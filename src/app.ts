import cors from 'cors';
import express from 'express';
import { errorMiddleware } from './middleware/error.middleware.js';
import { profilesRouter } from './routes/profiles.route.js';

export const app = express();

app.use(
  cors({
    origin: '*',
  }),
);

app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.use(express.json());

app.use('/api/profiles', profilesRouter);

app.use(errorMiddleware);
