import fundRequestService from "../service/fund.request.js"
import {successResponse} from "../../infrastructure/rest/response.js";

const create = async (req, res) => {
    const param = {
        subject: req.body.subject,
        description: req.body.description,
        branch_id: req.body.branch_id,
        items: req.body.items,
    }

    const fundRequest = await fundRequestService.create(param, req.user.profile)

    res.status(200).json(successResponse("successfully create fund request", fundRequest))
}

const update = async (req, res) => {
    const type = req.body.type

    let param = {}

    switch (type) {
        case 'updateFundRequest':
            param = {
                id: req.body.id,
                subject: req.body.subject,
                description: req.body.description,
                branch_id: req.body.branch_id,
                items: req.body.items,
                type: req.body.type,
            }
            break;

        case 'approveFundRequest':
            param = {
                id: req.body.id,
                type: req.body.type,
                items: req.body.items,
                total_approved: req.body.total_approved,
                approval_notes: req.body.approval_notes,
            }

    }

    const fundRequest = await fundRequestService.update(param, req.user.profile)

    res.status(200).json(successResponse("successfully update fund request", fundRequest))
}

const del = async (req, res) => {
    const fundRequestId = req.params.id
    await fundRequestService.del(fundRequestId)
    res.status(200).json(successResponse("successfully delete fund request", null))
}

const fetchList = async (req, res) => {
    const list = await fundRequestService.fetchList()
    res.status(200).json(successResponse("successfully fetch fund request list", list))
}

export default {
    create,
    update,
    del,
    fetchList,
}

