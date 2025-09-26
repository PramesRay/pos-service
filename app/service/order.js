import {
    Branch,
    CashierShift,
    Customer,
    Employee,
    KitchenShift, KitchenShiftDetail, Menu,
    Order,
    OrderItem,
    OrderPayment,
    RefundItem,
    User
} from "../model/model.js";
import {sequelize} from "../../infrastructure/database/mysql.js";
import {Op, literal, Sequelize} from "sequelize";
import {snap} from './midtrans.js';
import {NotFoundException} from "../../exception/not.found.exception.js";
import {BadRequestException} from "../../exception/bad.request.exception.js";
import {ConflictException} from "../../exception/conflict.exception.js";
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc.js";
import tz from "dayjs/plugin/timezone.js";
import { UnauthorizedException } from "../../exception/unauthorized.exception.js";
import Crypto from "crypto";

dayjs.extend(utc);
dayjs.extend(tz);
const ZONE = "Asia/Jakarta";
const fmt = (d, s) => d.tz(ZONE).format(s);

const STATUS_PRIORITY_CASE = `
    CASE
        WHEN orders.status = 'Pending' THEN 0
        WHEN orders.status = 'Diproses' THEN 1
        WHEN orders.status = 'Tersaji' THEN 2
        WHEN orders.status IN ('Batal', 'Selesai', 'Refund') THEN 3
        ELSE 4
    END
`
const getActor = (user) => {
    if (user.type === "customer") return user.customer;
    if (user.type === "employee") return user.employee;
    return null;
}
export const fetchOrderList = async (param) => {
    let where = { };
    if(param.created_by) {
        where.created_by = param.created_by;

        const customer = await Customer.findOne({
            where: { fk_user_id: param.created_by }
        })
        if(customer) where.fk_customer_id = customer.id
    }

    if(param.branch_id) {
        where.fk_branch_id = param.branch_id
        const {activeKitchenShift, activeCashierShift} = await getActiveKitchenAndCashierShift(param.branch_id)
        if(activeKitchenShift) where.fk_kitchen_shift_id = activeKitchenShift.id
    }

    const rows = await Order.findAll({
        where,
        attributes: [
            "id",
            "table_number",
            "is_take_away",
            "status",
            "createdAt",
            "updatedAt",
            "fk_branch_id",
            "created_by",
            "updated_by",
        ],
        include: [
            {model: Customer, as: "customer", attributes: ["name", "phone"]},
            {
                model: OrderItem, as: "items",
                attributes: ["id", "quantity", "note", "status"],
                include: [{model: Menu, as: "menu"}]
            },
            {model: CashierShift, as: "cashier_shift", attributes: ["id"]},
            {model: KitchenShift, as: "kitchen_shift", attributes: ["id"]},
            {model: OrderPayment, as: "payment", attributes: ["amount", "status", "snap_token" , "createdAt"]},
            {model: Branch, as: "branch", attributes: ["id", "name"]},
            {
                model: User, as: "createdBy",
                include: [
                    {model: Employee, as: "employee", attributes: ["id", "name"]},
                    {model: Customer, as: "customer", attributes: ["id", "name"]},
                ],
            },
            {
                model: User, as: "updatedBy",
                include: [
                    {model: Employee, as: "employee", attributes: ["id", "name"]},
                    {model: Customer, as: "customer", attributes: ["id", "name"]},
                ]
            },
        ],
        order: [
            [literal(STATUS_PRIORITY_CASE), "ASC"],
            ["createdAt", "ASC"]
        ],
    });

    return rows.map((o) => {
        return {
            id: o.id,
            shift: {
                cashier: o.cashier_shift?.id ?? "",
                kitchen: o.kitchen_shift?.id ?? "",
            },
            branch: {
                id: o.branch?.id ? String(o.branch.id) : "",
                name: o.branch?.name ?? "",
            },
            table_number: o.table_number,
            customer: o.customer,
            is_take_away: o.is_take_away,
            items: (o.items ?? []).map((it) => ({
                id: it.id,
                item_id: it.menu?.id ?? "",
                name: it.menu?.name ?? "",
                quantity: it.quantity,
                price: it.menu?.price ? Number(it.menu.price) : 0,
                status: it.status,
                note: it.note ?? "",
            })),
            status: o.status,
            amount: o.payment ? Number(o.payment.amount) : 0,
            snap_token: o.payment?.snap_token ?? null,
            payment_status: o.payment?.status ?? "",
            meta: {
                created_at: o.createdAt,
                updated_at: o.updatedAt,
                created_by: {
                    id: getActor(o.createdBy)?.id ?? "",
                    name: getActor(o.createdBy)?.name ?? "",
                },
                last_updated_by: {
                    id: getActor(o.updatedBy)?.id ?? "",
                    name: getActor(o.updatedBy)?.name ?? "",
                },
            },

        };
    });
};


