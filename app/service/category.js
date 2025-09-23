import {Category} from "../model/model.js";

const create = async (param, type) => {
    const createCtgParam = {
        name: param.name,
        description: param.description,
        type: type
    }

    return Category.create(createCtgParam);
}

const update = async (id, param) => {
    const item = await Category.findByPk(id)

    await Category.update(
        param,
        {
            where: {
                id: id,
            }
        }
    )

    return item;
}

const remove = async (id) => {
    await Category.destroy(
        {
            where: {
                id: id,
            }
        }
    )
}

const getAll = async (type) => {
    return await Category.findAll({
        where: {
            type: type
        }
    });
}

const getOne = async (id) => {
    return await Category.findByPk(id);
}

export default {
    create,
    update,
    remove,
    getAll,
    getOne
}