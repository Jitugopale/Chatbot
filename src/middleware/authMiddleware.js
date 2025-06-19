 import jwt from 'jsonwebtoken';
import { ErrorCode } from '../exceptions/root.js';
import { JWT_SECRET } from '../secrets.js';
import { UnauthorizedException } from '../exceptions/unauthorized.js';

 export const authMiddleware = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
      return next (new UnauthorizedException("UnAuthorized",ErrorCode.UNAUTHORIZED));
    }
    
    try {
        const data = jwt.verify(token,JWT_SECRET);
        req.user = data;
        next();
    } catch (error) {
        return next (new UnauthorizedException("UnAuthorized",ErrorCode.UNAUTHORIZED));
    }

 }    