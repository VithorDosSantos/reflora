import express, {Request, Response} from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { eq } from 'drizzle-orm';
import { db } from '../db/db';

import {userTable} from '../db/schema';
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET

// Cadastro de usuário
router.post('/register', async (req: Request, res: Response) => {
  try {
    const userData = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(userData.password, salt);

    const userDb = await db.insert(userTable).values({
      name: userData.name,
      email: userData.email,
      password: hashPassword,
    }).returning().execute();

    res.status(201).json(userDb);
  } catch (error) {
    res.status(500).json({ message: "Erro no Servidor, tente novamente" });
    console.error(error);
  }
})

// Login de usuário
router.post('/login', async (req: Request, res: Response) : Promise<any> => {
  try{
    const {email, password} = req.body;

    if(!email || !password){
      return res.status(400).json({message: "Email e senha são obrigatórios"});
    }

    const selectedUser = await db.select().from(userTable).where(eq(userTable.email, email)).execute();

    if(selectedUser.length === 0){
      return res.status(404).json({message: "Usuário não encontrado"});
    }

    const isMatch = await bcrypt.compare(password, selectedUser[0].password!);

    if(!isMatch){
      return res.status(401).json({message: "Senha incorreta"});
    }

    const token = jwt.sign({id: selectedUser[0].userId}, JWT_SECRET!, {expiresIn: '1h'});

    res.status(200).json(token);
  } catch(error){
    res.status(500).json({ message: "Erro no Servidor, tente novamente" });
    console.error(error);
  }
  
  
});

export default router;