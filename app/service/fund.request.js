import {sequelize} from "../../infrastructure/database/mysql.js";
import {
    Employee,
    FundRequest,
    FundRequestItem,
    InventoryItem,
    WarehouseShift
} from "../model/model.js";
import {decodePrefixedId, prefixId} from "../../util/util.js";

const create = async (param, authUser) => {
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

    const tx = await sequelize.transaction()

    try {
        const fundRequest = await FundRequest.create(
            {
                subject: param.subject,
                description: param.description,
                fk_warehouse_shift_id: warehouseShift.id,
                created_by: authUser.id,
                updated_by: authUser.id,
            },
            {
                transaction: tx,
            }
        )

        const createFundRequestItemPayload = param.items.map(item => ({
            fk_fund_request_id: fundRequest.id,
            fk_inventory_item_id: item.id,
            quantity: item.quantity,
            created_by: authUser.id,
            updated_by: authUser.id,
        }))

        await FundRequestItem.bulkCreate(createFundRequestItemPayload, {transaction: tx})

        await tx.commit()
        return {
            ...fundRequest.toJSON(),
            id: prefixId("fun-req", fundRequest.id),
        }
    } catch (error) {
        throw error;
    }
}

const update = async (param, authUser) => {
    const {type, ...payload} = param

    switch (type) {
        case 'updateFundRequest':
            return updateFundRequest(payload, authUser);

        case 'approveFundRequest':
            return approveFundRequest(payload, authUser);
    }
}

const updateFundRequest = async (payload, authUser) => {
    const idNumber = decodePrefixedId(payload.id).idNumber;
    console.log("idNumber", idNumber)
    const {fundRequest, fundRequestItems} = await findFundRequestAndItems(idNumber)

    const tx = await sequelize.transaction()

    try {
        fundRequest.set({
            subject: payload.subject,
            description: payload.description,
            updated_by: authUser.id,
        })

        await fundRequest.save({transaction: tx})

        const invItemIDToQuantity = new Map(
            payload.items.map((item) => [item.id, item.quantity])
        )

        for (const item of fundRequestItems) {
            const quantity = invItemIDToQuantity.get(item.fk_inventory_item_id);
            if (typeof quantity !== "undefined") {
                item.quantity = quantity;
                item.updated_by = authUser.id
                await item.save({transaction: tx});
            }
        }

        return {
            ...fundRequest.toJSON(),
            id: prefixId("fun-req", fundRequest.id),
        }
    } catch (error) {
        throw error;
    }
}

const approveFundRequest = async (payload, authUser) => {
    const idNumber = decodePrefixedId(payload.id).idNumber;
    console.log("idNumber", idNumber)
    const {fundRequest, fundRequestItems} = await findFundRequestAndItems(idNumber)

    const tx = await sequelize.transaction()

    try {
        const approvedCount = payload.total_approved

        if (approvedCount === 0) {
            fundRequest.status = 'Ditolak'
        } else if (approvedCount === fundRequestItems.length) {
            fundRequest.status = 'Disetujui'
        } else {
            fundRequest.status = 'Beberapa Disetujui'
        }

        fundRequest.approval_notes = payload.approval_notes
        fundRequest.updated_by = authUser.id
        await fundRequest.save({transaction: tx})

        const invItemIDToStatus = new Map(
            payload.items.map((item) => [item.id, item.approved ? 'Disetujui' : 'Ditolak'])
        )

        for (const item of fundRequestItems) {
            const status = invItemIDToStatus.get(item.fk_inventory_item_id);
            if (typeof status !== "undefined") {
                item.status = status;
                item.updated_by = authUser.id
                await item.save({transaction: tx});
            }
        }

        await tx.commit()

        return {
            ...fundRequest.toJSON(),
            id: prefixId("fun-req", fundRequest.id),
        }

    } catch (error) {
        throw error;
    }
}

const findFundRequestAndItems = async (id) => {
    const fundRequest = await FundRequest.findByPk(id)
    if (!fundRequest) {
        throw new Error("Fund request not found")
    }

    const fundRequestItems = await FundRequestItem.findAll({
        where: {
            fk_fund_request_id: id,
        }
    })
    if (!fundRequestItems) {
        throw new Error("Fund request item not found")
    }

    return {
        fundRequest,
        fundRequestItems
    }
}

const del = async (itemId) => {
    const idNumber = decodePrefixedId(itemId).idNumber;
    const tx = await sequelize.transaction()

    try {
        await FundRequestItem.destroy(
            {
                where: {
                    fk_fund_request_id: idNumber,
                }
            },
            {transaction: tx}
        )

        await FundRequest.destroy(
            {
                where: {
                    id: idNumber,
                }
            },
            {transaction: tx}
        )

        await tx.commit()
    } catch (error) {
        throw error;
        ƒ
    }
}

const STATUS_PRIORITY_CASE = `
    CASE
        WHEN fund_requests.status = 'Pending' THEN 0
        WHEN fund_requests.status IN ('Ditolak', 'Disetujui') THEN 1
        ELSE 4
    END
`

const fetchList = async () => {
    const rows = await FundRequest.findAll({
        include: [
            {model: FundRequestItem, as: "items", include: [{model: InventoryItem, as: "inventoryItem"}]},
            {model: WarehouseShift, as: "warehouseShift"},
            {model: Employee, as: "createdBy", attributes: ["id", "name"]},
            {model: Employee, as: "updatedBy", attributes: ["id", "name"]},

        ],
        order: [
            [sequelize.literal(STATUS_PRIORITY_CASE), "ASC"],
            [
                sequelize.literal(`
                    CASE 
                        WHEN fund_requests.status IN ('Ditolak', 'Disetujui') THEN fund_requests.createdAt
                    END
                `), "DESC"
            ],
            ["createdAt", "ASC"]
        ],
    });

    return rows.map((row) => {
        const amount = row.items.reduce((acc, item) => acc + (item.quantity * item.inventoryItem.purchase_price), 0)
        return {
            id: prefixId("fun-req", row.id),
            subject: row.subject,
            description: row.description,
            shift_warehouse_id: row.warehouseShift.id,
            items: row.items.map(item => ({
                item: {
                    id: item.inventoryItem.id,
                    name: item.inventoryItem.name,
                    purchase_price: item.inventoryItem.purchase_price,
                    unit: item.inventoryItem.unit,
                },
                quantity: item.quantity,
                status: item.status,
            })),
            amount,
            status: row.status,
            approval_notes: row.approval_notes,
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

        };
    });
}

export default {
    create,
    update,
    del,
    fetchList
}