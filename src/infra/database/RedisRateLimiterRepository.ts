import {
  IRateLimiterRepository,
  IRateLimiterResponse,
} from '../../core/interfaces/IRateLimiterRepository';
import { redisClient } from './redis';

export class RedisRateLimiterRepository implements IRateLimiterRepository {
  async incrementAndCheck(
    key: string,
    limit: number,
    windowInSeconds: number,
  ): Promise<IRateLimiterResponse> {
    const now = Date.now();
    const clearBefore = now - windowInSeconds * 1000;

    // Criamos a pipeline genérica de comandos
    const pipeline = redisClient.multi();

    // Executamos usando chamadas diretas que contornam conflitos de nomes de funções
    // Se a tua biblioteca for o 'redis' oficial, ela aceita strings ou métodos nativos.
    // Vamos garantir compatibilidade total chamando as funções que existem em runtime:
    if (typeof (pipeline as any).zRemRangeByScore === 'function') {
      (pipeline as any).zRemRangeByScore(key, 0, clearBefore);
      (pipeline as any).zCard(key);
      (pipeline as any).zAdd(key, { score: now, value: `${now}-${Math.random()}` });
      (pipeline as any).expire(key, windowInSeconds);
    } else {
      (pipeline as any).zremrangebyscore(key, 0, clearBefore);
      (pipeline as any).zcard(key);
      (pipeline as any).zadd(key, now, `${now}-${Math.random()}`);
      (pipeline as any).expire(key, windowInSeconds);
    }

    const results = await pipeline.exec();

    let currentRequests = 0;
    
    // Tratamento adaptativo do resultado para suportar ioredis e redis oficial
    if (Array.isArray(results) && results.length > 0) {
      // O resultado do ZCARD estará no segundo comando executado (índice 1)
      const zcardResult = results[1];
      
      if (Array.isArray(zcardResult)) {
        // Formato [error, value] comum no ioredis
        currentRequests = Number(zcardResult[1]) || 0;
      } else if (zcardResult !== undefined && zcardResult !== null) {
        // Formato de resposta direta comum no redis oficial
        currentRequests = Number(zcardResult) || 0;
      }
    }

    console.log(`📊 Requisições detetadas na janela: ${currentRequests} / Limite: ${limit}`);

    const isAllowed = currentRequests < limit;
    const remainingRequests = isAllowed ? Math.max(0, limit - currentRequests) : 0;
    const resetTime = now + windowInSeconds * 1000;

    return {
      isAllowed,
      maxRequests: limit,
      remainingRequests,
      resetTime,
    };
  }
}