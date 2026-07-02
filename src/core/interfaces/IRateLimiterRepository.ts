export interface IRateLimiterResponse {
  isAllowed: boolean;
  maxRequests: number;
  remainingRequests: number;
  resetTime: number; // Timestamp de quando o limite faz reset
}

export interface IRateLimiterRepository {
  /**
   * Incrementa o acesso do utilizador e retorna o estado atual do limite.
   * @param key Identificador único (ex: IP ou ID do utilizador)
   * @param limit Máximo de requisições permitidas na janela
   * @param windowInSeconds Tamanho da janela de tempo em segundos
   */
  incrementAndCheck(
    key: string,
    limit: number,
    windowInSeconds: number
  ): Promise<IRateLimiterResponse>;
}