import {InventoryItem} from "../model/model.js";

const create = async (param) => {
    const createItemParam = {
        fk_inventory_item_category_id: param.category_id,
        name: param.name,
        description: param.description,
        unit: param.unit,
        purchase_price: param.purchase_price,
        threshold: param.threshold,
    }

    return InventoryItem.create(createItemParam);
}

const update = async (param) => {
    const itemId = param.id

    const item = await InventoryItem.findByPk(itemId)

    const updateItemParam = {
        name: param.name,
        description: param.description,
        unit: param.unit,
        purchase_price: param.purchase_price,
        threshold: param.threshold,
        expired_date: param.expired_date,
    }

    await InventoryItem.update(
        updateItemParam,
        {
            where: {
                id: itemId,
            }
        }
    )

    return item;
}

const del = async (itemId) => {
    await InventoryItem.destroy(
        {
            where: {
                id: itemId,
            }
        }
    )
}

export default {
    create,
    update,
    del,
}