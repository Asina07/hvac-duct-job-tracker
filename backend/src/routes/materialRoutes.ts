import {Router} from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { createMaterial, getMaterials } from '../controllers/materialController';

const Materialrouter = Router();

Materialrouter.get('/', authenticateToken, getMaterials);
Materialrouter.post('/', authenticateToken, createMaterial);

export default Materialrouter;