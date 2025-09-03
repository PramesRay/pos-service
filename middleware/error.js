import {errorResponse} from "../infrastructure/rest/response.js";
import {ConflictException} from "../exception/conflict.exception.js";
import {NotFoundException} from "../exception/not.found.exception.js";
import {BadRequestException} from "../exception/bad.request.exception.js";

export const errorMiddleware = async (err, req, res, next) => {
    switch (true) {
        case err instanceof ConflictException:
            res.status(409).send(errorResponse(err.message));
            break;
        case err instanceof NotFoundException:
            res.status(404).send(errorResponse(err.message));
            break;
        case err instanceof BadRequestException:
            res.status(400).send(errorResponse(err.message));
            break;
        default:
            res
                .status(500)
                .json(errorResponse("Internal Server Error", err.message));
            break;
    }

    next();
};