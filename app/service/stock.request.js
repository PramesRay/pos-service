import {sequelize} from "../../infrastructure/database/mysql.js";
import {KitchenShift, StockRequest, WarehouseShift} from "../model/model.js";

const create = async (param) => {
    // get current kitchen shift
    const kitchenShift = await KitchenShift.findOne({
        where: {
            end: null,
            fk_branch_id: param.branch_id,
        }
    })

    if (!kitchenShift) {
        throw new Error("Kitchen shift not found")
    }

    // get current warehouse shift
    const warehouseShift = await WarehouseShift.findOne(
        {
            where: {
                end: null,
                fk_branch_id: param.branch_id,
            }
        }
    )

    if (!warehouseShift) {
        throw new Error("Warehouse shift not found")
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
        }, {transaction: tx})

        // create stock request item
        const stockRequestItemsPayload = param.items.map(item => ({
            fk_stock_request_id: stockRequest.id,
            fk_inventory_item_id: item.id,
            quantity: item.quantity,
        }))

        await StockRequest.bulkCreate(stockRequestItemsPayload, {transaction: tx})

        await tx.commit();

        return stockRequest;
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}

export const update = async (param) => {
    const {type, ...payload} = param

    switch (type) {
        case 'updateStock':
            await updateStock(payload);
            break;

        case 'approveStock':
            await approveStock(payload);
            break;
    }
}

const updateStock = async (param) => {
    // find Stock Request
    const stockRequest = await StockRequest.findOne({
        where: {
            id: param.id,
        }
    })

    if (!stockRequest) {
        throw new Error("Stock request not found")
    }

    // find Stock Request Item
    const stockRequestItems = await StockRequest.findAll({
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
        await stockRequest.save({transaction: tx})

        // update stock request item
        for (const item of stockRequestItems) {
            const quantity = itemIDToQuantity.get(item.fk_inventory_item_id);
            if (typeof quantity !== "undefined") {
                item.quantity = quantity;
                await item.save({transaction: tx});
            }
        }

        await tx.commit();
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}

const approveStock = async (param) => {
    // find Stock Request
    const stockRequest = await StockRequest.findOne({
        where: {
            id: param.id,
        }
    })

    if (!stockRequest) {
        throw new Error("Stock request not found")
    }

    // find Stock Request Item
    const stockRequestItems = await StockRequest.findAll({
        where: {
            fk_stock_request_id: param.id,
        }
    })

    const itemIDToStatus = new Map(
        param.items.map((item) => [item.id, item.approved ? "Diproses" : "Ditolak"])
    )

    // start transaction
    const tx = await sequelize.transaction();

    try {
        // update stock request
        stockRequest.status = "Diproses"
        await stockRequest.save({transaction: tx})

        // update stock request item
        for (const item of stockRequestItems) {
            const status = itemIDToStatus.get(item.fk_inventory_item_id);
            if (typeof status !== "undefined") {
                item.status = status;
                await item.save({transaction: tx});
            }
        }

        await tx.commit();
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}

const finish = async (param) => {
    // find Stock Request
    const stockRequest = await StockRequest.findOne({
        where: {
            id: param.id,
        }
    })

    if (!stockRequest) {
        throw new Error("Stock request not found")
    }

    // find Stock Request Item
    const stockRequestItems = await StockRequest.findAll({
        where: {
            fk_stock_request_id: param.id,
        }
    })

    // start transaction
    const tx = await sequelize.transaction();

    try {
        // update stock request
        stockRequest.status = "Selesai"
        await stockRequest.save({transaction: tx})

        // update stock request item
        for (const item of stockRequestItems) {
            item.status = "Siap"
        }

        await tx.commit();
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}

export default {
    create,
    update,
    finish
}