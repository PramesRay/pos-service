import authService from "../service/auth.js";

const register = async (req, res) => {
    const param = {
        email: req.body.email,
        name: req.body.name,
        uid: req.body.uid,
    }

    const user = await authService.register(param)

    res.status(201).json(user)
}

export default {
    register
}