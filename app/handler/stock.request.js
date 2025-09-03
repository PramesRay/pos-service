import serviceStockRequest from "../service/stock.request.js"
import {successResponse} from "../../infrastructure/rest/response.js";

const create = async (req, res) => {
    const param = {
        branch_id: req.body.branch_id,
        note: req.body.notes,
        items: req.body.items,
    }
    const stockRequest = await serviceStockRequest.create(param)
    res.status(201).json(successResponse("successfully create stock request", null))
}

const update = async (req, res) => {
    const param = {
        type: req.body.type,
        id: req.body.id,
        note: req.body.notes,
        items: req.body.items,
    }
    await serviceStockRequest.update(param)
    res.status(200).json(successResponse("successfully update stock request", null))
}

const finish = async (req, res) => {
    const param = {
        id: req.body.id,
    }
    await serviceStockRequest.finish(param)
    res.status(200).json(successResponse("successfully finish stock request", null))
}

export default {
    create,
    update,
    finish,
}