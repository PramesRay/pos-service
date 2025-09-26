import {
    Branch,
    CashierShift,
    CashierShiftCashIn,
    CashierShiftCashOut, Employee,
    OrderPayment,
    EmployeeShift,
    KitchenShift,
    KitchenShiftDetail, Menu, Order, StockMovement, StockRequest, WarehouseShift,
    Category
} from "../model/model.js";
import {ConflictException} from "../../exception/conflict.exception.js";
import {sequelize} from "../../infrastructure/database/mysql.js";
import {NotFoundException} from "../../exception/not.found.exception.js";
import {Op} from "sequelize";

const startEmployeeShift = async (authUser) => {
    const latestShift = await EmployeeShift.findOne({
        where: {
            fk_employee_id: authUser.id,
        },
        order: [['createdAt', 'DESC']],
    });

    if (latestShift && !latestShift.end) {
        throw new ConflictException("Sif sudah dimulai");
    }

    const employee = await EmployeeShift.create({
        fk_employee_id: authUser.id,
        fk_branch_id: authUser.assigned_branch.id,
        start: (new Date()),
        created_by: authUser.id,
        updated_by: authUser.id,
    })

    return employee
}

const endEmployeeShift = async (authUser) => {
    const latestShift = await EmployeeShift.findOne({
        where: {
            fk_employee_id: authUser.id,
        },
        order: [['createdAt', 'DESC']],
    });

    if (latestShift && latestShift.end) {
        throw new ConflictException("Sif telah diakhiri");
    }

    latestShift.end = new Date();
    latestShift.updated_by = authUser.id;
    await latestShift.save()

    return latestShift
}

const getCurrentEmployeeShift = async (authUser) => {
    const latestShift = await EmployeeShift.findOne({
        where: {fk_employee_id: authUser.id},
        include: [
            {model: Branch, as: "branch", attributes: ["id", "name"]},
            {model: Employee, as: "employee"},
        ],
        order: [['createdAt', 'DESC']],
    });

    if (!latestShift) return null

    return {
        id: latestShift.id,
        branch: latestShift.branch,
        employee: latestShift.employee,
        start: latestShift.start,
        end: latestShift.end,
        meta: {
            created_at: latestShift.createdAt,
            created_by: latestShift.createdBy,
            updated_at: latestShift.updatedAt,
            last_updated_by: latestShift.updatedBy,
        }
    }
}

const fetchEmployeeShifts = async (param) => {
    const where = {};

    if (param.branch_id) {
        where.fk_branch_id = param.branch_id;
    }

    const rows = await EmployeeShift.findAll({
        where,
        include: [
            {model: Branch, as: "branch"},
            {model: Employee, as: "employee"},
            {model: Employee, as: "createdBy", attributes: ["id", "name"]},
            {model: Employee, as: "updatedBy", attributes: ["id", "name"]},
        ],
        order: [
            [sequelize.literal("(`end` IS NULL)"), "DESC"],
            ['start', 'DESC']
        ]
    })

    return rows.map((row) => {
        return {
            id: row.id,
            branch: row.branch,
            employee: row.employee,
            start: row.start,
            end: row.end,
            notes: row.notes,
            meta: {
                created_at: row.createdAt,
                created_by: row.createdBy,
                updated_at: row.updatedAt,
                last_updated_by: row.updatedBy,
            }
        }
    })
}

const startKitchenShift = async (param, authUser) => {
    const latestShift = await KitchenShift.findOne({
        where: {
            fk_branch_id: param.branch_id,
        },
        order: [['createdAt', 'DESC']],
    })

    if (latestShift && !latestShift.end) {
        throw new ConflictException("Sif sudah dimulai");
    }

    const tx = await sequelize.transaction();

    try {
        const kitchenShift = await KitchenShift.create({
            fk_branch_id: param.branch_id,
            start: new Date(),
            created_by: authUser.id,
            updated_by: authUser.id,
        }, {transaction: tx});

        const kitchenShiftDetailData = Array.isArray(param.initial_menu) ? param.initial_menu : [];

        const kitchenShiftDetailPayload = kitchenShiftDetailData
            .filter(data => data.quantity > 0)
            .map(data => ({
                fk_kitchen_shift_id: kitchenShift.id,
                fk_menu_id: data.id,
                initial_stock: data.quantity,
                end_stock: data.quantity,
                created_by: authUser.id,
                updated_by: authUser.id,
            }));

        let details = {}

        if (kitchenShiftDetailPayload.length > 0) {
            details = await KitchenShiftDetail.bulkCreate(kitchenShiftDetailPayload, {transaction: tx});
        }

        await tx.commit();
        return {
            ...kitchenShift.toJSON(),
            id: kitchenShift.id,
            details: details
        };
    } catch (error) {
        await tx.rollback();
        console.error('Failed to start kitchen shift:', error);
        throw error;
    }
}

