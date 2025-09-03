import {InventoryItem, StockMovement, WarehouseShift} from "../model/model.js";
import {sequelize} from "../../infrastructure/database/mysql.js";

const create = async (param) => {
    // get current warehouse shift
    const warehouseShift = await WarehouseShift.findOne(
        {
            where: {
                end: null,
            }
        }
    )

    if (!warehouseShift) {
        throw new Error("Warehouse shift not found")
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
        }, {
            transaction: tx,
        })

        switch (param.status) {
            case "Masuk":
                await addInventoryItem(param.item.id, param.item.quantity, tx)
                break;

            case "Keluar":
                await deductInventoryItem(param.item.id, param.item.quantity, tx)
                break;
            case "Pengurangan":
                await deductInventoryItem(param.item.id, param.item.quantity, tx)
                break;
        }

        await tx.commit();

        return stockMovement;
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}

const addInventoryItem = async (id, quantity, tx) => {
    const inventoryItem = InventoryItem.findOne(
        {
            where: {
                id: id,
            }
        }
    )

    if (!InventoryItem) {
        throw new Error("Inventory item not found")
    }

    inventoryItem.quantity += quantity
    await inventoryItem.save({transaction: tx})
}

const deductInventoryItem = async (id, quantity, tx) => {
    const inventoryItem = InventoryItem.findOne(
        {
            where: {
                id: id,
            }
        }
    )

    if (!InventoryItem) {
        throw new Error("Inventory item not found")
    }

    inventoryItem.quantity -= quantity
    await inventoryItem.save({transaction: tx})
}

const update = async (param) => {
    // get stock movement
    const stockMovement = await StockMovement.findOne(
        {
            where: {
                id: param.id,
            }
        }
    )

    // get inventory item
    const inventoryItem = await InventoryItem.findOne(
        {
            where: {
                id: param.item.id,
            }
        }
    )

    switch (inventoryItem.status) {
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

    if (!stockMovement) {
        throw new Error("Stock movement not found")
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
        })

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

        await stockMovement.save({transaction: tx})
        await inventoryItem.save({transaction: tx})

        await tx.commit();

        return stockMovement;
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}

const del = async (param) => {
    // find stock movement
    const stockMovement = await StockMovement.findOne(
        {
            where: {
                id: param.id,
            }
        }
    )

    // find Inventory Item
    const inventoryItem = await InventoryItem.findOne(
        {
            where: {
                id: stockMovement.fk_inventory_item_id,
            }
        }
    )

    switch (inventoryItem.status) {
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

        await inventoryItem.save({transaction: tx})

        await tx.commit();
    } catch (error) {
        await tx.rollback();
        throw error;
    }
}

export default {
    create,
    update,
    del
}