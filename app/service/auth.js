import {Branch, Employee, User} from "../model/model.js";
import shiftService from "./shift.js";

const register = async (param) => {
    const user = await User.create({type: 'employee'});

    return Employee.create({
        ...param,
        fk_user_id: user.id,
    });
}

const getAuthUser = async (param) => {
    return Employee.findByPk(param.userId)
}

const findOrCreate = async (firebaseUser) => {
    let user = await Employee.findOne({
        where: {
            uid: firebaseUser.uid,
        },
        include: [
            {model: Branch, as: "branch", attributes: ["id", "name"]}
        ],
    })

    if (!user) {
        user = await Employee.create({
            name: firebaseUser.name,
            email: firebaseUser.email,
            uid: firebaseUser.uid,
        })
    }

    const branch = user.branch ? {id: user.branch.id, name: user.branch.name} : null;
    const shift_emp = await shiftService.getCurrentEmployeeShift(user).catch(() => null);

    let shift_op = null;
    if (user.role === "gudang") {
        shift_op = await shiftService.getCurrentWarehouseShift(branch.id).catch(() => null);
    } else if (user.role === "kasir") {
        shift_op = await shiftService.getCurrentCashierShift(branch.id).catch(() => null);
    } else if (user.role === "dapur") {
        shift_op = await shiftService.getCurrentKitchenShift(branch.id).catch(() => null);
    }

    return {
        id: user.id,
        uid: user.uid,
        name: user.name,
        role: user.role,
        email: user.email,
        assigned_branch: branch,
        activity: {
            shift_emp,
            shift_op,
            is_active: !!shift_emp && !shift_emp.end,
            branch,
            last_active: shift_emp ? shift_emp.start : null,
        },
        meta: {
            created_at: user.createdAt,
            updated_at: user.updatedAt,
        },
    };
}

export default {
    register,
    getAuthUser,
    findOrCreate
}