import express from 'express';
import cors from 'cors';
import {Request, Response} from 'express';
import './config/db';
import materialRoutes from './routes/materialRoutes';
import statusRouter from './routes/statusRoutes';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import jobRoutes from './routes/jobRoutes';


const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req:Request, res:Response) => {
  res.send('Welcome, HVAC Material Management System!');
});

// auth routes
app.use('/api/auth', authRoutes);

//material routes
app.use('/api/materials', materialRoutes);

//status routes
app.use('/api/statuses', statusRouter);

//project routes
app.use('/api/projects', projectRoutes);

//job routes
app.use('/api/jobs', jobRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
