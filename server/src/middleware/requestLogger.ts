import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startHrTime = process.hrtime();
  
  // Extract client IP address safely
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const clientIp = Array.isArray(ip) ? ip[0] : ip;

  // We wait for the request execution to finish
  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    // Convert to milliseconds with 2 decimal places
    const elapsedTimeInMs = (elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2);
    
    const method = req.method;
    const url = req.originalUrl || req.url;
    const status = res.statusCode;

    // ANSI Colors for premium aesthetic logging
    let methodColor = '\x1b[36m'; // Cyan
    if (method === 'POST') methodColor = '\x1b[33m'; // Yellow
    if (method === 'PUT' || method === 'PATCH') methodColor = '\x1b[35m'; // Magenta
    if (method === 'DELETE') methodColor = '\x1b[31m'; // Red

    let statusColor = '\x1b[32m'; // Green
    if (status >= 300 && status < 400) statusColor = '\x1b[33m'; // Yellow
    if (status >= 400) statusColor = '\x1b[31m'; // Red

    const resetColor = '\x1b[0m';
    const grayColor = '\x1b[90m';
    const goldColor = '\x1b[38;2;212;175;55m'; // Sleek gold rgb(212,175,55)

    const timestamp = new Date().toLocaleTimeString();

    console.log(
      `${grayColor}[${timestamp}]${resetColor} ` +
      `${methodColor}${method.padEnd(6)}${resetColor} ` +
      `${url} ` +
      `${statusColor}${status}${resetColor} ` +
      `${grayColor}(${elapsedTimeInMs}ms)${resetColor} ` +
      `— ${goldColor}${clientIp}${resetColor}`
    );
  });

  next();
}
