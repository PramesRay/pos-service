import {successResponse} from "../../infrastructure/rest/response.js";
import orderService from "../service/order.js";


const createOrder = async (req, res) => {
    const data = await orderService.createOrder(req.body)
    res.status(200).json(successResponse("successfully create order", data))
}

const createDirectPaymentOrder = async (req, res) => {
    const data = await orderService.createDirectPaymentOrder(req.body)
    res.status(200).json(successResponse("successfully create direct payment order", data))
}


export default {
    createOrder,
    createDirectPaymentOrder
}