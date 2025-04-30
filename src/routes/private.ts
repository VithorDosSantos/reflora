import express, {Request, Response} from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { eq } from 'drizzle-orm';
import { db } from '../db/db';
import { sensorDataTable, userTable,sensorTable } from '../db/schema';

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
router.post('/sensors/:sensorId/data', async (req:Request, res: Response):Promise<any> =>{
  try{
    const {sensorId} = req.params
    const { pH, shadingIndex, airHumidity, soilNutrients, temperature } = req.body;

    const selectId = await db.select().from(sensorTable).where(eq(sensorTable.sensorId, parseInt(sensorId))).execute()

    if(selectId.length === 0 ){
      return res.status(404).json({message : "Sensor nao encontrado"})
    }
    await db.insert(sensorDataTable).values({
      sensorId: parseInt(sensorId),
      sensorDataId: crypto.randomUUID(),
      pH,
      shadingIndex,
      airHumidity,
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
router.get('/sensor-data/:sensorId', async (req: Request, res : Response): Promise<any>  =>{
  try{
    const { sensorId } = req.params

    const sensorExiste = await db.select().from(sensorTable).where(eq(sensorTable.sensorId,parseInt(sensorId))).execute()

    if(sensorExiste.length === 0 ){
      return res.status(404).json({message : "Sensor nao Encontrado"})
    }

    const sensorData = await db.select().from(sensorDataTable).where(eq(sensorDataTable.sensorId,parseInt(sensorId))).execute()
 
    if(sensorData.length === 0){
      return res.status(404).json({message: "Nenhum dado encontrado para este sensor"})
    }
    res.status(200).json({message:"Os dados do sensor :",data : sensorData})
  }catch(error){
    res.status(500).json({message : 'Erro no Servidor'})
  }
})
export default router;