export const createOrder = async (param, authUser) => {
    const orderItem = param.items

    if (!orderItem || !Array.isArray(orderItem) || orderItem.length < 1) {
        throw new BadRequestException("Item pesanan tidak valid")
    }

    const {activeKitchenShift, activeCashierShift} = await getActiveKitchenAndCashierShift(param.branch_id)
    
    const tx = await sequelize.transaction();
    const customer = await findOrCreateCustomer(param.customer, tx)

    if (!customer) {
        throw new BadRequestException("Pelanggan tidak ditemukan")
    }

    const where = {
        fk_kitchen_shift_id: activeKitchenShift.id,
        fk_customer_id: {
            [Op.ne]: customer.id
        },
        status: {
            [Op.not]: ["Selesai", "Batal", "Refund"]
        }
    }

    if (!param.is_take_away) {
        where.table_number = param.table_number
    }

    const activeOrder = await Order.findOne({
        where
    })


    if (activeOrder) {
      throw new ConflictException(`Meja ${param.table_number} sedang digunakan`)
    }

    try {
        const kitchenShiftDetails = await KitchenShiftDetail.findAll({
            where: {
                fk_kitchen_shift_id: activeKitchenShift.id,
                end_stock: {[Op.gt]: 0}
            },
            include: [{model: Menu, as: "menu"}]
        })

        if (kitchenShiftDetails.length < 1) {
            throw new ConflictException("Tidak ada menu yang tersedia")
        }

        const unavailableMenu =
            kitchenShiftDetails.find(detail =>
                orderItem.some(it => it.item_id === detail.fk_menu_id && it.quantity > detail.end_stock)
            );


        if (unavailableMenu) {
            throw new ConflictException(`Menu yang tersedia tidak mencukupi`);
        }

        const order = await createOrderAndOrderItem(param, customer, orderItem, activeKitchenShift, activeCashierShift, tx, authUser.user.id)

        const createOrderPaymentParam = {
            fk_order_id: order.id,
            fk_cashier_shift_id: activeCashierShift.id,
            amount: param.amount,
            status: "Pending",
            created_by: authUser.user.id,
            updated_by: authUser.user.id,
        }

        await OrderPayment.create(createOrderPaymentParam, {transaction: tx});

        await Promise.all(kitchenShiftDetails.map(async (detail) => {
            const orderItemQuantity = orderItem.find(it => it.item_id === detail.fk_menu_id)?.quantity ?? 0
            await detail.update({
                end_stock: detail.end_stock - orderItemQuantity
            }, {transaction: tx})
        }))

        await tx.commit()

        return order;
    } catch (error) {
        await tx.rollback();
        console.error('Gagal membuat pesanan:', error);
        throw error;
    }
}

