import reservationService from "../service/reservation.js"
import {successResponse} from "../../infrastructure/rest/response.js";

const create = async (req, res) => {
    const param = {
        branch_id: req.body.branch_id,
        customer: req.body.customer,
        time: req.body.time,
        people: req.body.people,
        notes: req.body.notes,
    }

    const reservation = await reservationService.create(param, req.user.profile, 'employee')
    res.status(201).json(successResponse("successfully create reservation", reservation))
}

const createByCustomer = async (req, res) => {
    const param = {
        branch_id: req.body.branch_id,
        customer: req.body.customer,
        time: req.body.time,
        people: req.body.people,
        notes: req.body.notes,
    }

    const reservation = await reservationService.create(param, param.customer, 'customer')
    res.status(201).json(successResponse("successfully create reservation", reservation))
}

const update = async (req, res) => {
    let param = {}

    switch (req.body.type) {
        case 'updateReservation':
            param = {
                id: req.body.id,
                branch_id: req.body.branch_id,
                customer: req.body.customer,
                time: req.body.time,
                people: req.body.people,
                notes: req.body.notes,
            }
            break;
        case 'updateReservationStatus':
            param = {
                id: req.body.id,
                approved: req.body.approved,
            }
            break;
    }

    const reservation = await reservationService.update(param, req.user.profile)
    res.status(200).json(successResponse("successfully update reservation", reservation))
}

const updateByCustomer = async (req, res) => {
    const reservation = await reservationService.update(req.body, req.body, 'customer')
    res.status(200).json(successResponse("successfully update reservation", reservation))
}

const del = async (req, res) => {
    const reservationId = req.params.id
    await reservationService.del(reservationId)
    res.status(200).json(successResponse("successfully delete reservation", null))
}

const fetchList = async (req, res) => {
    const list = await reservationService.fetchList(req.query)
    res.status(200).json(successResponse("successfully fetch reservation list", list))
}

const fetchByCustomer = async (req, res) => {
    const list = await reservationService.fetchList(req.query)
    res.status(200).json(successResponse("successfully fetch reservation list", list))
}

export default {
    create,
    createByCustomer,
    update,
    updateByCustomer,
    del,
    fetchList,
    fetchByCustomer
}