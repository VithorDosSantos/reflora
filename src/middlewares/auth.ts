import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET

interface DecodedToken {
  id: number;
  exp: number;
  iat: number;
}

const auth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    res.status(401).json({ message: "Acesso negado: Cabeçalho de autorização não encontrado." });
    return;
  }
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: "Formato do token inválido. Certifique-se de que o token começa com 'Bearer '." });
    return;
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    res.status(401).json({ message: "Token não fornecido. Certifique-se de que o token está presente." });
    return;
  }

  try {
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET não está definido no ambiente.");
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    req.userId = decoded.id;

    return next();
  } catch (error) {
    res.status(401).json({ message: "Token inválido ou expirado." });
    return;
  }
}

export default auth
