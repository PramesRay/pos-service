import { NotFoundException } from "../../exception/not.found.exception.js";
import { Customer, User } from "../model/model.js";
import { sequelize } from "../../infrastructure/database/mysql.js";

const create = async (customer) => {
  const tx = await sequelize.transaction();
  const exist = await Customer.findOne({
    where: {
      name: customer.name,
      phone: customer.phone
    },
    transaction: tx ?? null,
  })

  if (exist) {
    return exist;
  }
  
  const user = await User.create({
    type: "customer",
  }, {
    transaction: tx ?? null,
  });

  const customerData = await Customer.create({
    fk_user_id: user.id,
    name: customer.name,
    phone: customer.phone,
  }, {
    transaction: tx ?? null,
  });

  await tx.commit();

  return customerData
}

const getOne = async (id) => {
  const data = await Customer.findByPk(id, {
    include: [{model: User, as: "user"}]
  });

  return data
}

const update = async (id, data) => {
  const customer = await Customer.findByPk(id, {
    include: [{model: User, as: "user"}]
  });

  if (!customer) {
    throw new NotFoundException("Customer not found");
  }

  return await customer.update(data);
};

export default {
  getOne,
  create,
  update
}