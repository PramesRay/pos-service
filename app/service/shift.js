import {
    CashierShift,
    CashierShiftCashIn,
    CashierShiftCashOut,
    EmployeeShift,
    KitchenShift,
    KitchenShiftDetail, WarehouseShift
} from "../model/model.js";
import {ConflictException} from "../../exception/conflict.exception.js";
import {sequelize} from "../../infrastructure/database/mysql.js";
import {NotFoundException} from "../../exception/not.found.exception.js";

const startEmployeeShift = async (param, authUser) => {
    const latestShift = await EmployeeShift.findOne({
        where: {
            fk_employee_id: authUser.id,
        },
        order: [['createdAt', 'DESC']],
    });

    if (latestShift && !latestShift.end) {
        throw new ConflictException("Shift already exists");
    }

    return EmployeeShift.create({
        fk_employee_id: authUser.id,
        fk_branch_id: param.branchId,
        start: (new Date())
    })
}

const endEmployeeShift = async (authUser) => {
    const latestShift = await EmployeeShift.findOne({
        where: {
            fk_employee_id: authUser.id,
        },
        order: [['createdAt', 'DESC']],
    });

    if (latestShift && latestShift.end) {
        throw new ConflictException("Shift already ended");
    }

    latestShift.end = new Date();

    return await latestShift.save()
}

const fetchEmployeeShifts = async (req, res) => {
    return await EmployeeShift.findAll()
}

const startKitchenShift = async (param, authUser) => {
    const latestShift = await KitchenShift.findOne({
        where: {
            fk_branch_id: param.branch_id,
        },
        order: [['createdAt', 'DESC']],
    })

    if (latestShift && !latestShift.end) {
        throw new ConflictException("Shift already exists");
    }

    const tx = await sequelize.transaction();

    try {
        const kitchenShift = await KitchenShift.create({
            fk_branch_id: param.branch_id,
            fk_employee_id: authUser.id,
            start: new Date()
        }, {transaction: tx});

        const kitchenShiftDetailData = Array.isArray(param.initial_menu) ? param.initial_menu : [];

        const kitchenShiftDetailPayload = kitchenShiftDetailData
            .filter(data => data.quantity > 0)
            .map(data => ({
                fk_kitchen_shift_id: kitchenShift.id,
                fk_menu_id: data.id,
                initial_stock: data.quantity
            }));

        if (kitchenShiftDetailPayload.length > 0) {
            await KitchenShiftDetail.bulkCreate(kitchenShiftDetailPayload, {transaction: tx});
        }

        await tx.commit();
        return kitchenShift;
    } catch (error) {
        await tx.rollback();
        console.error('Failed to start kitchen shift:', error);
        throw error;
    }
}

const updateKitchenShift = async (param, authUser) => {
    const latestShift = await KitchenShift.findByPk(param.id);

    if (!latestShift) {
        throw new NotFoundException("Kitchen Shift not found");
    }

    if (latestShift && latestShift.end) {
        throw new ConflictException("Shift already ended");
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
                await detail.save({transaction});
            }
        }

        if (param.notes) {
            latestShift.notes = param.notes;
            await latestShift.save({transaction});
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const endKitchenShift = async (param, authUser) => {
    const latestShift = await KitchenShift.findByPk(param.id);

    if (!latestShift) {
        throw new NotFoundException("Kitchen Shift not found");
    }

    if (latestShift && latestShift.end) {
        throw new ConflictException("Shift already ended");
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
                await detail.save({transaction});
            }
        }

        latestShift.end = new Date();

        if (param.notes) {
            latestShift.notes = param.notes;
        }

        await latestShift.save({transaction});

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const startCashierShift = async (param) => {
    const latestShift = await CashierShift.findOne({
        where: {
            fk_branch_id: param.branch_id,
        },
        order: [['createdAt', 'DESC']],
    });

    if (latestShift && !latestShift.end) {
        throw new ConflictException("Shift already exists");
    }

    return await CashierShift.create({
        fk_branch_id: param.branch_id,
        start: new Date(),
        initial_cash: param.cash
    });
}

const updateCashierShift = async (param) => {
    const shift = await CashierShift.findByPk(param.id);

    if (!shift) {
        throw new NotFoundException("Cashier shift not found");
    }

    if (shift.end) {
        throw new ConflictException("Cannot update ended shift");
    }

    const transaction = await sequelize.transaction();

    try {
        // Handle cash-in entries
        if (param.cash_in && param.cash_in.length > 0) {
            const cashInEntries = param.cash_in.map(entry => ({
                fk_cashier_shift_id: shift.id,
                subject: entry.subject,
                amount: entry.amount
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
                amount: entry.quantity * entry.unit_price
            }));
            await CashierShiftCashOut.bulkCreate(cashOutEntries, {transaction});
        }

        // Update notes if provided
        if (param.notes !== undefined) {
            shift.notes = param.notes;
            await shift.save({transaction});
        }

        await transaction.commit();
        return shift;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const endCashierShift = async (param) => {
    const shift = await CashierShift.findByPk(param.id);

    if (!shift) {
        throw new NotFoundException("Cashier shift not found");
    }

    if (shift.end) {
        throw new ConflictException("Cannot update ended shift");
    }

    const transaction = await sequelize.transaction();

    try {
        // Handle cash-in entries
        if (param.cash_in && param.cash_in.length > 0) {
            const cashInEntries = param.cash_in.map(entry => ({
                fk_cashier_shift_id: shift.id,
                subject: entry.subject,
                amount: entry.amount
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
                amount: entry.quantity * entry.unit_price
            }));
            await CashierShiftCashOut.bulkCreate(cashOutEntries, {transaction});
        }

        // Update notes if provided
        if (param.notes !== undefined) {
            shift.notes = param.notes;
        }

        // End shift
        shift.end = new Date()
        await shift.save({transaction});

        await transaction.commit();
        return shift;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const startWarehouseShift = async () => {
    const latestShift = await WarehouseShift.findOne({
        where: {
            end: null,
        },
    })

    if (latestShift) {
        throw new ConflictException("Shift already exists");
    }

    return await WarehouseShift.create({
        start: new Date()
    });
}

const updateWarehouseShift = async (param) => {
    const shift = await WarehouseShift.findByPk(param.id);

    if (!shift) {
        throw new NotFoundException("Warehouse shift not found");
    }

    shift.notes = param.note;
    return await shift.save();
}

const endWarehouseShift = async (param) => {
    const shift = await WarehouseShift.findByPk(param.id);

    if (!shift) {
        throw new NotFoundException("Warehouse shift not found");
    }

    if (shift.end) {
        throw new ConflictException("Shift already ended");
    }

    shift.end = new Date();
    return await shift.save();
}


export default {
    startEmployeeShift,
    endEmployeeShift,
    fetchEmployeeShifts,
    startKitchenShift,
    updateKitchenShift,
    endKitchenShift,
    startCashierShift,
    updateCashierShift,
    endCashierShift,
    startWarehouseShift,
    updateWarehouseShift,
    endWarehouseShift,
}