export const createDirectPaymentOrder = async (param, authUser, type = 'employee') => {
    const orderItem = param.items

    if (!orderItem || !Array.isArray(orderItem) || orderItem.length < 1) {
      throw new BadRequestException("Item pesanan tidak valid")
    }
    
    const {activeKitchenShift, activeCashierShift} = await getActiveKitchenAndCashierShift(param.branch_id)

    const tx = await sequelize.transaction();
    
    let userId = 0
    
    const customer = await findOrCreateCustomer(param.customer, tx)
    if (!customer) {
        throw new BadRequestException("Pelanggan tidak ditemukan")
    }
    
    if (type === "customer") {
      userId = customer.fk_user_id

      const existingActiveOrder = await OrderPayment.findOne({
        where: {
          created_by: userId,
          status: {
            [Op.in]: ["Pending"]
          }
        }
      })
      
      if (existingActiveOrder) {
        throw new ConflictException("Masih ada pembayaran yang belum diselesaikan, selesaikan pembayaran terlebih dahulu.");
      }
    }
    else userId = authUser.user.id

    const where = {
        fk_kitchen_shift_id: activeKitchenShift.id,
        fk_customer_id: {
            [Op.ne]: customer.id
        },
        status: {
            [Op.not]: ["Selesai", "Batal", "Refund"]
        }
    }

    if (!param.is_take_away) {
        where.table_number = param.table_number
    }

    const activeOrder = await Order.findOne({
        where
    })

    if (activeOrder) {
      throw new ConflictException(`Meja ${param.table_number} sedang digunakan`)
    }

    try {
        const kitchenShiftDetails = await KitchenShiftDetail.findAll({
            where: {
                fk_kitchen_shift_id: activeKitchenShift.id,
                end_stock: {[Op.gt]: 0}
            }
        })

        if (kitchenShiftDetails.length < 1) {
            throw new ConflictException("Tidak ada menu yang tersedia")
        }

        const unavailableMenu =
            kitchenShiftDetails.find(detail =>
                orderItem.some(it => it.item_id === detail.fk_menu_id && it.quantity > detail.end_stock)
            );

        if (unavailableMenu) {
            throw new ConflictException(`Menu yang tersedia tidak mencukupi`);
        }

        const order = await createOrderAndOrderItem(param, customer, param.items, activeKitchenShift, activeCashierShift, tx, userId)
        if (!order) throw new BadRequestException("Gagal membuat pesanan")
        const amount = order.items.reduce((total, item) => total + (item.quantity * item.menu.price || 0), 0);

        const midtransPayload = {
          order_id: order.id,
          customer: order.customer,
          amount: amount,
          items: order.items
        }

        const transaction = await generateMidtransToken(midtransPayload)
        if (!transaction) throw new BadRequestException("Gagal membuat pembayaran Midtrans")

        const createOrderPaymentParam = {
            fk_order_id: order.id,
            fk_cashier_shift_id: activeCashierShift.id,
            method: param.payment_method,
            amount: amount,
            snap_token: param.payment_method === "midtrans" ? transaction.token : null,
            status: param.payment_method === "midtrans" ? "Pending" : "Lunas",
            created_by: userId,
            updated_by: userId,
        }

        await OrderPayment.create(createOrderPaymentParam, {transaction: tx});

        await Promise.all(kitchenShiftDetails.map(async (detail) => {
            const orderItemQuantity = orderItem.find(it => it.item_id === detail.fk_menu_id)?.quantity ?? 0
            await detail.update({
                end_stock: detail.end_stock - orderItemQuantity
            }, {transaction: tx})
        }))

        await tx.commit()

        return {...order, snap_token: transaction.token};
    } catch (error) {
        await tx.rollback();
        console.error('Gagal membuat pesanan:', error);
        throw error;
    }
}

export const generateMidtransToken = async (param) => {
    const midtransItems = param.items.map(i => ({
      id: i.menu.id,
      name: i.menu.name,
      price: Math.round(i.menu.price || 0), // Midtrans pakai integer (IDR)
      quantity: i.quantity
    }))
    
    const payload = {
        transaction_details: {
            order_id: param.order_id,
            gross_amount: param.amount,
        },
        customer_details: {
            first_name: param.customer.name,
            phone: param.customer.phone,
        },
        item_details: midtransItems,
        expiry: {
            unit: "minutes",
            duration: 15
        }
    }
    const transaction = await snap.createTransaction(payload)
    return transaction
}

export const updateOrder = async (param, authUser, by = "employee") => {
    const {type, ...payload} = param

    let userId = 0
    if (by === "customer") userId = payload.customer.fk_user_id
    else userId = authUser.user.id
    
    switch (type) {
        case 'updateStatus':
            return await updateOrderStatus(payload, userId);

        case 'updateItems':
            return await updateOrderItemStatus(payload, userId);

        case 'updatePayment':
            return await updateOrderPayment(payload, userId);

        case 'updateOrder':
            return await updateWholeOrder(payload, userId);
    }
}

