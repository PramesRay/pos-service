import authService from "../app/service/auth.js";

export const authMiddleware = async (req, res, next) => {
    req.user = await authService.getAuthUser({userId: 1})
    next()
}