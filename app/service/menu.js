import {
    Menu,
    Branch,
    Category,
    KitchenShiftDetail,
    KitchenShift
} from "../model/model.js";
import {NotFoundException} from "../../exception/not.found.exception.js";

const getOne = async (id) => {
  const menu = await Menu.findByPk({
    where: {
      id
    },
    include: [
        {model: Branch, as: "branch", attributes: ["id", "name"]},
        {model: Category, as: "category", attributes: ["id", "name"]},
    ],
    order: [
      [{ model: Category, as: 'category' }, 'name', 'ASC'],
      ['name', 'ASC'],
    ],
  })
  if (!menu) {
    throw new NotFoundException("Menu tidak ditemukan")
  }
  return menu
}

const getAllByBranch = async (branchId) => {
    const menus = await Menu.findAll({
        where: {
            fk_branch_id: branchId
        },
        include: [
            {model: Branch, as: "branch", attributes: ["id", "name"]},
            {model: Category, as: "category", attributes: ["id", "name"]},
        ],
        order: [
            [{ model: Category, as: 'category' }, 'name', 'ASC'],
            ['name', 'ASC'],
            ],
    })
    return menus
}

const getSalesByBranch = async (branchId) => {
    const row = await KitchenShift.findOne({
        where: {
            fk_branch_id: branchId
        },
        include: [
            {model: KitchenShiftDetail, 
                as: "details", 
                include: [{model: Menu, 
                    as: "menu",
                    include: [{model: Category, 
                        as: "category",
                        attributes: ["id", "name"]
                    }],
                    attributes: ["id", "name", "description", "price", 'threshold'],
                    order: [
                        [{ model: Category, as: 'category' }, 'name', 'ASC'],
                        ['name', 'ASC'],
                    ],
                }]}
        ],
        order: [['createdAt', 'DESC']],
    });

    return row.details.map(detail => ({...detail.menu.toJSON(), quantity: detail.end_stock}));
}

const create = async (param) => {
    const {fk_branch_id, fk_category_id, name, description, price, threshold} = param
    const menu = await Menu.create({
        fk_branch_id,
        fk_category_id,
        name,
        description,
        price,
        threshold
    })
    return menu
}

const update = async (id, param) => {
    const {branch_id, category_id, name, description, price, threshold} = param
    const menu = await Menu.findByPk(id)
    if (!menu) {
        throw new NotFoundException("Menu tidak ditemukan")
    }
    await menu.update({
        fk_branch_id: branch_id,
        fk_category_id: category_id,
        name,
        description,
        price,
        threshold
    })
    return menu
}

const remove = async (id) => {
    const menu = await Menu.findByPk(id)
    if (!menu) {
        throw new NotFoundException("Menu tidak ditemukan")
    }
    await menu.destroy()
}

export default {
    getOne,
    getAllByBranch,
    getSalesByBranch,
    create,
    update,
    remove,
};