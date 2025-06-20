import { HttpException } from "./root.js";

export class BadRequestException extends HttpException{
    constructor(message,errorCode){
        super(message,errorCode,400,null);
    }
}