import categoryService from "../service/category.js"
import {successResponse} from "../../infrastructure/rest/response.js";

const create = async (req, res) => {
    const type = req.query.type
    const item = await categoryService.create(req.body, type)
    res.status(201).json(successResponse("successfully create item", item))
}

const update = async (req, res) => {
    const param = req.params.id
    const item = await categoryService.update(param, req.body)
    res.status(200).json(successResponse("successfully update item", item))
}

const remove = async (req, res) => {
    const itemId = req.params.id
    await categoryService.remove(itemId)
    res.status(200).json(successResponse("successfully delete item", null))
}

const getAll = async (req, res) => {
    const type = req.query.type
    const items = await categoryService.getAll(type)
    res.status(200).json(successResponse("successfully get items", items))
}

const getOne = async (req, res) => {
    const id = req.params.id
    const item = await categoryService.getOne(id)
    res.status(200).json(successResponse("successfully get item", item))
}

export default {
    create,
    update,
    remove,
    getAll,
    getOne
}