const updateKitchenShift = async (param, authUser) => {
    const latestShift = await KitchenShift.findByPk(param.id);

    if (!latestShift) {
        throw new NotFoundException("Sif Dapur tidak ditemukan");
    }

    if (latestShift && latestShift.end) {
        throw new ConflictException("Sif telah diakhiri");
    }

    const shiftDetails = await KitchenShiftDetail.findAll({
        where: {
            fk_kitchen_shift_id: latestShift.id,
        },
    });

    const transaction = await sequelize.transaction();
    try {
        const menuIdToQuantity = new Map(
            param.final_menu.map((item) => [item.id, item.quantity])
        );

        for (const detail of shiftDetails) {
            const quantity = menuIdToQuantity.get(detail.fk_menu_id);
            if (typeof quantity !== "undefined") {
                detail.end_stock = quantity;
                detail.updated_by = authUser.id;
                await detail.save({transaction});
            }
        }

        if (param.notes) {
            latestShift.notes = param.notes;
            latestShift.updated_by = authUser.id;
            await latestShift.save({transaction});
        }

        await transaction.commit();
        return {
            ...latestShift.toJSON(),
            id: latestShift.id,
            details: shiftDetails
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const endKitchenShift = async (param, authUser) => {
    const latestShift = await KitchenShift.findByPk(param.id);

    if (!latestShift) {
        throw new NotFoundException("Sif Dapur tidak ditemukan");
    }

    if (latestShift && latestShift.end) {
        throw new ConflictException("Sif telah diakhiri");
    }

    const shiftDetails = await KitchenShiftDetail.findAll({
        where: {
            fk_kitchen_shift_id: latestShift.id,
        },
    });

    latestShift.end = new Date();
    latestShift.updated_by = authUser.id;

    await latestShift.save();

    return {
        ...latestShift.toJSON(),
        details: shiftDetails
    };
};

const getCurrentKitchenShift = async (param) => {
    const where = {};

    if (param.branch_id) {
        where.fk_branch_id = param.branch_id;
    }

    const row = await KitchenShift.findOne({
        include: [
            {model: Branch, as: "branch"},
            {model: KitchenShiftDetail, 
                as: "details", 
                include: [{model: Menu, 
                    as: "menu",
                    include: [{model: Category, 
                        as: "category",
                        attributes: ["id", "name"]
                    }],
                    attributes: ["id", "name", "price", 'threshold']
                }]},
            {model: StockRequest, as: "stockRequests"},
            {model: Employee, as: "createdBy", attributes: ["id", "name"]},
            {model: Employee, as: "updatedBy", attributes: ["id", "name"]},
            {model: Order, as: "orders"}
        ],
        where,
        order: [['createdAt', 'DESC']],
    });

    if (!row) return null

    const totalOrder = row.orders.length
    const successOrder = row.orders.filter(o => o?.status === 'Selesai').length
    const cancelledOrder = row.orders.filter(o => o?.status === 'Batal').length

    const totalRequest = row.stockRequests.length
    const approvedRequest = row.stockRequests.filter(sr => sr.status === 'Selesai').length
    const rejectedRequest = row.stockRequests.filter(sr => sr.status === 'Ditolak').length

    return {
        id: row.id,
        branch: row.branch,
        start: row.start,
        end: row.end,
        quantity_menu: row.details.map(detail => ({
            ...detail.menu.toJSON(),
            initial: detail.initial_stock,
            final: detail.end_stock,
        })),
        total_restock_request: totalRequest,
        request_approved: approvedRequest,
        request_rejected: rejectedRequest,
        total_order: totalOrder,
        completed_order: successOrder,
        canceled_order: cancelledOrder,
        notes: row.notes,
        meta: {
            created_at: row.createdAt,
            created_by: row.createdBy,
            updated_at: row.updatedAt,
            last_updated_by: row.updatedBy,
        }
    };
};

const fetchKitchenShifts = async (param) => {
    const where = {};

    if (param.branch_id) {
        where.fk_branch_id = param.branch_id;
    }

    const rows = await KitchenShift.findAll({
        include: [
            {model: Branch, as: "branch"},
            {model: KitchenShiftDetail, as: "details", include: [{model: Menu, as: "menu"}]},
            {model: StockRequest, as: "stockRequests"},
            {model: Employee, as: "createdBy", attributes: ["id", "name"]},
            {model: Employee, as: "updatedBy", attributes: ["id", "name"]},
            {model: Order, as: "orders"}
        ],
        order: [
            [sequelize.literal("(`end` IS NULL)"), "DESC"],
            ['start', 'DESC']
        ],
        where
    })

    return rows.map((row) => {
        const totalOrder = row.orders.length
        const successOrder = row.orders.filter(o => o?.status === 'Selesai').length
        const cancelledOrder = row.orders.filter(o => o?.status === 'Batal').length

        const totalRequest = row.stockRequests.length
        const approvedRequest = row.stockRequests.filter(sr => sr.status === 'Selesai').length
        const rejectedRequest = row.stockRequests.filter(sr => sr.status === 'Ditolak').length

        return {
            id: row.id,
            branch: row.branch,
            start: row.start,
            end: row.end,
            quantity_menu: row.details.map(detail => ({
                id: detail.menu.id,
                name: detail.menu.name,
                initial: detail.initial_stock,
                final: detail.end_stock,
            })),
            total_restock_request: totalRequest,
            request_approved: approvedRequest,
            request_rejected: rejectedRequest,
            total_order: totalOrder,
            completed_order: successOrder,
            canceled_order: cancelledOrder,
            notes: row.notes,
            meta: {
                created_at: row.createdAt,
                created_by: row.createdBy,
                updated_at: row.updatedAt,
                last_updated_by: row.updatedBy,
            }
        }
    })
}

const getCurrentCashierShift = async (param) => {
    const where = {};

    if (param.branch_id) {
        where.fk_branch_id = param.branch_id;
    }
    const row = await CashierShift.findOne({
        where,
        include: [
            { model: Branch, as: "branch" },
            { model: Order, as: "orders" },
            { model: OrderPayment, as: "order_payments" },
            { model: CashierShiftCashIn, as: "cashier_shift_cash_ins" },
            { model: CashierShiftCashOut, as: "cashier_shift_cash_outs" },
            { model: Employee, as: "createdBy", attributes: ["id", "name", "role"] },
            { model: Employee, as: "updatedBy", attributes: ["id", "name", "role"] },
        ],
        order: [["createdAt", "DESC"]],
    });

    if (!row) return null;

    // --- perhitungan sama persis kayak fetchCashierShifts ---
    const totalOrder = row.orders.length;
    const completedOrder = row.orders.filter((o) => o?.status === "Selesai").length;
    const canceledOrder = row.orders.filter((o) => o?.status === "Batal").length;

    const payments = row.order_payments || [];
    const cashPayment = payments
        .filter((p) => p.method === "cash" && p.status === "Lunas")
        .reduce((sum, p) => sum + p.amount, 0);
    const digitalPayment = payments
        .filter((p) => p.method !== "cash" && p.status === "Lunas")
        .reduce((sum, p) => sum + p.amount, 0);

    const cashPaymentRefund = payments
        .filter((p) => p.method === "cash" && p.status === "Refund")
        .reduce((sum, p) => sum + p.amount, 0);
    const digitalPaymentRefund = payments
        .filter((p) => p.method !== "cash" && p.status === "Refund")
        .reduce((sum, p) => sum + p.amount, 0);

    const cashIns = row.cashier_shift_cash_ins.map((ci) => ({
        id: ci.id,
        subject: ci.subject,
        amount: ci.amount,
    }));

    const cashOuts = row.cashier_shift_cash_outs.map((co) => ({
        id: co.id,
        subject: co.subject,
        quantity: co.quantity,
        unit: co.unit,
        unit_price: co.unit_price,
    }));

    const totalExpense = row.cashier_shift_cash_outs.reduce(
        (sum, co) => sum + co.amount,
        0
    );

    const income = cashPayment + digitalPayment;
    const netIncome = income - totalExpense - (cashPaymentRefund + digitalPaymentRefund);

    return {
        id: row.id,
        branch: row.branch
        ? {
            id: row.branch.id,
            name: row.branch.name,
            }
        : null,
        start: row.start,
        end: row.end,
        initial_cash: row.initial_cash,
        cash_in: cashIns,
        cash_out: cashOuts,
        cash_payment: cashPayment,
        digital_payment: digitalPayment,
        digital_payment_refund: digitalPaymentRefund,
        cash_payment_refund: cashPaymentRefund,
        total_order: totalOrder,
        completed_order: completedOrder,
        canceled_order: canceledOrder,
        total_expense: totalExpense,
        income,
        net_income: netIncome,
        actual_cash: row.final_cash || 0,
        notes: row.notes,
        meta: {
        created_at: row.createdAt,
        created_by: row.createdBy,
        updated_at: row.updatedAt,
        last_updated_by: row.updatedBy,
        },
    };
};

const fetchCashierShifts = async (param) => {
  const where = {};

  if (param.branch_id) {
    where.fk_branch_id = param.branch_id;
  }

  const rows = await CashierShift.findAll({
    include: [
      { model: Branch, as: "branch" },
      { model: Order, as: "orders" },
      { model: OrderPayment, as: "order_payments" },
      { model: CashierShiftCashIn, as: "cashier_shift_cash_ins" },
      { model: CashierShiftCashOut, as: "cashier_shift_cash_outs" },
      { model: Employee, as: "createdBy", attributes: ["id", "name", "role"] },
      { model: Employee, as: "updatedBy", attributes: ["id", "name", "role"] },
    ],
    order: [
        [sequelize.literal("(`end` IS NULL)"), "DESC"],
        ['start', 'DESC']
    ],
    where,
  });

  return rows.map((row) => {
    // Orders
    const totalOrder = row.orders.length;
    const completedOrder = row.orders.filter((o) => o?.status === "Selesai").length;
    const canceledOrder = row.orders.filter((o) => o?.status === "Batal").length;

    // Payments
    const payments = row.order_payments || [];
    const cashPayment = payments
      .filter((p) => p.method === "cash" && p.status === "Lunas")
      .reduce((sum, p) => sum + p.amount, 0);
    const digitalPayment = payments
      .filter((p) => p.method !== "cash" && p.status === "Lunas")
      .reduce((sum, p) => sum + p.amount, 0);

    const cashPaymentRefund = payments
      .filter((p) => p.method === "cash" && p.status === "Refund")
      .reduce((sum, p) => sum + p.amount, 0);
    const digitalPaymentRefund = payments
      .filter((p) => p.method !== "cash" && p.status === "Refund")
      .reduce((sum, p) => sum + p.amount, 0);

    // Cash In / Out
    const cashIns = row.cashier_shift_cash_ins.map((ci) => ({
      id: ci.id,
      subject: ci.subject,
      amount: ci.amount,
    }));

    const cashOuts = row.cashier_shift_cash_outs.map((co) => ({
      id: co.id,
      subject: co.subject,
      quantity: co.quantity,
      unit: co.unit,
      unit_price: co.unit_price,
    }));

    const totalExpense = row.cashier_shift_cash_outs.reduce(
      (sum, co) => sum + co.amount,
      0
    );

    // Income
    const income = cashPayment + digitalPayment;
    const netIncome = income - totalExpense;

    return {
      id: row.id,
      branch: row.branch
        ? {
            id: row.branch.id,
            name: row.branch.name,
          }
        : null,
      start: row.start,
      end: row.end,
      initial_cash: row.initial_cash,
      cash_in: cashIns,
      cash_out: cashOuts,
      cash_payment: cashPayment,
      digital_payment: digitalPayment,
      digital_payment_refund: digitalPaymentRefund,
      cash_payment_refund: cashPaymentRefund,
      total_order: totalOrder,
      completed_order: completedOrder,
      canceled_order: canceledOrder,
      total_expense: totalExpense,
      income,
      net_income: netIncome,
      actual_cash: row.final_cash || 0, // isi dari end shift
      notes: row.notes,
      meta: {
        created_at: row.createdAt,
        created_by: row.createdBy,
        updated_at: row.updatedAt,
        last_updated_by: row.updatedBy,
      },
    };
  });
};

const startCashierShift = async (param, authUser) => {
    const latestShift = await CashierShift.findOne({
        where: {
            fk_branch_id: param.branch_id,
        },
        order: [['createdAt', 'DESC']],
    });

    if (latestShift && !latestShift.end) {
        throw new ConflictException("Sif sudah dimulai");
    }

    const shift = await CashierShift.create({
        fk_branch_id: param.branch_id,
        start: new Date(),
        initial_cash: param.cash,
        created_by: authUser.id,
        updated_by: authUser.id,
    });

    return shift
}

const updateCashierShift = async (param, authUser) => {
    const shift = await CashierShift.findByPk(param.id);

    if (!shift) {
        throw new NotFoundException("Sif Kasir tidak ditemukan");
    }

    if (shift.end) {
        throw new ConflictException("Sif Kasir telah diakhiri");
    }

    const transaction = await sequelize.transaction();

    try {
        // Handle cash-in entries
        if (param.cash_in && param.cash_in.length > 0) {
            const cashInEntries = param.cash_in.map(entry => ({
                fk_cashier_shift_id: shift.id,
                subject: entry.subject,
                amount: entry.amount,
                created_by: authUser.id,
                updated_by: authUser.id,
            }));
            await CashierShiftCashIn.bulkCreate(cashInEntries, {transaction});
        }

        // Handle cash-out entries
        if (param.cash_out && param.cash_out.length > 0) {
            const cashOutEntries = param.cash_out.map(entry => ({
                fk_cashier_shift_id: shift.id,
                subject: entry.subject,
                quantity: entry.quantity,
                unit: entry.unit,
                unit_price: entry.unit_price,
                amount: entry.quantity * entry.unit_price,
                created_by: authUser.id,
                updated_by: authUser.id,
            }));
            await CashierShiftCashOut.bulkCreate(cashOutEntries, {transaction});
        }

        if (param.delete_cash_in && param.delete_cash_in.length > 0) {
            await CashierShiftCashIn.destroy({
                where: {
                    fk_cashier_shift_id: shift.id,
                    id: {
                        [Op.in]: param.delete_cash_in
                    }
                },
                transaction
            })
        }

        if (param.delete_cash_out && param.delete_cash_out.length > 0) {
            await CashierShiftCashOut.destroy({
                where: {
                    fk_cashier_shift_id: shift.id,
                    id: {
                        [Op.in]: param.delete_cash_out
                    }
                },
            })
        }

        // Update notes if provided
        if (param.notes !== undefined) {
            shift.notes = param.notes;
            shift.updated_by = authUser.id;
            await shift.save({transaction});
        }

        await transaction.commit();
        return shift
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const endCashierShift = async (param, authUser) => {
    const shift = await CashierShift.findByPk(param.id);

    if (!shift) {
        throw new NotFoundException("Sif Kasir tidak ditemukan");
    }

    if (shift.end) {
        throw new ConflictException("Sif Kasir telah diakhiri");
    }

    shift.end = new Date()
    shift.updated_by = authUser.id;
    shift.final_cash = param.actual_cash;
    await shift.save();
    return shift
};

const startWarehouseShift = async (authUser) => {
    const latestShift = await WarehouseShift.findOne({
        where: {
            end: null,
        },
    })

    if (latestShift) {
        throw new ConflictException("Sif sudah dimulai");
    }

    const shift = await WarehouseShift.create({
        start: new Date(),
        created_by: authUser.id,
        updated_by: authUser.id,
    });

    return shift
}

const updateWarehouseShift = async (param, authUser) => {
    const shift = await WarehouseShift.findByPk(param.id);

    if (!shift) {
        throw new NotFoundException("Sif Gudang tidak ditemukan");
    }

    shift.notes = param.notes;
    shift.updated_by = authUser.id;
    await shift.save();
    return shift
}

const endWarehouseShift = async (param, authUser) => {
    const shift = await WarehouseShift.findByPk(param.id);

    if (!shift) {
        throw new NotFoundException("Sif Gudang tidak ditemukan");
    }

    if (shift.end) {
        throw new ConflictException("Sif Gudang telah diakhiri");
    }

    shift.end = new Date();
    shift.updated_by = authUser.id;
    await shift.save();
    return shift
}

const getCurrentWarehouseShift = async () => {
    const where = {};

    const row = await WarehouseShift.findOne({
        include: [
            {model: StockRequest, as: "stockRequests"},
            {model: StockMovement, as: "stockMovements"},
            {model: Employee, as: "createdBy", attributes: ["id", "name"]},
            {model: Employee, as: "updatedBy", attributes: ["id", "name"]},
        ],
        where,
        order: [["createdAt", "DESC"]],
    });

    if (!row) return null

    const totalStockMovement = row.stockMovements.length
    const stockMovementIn = row.stockMovements.filter(o => o?.status === 'Masuk').length
    const stockMovementOut = row.stockMovements.filter(o => o?.status === 'Keluar' || o?.status === "Pengurangan").length

    const totalRequest = row.stockRequests.length
    const approvedRequest = row.stockRequests.filter(sr => sr.status === 'Selesai').length
    const rejectedRequest = row.stockRequests.filter(sr => sr.status === 'Ditolak').length

    return {
        id: row.id,
        start: row.start,
        end: row.end,
        notes: row.notes,
        total_restock_request: totalRequest,
        request_approved: approvedRequest,
        request_rejected: rejectedRequest,
        total_stock_movement: totalStockMovement,
        stock_movement_in: stockMovementIn,
        stock_movement_out: stockMovementOut,
        meta: {
            created_at: row.createdAt,
            created_by: row.createdBy,
            updated_at: row.updatedAt,
            last_updated_by: row.updatedBy,
        }
    }
};

const fetchWarehouseShifts = async (param) => {
    const where = {};

    if (param.branch_id) {
        where.fk_branch_id = param.branch_id;
    }

    const rows = await WarehouseShift.findAll({
        include: [
            {model: StockRequest, as: "stockRequests"},
            {model: StockMovement, as: "stockMovements"},
            {model: Employee, as: "createdBy", attributes: ["id", "name"]},
            {model: Employee, as: "updatedBy", attributes: ["id", "name"]},
        ],
        order: [
            [sequelize.literal("(`end` IS NULL)"), "DESC"],
            ['start', 'DESC']
        ],
        where
    })

    return rows.map((row) => {
        const totalStockMovement = row.stockMovements.length
        const stockMovementIn = row.stockMovements.filter(o => o?.status === 'Masuk').length
        const stockMovementOut = row.stockMovements.filter(o => o?.status === 'Keluar' || o?.status === "Pengurangan").length

        const totalRequest = row.stockRequests.length
        const approvedRequest = row.stockRequests.filter(sr => sr.status === 'Selesai').length
        const rejectedRequest = row.stockRequests.filter(sr => sr.status === 'Ditolak').length

        return {
            id: row.id,
            start: row.start,
            end: row.end,
            notes: row.notes,
            total_restock_request: totalRequest,
            request_approved: approvedRequest,
            request_rejected: rejectedRequest,
            total_stock_movement: totalStockMovement,
            stock_movement_in: stockMovementIn,
            stock_movement_out: stockMovementOut,
            meta: {
                created_at: row.createdAt,
                created_by: row.createdBy,
                updated_at: row.updatedAt,
                last_updated_by: row.updatedBy,
            }
        }
    })
}


export default {
    startEmployeeShift,
    endEmployeeShift,
    getCurrentEmployeeShift,
    fetchEmployeeShifts,

    startKitchenShift,
    updateKitchenShift,
    endKitchenShift,
    getCurrentKitchenShift,
    fetchKitchenShifts,

    startCashierShift,
    updateCashierShift,
    endCashierShift,
    getCurrentCashierShift,
    fetchCashierShifts,

    startWarehouseShift,
    updateWarehouseShift,
    endWarehouseShift,
    getCurrentWarehouseShift,
    fetchWarehouseShifts,
}