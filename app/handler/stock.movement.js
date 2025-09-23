import stockMovementService from "../service/stock.movement.js"
import {successResponse} from "../../infrastructure/rest/response.js";

const create = async (req, res) => {
    const param = {
        branch_id: req.body.branch_id,
        item: req.body.item,
        description: req.body.description,
        status: req.body.status,
        time: req.body.time,
    }

    const stockMovement = await stockMovementService.create(param, req.user.profile)
    res.status(201).json(successResponse("successfully create stock movement", stockMovement))
}

const update = async (req, res) => {
    const param = {
        id: req.body.id,
        branch_id: req.body.branch_id,
        item: req.body.item,
        description: req.body.description,
        status: req.body.status,
        time: req.body.time,
    }

    const stockMovement = await stockMovementService.update(param, req.user.profile)
    res.status(200).json(successResponse("successfully update stock movement", stockMovement))
}

const del = async (req, res) => {
    const param = {
        id: req.params.id,
    }

    await stockMovementService.del(param, req.user.profile)
    res.status(200).json(successResponse("successfully delete stock movement", null))
}

const fetchList = async (req, res) => {
    const list = await stockMovementService.fetchList()
    res.status(200).json(successResponse("successfully fetch stock movement list", list))
}

export default {
    create,
    update,
    del,
    fetchList
}