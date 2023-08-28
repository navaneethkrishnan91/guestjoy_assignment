import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Gets the request log
    console.log(`req:`, {
      headers: req.headers,
      body: req.body,
      originalUrl: req.originalUrl,
    });

    getResponseLog(res);
    // Ends middleware function execution, hence allowing to move on
    if (next) {
      next();
    }
  }
}

const getResponseLog = (res: Response) => {
  const rawResponse = res.write;
  const rawResponseEnd = res.end;
  const chunkBuffers = [];

  res.write = (...chunks) => {
    const resArgs = [];
    for (let i = 0; i < chunks.length; i++) {
      resArgs[i] = chunks[i];
      if (!resArgs[i]) {
        res.once('drain', res.write);
        i--;
      }
    }
    if (resArgs[0]) {
      chunkBuffers.push(Buffer.from(resArgs[0]));
    }
    return rawResponse.apply(res, resArgs);
  };

  console.log(`Done writing, beginning res.end`);

  res.end = (...chunk) => {
    const resArgs = [];
    for (let i = 0; i < chunk.length; i++) {
      resArgs[i] = chunk[i];
    }
    if (resArgs[0]) {
      chunkBuffers.push(Buffer.from(resArgs[0]));
    }
    const body = Buffer.concat(chunkBuffers).toString('utf8');

    res.setHeader('origin', 'restjs-req-res-logging-repo');

    let responseBody = {};
    try {
      responseBody = JSON.parse(body);
    } catch (error) {
      // Handle JSON parsing error if needed
      console.error('Error parsing JSON:', error);
    }

    const responseLog = {
      response: {
        statusCode: res.statusCode,
        body: responseBody || body || {},
        headers: res.getHeaders(),
      },
    };

    console.log('res: ', responseLog);
    rawResponseEnd.apply(res, resArgs);
    return responseLog as unknown as Response;
  };
};

