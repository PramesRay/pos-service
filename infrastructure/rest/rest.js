import express from 'express';
import cors from 'cors';
import {successResponse} from "./response.js";
import {errorMiddleware} from "../../middleware/error.js";
import authHandler from "../../app/handler/auth.js"
import {authMiddleware} from "../../middleware/auth.js";
import employeeHandler from "../../app/handler/employee.js"
import customerHandler from "../../app/handler/customer.js"
import branchHandler from "../../app/handler/branch.js"
import menuHandler from "../../app/handler/menu.js"
import shiftHandler from "../../app/handler/shift.js"
import orderHandler from "../../app/handler/order.js";
import stockRequestHandler from "../../app/handler/stock.request.js";
import stockMovementHandler from "../../app/handler/stock.movement.js";
import inventoryItemHandler from "../../app/handler/inventory.item.js";
import categoryHandler from "../../app/handler/category.js";
import fundRequestHandler from "../../app/handler/fund.request.js";
import reservationHandler from "../../app/handler/reservation.js";
import financeSummaryHandler from "../../app/handler/finance.summary.js";

let app;

export const initServer = () => {
    if (app) return app;
    app = express();

    app.use(cors({
        origin: [
            'http://localhost:5173', 
            'http://localhost:5174', 
            'https://internalposnurchs.up.railway.app', 
            'https://nurchs.up.railway.app',
            'https://op-nurchs.vercel.app',
            'https://nurchs.vercel.app'
        ], 
            // ganti dengan origin yang diizinkan
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true
    }))
    app.use(express.json())

    app.get('/health-check', (req, res) => {
        res.status(200).json(successResponse("Server Health Check", "OK"));
    })

    // auth
    app.post('/auth/register', authHandler.register)
    
    app.get('/branch', branchHandler.getAll)
    
    app.post('/customer', customerHandler.create)
    app.get('/customer/:id', customerHandler.getOne)
    app.put('/customer/:id', customerHandler.update)
    
    app.get('/menu-sales', menuHandler.getSalesByBranch)
    app.get('/categories', categoryHandler.getAll)
    app.get('/category/:id', categoryHandler.getOne)

    app.get("/orders/customer", orderHandler.fetchOrderList)
    app.post('/order/customer', orderHandler.createCustomerOrder)
    app.put('/order/customer/:id', orderHandler.updateOrder)
    app.post('/order/webhook', orderHandler.webhookUpdateOrderPayment)

    app.get('/reservations/customer', reservationHandler.fetchByCustomer)
    app.post('/reservation/customer', reservationHandler.createByCustomer)
    app.put('/reservation/customer/:id', reservationHandler.updateByCustomer)

    app.use(authMiddleware)

    // employee
    app.get('/employees-activity', employeeHandler.attendanceSummaryAverages)
    app.get('/employee/me', employeeHandler.getOne)
    app.get('/employees', employeeHandler.getAll)
    app.put('/employee/:uid', employeeHandler.update)
    app.put('/employee-me', employeeHandler.updateMe)
    app.delete('/employee/:uid', employeeHandler.remove)

    // branch
    app.get('/branch/:id', branchHandler.getOne)
    app.post('/branch', branchHandler.create)
    app.put('/branch/:id', branchHandler.update)
    app.delete('/branch/:id', branchHandler.remove)

    // menu
    app.get('/menu/:id', menuHandler.getOne)
    app.get('/menus', menuHandler.getAllByBranch)
    app.post('/menu', menuHandler.create)
    app.put('/menu/:id', menuHandler.update)
    app.delete('/menu/:id', menuHandler.remove)

    // employee shift
    app.get('/shift/employee/current', shiftHandler.getCurrentEmployeeShift)
    app.get('/shift/employees', shiftHandler.fetchEmployeeShifts)
    app.post('/shift/employee/start', shiftHandler.startEmployeeShift)
    app.put('/shift/employee/:id/end', shiftHandler.endEmployeeShift)
    app.put('/shift/employee/end', shiftHandler.endEmployeeShift)

    // kitchen shift
    app.get('/shift/kitchen/current', shiftHandler.getCurrentKitchenShift)
    app.get('/shift/kitchens', shiftHandler.fetchKitchenShifts)
    app.post('/shift/kitchen/:branchId/start', shiftHandler.startKitchenShift)
    app.put('/shift/kitchen/:id', shiftHandler.updateKitchenShift)
    app.put('/shift/kitchen/:id/end', shiftHandler.endKitchenShift)

    // cashier shift
    app.get('/shift/cashier/current', shiftHandler.getCurrentCashierShift)
    app.get('/shift/cashiers', shiftHandler.fetchCashierShifts)
    app.post('/shift/cashier/:branchId/start', shiftHandler.startCashierShift)
    app.put('/shift/cashier/:id', shiftHandler.updateCashierShift)
    app.put('/shift/cashier/:id/end', shiftHandler.endCashierShift)

    // warehouse shift
    app.get('/shift/warehouse/current', shiftHandler.getCurrentWarehouseShift)
    app.get('/shift/warehouses', shiftHandler.fetchWarehouseShifts)
    app.post('/shift/warehouse/start', shiftHandler.startWarehouseShift)
    app.put('/shift/warehouse/:id', shiftHandler.updateWarehouseShift)
    app.put('/shift/warehouse/:id/end', shiftHandler.endWarehouseShift)

    // order
    app.get("/total-order", orderHandler.orderSummary)
    app.get("/orders", orderHandler.fetchOrderList)
    app.post('/order', orderHandler.createOrder)
    app.post('/order/process-direct-payment', orderHandler.createDirectPaymentOrder)
    app.put('/order/:id', orderHandler.updateOrder)
    app.put('/order/:id/refund', orderHandler.refundOrderItem)

    // stock request
    app.get('/inventory/stock-requests', stockRequestHandler.fetchList)
    app.post('/inventory/stock-request', stockRequestHandler.create)
    app.put('/inventory/stock-request', stockRequestHandler.update)
    app.put('/inventory/stock-request/:id/ready', stockRequestHandler.ready)
    app.put('/inventory/stock-request/:id/end', stockRequestHandler.finish)

    // stock movement
    app.get('/inventory/stock-movements', stockMovementHandler.fetchList)
    app.post('/inventory/stock-movement', stockMovementHandler.create)
    app.put('/inventory/stock-movement', stockMovementHandler.update)
    app.delete('/inventory/stock-movement/:id', stockMovementHandler.del)

    // inventory item
    app.get('/inventory/items', inventoryItemHandler.fetchList)
    app.post('/inventory/item', inventoryItemHandler.create)
    app.put('/inventory/item', inventoryItemHandler.update)
    app.delete('/inventory/item/:id', inventoryItemHandler.del)

    // category
    app.post('/category', categoryHandler.create)
    app.put('/category/:id', categoryHandler.update)
    app.delete('/category/:id', categoryHandler.remove)

    // fund request
    app.get('/finance/fund-requests', fundRequestHandler.fetchList)
    app.post('/finance/fund-request', fundRequestHandler.create)
    app.put('/finance/fund-request', fundRequestHandler.update)
    app.put('/finance/fund-request/:id/end', fundRequestHandler.finish)
    app.delete('/finance/fund-request/:id', fundRequestHandler.del)

    // reservation /reservation
    app.get('/reservations', reservationHandler.fetchList)
    app.post('/reservation', reservationHandler.create)
    app.put('/reservation', reservationHandler.update)
    app.delete('/reservation/:id', reservationHandler.del)

    // finance summary
    app.get('/finance-summary', financeSummaryHandler.fetchFinanceSummary)

    app.use(errorMiddleware)

    return app
}