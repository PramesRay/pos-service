import {successResponse} from "../../infrastructure/rest/response.js";
import orderService from "../service/order.js";


const createOrder = async (req, res) => {
    const data = await orderService.createOrder(req.body, req.user.profile)
    res.status(200).json(successResponse("successfully create order", data))
}

const createDirectPaymentOrder = async (req, res) => {
    const data = await orderService.createDirectPaymentOrder(req.body, req.user.profile)
    res.status(200).json(successResponse("successfully create direct payment order", data))
}

const createCustomerOrder = async (req, res) => {
    const data = await orderService.createDirectPaymentOrder(req.body, req.body.customer, 'customer')
    res.status(200).json(successResponse("successfully create customer order", data))
}

const updateOrder = async (req, res) => {
    const params = {
        id: req.params.id,
        ...req.body
    }
    const data = await orderService.updateOrder(params, req.user.profile)
    res.status(200).json(successResponse("successfully update order", data))
}
const updateOrderByCustomer = async (req, res) => {
    const params = {
        id: req.params.id,
        ...req.body
    }
    const data = await orderService.updateOrder(params, params, 'customer')
    res.status(200).json(successResponse("successfully update order", data))
}

const webhookUpdateOrderPayment = async (req, res) => {
    const data = await orderService.webHookUpdateOrderPayment(req.body)
    res.status(200).json(successResponse("successfully update order", data))
}

const refundOrderItem = async (req, res) => {
    const params = {...req.body, id: req.params.id}
    const data = await orderService.refundOrderItem(params, req.user.profile)
    res.status(200).json(successResponse("successfully refund order item", data))
}

const fetchOrderList = async (req, res) => {
    const data = await orderService.fetchOrderList(req.query)
    res.status(200).json(successResponse("successfully fetch order list", data))
}

const orderSummary = async (req, res) => {
    const data = await orderService.orderSummary(req.query)
    res.status(200).json(successResponse("successfully fetch order summary", data))
}


export default {
    createOrder,
    createDirectPaymentOrder,
    updateOrder,
    webhookUpdateOrderPayment,
    refundOrderItem,
    fetchOrderList,
    orderSummary,
    
    createCustomerOrder,
    updateOrderByCustomer
}