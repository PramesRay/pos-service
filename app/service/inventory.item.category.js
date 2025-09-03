import {InventoryItemCategory} from "../model/model.js";

const create = async (param) => {
    const createCtgParam = {
        name: param.name,
        description: param.description
    }

    return InventoryItemCategory.create(createCtgParam);
}

const update = async (param) => {
    const ctgId = param.id

    const item = await InventoryItemCategory.findByPk(ctgId)

    const updateCtgParam = {
        name: param.name,
        description: param.description,
    }

    await InventoryItemCategory.update(
        updateCtgParam,
        {
            where: {
                id: ctgId,
            }
        }
    )

    return item;
}

const del = async (itemId) => {
    await InventoryItemCategory.destroy(
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