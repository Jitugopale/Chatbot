//message, status code, error codes for frontend, error

export class HttpException extends Error{
    message;
    errorCode;
    statusCode;
    errors

    constructor(message,errorCode,statusCode,errors){//initialize constructor
        //call super method
        super(message)

        this.message = message,
        this.errorCode = errorCode,
        this.statusCode = statusCode,
        this.errors = errors
    }
}

// error-codes.js
export const ErrorCode = {
  USER_NOT_FOUND: 1001,
  USER_ALREADY_EXISTS: 1002,
  INCORRECT_PASSWORD: 1003,
  UNPROCESSABLE_ENTITY: 11001,
  INTERNAL_EXCEPTION: 11002,
  UNAUTHORIZED: 11003,
};
