import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly staticToken = 'guestjoy'; // to-do: move this to .env file

  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['authorization'];

    if (token === this.staticToken) {
      next();
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  }
}
