import {successResponse} from "../../infrastructure/rest/response.js";
import branchService from "../service/branch.js";

export default {
    create: async (req, res) => {
        if (!(req.user.profile.role === "admin" || req.user.profile.role === "pemilik")) throw new Error("Unauthorized");

        const branch = await branchService.create(req.body);
        res.status(201).json(successResponse("successfully create branch", branch));
    },
    update: async (req, res) => {
        if (!(req.user.profile.role === "admin" || req.user.profile.role === "pemilik")) throw new Error("Unauthorized");

        const branch = await branchService.update(req.params.id, req.body);
        res.status(200).json(successResponse("successfully update branch", branch));
    },
    remove: async (req, res) => {
        if (!(req.user.profile.role === "admin" || req.user.profile.role === "pemilik")) throw new Error("Unauthorized");

        await branchService.remove(req.params.id);
        res.status(200).json(successResponse("successfully delete branch", null));
    },
    getAll: async (req, res) => {
        const query = req.query;
        const branches = await branchService.getAll(query);
        res.status(200).json(successResponse("successfully fetch branches", branches));
    },
    getOne: async (req, res) => {
        const branch = await branchService.getOne(req.params.id);
        res.status(200).json(successResponse("successfully fetch branch by id", branch));
    },
};