export const refundOrderItem = async (payload, authUser) => {
    const orderItemToRefund = new Map(
        payload.items.map((item) => [item.id, item])
    )

    const orderItems = await OrderItem.findAll({where: {fk_order_id: payload.id}})

    const transaction = await sequelize.transaction();

    try {
        for (const item of orderItems) {
            if (orderItemToRefund.has(item.id)) {
                item.status = 'Refund'
                item.updated_by = authUser.id
                await item.save({transaction})

                await RefundItem.create({
                    fk_order_item_id: item.id,
                    amount: payload.amount,
                    method: payload.method,
                    reason: payload.reason,
                    created_by: authUser.id,
                    updated_by: authUser.id,
                }, {transaction})
            }
        }

        const refundedCount = await OrderItem.count({
            where: { fk_order_id: payload.id, status: 'Refund' },
            transaction
        });
        const isAllRefund = refundedCount === orderItems.length;

        if (isAllRefund) {
            const order = await Order.findByPk(payload.id);
            order.status = "Refund";
            order.updated_by = authUser.id;
            await order.save({transaction,});
        }

        await transaction.commit()
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

const aggregateQtyPerMenu = (items) => {
    const map = new Map();
    for (const it of items) {
        const menuId = it.fk_menu_id; // ganti jika fieldnya beda
        const qty = Number(it.quantity) || 0;
        if (!menuId || qty <= 0) continue;
        map.set(menuId, (map.get(menuId) || 0) + qty);
    }
    return map;
};

const updateOrderStatus = async (payload, userId) => {
    const tx = await sequelize.transaction();

  try {
    // 1) Ambil order + relasi dengan FOR UPDATE (locking)
    const order = await Order.findByPk(payload.id, {
      include: [
        { model: OrderItem, as: 'items' },
        { model: OrderPayment, as: 'payment' },
        {
          model: KitchenShift,
          as: 'kitchen_shift',
          include: [{ model: KitchenShiftDetail, as: 'details' }],
        },
      ],
      transaction: tx
    });

    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');

    // 2) Update status Order (pakai instance.save + transaction)
    order.status = payload.status;
    order.payment.status = payload.status;
    order.updated_by = userId;
    await order.save({ transaction: tx });
    await order.payment.save({ transaction: tx });

    // Early exit jika bukan Batal
    if (payload.status !== 'Batal') {
      await tx.commit();
      return;
    }

    // 3) Tandai semua OrderItem menjadi Batal
    if (Array.isArray(order.items) && order.items.length) {
      for (const item of order.items) {
        item.status = 'Batal';
        item.updated_by = userId;
        await item.save({ transaction: tx });
      }
    }
    
    // 6) Hitung total qty per menu dari items order
    const qtyPerMenu = aggregateQtyPerMenu(order.items || []);

    if (qtyPerMenu.size > 0) {
      // 6a) Ambil detail shift untuk menu-menu yang terdampak (FOR UPDATE)
      const menuIds = Array.from(qtyPerMenu.keys());
      const details = await KitchenShiftDetail.findAll({
        where: {
          fk_kitchen_shift_id: order.kitchen_shift.id,
          fk_menu_id: menuIds,
        },
        transaction: tx
      });

      // 6b) Update end_stock = end_stock + qty yang dikembalikan
      for (const detail of details) {
        const addBack = qtyPerMenu.get(detail.fk_menu_id) || 0;

        // Naikkan end_stock dengan literal agar atomic
        await KitchenShiftDetail.update(
          {
            end_stock: sequelize.literal(`COALESCE(end_stock,0) + ${addBack}`),
            updated_by: userId,
          },
          {
            where: {
              id: detail.id,
              fk_kitchen_shift_id: order.kitchen_shift.id,
            },
            transaction: tx
          }
        );
      }
    }

    await order.reload( {
      
    });
    await tx.commit();
    return order
  } catch (err) {
    await tx.rollback();
    throw err;
  }
};


const updateOrderItemStatus = async (payload, userId) => {
    const tx = await sequelize.transaction();

  try {
    const order = await Order.findByPk(payload.id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: tx
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    const idToStatus = new Map(
      (payload.items || []).map(i => [i.id, i.status])
    );

    for (const item of order.items) {
      const newStatus = idToStatus.get(item.id);
      if (!newStatus) continue;

      if (item.status !== newStatus) {
        item.status = newStatus;
        item.updated_by = userId;
        await item.save({ transaction: tx }); 
      }
    }

    await order.reload({
      include: [
        { model: OrderItem, as: 'items' },
        { model: OrderPayment, as: 'payment' }
    ],
      transaction: tx
    });

    const totalItems = order.items.length;
    const allServed = totalItems > 0 && order.items.every(i => i.status === 'Tersaji');
    const anyProcessing = order.items.some(i => i.status === 'Diproses');

    if (allServed && order.payment.status === 'Lunas') {
        order.status = 'Selesai';  
    } else if (allServed && order.status !== allServed) {
        order.status = 'Tersaji';
    }

    if (anyProcessing && order.status !== anyProcessing) {
        order.status = 'Diproses';
    }

    order.updated_by = userId;
    await order.save({ transaction: tx });

    const response = await order.reload({
      include: [
        { model: OrderItem, as: 'items' }
      ],
      transaction: tx
    })

    await tx.commit();
    return response
  } catch (err) {
    await tx.rollback();
    console.error(`Error updating order ${payload?.id}: ${err.message}`);
    throw err;
  }
};

const updateOrderPayment = async (payload, userId) => {
    const tx = await sequelize.transaction();

    try{
        const orderData = await Order.findByPk(payload.id, {
          include: [
            {
              model: OrderItem,
              as: 'items',
              attributes: ['id', 'quantity'],
              include: [
                { model: Menu, as: 'menu', attributes: ['id', 'name', 'price'] }
              ]
            },
            { model: OrderPayment, as: 'payment' },
            { model: Customer, as: 'customer' }
          ],
          transaction: tx
        })

        const order = orderData.get({ plain: true }) 
        
        if (order.payment.status === "Lunas" || order.payment.status === "Refund") {
            throw new ConflictException("Pembayaran telah selesai atau direfund");
        }

        const amount = order.items.reduce((total, item) => total + (item.quantity * item.menu.price || 0), 0);

        if (payload.payment_method === "midtrans") {
            const midtransPayload = {
              order_id: order.id,
              customer: order.customer,
              amount: amount,
              items: order.items
            }
            const transaction = await generateMidtransToken(midtransPayload)
            if (!transaction) throw new BadRequestException("Gagal membuat pembayaran Midtrans")

            orderData.payment.snap_token = transaction.token
        } else {
            orderData.payment.status = "Lunas"
        }
        
        orderData.payment.amount = amount
        orderData.payment.method = payload.payment_method
        orderData.payment.updated_by = userId
        await orderData.payment.save({ transaction: tx });
        
        orderData.updated_by = userId;
        if (orderData.status === 'Tersaji') orderData.status = 'Selesai';
        await orderData.save({ transaction: tx });
        await orderData.reload({
            include: [{ model: OrderPayment, as: 'payment' }]
        })
        await tx.commit();

        return {...orderData.toJSON(), snap_token: orderData.payment.snap_token};
    } catch (err) {
        await tx.rollback();
        console.error(`Error updating order ${payload?.id}: ${err.message}`);
        throw err;
    }
}

const updateWholeOrder = async (payload, userId) => {
  const transaction = await sequelize.transaction();
  
  const order = await Order.findByPk(payload.id, {
    transaction,
  });
  if (!order) throw new NotFoundException('Pesanan tidak ditemukan');

  try {
    const orderItems = await OrderItem.findAll({
      where: { fk_order_id: payload.id },
      transaction,
    });

        order.table_number = payload.table_number;
        order.is_take_away = payload.is_take_away;
        order.fk_branch_id = payload.branch_id;
        order.updated_by = userId;
        await order.save({transaction});

        const existById = new Map(orderItems.map(it => [String(it.id), it]));

        const payloadItems = Array.isArray(payload.items) ? payload.items : [];
        for (const p of payloadItems) {
            const pid = p?.id != '' ? String(p.id) : null;

            if (pid && existById.has(pid)) {
                const it = existById.get(pid);

                it.fk_menu_id = p.item_id ?? it.fk_menu_id;
                it.quantity = p.quantity ?? it.quantity;
                it.note = p.note ?? it.note;
                it.updated_by = userId;

                await it.save({transaction});
            } else {
                const createOrderItemParam = {
                    fk_order_id: order.id,
                    fk_menu_id: p.item_id,
                    quantity: p.quantity,
                    note: p.note ?? null,
                    status: "Pending",
                    created_by: userId,
                    updated_by: userId,
                };
                await OrderItem.create(createOrderItemParam, {transaction});
            }
        }

        const payloadIdSet = new Set(
            payloadItems.filter(x => x?.id != null).map(x => String(x.id))
        );
        for (const it of orderItems) {
            if (!payloadIdSet.has(String(it.id))) {
                await it.destroy({transaction});
            }
        }

        await OrderPayment.update(
            {amount: payload.amount, updated_by: userId},
            {where: {fk_order_id: payload.id}, transaction}
        );

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

    const payloadIdSet = new Set(
      payloadItems.filter(x => x?.id != null).map(x => String(x.id))
    );
    for (const it of orderItems) {
      if (!payloadIdSet.has(String(it.id))) {
        await it.destroy({ transaction });
      }
    }

    await OrderPayment.update(
      { amount: payload.amount, updated_by: userId },
      { where: { fk_order_id: payload.id }, transaction }
    );

    await order.reload({
      include: [
        { model: OrderItem, as: 'items' },
        { model: OrderPayment, as: 'payment' },
      ],
    })
    await transaction.commit();

    return order
};

const getActiveKitchenAndCashierShift = async (branchId) => {
    const activeKitchenShift = await KitchenShift.findOne({
        where: {
            end: null,
            fk_branch_id: branchId
        }
    })

    if (!activeKitchenShift) {
        throw new NotFoundException("Tidak ada Sif Dapur yang aktif")
    }

    const activeCashierShift = await CashierShift.findOne({
        where: {
            end: null,
            fk_branch_id: branchId
        }
    })

    if (!activeCashierShift) {
        throw new NotFoundException("Tidak ada Sif Kasir yang aktif")
    }

    return {activeKitchenShift, activeCashierShift}
}

function makeSignature({ order_id, status_code, gross_amount }, serverKey) {
  const raw = `${order_id}${status_code}${gross_amount}${serverKey}`;
  return Crypto.createHash('sha512').update(raw).digest('hex');
}

export const webHookUpdateOrderPayment = async (param) => {
    const sig = makeSignature(
      {
        order_id: param.order_id,
        status_code: param.status_code,
        gross_amount: param.gross_amount,
      },
      process.env.MIDTRANS_SERVER_KEY
    );

    if(sig !== param.signature_key) {
        throw new UnauthorizedException("Signature Key Salah");
    }
    const order = await Order.findByPk(param.order_id, {
        include: [
            { model: OrderItem, as: 'items' },
            { model: OrderPayment, as: 'payment' },
            { model: User, as: 'createdBy' },
        ],
    });

    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');

    if (order.payment.status === "Lunas" || order.payment.status === "Refund") {
        return
    }

    if (order.status === "Batal") {
        return
    }

    if (
      param.status_code === '200' 
      && param.transaction_status === 'settlement' || param.transaction_status === 'capture'
      && String(param.fraud_status).toLowerCase() === 'accept'
    ) {
        order.payment.status = 'Lunas';

        if (order.status === 'Tersaji') {
          order.status = 'Selesai';
          await order.save();
        }
    } else if (['deny','cancel','expire','failure'].includes(String(param.transaction_status).toLowerCase())) {
        order.payment.status = 'Gagal';

        if (order.createdBy.type === 'customer') {
          order.status = 'Batal';
          await order.save();
        }
    }
    await order.payment.save();
}

const createOrderAndOrderItem = async (param, customer, orderItem, activeKitchenShift, activeCashierShift, tx, userId) => {
    const createOrderParam = {
        table_number: param.table_number,
        is_take_away: param.is_take_away,
        fk_branch_id: param.branch_id,
        ordered_at: new Date(),
        fk_kitchen_shift_id: activeKitchenShift.id,
        fk_cashier_shift_id: activeCashierShift.id,
        fk_customer_id: customer.id,
        status: "Pending",
        created_by: userId,
        updated_by: userId,
    }

    const order = await Order.create(createOrderParam, {transaction: tx});

    const createOrderItemParam = orderItem
        .filter(item => item.quantity > 0)
        .map(item => ({
            status: "Pending",
            fk_order_id: order.id,
            fk_menu_id: item.item_id,
            quantity: item.quantity,
            note: item.note ?? "",
            created_by: userId,
            updated_by: userId,
        }))

    await OrderItem.bulkCreate(createOrderItemParam, {transaction: tx});

    const reloadedOrder = await Order.findByPk(order.id, {
    attributes: ['id'],
    include: [
      {
        model: OrderItem,
        as: 'items',
        attributes: ['id', 'quantity'],
        include: [
          { model: Menu, as: 'menu', attributes: ['id', 'name', 'price'] }
        ]
      },
      { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] }
    ],
    transaction: tx
  })

  return reloadedOrder.get({ plain: true })
}

// find a customer by phone number and create if it doesn't exist
const findOrCreateCustomer = async (customer, tx) => {
    const exist = await Customer.findOne({
        where: {
            phone: customer.phone
        },
        transaction: tx
    })

    if (exist) {
        return exist;
    }

    const user = await User.create({ type: "customer" }, { transaction: tx });

    try {
        const customer = await Customer.create({
        fk_user_id: user.id,
        name: payload.name,
        phone: payload.phone,
        }, { transaction: tx });

        return customer;
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
        const winner = await Customer.findOne({
            where: { phone: payload.phone },
            transaction: tx
        });
        return winner;
        }
        throw err;
    }
}

const orderSummary = async (param) => {
    const statusFilter = param?.status ?? 'Selesai';
    const branchFilter = param?.branch_id ?? param?.branchId ?? undefined;

    // helpers waktu (pakai zona)
    const now = dayjs().tz(ZONE);
    const todayStr = now.format("YYYY-MM-DD");
    const todayStart = now.startOf("day");
    const todayEnd = todayStart.add(1, "day");
    const zoneOffset = now.format("Z"); // contoh "+07:00"

    // =========================
    // fetch current (hari ini - timezone aware)
    // =========================
    const currentRows = await sequelize.query(
        `
            SELECT fk_branch_id, COUNT(*) AS cnt
            FROM orders
            WHERE DATE(CONVERT_TZ(ordered_at, '+00:00', :zone)) = :today
              ${statusFilter ? "AND status = :status" : ""}
              ${branchFilter ? "AND fk_branch_id = :bid" : ""}
            GROUP BY fk_branch_id
        `,
        {
            replacements: {
                zone: zoneOffset,
                today: todayStr,
                status: statusFilter,
                bid: branchFilter,
            },
            type: Sequelize.QueryTypes.SELECT,
        }
    );

    const currentMap = new Map();
    currentRows.forEach(r => currentMap.set(r.fk_branch_id, Number(r.cnt)));

    // =========================
    // fetch week (per minggu dalam bulan berjalan, berhenti di minggu sekarang)
    // =========================
    const {weekStarts, weekRangeStart} = weekStartsMTD(zoneOffset);

    const weekRows = await sequelize.query(
        `
            SELECT fk_branch_id,
                   DATE(
                       DATE_SUB(
                           CONVERT_TZ(ordered_at, '+00:00', :zone),
                           INTERVAL WEEKDAY(CONVERT_TZ(ordered_at, '+00:00', :zone)) DAY
                       )
                   ) AS week_start,
                   COUNT(*) AS cnt
            FROM orders
            WHERE CONVERT_TZ(ordered_at, '+00:00', :zone) >= :wstart
              AND CONVERT_TZ(ordered_at, '+00:00', :zone) < :wend
              ${statusFilter ? "AND status = :status" : ""}
              ${branchFilter ? "AND fk_branch_id = :bid" : ""}
            GROUP BY fk_branch_id, week_start
        `,
        {
            replacements: {
                zone: zoneOffset,
                wstart: weekRangeStart.startOf("day").toDate(),
                wend: now.endOf("day").toDate(), // berhenti di hari ini
                status: statusFilter,
                bid: branchFilter,
            },
            type: Sequelize.QueryTypes.SELECT,
        }
    );

    const weekMap = new Map();
    weekRows.forEach(r => {
        const bid = r.fk_branch_id;
        if (!weekMap.has(bid)) weekMap.set(bid, new Map());
        weekMap.get(bid).set(dayjs(r.week_start).format("YYYY-MM-DD"), Number(r.cnt));
    });

    // =========================
    // fetch month (bulanan YTD, timezone aware)
    // =========================
    const { monthStarts, monthRangeStart } = monthStartsYTD(ZONE);

    const monthRows = await sequelize.query(
        `
            SELECT fk_branch_id,
                   DATE_FORMAT(CONVERT_TZ(ordered_at, '+00:00', :zone), '%Y-%m-01') AS mstart,
                   COUNT(*) AS cnt
            FROM orders
            WHERE CONVERT_TZ(ordered_at, '+00:00', :zone) >= :mstart
              AND CONVERT_TZ(ordered_at, '+00:00', :zone) < :tend
              ${statusFilter ? "AND status = :status" : ""}
              ${branchFilter ? "AND fk_branch_id = :bid" : ""}
            GROUP BY fk_branch_id, mstart
        `,
        {
            replacements: {
                zone: zoneOffset,
                mstart: monthRangeStart.startOf("day").toDate(),
                tend: todayEnd.toDate(),
                status: statusFilter,
                bid: branchFilter,
            },
            type: Sequelize.QueryTypes.SELECT,
        }
    );

    const monthMap = new Map();
    monthRows.forEach(r => {
        const bid = r.fk_branch_id;
        if (!monthMap.has(bid)) monthMap.set(bid, new Map());
        monthMap.get(bid).set(dayjs(r.mstart).format("YYYY-MM-01"), Number(r.cnt));
    });

    // =========================
    // build result (per cabang bila ada param branch)
    // =========================
    if (branchFilter) {
        // kalau cabang tidak ketemu -> nol semua (tidak ngambil agregat)
        const branch = await Branch.findOne({ where: { id: branchFilter } });
        if (!branch) {
            return {
                current: 0,
                week: weekStarts.map(() => 0),
                month: monthStarts.map(() => 0),
            };
        }

        const branchID = branch.id;
        const cur = currentMap.get(branchID) ?? 0;

        const wmap = weekMap.get(branchID) ?? new Map();
        const week = weekStarts.map(ws => wmap.get(ws) ?? 0);

        const mmap = monthMap.get(branchID) ?? new Map();
        const month = monthStarts.map(ms => mmap.get(ms) ?? 0);

        return { current: cur, week, month };
    }

    // agregasi seluruh cabang (default)
    const branches = await Branch.findAll();
    const result = branches.reduce((acc, branch) => {
        const branchID = branch.id;
        const cur = (currentMap.get(branchID) ?? 0) + (acc.current ?? 0);

        const wmap = weekMap.get(branchID) ?? new Map();
        const week = weekStarts.map((ws, i) => (wmap.get(ws) ?? 0) + (acc.week ? acc.week[i] : 0));

        const mmap = monthMap.get(branchID) ?? new Map();
        const month = monthStarts.map((ms, i) => (mmap.get(ms) ?? 0) + (acc.month ? acc.month[i] : 0));

        return {
            current: cur,
            week,
            month,
        };
    }, { current: 0, week: weekStarts.map(() => 0), month: monthStarts.map(() => 0) });

    return result;
};


const monthStartsYTD = (zone = ZONE) => {
    const now = dayjs().tz(zone);
    const yearStart = now.startOf("year");
    const thisMonthStart = now.startOf("month");
    const out = [];
    let cur = yearStart.startOf("month");
    while (cur.isBefore(thisMonthStart) || cur.isSame(thisMonthStart)) {
        out.push(fmt(cur, "YYYY-MM-01"));
        cur = cur.add(1, "month");
    }
    return {monthStarts: out, monthRangeStart: yearStart};
}

// versi aman: selalu include Senin minggu sekarang
const weekStartsMTD = () => {
  const now = dayjs().tz(ZONE);
  const monthStart = now.startOf('month');

  // Monday anchor (Senin sebagai awal minggu)
  const toMonday = (d) => d.subtract((d.day() + 6) % 7, 'day').startOf('day');
  const firstWeekMonday = toMonday(monthStart);
  const thisWeekMonday  = toMonday(now);

  const weekStarts = [];
  let cur = firstWeekMonday;

  // PERHATIKAN: pakai !isAfter (== <=) agar Senin minggu berjalan ikut
  while (!cur.isAfter(thisWeekMonday)) {
    weekStarts.push(cur.format('YYYY-MM-DD'));
    cur = cur.add(7, 'day');
  }

  // Kalau kamu mau “MTD murni” (minggu pertama dipotong dari tgl 1),
  // biarkan saja anchor tetap Senin, nanti nilai minggu pertama bisa >0
  // meski beberapa harinya ada di bulan sebelumnya. Kalau mau benar2
  // MTD only di SQL, ganti wstart = monthStart (lihat catatan di bawah).
  return { weekStarts, weekRangeStart: firstWeekMonday };
};

export default {
    fetchOrderList,
    createOrder,
    createDirectPaymentOrder,
    webHookUpdateOrderPayment,
    updateOrder,
    refundOrderItem,
    orderSummary
};