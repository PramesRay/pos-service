import {
    Customer,
    Employee,
    Reservation,
    User,
    Branch
} from "../model/model.js";
import {sequelize} from "../../infrastructure/database/mysql.js";
import {NotFoundException} from "../../exception/not.found.exception.js";
import {decodePrefixedId, prefixId} from "../../util/util.js";
import { literal } from "sequelize";

const STATUS_PRIORITY_CASE = `
    CASE
        WHEN reservations.status = 'Pending' THEN 0
        WHEN reservations.status IN ('Ditolak', 'Disetujui') THEN 1
        ELSE 2
    END
`

const fetchList = async (param) => {
    let where = {};
    if(param.created_by) {
        where.created_by = param.created_by

        const customer = await Customer.findOne({
            where: { fk_user_id: param.created_by }
        })
        if(customer) where.fk_customer_id = customer.id
    }

    const rows = await Reservation.findAll({
        where,
        include: [
            {model: Branch, as: "branch", attributes: ["id", "name"]},
            {model: Customer, as: "customer", attributes: ["name", "phone"]},
            {
                model: User, as: "createdBy",
                include: [
                    {model: Employee, as: "employee", attributes: ["id", "name"]},
                    {model: Customer, as: "customer", attributes: ["id", "name"]},
                ],
            },
            {
                model: User, as: "updatedBy",
                include: [
                    {model: Employee, as: "employee", attributes: ["id", "name"]},
                    {model: Customer, as: "customer", attributes: ["id", "name"]},
                ]
            },
        ],
        order: [
            [literal(STATUS_PRIORITY_CASE), 'ASC'],
            ['createdAt', 'ASC'],
        ],
    })

    return rows.map((row) => {
        return {
            id: prefixId('rsv', row.id),
            branch: row.branch,
            customer: row.customer,
            time: row.time,
            status: row.status,
            people: row.people,
            notes: row.notes,
            meta: {
                created_at: row.createdAt,
                updated_at: row.updatedAt,
                created_by: {
                    id: getActor(row.createdBy)?.id ?? "",
                    name: getActor(row.createdBy)?.name ?? "",
                },
                last_updated_by: {
                    id: getActor(row.updatedBy)?.id ?? "",
                    name: getActor(row.updatedBy)?.name ?? "",
                },
            },
        }
    })
}

const create = async (param, authUser, type = "employee") => {
    const tx = await sequelize.transaction()
    try {
        let userId = 0
        const customer = await findOrCreateCustomer(param.customer, tx)
        if (type === "customer") userId = customer.fk_user_id
        else userId = authUser.user.id

        const createParam = {
            ...param,
            fk_branch_id: param.branch_id,
            fk_customer_id: customer.id,
            status: type === "customer" ? "Pending" : "Disetujui",
            created_by: userId,
            updated_by: userId,
        }

        const reservation = await Reservation.create(createParam, {transaction: tx})

        await tx.commit()
        return reservation;
    } catch (error) {
        await tx.rollback()
        throw error;
    }
}

const update = async (param, authUser, by = "employee") => {
    let userId = 0
    if (by === "customer") userId = param.customer.fk_user_id
    else userId = authUser.user.id

    console.log(userId, param.type)

    switch (param.type) {
        case 'updateReservation':
            return await updateReservation(param, userId);
        case 'updateReservationStatus':
            return await updateReservationStatus(param, userId);
    }

}

const updateReservation = async (param, userId) => {
    const reservationId = decodePrefixedId(param.id).idNumber;

    const reservation = await Reservation.findByPk(reservationId)

    if (!reservation) {
        throw new NotFoundException("Reservasi tidak ditemukan")
    }

    reservation.set(
        {
            branch_id: param.branch_id,
            customer: param.customer,
            time: param.time,
            people: param.people,
            notes: param.notes,
            updated_by: userId,
        }
    )

    await reservation.save()

    return reservation;
}

const updateReservationStatus = async (param, userId) => {
    console.log('function updateReservationStatus is running');
    const reservationId = decodePrefixedId(param.id).idNumber;

    const reservation = await Reservation.findByPk(reservationId)

    if (!reservation) {
        throw new NotFoundException("Reservasi tidak ditemukan")
    }

    reservation.set(
        {
            status: param.approved ? "Disetujui" : "Ditolak",
            updated_by: userId,
        }
    )

    await reservation.save()

    return reservation;
}

const del = async (id) => {
    const reservationId = decodePrefixedId(id).idNumber;
    
    const reservation = await Reservation.findByPk(reservationId)
    if (!reservation) {
        throw new NotFoundException("Reservasi tidak ditemukan")
    }
    await reservation.destroy()
}

const findOrCreateCustomer = async (customer, tx) => {
    const exist = await Customer.findOne({
        where: {
            phone: customer.phone
        },
        transaction: tx
    })

    if (exist) {
        return exist;
    }

    const user = await User.create({ type: "customer" }, { transaction: tx });

    try {
        const customer = await Customer.create({
        fk_user_id: user.id,
        name: payload.name,
        phone: payload.phone,
        }, { transaction: tx });

        return customer;
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
        const winner = await Customer.findOne({
            where: { phone: payload.phone },
            transaction: tx
        });
        return winner;
        }
        throw err;
    }
}

const getActor = (user) => {
    if (user.type === "customer") return user.customer;
    if (user.type === "employee") return user.employee;
    return null;
}

export default {
    create,
    update,
    del,
    fetchList,
}