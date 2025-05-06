import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

declare global {
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET

const auth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    res.status(401).json({ message: 'Acesso negado' })
    return
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    res.status(401).json({ message: 'Token não fornecido' })
    return
  }

  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET não está definido no ambiente.')
    }
    const decoded = jwt.verify(token, JWT_SECRET!)
    req.userId = (decoded as jwt.JwtPayload).id
    next()
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' })
  }
}

export default auth
