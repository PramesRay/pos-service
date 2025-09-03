import serviceInventoryItem from "../service/inventory.item.js"
import {successResponse} from "../../infrastructure/rest/response.js";

const create = async (req, res) => {
    const param = req.body
    const item = await serviceInventoryItem.create(param)
    res.status(201).json(successResponse("successfully create item", item))
}

const update = async (req, res) => {
    const param = req.body
    const item = await serviceInventoryItem.update(param)
    res.status(200).json(successResponse("successfully update item", item))
}

const del = async (req, res) => {
    const itemId = req.params.id
    await serviceInventoryItem.del(itemId)
    res.status(200).json(successResponse("successfully delete item", null))
}

export default {
    create,
    update,
    del
}