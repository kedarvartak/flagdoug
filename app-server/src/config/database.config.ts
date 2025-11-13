import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    // Connection pool configuration
    extra: {
      max: parseInt(process.env.DB_POOL_MAX || '10', 10), // Maximum pool size
      min: parseInt(process.env.DB_POOL_MIN || '2', 10), // Minimum pool size
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10), // 30 seconds
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10), // 2 seconds
    },
    // Query performance optimization
    maxQueryExecutionTime: 1000, // Log queries taking longer than 1 second
  }),
);
