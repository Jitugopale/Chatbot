
import { HttpException } from "./root.js";

export class InternalException extends HttpException{
    constructor(message,errorCode,errors){
        super(message,errorCode,500,null)
    }
}