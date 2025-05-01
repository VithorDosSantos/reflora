import express, {Request, Response} from 'express';

import { eq } from 'drizzle-orm';
import { db } from '../db/db';
import { sensorDataTable, userTable,sensorTable, alertTable } from '../db/schema';

const router = express.Router();

// Cadastro de sensor
router.post('/sensors', async (req: Request, res: Response) : Promise<any>  => {
  try {
    const { userId, sensorName, location } = req.body;

    if(!userId || !sensorName || !location) {
      return res.status(400).json({ message: "userId, sensorName e location são obrigatórios" });
    }

    await db.insert(sensorTable).values({
      userId,
      sensorName,
      location,
      installationDate: new Date()
    })

    res.status(201).json({ message: "Sensor cadastrado com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro no Servidor, tente novamente" });
  }
})

// Listar sensores do usuário
router.get('/sensors', async (req: Request, res: Response) : Promise<any> => {
  try {
    const {userId} = req
    const userSensors = await db.select().from(sensorTable).where(eq(sensorTable.userId, Number(userId))).execute()
    if(userSensors.length === 0){
      return res.status(404).json({message: "Nenhum sensor encontrado"})
    }
    res.status(200).json(userSensors);
  } catch (error) {
    res.status(500).json({ message: "Erro no Servidor, tente novamente" });
  }
})

// Listar sensor por id
router.get('/sensors/:sensorId', async (req: Request, res: Response) : Promise<any> => {
  try {
    const {sensorId} = req.params
    const {userId} = req
    const userSensors = await db.select().from(sensorTable).where(eq(sensorTable.userId, Number(userId))).execute()
    if(userSensors.length === 0){
      return res.status(404).json({message: "Nenhum sensor encontrado"})
    }
    const selectedSensor = userSensors.filter(sensor => sensor.sensorId === parseInt(sensorId))
    if(!selectedSensor){
      return res.status(404).json({message: "Sensor não encontrado"})
    }
    res.status(200).json(selectedSensor);
  } catch (error) {
    res.status(500).json({ message: "Erro no Servidor, tente novamente" });
  }
})

// Cadstro do sensor_data em um sensor
router.post('/sensors/:sensorId/data', async (req:Request, res: Response):Promise<any>=>{
  try{
    const {sensorId} = req.params
    const { ph, shadingIndex, airHumidity, soilHumidity, soilNutrients ,temperature } = req.body;
    const {userId} = req
    
    const userSensors = await db.select().from(sensorTable).where(eq(sensorTable.userId, Number(userId))).execute()
    if(userSensors.length === 0){
      return res.status(404).json({message : "Nenhum sensor encontrado"})
    }
    const selectedSensor = userSensors.filter(sensor => sensor.sensorId === parseInt(sensorId))

    if(!selectedSensor){
      return res.status(404).json({message : "Sensor não encontrado"})
    }
    
    await db.insert(sensorDataTable).values({
      sensorId: parseInt(sensorId),
      ph,
      shadingIndex,
      airHumidity,
      soilHumidity,
      soilNutrients,
      temperature,
      dateTime: new Date()
    }).execute()
    res.status(200).json({message : 'Dados do sensor adicionado '})
  }catch(error){
    res.status(500).json({message : "Erro no Servidor, Tente Novamente"})
    console.error(error)
  }
})

// Cadastro de alerta em um sensor
router.post('/sensors/:sensorId/alert', async (req:Request, res: Response):Promise<any>=>{
  try {
    const {sensorId} = req.params
    const {message, level} = req.body

    const selectedSensor = await db.select().from(sensorTable).where(eq(sensorTable.sensorId, parseInt(sensorId))).execute()

    if(selectedSensor.length === 0){
      return res.status(404).json({message: "Sensor não encontrado"})
    }

    await db.insert(alertTable).values({
      sensorId: parseInt(sensorId),
      message,
      level,
      timestamp: new Date()
    }).execute()

    res.status(200).json({message: "Alerta adicionado com sucesso"})
  } catch (error) {
    res.status(500).json({message: "Erro no Servidor, Tente Novamente"})
  }
})


export default router;