import express from 'express';
import dotenv from 'dotenv';
import router from './routes.js';
import conectar from './db.js';

dotenv.config();

const app = express();

conectar();

app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/tareas', router);

app.use((req, res) => {
  res.status(404).json({ message: 'RUTA NO ENCONTRADA' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});