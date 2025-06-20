import { HttpException } from "./root.js";

export class NotFoundException extends HttpException{
    constructor(message,errorCode,errors){
        super(message,errorCode,404,null)
    }
}