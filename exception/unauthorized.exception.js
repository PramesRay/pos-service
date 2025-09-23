class UnauthorizedException extends Error {
    constructor(message) {
        super(message);
    }
}

export {UnauthorizedException}