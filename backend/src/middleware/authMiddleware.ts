import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
    return res.status(401).json({ error: 'Access token is missing' });
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("JWT_SECRET is not defined");
    }
    jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
        return res.status(403).json({ error: 'Invalid access token' });
    }
    req.user = user as { id: number; email: string };
    next();
  });
};
