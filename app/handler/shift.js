import shiftService from "../service/shift.js";
import {successResponse} from "../../infrastructure/rest/response.js";
import shift from "../service/shift.js";

const startEmployeeShift = async (req, res) => {
    const param = {
        branchId: req.body.branch_id,
    }

    const shift = await shiftService.startEmployeeShift(param, req.user)

    res.status(201).json(successResponse("successfully start shift", shift))
}

const endEmployeeShift = async (req, res) => {
    const shift = await shiftService.endEmployeeShift(req.user)

    res.status(200).json(successResponse("successfully end shift", shift))
}

const fetchEmployeeShifts = async (req, res) => {
    const shifts = await shiftService.fetchEmployeeShifts()
    res.status(200).json(successResponse("successfully fetch shifts", shifts))
}

const startKitchenShift = async (req, res) => {
    await shiftService.startKitchenShift(req.body, req.user)
    res.status(200).json(successResponse("successfully start kitchen shift", null))
}

const updateKitchenShift = async (req, res) => {
    await shiftService.updateKitchenShift(req.body, req.user)
    res.status(200).json(successResponse("successfully update kitchen shift", null))
}
const endKitchenShift = async (req, res) => {
    await shiftService.endKitchenShift(req.body, req.user)
    res.status(200).json(successResponse("successfully end kitchen shift", null))
}

const startCashierShift = async (req, res) => {
    const param = {
        branch_id: req.body.branch_id,
        cash: req.body.cash
    };

    const shift = await shiftService.startCashierShift(param);
    res.status(201).json(successResponse("Successfully started cashier shift", shift));
};

const updateCashierShift = async (req, res) => {
    const param = {
        id: req.params.id,
        cash_in: req.body.cash_in,
        cash_out: req.body.cash_out,
        notes: req.body.notes
    };

    const shift = await shiftService.updateCashierShift(param);
    res.status(200).json(successResponse("Successfully updated cashier shift", shift));
};

const endCashierShift = async (req, res) => {
    const param = {
        id: req.params.id,
        cash_in: req.body.cash_in,
        cash_out: req.body.cash_out,
        notes: req.body.notes
    };

    const shift = await shiftService.endCashierShift(param);
    res.status(200).json(successResponse("Successfully ended cashier shift", shift));
};

const startWarehouseShift = async (req, res) => {
    const shift = await shiftService.startWarehouseShift();
    res.status(201).json(successResponse("Successfully started warehouse shift", shift));
};

const updateWarehouseShift = async (req, res) => {
    const param = {
        id: req.body.id,
        notes: req.body.notes
    };

    const shift = await shiftService.updateWarehouseShift(param);
    res.status(200).json(successResponse("Successfully updated warehouse shift", shift));
}

const endWarehouseShift = async (req, res) => {
    const param = {
        id: req.params.id,
        notes: req.body.notes
    };

    const shift = await shiftService.endWarehouseShift(param);
    res.status(200).json(successResponse("Successfully ended warehouse shift", shift));
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