import {KitchenShift, Order, OrderItem, OrderPayment} from "../model/model.js";
import {NotFoundException} from "../../exception/not.found.exception.js";
import {sequelize} from "../../infrastructure/database/mysql.js";
import {BadRequestException} from "../../exception/bad.request.exception.js";

export const createOrder = async (param) => {
    const orderItem = param.items

    if (!orderItem || !Array.isArray(orderItem) || orderItem.length < 1) {
        throw new BadRequestException("invalid order items data")
    }

    const activeKitchenShift = await KitchenShift.findOne({
        where: {
            end: null,
            fk_branch_id: param.branch_id,
        }
    })

    if (!activeKitchenShift) {
        throw new NotFoundException("active kitchen shift not found")
    }

    const tx = await sequelize.transaction();

    try {
        // TODO: add cashier shift
        const createOrderParam = {
            table_number: param.table_number,
            is_take_away: param.is_take_away,
            fk_branch_id: param.branch_id,
            ordered_at: new Date(),
            fk_kitchen_shift_id: activeKitchenShift.id,
            status: "Pending",
        }

        const order = await Order.create(createOrderParam, {transaction: tx});

        const createOrderItemParam = orderItem
            .filter(item => item.quantity > 0)
            .map(item => ({
                fk_order_id: order.id,
                fk_menu_id: item.id,
                quantity: item.quantity,
                note: item.note ?? "",
            }))

        await OrderItem.bulkCreate(createOrderItemParam, {transaction: tx})

        // TODO: add cashier shift
        const createOrderPaymentParam = {
            fk_order_id: order.id,
            method: param.payment_method,
            amount: param.amount,
            status: "Pending"
        }

        await OrderPayment.create(createOrderPaymentParam, {transaction: tx})

        await tx.commit()

        return {
            order,
            items: createOrderItemParam,
        };
    } catch (error) {
        await tx.rollback();
        console.error('Failed to create order:', error);
        throw error;
    }
}

export const createDirectPaymentOrder = async (param) => {
    const orderItem = param.items

    if (!orderItem || !Array.isArray(orderItem) || orderItem.length < 1) {
        throw new BadRequestException("invalid order items data")
    }

    const activeKitchenShift = await KitchenShift.findOne({
        where: {
            end: null,
            fk_branch_id: param.branch_id,
        }
    })

    if (!activeKitchenShift) {
        throw new NotFoundException("active kitchen shift not found")
    }

    const tx = await sequelize.transaction();

    try {
        // TODO: add cashier shift
        const createOrderParam = {
            table_number: param.table_number,
            is_take_away: param.is_take_away,
            fk_branch_id: param.branch_id,
            ordered_at: new Date(),
            fk_kitchen_shift_id: activeKitchenShift.id,
            status: "Pending",
        }

        const order = await Order.create(createOrderParam, {transaction: tx});

        const createOrderItemParam = orderItem
            .filter(item => item.quantity > 0)
            .map(item => ({
                fk_order_id: order.id,
                fk_menu_id: item.id,
                quantity: item.quantity,
                note: item.note ?? "",
            }))

        await OrderItem.bulkCreate(createOrderItemParam, {transaction: tx})

        // TODO: add cashier shift
        const createOrderPaymentParam = {
            fk_order_id: order.id,
            method: param.payment_method,
            amount: param.amount,
            status: "Selesai"
        }

        await OrderPayment.create(createOrderPaymentParam, {transaction: tx})

        await tx.commit()

        return {
            order,
            items: createOrderItemParam,
        };
    } catch (error) {
        await tx.rollback();
        console.error('Failed to create order:', error);
        throw error;
    }
}

export const updateOrder = async (param) => {
    const {type, ...payload} = param

    switch (type) {
        case 'updateStatus':
            await updateOrderStatus(payload);
            break;

        case 'updateItems':
            await updateOrderItemStatus(payload);
            break;

        case 'updatePayment':
            await updateOrderPayment(payload);
            break;

        case 'updateOrder':
            await updateWholeOrder(payload);
            break;
    }
}

export const updateOrderStatus = async (payload) => {
    await Order.update(
        {
            status: payload.status,
        },
        {
            where: {
                id: payload.id,
            }
        }
    )
}

export const updateOrderItemStatus = async (payload) => {
    const orderIdToStatus = new Map(
        payload.items.map((item) => [item.id, item.status])
    )

    const orderItems = await OrderItem.findAll({
        where: {
            fk_order_id: payload.id
        }
    })

    const transaction = await sequelize.transaction();

    try {
        for (const item of orderItems) {
            const status = orderIdToStatus.get(item.id);
            if (status) {
                item.status = status;
                await item.save({transaction});
            }
        }

        await transaction.commit()
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export const updateOrderPayment = async (payload) => {
    const orderPayment = await OrderPayment.findOne({
        where: {
            fk_order_id: payload.id,
        }
    })

    orderPayment.method = payload.method
    await orderPayment.save()
}

export const updateWholeOrder = async (payload) => {
    const order = await Order.findByPk(payload.id)

    const orderItems = await order.find({
        where: {
            fk_order_id: payload.id,
        }
    })

    const transaction = await sequelize.transaction()
    try {

        order.table_number = payload.table_number
        order.is_take_away = payload.is_take_away
        order.fk_branch_id = payload.branch_id

        await order.save({transaction});

        const itemById = new Map(
            payload.items.map((item) => [item.id, item.status])
        )

        for (const item of orderItems) {
            const itemParam = itemById.get(item.id);
            if (itemParam) {
                item.quantity = itemParam.quantity
                item.note = itemParam.note
                await item.save({transaction});
            }
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export default {
    createOrder,
    createDirectPaymentOrder
};