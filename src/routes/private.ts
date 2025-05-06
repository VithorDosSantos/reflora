import { and, eq } from 'drizzle-orm';
import express, { Request, Response } from 'express';
import { db } from '../db/db';
import {
  sensorDataTable,
  sensorTable
} from '../db/schema';

const router = express.Router();

// Mensagens de erro reutilizáveis
const ERROR_SERVER = 'Erro no Servidor, tente novamente';
const ERROR_NOT_FOUND = 'Não encontrado';
const ERROR_MISSING_FIELDS = 'Campos obrigatórios estão faltando';
const ERROR_INVALID_SENSOR = 'Sensor não encontrado';
const ERROR_INVALID_DATA = 'Dado não encontrado';

interface AuthenticatedRequest extends Request {
  userId?: number;
}

// Função para tratar erros
const handleError = (res: Response, message: string, statusCode = 500) => {
  console.error(message);
  return res.status(statusCode).json({ message });
};

// Cadastrar sensor
router.post('/sensors', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { sensorName, location } = req.body;
    const userId = req.userId;
    if (!userId || !sensorName || !location) {
      return res.status(400).json({ message: ERROR_MISSING_FIELDS });
    }
    await db
      .insert(sensorTable)
      .values({ userId, sensorName, location, installationDate: new Date() })
      .execute();

    return res.status(201).json({ message: 'Sensor cadastrado com sucesso' });
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Listar sensores do usuário
router.get('/sensors', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId!;
    const userSensors = await db
      .select()
      .from(sensorTable)
      .where(eq(sensorTable.userId, userId))
      .execute();

    if (userSensors.length === 0) {
      return res.status(404).json({ message: ERROR_NOT_FOUND });
    }

    return res.status(200).json(userSensors);
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Buscar sensor específico
router.get('/sensors/:sensorId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const sensorId = Number(req.params.sensorId);
    const userId = req.userId!;
    const [sensor] = await db
      .select()
      .from(sensorTable)
      .where(and(eq(sensorTable.sensorId, sensorId), eq(sensorTable.userId, userId)))
      .execute();

    if (!sensor) {
      return res.status(404).json({ message: ERROR_INVALID_SENSOR });
    }
    return res.status(200).json(sensor);
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Atualizar sensor
router.put('/sensors/:sensorId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const sensorId = Number(req.params.sensorId);
    const userId = req.userId!;
    const { sensorName, location } = req.body;

    if (!sensorName || !location) {
      return res.status(400).json({ message: 'sensorName e location são obrigatórios' });
    }

    const result = await db
      .update(sensorTable)
      .set({ sensorName, location })
      .where(and(eq(sensorTable.sensorId, sensorId), eq(sensorTable.userId, userId)))
      .execute();

    if (result.rowCount === 0) {
      return res.status(404).json({ message: ERROR_INVALID_SENSOR });
    }

    return res.status(200).json({ message: 'Sensor atualizado com sucesso' });
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Deletar sensor
router.delete('/sensors/:sensorId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const sensorId = Number(req.params.sensorId);
    const userId = req.userId!;

    const result = await db
      .delete(sensorTable)
      .where(and(eq(sensorTable.sensorId, sensorId), eq(sensorTable.userId, userId)))
      .execute();

    if (result.rowCount === 0) {
      return res.status(404).json({ message: ERROR_INVALID_SENSOR });
    }

    return res.status(200).json({ message: 'Sensor deletado com sucesso' });
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Inserir dados em um sensor
router.post('/sensors/:sensorId/data', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const sensorId = Number(req.params.sensorId);
    const userId = req.userId!;
    const { ph, shadingIndex, airHumidity, soilHumidity, soilNutrients, temperature } = req.body;

    const [sensor] = await db
      .select()
      .from(sensorTable)
      .where(and(eq(sensorTable.sensorId, sensorId), eq(sensorTable.userId, userId)))
      .execute();

    if (!sensor) {
      return res.status(404).json({ message: ERROR_INVALID_SENSOR });
    }

    await db
      .insert(sensorDataTable)
      .values({
        sensorId,
        ph,
        shadingIndex,
        airHumidity,
        soilHumidity,
        soilNutrients,
        temperature,
        dateTime: new Date(),
      })
      .execute();

    return res.status(201).json({ message: 'Dados do sensor adicionados com sucesso' });
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Listar todos os dados de um sensor
router.get('/sensors/:sensorId/data', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const sensorId = Number(req.params.sensorId);
    const userId = req.userId!;

    const [sensor] = await db
      .select()
      .from(sensorTable)
      .where(and(eq(sensorTable.sensorId, sensorId), eq(sensorTable.userId, userId)))
      .execute();

    if (!sensor) {
      return res.status(404).json({ message: ERROR_INVALID_SENSOR });
    }

    const data = await db
      .select()
      .from(sensorDataTable)
      .where(eq(sensorDataTable.sensorId, sensorId))
      .execute();

    if (data.length === 0) {
      return res.status(404).json({ message: ERROR_INVALID_DATA });
    }

    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Buscar dado específico de um sensor
router.get('/sensors/:sensorId/data/:dataId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const sensorId = Number(req.params.sensorId);
    const dataId = Number(req.params.dataId);
    const userId = req.userId!;

    const [sensor] = await db
      .select()
      .from(sensorTable)
      .where(and(eq(sensorTable.sensorId, sensorId), eq(sensorTable.userId, userId)))
      .execute();

    if (!sensor) {
      return res.status(404).json({ message: ERROR_INVALID_SENSOR });
    }

    const [datum] = await db
      .select()
      .from(sensorDataTable)
      .where(and(eq(sensorDataTable.sensorDataId, dataId), eq(sensorDataTable.sensorId, sensorId)))
      .execute();

    if (!datum) {
      return res.status(404).json({ message: ERROR_INVALID_DATA });
    }

    return res.status(200).json(datum);
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Atualizar dado específico
router.put('/sensors/:sensorId/data/:dataId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const sensorId = Number(req.params.sensorId);
    const dataId = Number(req.params.dataId);
    const userId = req.userId!;
    const { ph, shadingIndex, airHumidity, soilHumidity, soilNutrients, temperature } = req.body;

    const [sensor] = await db
      .select()
      .from(sensorTable)
      .where(and(eq(sensorTable.sensorId, sensorId), eq(sensorTable.userId, userId)))
      .execute();

    if (!sensor) {
      return res.status(404).json({ message: ERROR_INVALID_SENSOR });
    }

    const result = await db
      .update(sensorDataTable)
      .set({ ph, shadingIndex, airHumidity, soilHumidity, soilNutrients, temperature })
      .where(and(eq(sensorDataTable.sensorDataId, dataId), eq(sensorDataTable.sensorId, sensorId)))
      .execute();

    if (result.rowCount === 0) {
      return res.status(404).json({ message: ERROR_INVALID_DATA });
    }

    return res.status(200).json({ message: 'Dado do sensor atualizado com sucesso' });
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

// Deletar dado específico
router.delete('/sensors/:sensorId/data/:dataId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const sensorId = Number(req.params.sensorId);
    const dataId = Number(req.params.dataId);
    const userId = req.userId!;

    const result = await db
      .delete(sensorDataTable)
      .where(and(eq(sensorDataTable.sensorDataId, dataId), eq(sensorDataTable.sensorId, sensorId)))
      .execute();

    if (result.rowCount === 0) {
      return res.status(404).json({ message: ERROR_INVALID_DATA });
    }

    return res.status(200).json({ message: 'Dado do sensor deletado com sucesso' });
  } catch (error) {
    return handleError(res, ERROR_SERVER);
  }
});

export default router;