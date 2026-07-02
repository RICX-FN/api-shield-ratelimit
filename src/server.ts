import express from 'express';
import { RedisRateLimiterRepository } from './infra/database/RedisRateLimiterRepository';
import { createRateLimiterMiddleware } from './infra/http/rateLimiterMiddleware';

const app = express();
app.use(express.json());

// 1. Instanciamos o repositório que comunica com o Redis
const rateLimiterRepository = new RedisRateLimiterRepository();

// 2. Criamos o middleware configurado (Ex: Máximo de 5 requisições a cada 10 segundos)
const rateLimiter = createRateLimiterMiddleware(rateLimiterRepository, {
  limit: 5,
  windowInSeconds: 10,
});

// 3. Aplicamos o middleware globalmente ou apenas nas rotas sensíveis
app.use(rateLimiter);

// Rota de teste
app.get('/api/v1/resource', (req, res) => {
  res.json({ message: 'Sucesso! Conseguiste aceder ao recurso protegido.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend a rodar na porta ${PORT}`);
});
