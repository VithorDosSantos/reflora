import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import { user, sensor, sensorData, sensorAlert } from './db/schema'; // Ajustado para './db/schema'
import { db } from './db/db';
import 'dotenv/config';

const app = express();
app.use(express.json());

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu-segredo-jwt');
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido' });
  }
};

app.post('/auth/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db
      .insert(user)
      .values({ name, email, password: hashedPassword })
      .returning();

    const token = jwt.sign({ userId: newUser[0].userId }, process.env.JWT_SECRET || 'seu-segredo-jwt', {
      expiresIn: '1h',
    });

    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar usuário' });
    console.error('Erro ao registrar usuário:', error);
  }
});

app.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }

  try {
    const foundUser = await db.select().from(user).where({ email }).limit(1);
    if (!foundUser.length) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const passwordMatch = await bcrypt.compare(password, foundUser[0].password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    const token = jwt.sign({ userId: foundUser[0].userId }, process.env.JWT_SECRET || 'seu-segredo-jwt', {
      expiresIn: '1h',
    });

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

app.get('/users/me', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  try {
    const foundUser = await db.select().from(user).where({ userId }).limit(1);
    if (!foundUser.length) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.status(200).json({ id: foundUser[0].userId, name: foundUser[0].name, email: foundUser[0].email });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

app.post('/sensors', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { sensorName, location } = req.body;

  if (!sensorName || !location) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }

  try {
    const newSensor = await db
      .insert(sensor)
      .values({ userId, sensorName, location })
      .returning();

    res.status(201).json(newSensor[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar sensor' });
  }
});

app.get('/sensors', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  try {
    const sensors = await db.select().from(sensor).where({ userId });
    res.status(200).json(sensors);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar sensores' });
  }
});

app.post('/sensor-data', authenticateToken, async (req: Request, res: Response) => {
  const { sensorId, pH, shadingIndex, airHumidity, soilNutrients, temperature } = req.body;

  if (!sensorId || !pH || !shadingIndex || !airHumidity || !soilNutrients || !temperature) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }

  try {
    const newData = await db
      .insert(sensorData)
      .values({ sensorId, pH, shadingIndex, airHumidity, soilNutrients, temperature })
      .returning();

    res.status(201).json(newData[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar dados do sensor' });
  }
});

app.get('/sensor-data/:sensorId', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const sensorId = parseInt(req.params.sensorId);

  try {
    const foundSensor = await db.select().from(sensor).where({ sensorId, userId }).limit(1);
    if (!foundSensor.length) {
      return res.status(403).json({ error: 'Sensor não encontrado ou não pertence ao usuário' });
    }

    const data = await db.select().from(sensorData).where({ sensorId });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar dados do sensor' });
  }
});

app.get('/alerts', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  try {
    const alerts = await db
      .select()
      .from(sensorAlert)
      .innerJoin(sensor, { [sensor.sensorId]: sensorAlert.sensorId })
      .where({ [sensor.userId]: userId });

    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar alertas' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});