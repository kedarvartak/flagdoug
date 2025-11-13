import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from './config.module';
import { ConfigService } from '@nestjs/config';

describe('ConfigModule', () => {
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(configService).toBeDefined();
  });

  it('should load DATABASE_URL', () => {
    const databaseUrl = configService.get('DATABASE_URL');
    expect(databaseUrl).toBeDefined();
    expect(typeof databaseUrl).toBe('string');
  });

  it('should load NODE_ENV', () => {
    const nodeEnv = configService.get('NODE_ENV');
    expect(nodeEnv).toBeDefined();
    expect(['development', 'staging', 'production', 'test']).toContain(nodeEnv);
  });

  it('should load PORT', () => {
    const port = configService.get('PORT');
    expect(port).toBeDefined();
    expect(typeof port).toBe('number');
  });

  it('should load CORS_ORIGIN', () => {
    const corsOrigin = configService.get('CORS_ORIGIN');
    expect(corsOrigin).toBeDefined();
    expect(typeof corsOrigin).toBe('string');
  });

  it('should have database configuration', () => {
    const dbConfig = configService.get('database');
    expect(dbConfig).toBeDefined();
    expect(dbConfig.type).toBe('postgres');
    expect(dbConfig.url).toBeDefined();
    expect(dbConfig.entities).toBeDefined();
    expect(dbConfig.migrations).toBeDefined();
    expect(dbConfig.synchronize).toBe(false);
  });
});
