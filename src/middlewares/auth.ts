import { Request, Response, NextFunction } from 'express'

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET;

const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization!.split(' ')[1]
  
  if(!req.headers.authorization){
    return res.status(401).json({message: "Acesso negado"})
  }

  if(!token){
    res.status(401).json({message: "Acesso negado"})
  }

  try {
    const decoded = jwt.verify(token!, JWT_SECRET!);

    req.userId = (decoded as jwt.JwtPayload).id;
  } catch (error) {
    return res.status(401).json({message: "Token inválido"})
  }
  
  next();
}


export default auth;