import shiftService from "../service/shift.js";
import {successResponse} from "../../infrastructure/rest/response.js";
import shift from "../service/shift.js";

const startEmployeeShift = async (req, res) => {
    const shift = await shiftService.startEmployeeShift(req.user.profile)

    res.status(201).json(successResponse("successfully start shift", shift))
}

const endEmployeeShift = async (req, res) => {
    const shift = await shiftService.endEmployeeShift(req.params.id ? req.params : req.user.profile)

    res.status(200).json(successResponse("successfully end shift", shift))
}

const getCurrentEmployeeShift = async (req, res) => {
    const shift = await shiftService.getCurrentEmployeeShift(req.user.profile)

    res.status(200).json(successResponse("successfully fetch current shift", shift))
}

const fetchEmployeeShifts = async (req, res) => {
    const param = {
        branch_id: req.query.branch_id,
    }
    const shifts = await shiftService.fetchEmployeeShifts(param)
    res.status(200).json(successResponse("successfully fetch shifts", shifts))
}

const startKitchenShift = async (req, res) => {
    const param = {
        ...req.body,
        branch_id: req.params.branchId
    }
    const data = await shiftService.startKitchenShift(param, req.user.profile)
    res.status(200).json(successResponse("successfully start kitchen shift", data))
}

const updateKitchenShift = async (req, res) => {
    const param = {
        ...req.body,
        id: req.params.id,
    }
    const data = await shiftService.updateKitchenShift(param, req.user.profile)
    res.status(200).json(successResponse("successfully update kitchen shift", data))
}
const endKitchenShift = async (req, res) => {
    const param = {
        ...req.body,
        id: req.params.id,
    }
    const data = await shiftService.endKitchenShift(param, req.user.profile)
    res.status(200).json(successResponse("successfully end kitchen shift", data))
}

const getCurrentKitchenShift = async (req, res) => {
    const param = {
        branch_id: req.query.branch_id,
    }
    const shift = await shiftService.getCurrentKitchenShift(param)
    res.status(200).json(successResponse("successfully fetch current kitchen shift", shift))
}

const fetchKitchenShifts = async (req, res) => {
    const param = {
        branch_id: req.query.branch_id,
    }
    const shifts = await shiftService.fetchKitchenShifts(param)
    res.status(200).json(successResponse("successfully fetch kitchen", shifts))
}

const startCashierShift = async (req, res) => {
    const param = {
        branch_id: req.params.branchId,
        cash: req.body.cash
    };

    const shift = await shiftService.startCashierShift(param, req.user.profile);
    res.status(201).json(successResponse("Successfully started cashier shift", shift));
};

const updateCashierShift = async (req, res) => {
    const param = {
        id: req.params.id,
        cash_in: req.body.cash_in,
        cash_out: req.body.cash_out,
        delete_cash_in: req.body.delete_cash_in,
        delete_cash_out: req.body.delete_cash_out,
        notes: req.body.notes
    };

    const shift = await shiftService.updateCashierShift(param, req.user.profile);
    res.status(200).json(successResponse("Successfully updated cashier shift", shift));
};

const endCashierShift = async (req, res) => {
    const param = {
        id: req.params.id,
        cash_in: req.body.cash_in,
        cash_out: req.body.cash_out,
        actual_cash: req.body.actual_cash,
        notes: req.body.notes
    };

    const shift = await shiftService.endCashierShift(param, req.user.profile);
    res.status(200).json(successResponse("Successfully ended cashier shift", shift));
};

const getCurrentCashierShift = async (req, res) => {
    const param = {
        branch_id: req.query.branch_id,
    }
    const shift = await shiftService.getCurrentCashierShift(param)
    res.status(200).json(successResponse("successfully fetch current cashier shift", shift))
}

const fetchCashierShifts = async (req, res) => {
    const param = {
        branch_id: req.query.branch_id,
    }
    const shifts = await shiftService.fetchCashierShifts(param)
    res.status(200).json(successResponse("successfully fetch cashier shifts", shifts))
}

const startWarehouseShift = async (req, res) => {
    const shift = await shiftService.startWarehouseShift(req.user.profile);
    res.status(201).json(successResponse("Successfully started warehouse shift", shift));
};

const updateWarehouseShift = async (req, res) => {
    const param = {
        id: req.params.id,
        notes: req.body.notes
    };

    const shift = await shiftService.updateWarehouseShift(param, req.user.profile);
    res.status(200).json(successResponse("Successfully updated warehouse shift", shift));
}

const endWarehouseShift = async (req, res) => {
    const param = {
        id: req.params.id
    };

    const shift = await shiftService.endWarehouseShift(param, req.user.profile);
    res.status(200).json(successResponse("Successfully ended warehouse shift", shift));
}

const getCurrentWarehouseShift = async (req, res) => {
    const shift = await shiftService.getCurrentWarehouseShift()
    res.status(200).json(successResponse("successfully fetch current warehouse shift", shift))
}

const fetchWarehouseShifts = async (req, res) => {
    const param = {
        branch_id: req.query.branch_id,
    }
    const shifts = await shiftService.fetchWarehouseShifts(param)
    res.status(200).json(successResponse("successfully fetch warehouse", shifts))
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
    fetchWarehouseShifts
}