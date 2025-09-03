const successResponse = (message, data) => {
    return {
        status: "success",
        message,
        data
    }
}

const errorResponse = (message, err) => {
    return {
        status: "error",
        message,
        error: err
    }
}

export {
    successResponse,
    errorResponse
}