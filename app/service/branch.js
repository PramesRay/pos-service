import { 
    Branch
} from "../model/model.js";
import { ConflictException } from "../../exception/conflict.exception.js";
import { NotFoundException } from "../../exception/not.found.exception.js";
import shiftService from "./shift.js";

const create = async (data) => {
    const branch = await Branch.findOne({
        where: {
            name: data.name,
        },
    });

    if (branch) {
        throw new ConflictException("Branch already exists");
    }

    return await Branch.create(data);
};

const update = async (id, data) => {
    const branch = await Branch.findByPk(id);

    if (!branch) {
        throw new NotFoundException("Branch not found");
    }

    return await branch.update(data);
};

const remove = async (id) => {
    const branch = await Branch.findByPk(id);

    if (!branch) {
        throw new NotFoundException("Branch not found");
    }

    await branch.destroy();
};

const getAll = async (params = {}) => {
    const branches = await Branch.findAll();

    const filteredBranches = await Promise.all(
        branches.map(async (branch) => {
            const shiftCashier = await shiftService.getCurrentCashierShift({branch_id: branch.id})
            const shiftKitchen = await shiftService.getCurrentKitchenShift({branch_id: branch.id})
            
            const is_active = (shiftCashier?.id && !shiftCashier?.end) ? true : false;
            const last_active = shiftCashier?.end ?? shiftCashier?.start ?? null

            return {
                id: branch.id,
                name: branch.name,
                description: branch.description,
                address: branch.address,
                contact: branch.contact,
                operational: {
                    activity: {
                        shift_cashier: mapShiftActivity(shiftCashier),
                        shift_kitchen: mapShiftActivity(shiftKitchen),
                        is_active,
                        last_active,
                    },
                    open_time: branch.open_time,
                    close_time: branch.close_time,
                },
            };
        })
    );

    if (params.is_active) {
        return filteredBranches.filter((branch) => branch.operational.activity.is_active);
    }

    return filteredBranches.filter((branch) => Object.keys(branch).length > 0);
};
const getOne = async (id) => {
    const branch = await Branch.findByPk(id);

    if (!branch) {
        throw new NotFoundException("Branch not found");
    }

    const shiftCashier = await shiftService.getCurrentCashierShift({branch_id: branch.id})
    const shiftKitchen = await shiftService.getCurrentKitchenShift({branch_id: branch.id})
    
    const is_active = (shiftCashier?.id && shiftCashier?.end) ? false : true;
    const last_active = shiftCashier?.end ?? shiftCashier?.start ?? null

    return {
        id: branch.id,
        name: branch.name,
        description: branch.description,
        operational: {
            activity: {
                shift_cashier: mapShiftActivity(shiftCashier),
                shift_kitchen: mapShiftActivity(shiftKitchen),
                is_active,
                last_active,
            },
            open_time: branch.open_time,
            close_time: branch.close_time,
        },
    };
};

function mapShiftActivity(row) {
  if (!row) {
    return {
      id: null,
      start: null,
      end: null,
      meta : null
    };
  }

  return {
    id: row?.id,
    start: row?.start,
    end: row?.end,
    meta: row?.meta
  };
}

export default {
    create,
    update,
    remove,
    getAll,
    getOne,
};