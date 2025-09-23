import {
    Employee,
    InventoryItem, 
    Category
} from "../model/model.js";

const create = async (param, authUser) => {
    const createItemParam = {
        fk_category_id: param.category_id,
        name: param.name,
        description: param.description,
        unit: param.unit,
        purchase_price: param.purchase_price,
        threshold: param.threshold,
        created_by: authUser.id,
        updated_by: authUser.id,
    }

    return InventoryItem.create(createItemParam);
}

const update = async (param, authUser) => {
    const itemId = param.id

    const item = await InventoryItem.findByPk(itemId)

    const updateItemParam = {
        fk_category_id: param.category_id,
        name: param.name,
        description: param.description,
        unit: param.unit,
        purchase_price: param.purchase_price,
        threshold: param.threshold,
        expired_date: param.expired_date,
        updated_by: param.updated_by,
    }

    await item.update(
        updateItemParam,
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

const fetchList = async () => {
    const rows = await InventoryItem.findAll({
        include: [
            {model: Category, as: 'category'},
            {model: Employee, as: "createdBy", attributes: ["id", "name"]},
            {model: Employee, as: "updatedBy", attributes: ["id", "name"]},
        ],
        order: [["name", "ASC"]],
    })

    return rows.map((row) => {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            category: row.category,
            unit: row.unit,
            quantity: row.quantity,
            purchase_price: row.purchase_price,
            threshold: row.threshold,
            is_new: row.is_new,
            expired_date: row.expired_date,
            meta: {
                created_at: row.createdAt,
                updated_at: row.updatedAt,
                created_by: {
                    id: row.createdBy?.id ? String(row.createdBy.id) : "",
                    name: row.createdBy?.name ?? "",
                },
                last_updated_by: {
                    id: row.updatedBy?.id
                        ? String(row.updatedBy.id)
                        : (row.createdBy?.id ? String(row.createdBy.id) : ""),
                    name: row.updatedBy?.name ?? (row.createdBy?.name ?? ""),
                },
            },
        }
    })
}

export default {
    create,
    update,
    del,
    fetchList
}