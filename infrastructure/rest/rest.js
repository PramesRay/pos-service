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

const rest = express();

export const initServer = () => {
    rest.use(cors({
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
    rest.use(express.json())

    rest.get('/health-check', (req, res) => {
        res.status(200).json(successResponse("Server Health Check", "OK"));
    })

    // auth
    rest.post('/auth/register', authHandler.register)
    
    rest.get('/branch', branchHandler.getAll)
    
    rest.post('/customer', customerHandler.create)
    rest.get('/customer/:id', customerHandler.getOne)
    rest.put('/customer/:id', customerHandler.update)
    
    rest.get('/menu-sales', menuHandler.getSalesByBranch)
    rest.get('/categories', categoryHandler.getAll)
    rest.get('/category/:id', categoryHandler.getOne)

    rest.get("/orders/customer", orderHandler.fetchOrderList)
    rest.post('/order/customer', orderHandler.createCustomerOrder)
    rest.put('/order/customer/:id', orderHandler.updateOrder)
    rest.post('/order/webhook', orderHandler.webhookUpdateOrderPayment)

    rest.get('/reservations/customer', reservationHandler.fetchByCustomer)
    rest.post('/reservation/customer', reservationHandler.createByCustomer)
    rest.put('/reservation/customer/:id', reservationHandler.updateByCustomer)

    rest.use(authMiddleware)

    // employee
    rest.get('/employees-activity', employeeHandler.attendanceSummaryAverages)
    rest.get('/employee/me', employeeHandler.getOne)
    rest.get('/employees', employeeHandler.getAll)
    rest.put('/employee/:uid', employeeHandler.update)
    rest.put('/employee-me', employeeHandler.updateMe)
    rest.delete('/employee/:uid', employeeHandler.remove)

    // branch
    rest.get('/branch/:id', branchHandler.getOne)
    rest.post('/branch', branchHandler.create)
    rest.put('/branch/:id', branchHandler.update)
    rest.delete('/branch/:id', branchHandler.remove)

    // menu
    rest.get('/menu/:id', menuHandler.getOne)
    rest.get('/menus', menuHandler.getAllByBranch)
    rest.post('/menu', menuHandler.create)
    rest.put('/menu/:id', menuHandler.update)
    rest.delete('/menu/:id', menuHandler.remove)

    // employee shift
    rest.get('/shift/employee/current', shiftHandler.getCurrentEmployeeShift)
    rest.get('/shift/employees', shiftHandler.fetchEmployeeShifts)
    rest.post('/shift/employee/start', shiftHandler.startEmployeeShift)
    rest.put('/shift/employee/:id/end', shiftHandler.endEmployeeShift)
    rest.put('/shift/employee/end', shiftHandler.endEmployeeShift)

    // kitchen shift
    rest.get('/shift/kitchen/current', shiftHandler.getCurrentKitchenShift)
    rest.get('/shift/kitchens', shiftHandler.fetchKitchenShifts)
    rest.post('/shift/kitchen/:branchId/start', shiftHandler.startKitchenShift)
    rest.put('/shift/kitchen/:id', shiftHandler.updateKitchenShift)
    rest.put('/shift/kitchen/:id/end', shiftHandler.endKitchenShift)

    // cashier shift
    rest.get('/shift/cashier/current', shiftHandler.getCurrentCashierShift)
    rest.get('/shift/cashiers', shiftHandler.fetchCashierShifts)
    rest.post('/shift/cashier/:branchId/start', shiftHandler.startCashierShift)
    rest.put('/shift/cashier/:id', shiftHandler.updateCashierShift)
    rest.put('/shift/cashier/:id/end', shiftHandler.endCashierShift)

    // warehouse shift
    rest.get('/shift/warehouse/current', shiftHandler.getCurrentWarehouseShift)
    rest.get('/shift/warehouses', shiftHandler.fetchWarehouseShifts)
    rest.post('/shift/warehouse/start', shiftHandler.startWarehouseShift)
    rest.put('/shift/warehouse/:id', shiftHandler.updateWarehouseShift)
    rest.put('/shift/warehouse/:id/end', shiftHandler.endWarehouseShift)

    // order
    rest.get("/total-order", orderHandler.orderSummary)
    rest.get("/orders", orderHandler.fetchOrderList)
    rest.post('/order', orderHandler.createOrder)
    rest.post('/order/process-direct-payment', orderHandler.createDirectPaymentOrder)
    rest.put('/order/:id', orderHandler.updateOrder)
    rest.put('/order/:id/refund', orderHandler.refundOrderItem)

    // stock request
    rest.get('/inventory/stock-requests', stockRequestHandler.fetchList)
    rest.post('/inventory/stock-request', stockRequestHandler.create)
    rest.put('/inventory/stock-request', stockRequestHandler.update)
    rest.put('/inventory/stock-request/:id/ready', stockRequestHandler.ready)
    rest.put('/inventory/stock-request/:id/end', stockRequestHandler.finish)

    // stock movement
    rest.get('/inventory/stock-movements', stockMovementHandler.fetchList)
    rest.post('/inventory/stock-movement', stockMovementHandler.create)
    rest.put('/inventory/stock-movement', stockMovementHandler.update)
    rest.delete('/inventory/stock-movement/:id', stockMovementHandler.del)

    // inventory item
    rest.get('/inventory/items', inventoryItemHandler.fetchList)
    rest.post('/inventory/item', inventoryItemHandler.create)
    rest.put('/inventory/item', inventoryItemHandler.update)
    rest.delete('/inventory/item/:id', inventoryItemHandler.del)

    // category
    rest.post('/category', categoryHandler.create)
    rest.put('/category/:id', categoryHandler.update)
    rest.delete('/category/:id', categoryHandler.remove)

    // fund request
    rest.get('/finance/fund-requests', fundRequestHandler.fetchList)
    rest.post('/finance/fund-request', fundRequestHandler.create)
    rest.put('/finance/fund-request', fundRequestHandler.update)
    rest.put('/finance/fund-request/:id/end', fundRequestHandler.finish)
    rest.delete('/finance/fund-request/:id', fundRequestHandler.del)

    // reservation /reservation
    rest.get('/reservations', reservationHandler.fetchList)
    rest.post('/reservation', reservationHandler.create)
    rest.put('/reservation', reservationHandler.update)
    rest.delete('/reservation/:id', reservationHandler.del)

    // finance summary
    rest.get('/finance-summary', financeSummaryHandler.fetchFinanceSummary)

    rest.use(errorMiddleware)

    return rest
}