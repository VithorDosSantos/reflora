import express, {Request, Response} from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { eq } from 'drizzle-orm';
import { db } from '../db/db';
import { userTable } from '../db/schema';

const router = express.Router();

router.get('/list', async (req: Request, res: Response) => {
  try {
    const users = await db.query.userTable.findMany({
      columns: {
        password: false, // Exclui a senha do resultado
      }
    });

    res.status(200).json({message: "Usuários listados com sucesso", users});
  } catch (error) {
    res.status(500).json({ message: "Erro no Servidor, tente novamente" });
  }
})

export default router;