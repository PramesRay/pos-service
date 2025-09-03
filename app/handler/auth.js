import { ConflictException } from "../../exception/conflict.exception.js";
import { successResponse } from "../../infrastructure/rest/response.js";
import authService from "../service/auth.js";

const register = async (req, res) => {
    const param = {
        email: req.body.email,
        name: req.body.name,
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await authService.getUserByEmail(param.email);
    if (existingUser) {
        throw new ConflictException("Email already registered");
    }

    const user = await authService.register(param);

    res.status(201).json(successResponse('Successfully registered', user));
}

export default {
    register
}