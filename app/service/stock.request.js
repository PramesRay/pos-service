import { NotFoundException } from "../../exception/not.found.exception.js";
import {sequelize} from "../../infrastructure/database/mysql.js";
import {
    Branch, Employee, InventoryItem,
    KitchenShift,
    StockRequest,
    StockRequestItem,
    WarehouseShift
} from "../model/model.js";
import { Op } from "sequelize";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

const create = async (param, authUser) => {
    // get current kitchen shift
    const kitchenShift = await KitchenShift.findOne({
        where: {
            end: null,
            fk_branch_id: param.branch_id,
        }
    })

    if (!kitchenShift) {
        throw new NotFoundException("Sif Dapur tidak ditemukan")
    }

    // get current warehouse shift
    const warehouseShift = await WarehouseShift.findOne(
        {
            where: {
                end: null,
            }
        }
    )

    if (!warehouseShift) {
        throw new NotFoundException("Sif Gudang tidak ditemukan")
    }

    // start transaction
    const tx = await sequelize.transaction();

    try {
        // create stock request
        const stockRequest = await StockRequest.create({
            fk_branch_id: param.branch_id,
            fk_kitchen_shift_id: kitchenShift.id,
            fk_warehouse_shift_id: warehouseShift.id,
            note: param.note,
            created_by: authUser.id,
            updated_by: authUser.id,
            status: "Pending",
        }, {transaction: tx})

        // create stock request item
        const stockRequestItemsPayload = param.items.map(item => ({
            fk_stock_request_id: stockRequest.id,
            fk_inventory_item_id: item.id,
            quantity: item.quantity,
            created_by: authUser.id,
            updated_by: authUser.id,
        }))

        const items = await StockRequestItem.bulkCreate(stockRequestItemsPayload, {transaction: tx})

        await tx.commit();

        return {
            ...stockRequest.toJSON(),
            id: stockRequest.id,
            items: items,
        };
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}

export const update = async (param, authUser) => {
    const {type, ...payload} = param

    switch (type) {
        case 'updateStock':
            return await updateStock(payload, authUser);

        case 'approveStock':
            return await approveStock(payload, authUser);
    }
}

const updateStock = async (param, authUser) => {
    // find Stock Request
    const stockRequest = await StockRequest.findOne({
        where: {
            id: param.id,
        }
    })

    if (!stockRequest) {
        throw new NotFoundException("Permintaan Stok tidak ditemukan")
    }

    // find Stock Request Item
    const stockRequestItems = await StockRequestItem.findAll({
        where: {
            fk_stock_request_id: param.id,
        }
    })

    const itemIDToQuantity = new Map(
        param.items.map((item) => [item.id, item.quantity])
    )

    // start transaction
    const tx = await sequelize.transaction();

    try {
        // update stock request
        stockRequest.note = param.note
        stockRequest.updated_by = authUser.id
        await stockRequest.save({transaction: tx})

        // update stock request item
        for (const item of stockRequestItems) {
            const quantity = itemIDToQuantity.get(item.id);
            if (typeof quantity !== "undefined") {
                item.quantity = quantity;
                item.updated_by = authUser.id
                await item.save({transaction: tx});
            }
        }

        await tx.commit();
        return {
            ...stockRequest.toJSON(),
            id: stockRequest.id,
            items: stockRequestItems
        };
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}

const approveStock = async (param, authUser) => {
  const tx = await sequelize.transaction();
  try {
    const stockRequest = await StockRequest.findByPk(param.id, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });
    if (!stockRequest) {
      throw new NotFoundException('Permintaan Stok tidak ditemukan');
    }
   
    const items = await StockRequestItem.findAll({
      where: { fk_stock_request_id: param.id },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });
    
    const approvedIds = new Set(
      (param.items || [])
        .filter((it) => it && it.id != null && it.approved === true)
        .map((it) => it.id)
    );
    
    const approvedCount = items.reduce(
      (acc, it) => acc + (approvedIds.has(it.fk_inventory_item_id) ? 1 : 0),
      0
    );

        
    if (approvedCount > 0) {
      await StockRequestItem.update(
        { status: 'Diproses', updated_by: authUser.id },
        {
          where: {
            fk_stock_request_id: param.id,
            fk_inventory_item_id: { [Op.in]: Array.from(approvedIds) },
            status: 'Pending', 
          },
          transaction: tx,
        }
      );
    }
    
    await StockRequestItem.update(
      { status: 'Ditolak', updated_by: authUser.id },
      {
        where: {
          fk_stock_request_id: param.id,
          ...(approvedIds.size
            ? { fk_inventory_item_id: { [Op.notIn]: Array.from(approvedIds) } }
            : {}), 
          status: 'Pending', 
        },
        transaction: tx,
      }
    );

    const newRequestStatus = approvedCount > 0 ? 'Diproses' : 'Ditolak';
    await stockRequest.update(
      { status: newRequestStatus, updated_by: authUser.id },
      { transaction: tx }
    );

    await tx.commit();

    // 7) Kembalikan data terbaru (dengan items)
    const refreshed = await StockRequest.findByPk(param.id, {
      include: [{ model: StockRequestItem, as: 'items' }],
    });
    return refreshed;
  } catch (err) {
    await tx.rollback();
    throw err;
  }
};

const ready = async (param, authUser) => {
    // find Stock Request
    const stockRequest = await StockRequest.findOne({
        where: {
            id: param.id,
        }
    })

    if (!stockRequest) {
        throw new NotFoundException("Permintaan Stok tidak ditemukan")
    }

    // find Stock Request Item
    const stockRequestItems = await StockRequestItem.findAll({
        where: {
            fk_stock_request_id: param.id,
        }
    })

    // start transaction
    const tx = await sequelize.transaction();

    try {
        // update stock request
        stockRequest.status = "Siap"
        stockRequest.updated_by = authUser.id
        await stockRequest.save({transaction: tx})

        // update stock request item
        for (const item of stockRequestItems) {
            item.status = "Siap"
            item.updated_by = authUser.id
            await item.save({transaction: tx});
        }

        await tx.commit();
        return {
            ...stockRequest.toJSON(),
            id: stockRequest.id,
            items: stockRequestItems
        };
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}

const finish = async (param, authUser) => {
    const stockRequest = await StockRequest.findByPk(param.id);
    if (!stockRequest) {
        throw new NotFoundException("Permintaan Stok tidak ditemukan")
    }

    const stockRequestItems = await StockRequestItem.findAll({
        where: {
            fk_stock_request_id: param.id,
        }
    })

    const tx = await sequelize.transaction();

    try {
        // update stock request
        stockRequest.status = "Selesai"
        stockRequest.updated_by = authUser.id
        await stockRequest.save({transaction: tx})

        await tx.commit();
        return {
            ...stockRequest.toJSON(),
            id: stockRequest.id,
            items: stockRequestItems
        };
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}

const STATUS_PRIORITY_CASE = `
    CASE
        WHEN stock_requests.status = 'Pending' THEN 0
        WHEN stock_requests.status = 'Diproses' THEN 1
        WHEN stock_requests.status = 'Siap' THEN 2
        WHEN stock_requests.status IN ('Ditolak', 'Selesai') THEN 3
        ELSE 4
    END
`

const fetchList = async () => {
    const rows = await StockRequest.findAll({
        include: [
            {model: Branch, as: "branch"},
            {model: KitchenShift, as: "kitchenShift"},
            {model: WarehouseShift, as: "warehouseShift"},
            {model: Employee, as: "createdBy", attributes: ["id", "name"]},
            {model: Employee, as: "updatedBy", attributes: ["id", "name"]},
            {
                model: StockRequestItem, 
                as: "items", 
                include: [{model: InventoryItem, as: "inventoryItem"}]
            },
        ],
        order: [
            [sequelize.literal(STATUS_PRIORITY_CASE), "ASC"],
            [
                sequelize.literal(`
                    CASE 
                        WHEN stock_requests.status IN ('Ditolak', 'Selesai') THEN stock_requests.createdAt
                    END
                `), "DESC"
            ],
            ['createdAt', 'ASC']
        ],
        where: {
            createdAt: {
                [Op.gte]: dayjs().subtract(1, 'month').toDate()
            }
        },
    })

    return rows.map((row) => {
        return {
            id: row.id,
            branch: {
                id: row.branch.id,
                name: row.branch.name
            },
            shift: {
                kitchen: row.kitchenShift.id,
                warehouse: row.warehouseShift.id,
            },
            items: row.items.map(item => ({
                id: item.id,
                item: {
                    id: item.inventoryItem.id,
                    name: item.inventoryItem.name,
                    unit: item.inventoryItem.unit
                },
                quantity: item.quantity,
                status: item.status,
            })),
            status: row.status,
            note: row.note,
            meta: {
                created_at: row.createdAt,
                created_by: row.createdBy,
                updated_at: row.updatedAt,
                last_updated_by: row.updatedBy,
            }
        }
    })
}

export default {
    create,
    update,
    ready,
    finish,
    fetchList
}