import express, { Request, Response, NextFunction } from 'express';
import publicRoutes from './routes/public';
import privateRoutes from './routes/private';
import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import { userTable, sensorTable, sensorDataTable, alertTable } from './db/schema'; // Ajustado para './db/schema'
import { db } from './db/db';
import auth from './middlewares/auth'
import 'dotenv/config';

const app = express();
app.use(express.json());
app.use("/api",publicRoutes);
app.use("/api", auth, privateRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API rodando em http://localhost:${PORT}`);
});