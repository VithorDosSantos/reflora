import express, { Request, Response } from 'express';

import { and, eq } from 'drizzle-orm';
import { db } from '../db/db';
import { alertTable, sensorDataTable, sensorTable, userTable } from '../db/schema';

const router = express.Router();

// Cadastro de sensor
router.post('/sensors', async (req: Request, res: Response) : Promise<any> => {
  try {
    const { sensorName, location } = req.body;
    const {userId} = req;
    
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
});

// Cadstro do sensor_data em um sensor
router.post('/sensors/:sensorId/data', async (req:Request, res: Response):Promise<any> =>{
  try{
    const {sensorId} = req.params
    const { ph, shadingIndex, airHumidity, soilHumidity, soilNutrients ,temperature } = req.body;
    const {userId} = req
    
    const userSensors = await db.select().from(sensorTable).where(eq(sensorTable.userId, Number(userId))).execute()
    if(userSensors.length === 0){
      return res.status(404).json({message : "Nenhum sensor encontrado"})
    }
    const selectedSensor = userSensors.filter(sensor => sensor.sensorId === parseInt(sensorId))

    if(selectedSensor.length === 0){
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
});

// Cadastro de alerta em um sensor
router.post('/sensors/:sensorId/alert', async (req:Request, res: Response):Promise<any> =>{
  try {
    const {userId} = req;
    const {sensorId} = req.params;
    const {message, level} = req.body;

    const selectedSensor = await db.select().from(sensorTable).where(and(eq(sensorTable.sensorId, Number(sensorId)), eq(sensorTable.userId, Number(userId)))).execute();


    if(selectedSensor.length === 0){
      return res.status(404).json({message: "Sensor não encontrado"});
    }

    await db.insert(alertTable).values({
      sensorId: parseInt(sensorId),
      message,
      level,
      timestamp: new Date()
    }).execute();

    res.status(200).json({message: "Alerta adicionado com sucesso"});
  } catch (error) {
    res.status(500).json({message: "Erro no Servidor, Tente Novamente"});
  }
});

// Listar Informações do usuário
router.get('/me', async (req: Request, res: Response) : Promise<any> => {
  try {
    const {userId} = req;
    const user = await db.select().from(userTable).where(eq(userTable.userId, Number(userId))).execute()
    if(user.length === 0){
      return res.status(404).json({message: "Usuário não encontrado"})
    }
    res.status(200).json(user[0]);
  } catch (error) {
    res.status(500).json({ message: "Erro no Servidor, tente novamente" });
  }
});

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
});

// Listar sensor por id
router.get('/sensors/:sensorId', async (req: Request, res: Response) : Promise<any> => {
  try {
    const { sensorId } = req.params;
    const {userId} = req;

    const userSensors = await db.select().from(sensorTable).where(eq(sensorTable.userId, Number(userId)));

    if(userSensors.length === 0){
      return res.status(404).json({message: "Nenhum sensor encontrado"})
    }

    const selectedSensor = userSensors.filter(sensor => sensor.sensorId === parseInt(sensorId));

    if(selectedSensor.length === 0){
      return res.status(404).json({message: "Sensor não encontrado"})
    }

    res.status(200).json(selectedSensor[0]);

  } catch (error) {
    res.status(500).json({ message: "Erro no Servidor, tente novamente" });
  }
});

// Listar todos os dados de um sensor
router.get('/sensors/:sensorId/data', async (req: Request, res: Response) : Promise<any> => {
  try {
    const { sensorId } = req.params;
    const { userId } = req;
    const userSensors = await db.select().from(sensorTable).where(eq(sensorTable.userId, Number(userId))).execute();

    if(userSensors.length === 0){
      return res.status(404).json({message: "Nenhum sensor encontrado"})
    }

    const selectedSensor = userSensors.filter(sensor => sensor.sensorId === parseInt(sensorId));

    if(selectedSensor.length === 0){
      return res.status(404).json({message: "Sensor não encontrado"})
    }

    const sensorData = await db.select().from(sensorDataTable).where(eq(sensorDataTable.sensorId, selectedSensor[0].sensorId)).execute();

    if(sensorData.length === 0){
      return res.status(404).json({message: "Nenhum dado encontrado para esse sensor"})
    }

    res.status(200).json(sensorData);
  } catch (error) {
    res.status(500).json({ message: "Erro no Servidor, tente novamente" });
  }
});

// Listar todos os alertas de um sensor
router.get('/sensors/:sensorId/alerts', async (req: Request, res: Response) : Promise<any> => {
  try {
    const {sensorId} = req.params;
    const {userId} = req;

    const userSensors = await db.select().from(sensorTable).where(eq(sensorTable.userId, Number(userId))).execute();

    if(userSensors.length === 0){
      return res.status(404).json({message: "Nenhum sensor encontrado"})
    }

    const selectedSensor = userSensors.filter(sensor => sensor.sensorId === parseInt(sensorId));

    if(selectedSensor.length === 0){
      return res.status(404).json({message: "Sensor não encontrado"})
    }

    const sensorAlerts = await db.select().from(alertTable).where(eq(alertTable.sensorId, selectedSensor[0].sensorId)).execute();

    if(sensorAlerts.length === 0){
      return res.status(404).json({message: "Nenhum alerta encontrado para esse sensor"})
    }

    res.status(200).json(sensorAlerts);
  } catch (error) {
    res.status(500).json({ message: "Erro no Servidor, tente novamente" });
  }
})

// Atualizar sensor
router.put('/sensors/:sensorId', async (req: Request, res: Response) : Promise<any> => {
  try {
    const {sensorId} = req.params;
    const {userId} = req;

    const {sensorName, location} = req.body;

    if(!sensorName || !location){
      return res.status(400).json({message: "sensorName e location são obrigatórios"})
    }

    const userSensors = await db.select().from(sensorTable).where(eq(sensorTable.userId, Number(userId))).execute()

    if(userSensors.length === 0){
      return res.status(404).json({message: "Nenhum sensor encontrado"})
    }

    const selectedSensor = userSensors.filter(sensor => sensor.sensorId === parseInt(sensorId))

    if(selectedSensor.length === 0){
      return res.status(404).json({message: "Sensor não encontrado"})
    }

    await db.update(sensorTable).set({
      sensorName,
      location
    }).where(eq(sensorTable.sensorId, selectedSensor[0].sensorId)).execute();

    res.status(200).json({message: "Sensor atualizado com sucesso"});
  } catch (error) {
    res.status(500).json({ message: "Erro no Servidor, tente novamente" });
  }
});

// Atualizar dado específico
router.put('/sensors/:sensorId/data/:dataId', async (req: Request, res: Response) : Promise<any> => {
  try {
    const {sensorId, dataId} = req.params;
    const {userId} = req;
    const {ph, shadingIndex, airHumidity, soilHumidity, soilNutrients ,temperature} = req.body;

    const userSensors = await db.select().from(sensorTable).where(eq(sensorTable.userId, Number(userId))).execute()

    if(userSensors.length === 0){
      return res.status(404).json({message: "Nenhum sensor encontrado"})
    }

    const selectedSensor = userSensors.filter(sensor => sensor.sensorId === parseInt(sensorId));

    if(selectedSensor.length === 0){
      return res.status(404).json({message: "Sensor não encontrado"})
    }

    const sensorData = await db.select().from(sensorDataTable).where(and(eq(sensorDataTable.sensorId, selectedSensor[0].sensorId), eq(sensorDataTable.sensorDataId, parseInt(dataId)))).execute();

    if(sensorData.length === 0){
      return res.status(404).json({message: "Nenhum dado encontrado para esse sensor"})
    }

    await db.update(sensorDataTable).set({
      ph,
      shadingIndex,
      airHumidity,
      soilHumidity,
      soilNutrients,
      temperature
    }).where(and(eq(sensorDataTable.sensorId, selectedSensor[0].sensorId), eq(sensorDataTable.sensorDataId, sensorData[0].sensorDataId))).execute();

    res.status(200).json({message: "Dado atualizado com sucesso"});
  } catch (error) {
    res.status(500).json({ message: "Erro no Servidor, tente novamente" });
  }
});


export default router;