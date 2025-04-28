import express, {Request, Response} from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const port = 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.get('/healthcheck', (req: Request, res: Response) => {
  try {
    res.status(200).send();
  } catch (error) {
    res.status(500).send();
  }
});

app.get('/api/v1/sensors', (req: Request, res: Response) => {
  res.status(200).send("Sensor data here");
});

server.listen(port, () => {
  console.log(`Ta funfando na porta ${port}`);
});