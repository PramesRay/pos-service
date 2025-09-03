import express from 'express';
import {successResponse} from "./response.js";
import {errorMiddleware} from "../../middleware/error.js";
import authHandler from "../../app/handler/auth.js"
import {authMiddleware} from "../../middleware/auth.js";
import shiftHandler from "../../app/handler/shift.js"
import orderHandler from "../../app/handler/order.js";
import stockRequestHandler from "../../app/handler/stock.request.js";
import stockMovementHandler from "../../app/handler/stock.movement.js";
import inventoryItemHandler from "../../app/handler/inventory.item.js";
import inventoryItemcategoryHandler from "../../app/handler/inventory.item.category.js";

const rest = express();

export const initServer = () => {
    rest.use(express.json())

    rest.get('/health-check', (req, res) => {
        res.status(200).json(successResponse("Server Health Check", "OK"));
    })

    // auth
    rest.post('/auth/register', authHandler.register)

    rest.use(authMiddleware)

    // employee shift
    rest.get('/shift/employee', shiftHandler.fetchEmployeeShifts)
    rest.post('/shift/employee/start', shiftHandler.startEmployeeShift)
    rest.put('/shift/employee/end', shiftHandler.endEmployeeShift)

    // kitchen shift
    rest.post('/shift/kitchen/start', shiftHandler.startKitchenShift)
    rest.put('/shift/kitchen/:shiftKitchenId', shiftHandler.updateKitchenShift)
    rest.put('/shift/kitchen/:shiftKitchenId/end', shiftHandler.endKitchenShift)

    // warehouse shift
    rest.post('/shift/warehouse/start', shiftHandler.startWarehouseShift)
    rest.put('/shift/warehouse/:id', shiftHandler.updateWarehouseShift)
    rest.put('/shift/warehouse/end/:id', shiftHandler.endWarehouseShift)

    // order
    rest.post('/order', orderHandler.createOrder)
    rest.post('/order/process-direct-payment', orderHandler.createDirectPaymentOrder)

    // stock request
    rest.post('/inventory/stock-requests', stockRequestHandler.create)
    rest.put('/inventory/stock-requests', stockRequestHandler.update)
    rest.put('/inventory/stock-requests/:id/finish', stockRequestHandler.finish)

    // stock movement
    rest.post('/inventory/stock-movements', stockMovementHandler.create)
    rest.put('/inventory/stock-movements', stockMovementHandler.update)
    rest.delete('/inventory/stock-movements/:id', stockMovementHandler.del)

    // inventory item
    rest.post('/inventory/items', inventoryItemHandler.create)
    rest.put('/inventory/items', inventoryItemHandler.update)
    rest.delete('/inventory/items/:id', inventoryItemHandler.del)

    // inventory item category
    rest.post('/inventory/item-categories', inventoryItemcategoryHandler.create)
    rest.put('/inventory/item-categories', inventoryItemcategoryHandler.update)
    rest.delete('/inventory/item-categories/:id', inventoryItemcategoryHandler.del)

    rest.use(errorMiddleware)
}

export const runServer = () => {
    rest.listen(3000, () => {
        console.info("Server listening on port 3000");
    })
}

