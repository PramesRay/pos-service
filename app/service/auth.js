import {Employee} from "../model/model.js";

const register = async (param) => {
    return Employee.create(param);
}

const getAuthUser = async (param) => {
    return Employee.findByPk(param.userId)
}

const getUserByEmail = async (email) => {
    return Employee.findOne({ where: { email } });
}

export default {
    register,
    getAuthUser,
    getUserByEmail
}