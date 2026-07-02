import { createClient } from 'redis';

// Conecta ao Redis que definimos no docker-compose
export const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});

redisClient.on('connect', () => console.log('🛡️ Redis conectado com sucesso!'));
redisClient.on('error', (err) => console.error('Erro no Redis:', err));

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}
