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

    // Usamos um Sorted Set (ZSET) no Redis para guardar os timestamps de cada requisição
    const pipeline = redisClient.multi();

    // 1. Remove os timestamps antigos que já saíram da janela de tempo
    pipeline.zRemRangeByScore(key, 0, clearBefore);

    // 2. Conta quantas requisições restam na janela atual
    pipeline.zCard(key);

    // 3. Adiciona o timestamp da requisição atual
    pipeline.zAdd(key, {
      score: now,
      value: `${now}-${Math.random()}`,
    });

    // 4. Define o tempo de expiração da chave para não lixar a memória do Redis
    pipeline.expire(key, windowInSeconds);

    // Executa todos os comandos de forma atómica no Redis
    const results = await pipeline.exec();

    // O resultado do zCard (quantidade de requisições atuais) estará na segunda posição (índice 1)
    const zcardResult = results?.[1] as unknown;
    const currentRequests = Number((zcardResult as any)?.[1] ?? 0);

    const isAllowed = currentRequests < limit;
    const remainingRequests = Math.max(0, limit - currentRequests);
    const resetTime = now + windowInSeconds * 1000;

    return {
      isAllowed,
      maxRequests: limit,
      remainingRequests,
      resetTime,
    };
  }
}
