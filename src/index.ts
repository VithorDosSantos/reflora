import express, { Request, Response, NextFunction } from 'express';
import publicRoutes from './routes/public';
import privateRoutes from './routes/private';
import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import { userTable, sensorTable, sensorDataTable, sensorAlertTable } from './db/schema'; // Ajustado para './db/schema'
import { db } from './db/db';
import 'dotenv/config';

const app = express();
app.use(express.json());
app.use("/api",publicRoutes);
app.use("/api", privateRoutes);


// app.post('/sensors', async (req: Request, res: Response) => {
// });

// app.get('/sensors', async (req: Request, res: Response) => {
// });

// app.get('/sensors/:sensorId', async (req: Request, res: Response) => {
// });

// app.get('/sensors/:sensorId/data', async (req: Request, res: Response) => {
// });

// app.post('/sensor-data', async (req: Request, res: Response) => {
// });

// app.get('/sensor-data/:sensorId', async (req: Request, res: Response) => {
// });

// app.get('/alerts', async (req: Request, res: Response) => {
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});