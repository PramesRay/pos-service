import {Branch, InventoryItem, StockMovement, WarehouseShift} from "../model/model.js";
import { getSequelize } from "../../infrastructure/database/mysql.js";
import { ConflictException } from "../../exception/conflict.exception.js";
import { NotFoundException } from "../../exception/not.found.exception.js";
import { Op } from "sequelize";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

const sequelize = await getSequelize();
dayjs.extend(utc);
dayjs.extend(timezone);

const create = async (param, authUser) => {
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
        const stockMovement = await StockMovement.create({
            fk_branch_id: param.branch_id ? param.branch_id : null,
            fk_warehouse_shift_id: warehouseShift.id,
            fk_inventory_item_id: param.item.id,
            quantity: param.item.quantity,
            description: param.description,
            status: param.status,
            time: param.time,
            created_by: authUser.id,
            updated_by: authUser.id,
        }, {
            transaction: tx,
        })

        switch (param.status) {
            case "Masuk":
                await addInventoryItem(param.item.id, param.item.quantity, tx, authUser)
                break;

            case "Keluar":
                await deductInventoryItem(param.item.id, param.item.quantity, tx, authUser)
                break;
            case "Pengurangan":
                await deductInventoryItem(param.item.id, param.item.quantity, tx, authUser)
                break;
        }

        await tx.commit();

        return stockMovement
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}

const addInventoryItem = async (id, quantity, tx, authUser) => {
    const inventoryItem = await InventoryItem.findOne(
        {
            where: {
                id: id,
            }
        }
    )

    if (!inventoryItem) {
        throw new NotFoundException("Barang Gudang tidak ditemukan")
    }

    if (inventoryItem.is_new) {
        inventoryItem.is_new = false
    }
    inventoryItem.quantity += quantity
    inventoryItem.created_by = authUser.id
    inventoryItem.updated_by = authUser.id
    await inventoryItem.save({transaction: tx})
}

const deductInventoryItem = async (id, quantity, tx, authUser) => {
    const inventoryItem = await InventoryItem.findOne(
        {
            where: {
                id: id,
            }
        }
    )

    if (!inventoryItem) {
        throw new NotFoundException("Barang Gudang tidak ditemukan")
    }

    if (inventoryItem.quantity < quantity) {
        throw new ConflictException("Jumlah pengurangan melebihi kuantitas barang gudang")
    }

    inventoryItem.quantity -= quantity
    inventoryItem.created_by = authUser.id
    inventoryItem.updated_by = authUser.id
    await inventoryItem.save({transaction: tx})
}

const update = async (param, authUser) => {
    // get stock movement
    const stockMovement = await StockMovement.findOne(
        {
            where: {
                id: param.id,
            }
        }
    )

    if (!stockMovement) {
        throw new NotFoundException("Perpindahan Stok tidak ditemukan")
    }

    // get inventory item
    const inventoryItem = await InventoryItem.findOne(
        {
            where: {
                id: param.item.id,
            }
        }
    )

    if (!inventoryItem) {
        throw new NotFoundException("Barang Gudang tidak ditemukan")
    }

    switch (stockMovement.status) {
        case "Masuk":
            inventoryItem.quantity -= stockMovement.quantity
            break;

        case "Keluar":
            inventoryItem.quantity += stockMovement.quantity
            break;
        case "Pengurangan":
            inventoryItem.quantity += stockMovement.quantity
            break;
    }

    // start transaction
    const tx = await sequelize.transaction();

    try {
        stockMovement.set({
            fk_branch_id: param.branch_id,
            fk_inventory_item_id: param.item.id,
            quantity: param.item.quantity,
            description: param.description,
            status: param.status,
            time: param.time,
            updated_by: authUser.id,
        })
        await stockMovement.save({transaction: tx})

        switch (param.status) {
            case "Masuk":
                inventoryItem.quantity += param.item.quantity
                break;

            case "Keluar":
                inventoryItem.quantity -= param.item.quantity
                break;
            case "Pengurangan":
                inventoryItem.quantity -= param.item.quantity
                break;
        }

        inventoryItem.updated_by = authUser.id
        await inventoryItem.save({transaction: tx})

        await tx.commit();

        return stockMovement
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}

const del = async (param, authUser) => {
    // find stock movement
    const stockMovement = await StockMovement.findOne(
        {
            where: {
                id: param.id,
            }
        }
    )

    if (!stockMovement) {
        throw new NotFoundException("Perpindahan Stok tidak ditemukan")
    }

    // find Inventory Item
    const inventoryItem = await InventoryItem.findOne(
        {
            where: {
                id: stockMovement.fk_inventory_item_id,
            }
        }
    )

    if (!inventoryItem) {
        throw new NotFoundException("Barang Gudang tidak ditemukan")
    }

    switch (stockMovement.status) {
        case "Masuk":
            inventoryItem.quantity -= stockMovement.quantity
            break;

        case "Keluar":
            inventoryItem.quantity += stockMovement.quantity
            break;
        case "Pengurangan":
            inventoryItem.quantity += stockMovement.quantity
            break;
    }

    // start transaction
    const tx = await sequelize.transaction();

    try {
        await StockMovement.destroy({
            where: {
                id: param.id,
            },
            transaction: tx,
        })

        inventoryItem.updated_by = authUser.id
        await inventoryItem.save({transaction: tx})

        await tx.commit();
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}

const fetchList = async () => {
    const rows = await StockMovement.findAll({
        include: [
            {model: WarehouseShift, as: "warehouseShift"},
            {model: InventoryItem, as: "inventoryItem"},
            {model: Branch, as: "branch"},
        ],
        order: [['createdAt', 'DESC']],
        where: {
            createdAt: {
                [Op.gte]: dayjs().subtract(1, 'month').toDate()
            }
        },
    })

    return rows.map((row) => {
        return {
            id: row.id,
            shift_warehouse: row.warehouseShift.id,
            description: row.description,
            status: row.status,
            time: row.time,
            item: {
                id: row.inventoryItem.id,
                name: row.inventoryItem.name,
                unit: row.inventoryItem.unit,
                quantity: row.quantity
            },
            branch: row.branch,
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
    del,
    fetchList
}