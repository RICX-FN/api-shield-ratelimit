import { Request, Response, NextFunction } from 'express';
import { IRateLimiterRepository } from '../../core/interfaces/IRateLimiterRepository';

interface MiddlewareOptions {
  limit: number;
  windowInSeconds: number;
}

export function createRateLimiterMiddleware(
  repository: IRateLimiterRepository,
  options: MiddlewareOptions
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Usamos o IP do cliente como chave. 
    // Em produção atrás de proxies (Nginx/Cloudflare), usaríamos req.headers['x-forwarded-for']
    const clientKey = `ratelimit:${req.ip}`;

    try {
      const result = await repository.incrementAndCheck(
        clientKey,
        options.limit,
        options.windowInSeconds
      );

      // Boa prática de mercado: Enviar os headers HTTP padrão de Rate Limit
      // Grandes empresas (GitHub, Twitter, Stripe) fazem exatamente isto nas suas APIs
      res.setHeader('X-RateLimit-Limit', result.maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remainingRequests);
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

      if (!result.isAllowed) {
         res.status(429).json({
          error: 'Too Many Requests',
          message: 'Ultrapassaste o limite de requisições permitidas. Tenta novamente mais tarde.',
        });
         return;
      }

      next();
    } catch (error) {
      console.error('⚠️ Falha no Rate Limiter Middleware:', error);
      // Fail-open: Se o Redis cair por algum motivo, não queremos deitar a API abaixo para os utilizadores.
      // Em sistemas críticos, isto é uma decisão de System Design importante.
      next();
    }
  };
}