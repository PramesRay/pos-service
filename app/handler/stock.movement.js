import stockMovementService from "../service/stock.movement.js"
import stockMovement from "../service/stock.movement.js";
import {successResponse} from "../../infrastructure/rest/response.js";

const create = async (req, res) => {
    const param = {
        branch_id: req.body.branch_id,
        item: req.body.item,
        description: req.body.description,
        status: req.body.status,
        time: req.body.time,
    }

    const stockMovement = await stockMovementService.create(param)
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

   const stockMovement = await stockMovementService.update(param)
    res.status(200).json(successResponse("successfully update stock movement", stockMovement))
}

const del = async (req, res) => {
    const param = {
        id: req.body.id,
    }

    await stockMovementService.del(param)
    res.status(200).json(successResponse("successfully delete stock movement", null))
}

export default {
    create,
    update,
    del,
}