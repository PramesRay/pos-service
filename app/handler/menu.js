import menuService from "../service/menu.js";
import {successResponse} from "../../infrastructure/rest/response.js";
import branchService from "../service/branch.js";
import { UnauthorizedException } from "../../exception/unauthorized.exception.js";
import categoryService from "../service/category.js";

export default {
    create: async (req, res) => {
        if (!(req.user.profile.role === "admin" || req.user.profile.role === "pemilik")) throw new UnauthorizedException("Unauthorized");

        const menu = await Promise.all(req.body.branch.map(id => 
          menuService.create(
            {...req.body, 
              fk_branch_id: id, 
              fk_category_id: req.body.category_id
            }
          )
        ));

        res.status(200).json(successResponse("successfully create menu", menu));
    },

    update: async (req, res) => {
        if (!(req.user.profile.role === "admin" || req.user.profile.role === "pemilik")) throw new UnauthorizedException("Unauthorized");

        const menu = await menuService.update(req.params.id, req.body);
        res.status(200).json(successResponse("successfully update menu", menu));
    },

    remove: async (req, res) => {
        if (!(req.user.profile.role === "admin" || req.user.profile.role === "pemilik")) throw new UnauthorizedException("Unauthorized");

        await menuService.remove(req.params.id);
        res.status(200).json(successResponse("successfully delete menu", null));
    },

    getOne: async (req, res) => {
        const menu = await menuService.getMenu(req.params.id);
        res.status(200).json(successResponse("successfully get menu", menu));
    },

    getAllByBranch: async (req, res) => {
        const menus = await menuService.getAllByBranch(req.query.branch_id);
        res.status(200).json(successResponse("successfully get menu by branch", menus));
    },

    getSalesByBranch: async (req, res) => {
        const menus = await menuService.getSalesByBranch(req.query.branch_id);
        res.status(200).json(successResponse("successfully get menu by branch", menus));
    },
}