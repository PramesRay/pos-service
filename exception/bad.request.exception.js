class BadRequestException extends Error {
    constructor(message) {
        super(message);
    }
}

export {BadRequestException}