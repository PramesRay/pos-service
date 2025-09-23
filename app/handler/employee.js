import {successResponse} from "../../infrastructure/rest/response.js";
import employeeService from "../service/employee.js";

const getOne = async (req, res) => {
    const uid = req.user.uid;
    const employee = await employeeService.getOne(uid);
    res.status(200).json(successResponse("successfully fetch employee by token", employee));
};

const getAll = async (req, res) => {
    const employees = await employeeService.getAll();
    res.status(200).json(successResponse("successfully fetch employee list", employees));
}

const update = async (req, res) => {
    const employee = await employeeService.update(req.params.uid, req.body);
    res.status(200).json(successResponse("successfully update employee", employee));
}

const updateMe = async (req, res) => {
    const uid = req.user.uid;
    const employee = await employeeService.update(uid, req.body);
    res.status(200).json(successResponse("successfully update employee", employee));
}

const remove = async (req, res) => {
    await employeeService.remove(req.params.uid);
    res.status(200).json(successResponse("successfully delete employee", null));
}

const attendanceSummaryAverages = async (req, res) => {
    const param = {
        branch_id: req.query.branch_id ?? null,
    }

    const summary = await employeeService.attendanceSummaryAverages(param)
    res.status(200).json(successResponse("successfully fetch employee summary", summary))
}

export default {
    getOne,
    getAll,
    update,
    updateMe,
    remove,

    attendanceSummaryAverages,
}