import {successResponse} from "../../infrastructure/rest/response.js";
import customerService from "../service/customer.js";

export default {
  create: async (req, res) => {
    const data = await customerService.create(req.body);
    res.status(201).json(successResponse("Customer Created", data));
  },
  getOne: async (req, res) => {
    const data = await customerService.getOne(req.params.id);
    res.status(200).json(successResponse("Customer Found", data));
  },
  update: async (req, res) => {
    const data = await customerService.update(req.params.id, req.body);
    res.status(200).json(successResponse("Customer Updated", data));
  },
};