import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  // Database connection pool configuration
  DB_POOL_MAX: Joi.number().integer().min(1).max(100).default(10),
  DB_POOL_MIN: Joi.number().integer().min(1).max(50).default(2),
  DB_IDLE_TIMEOUT: Joi.number().integer().min(1000).default(30000),
  DB_CONNECTION_TIMEOUT: Joi.number().integer().min(100).default(2000),
});
