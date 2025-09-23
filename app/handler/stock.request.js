import serviceStockRequest from "../service/stock.request.js"
import {successResponse} from "../../infrastructure/rest/response.js";

const create = async (req, res) => {
    const param = {
        branch_id: req.body.branch_id,
        note: req.body.note,
        items: req.body.items,
    }
    const stockRequest = await serviceStockRequest.create(param, req.user.profile)
    res.status(201).json(successResponse("successfully create stock request", stockRequest))
}

const update = async (req, res) => {
    const param = {
        type: req.body.type,
        id: req.body.id,
        note: req.body.note,
        items: req.body.items,
    }
    const stockRequest = await serviceStockRequest.update(param, req.user.profile)
    res.status(200).json(successResponse("successfully update stock request", stockRequest))
}

const ready = async (req, res) => {
    const param = {
        id: req.params.id,
    }
    const stockRequest = await serviceStockRequest.ready(param, req.user.profile)
    res.status(200).json(successResponse("successfully update status stock request to ready", stockRequest))
}

const finish = async (req, res) => {
    const param = {
        id: req.params.id,
    }
    const stockRequest = await serviceStockRequest.finish(param, req.user.profile)
    res.status(200).json(successResponse("successfully finish stock request", stockRequest))
}

const fetchList = async (req, res) => {
    const list = await serviceStockRequest.fetchList()
    res.status(200).json(successResponse("successfully fetch stock request list", list))
}

export default {
    create,
    update,
    ready,
    finish,
    fetchList
}