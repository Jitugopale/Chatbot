import { HttpException } from "./root.js";

export class UnauthorizedException extends HttpException{
    constructor(message,errorCode,errors){
        super(message,errorCode,401,errors)
    }
}