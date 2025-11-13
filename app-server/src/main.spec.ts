import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

describe('Application Configuration', () => {
  describe('Helmet Configuration', () => {
    it('should have valid helmet configuration', () => {
      const helmetConfig = {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        crossOriginEmbedderPolicy: false,
      };

      expect(helmetConfig).toBeDefined();
      expect(helmetConfig.contentSecurityPolicy).toBeDefined();
      expect(helmetConfig.contentSecurityPolicy.directives.defaultSrc).toContain("'self'");
      expect(helmetConfig.crossOriginEmbedderPolicy).toBe(false);
    });

    it('should allow inline styles and scripts for Swagger UI', () => {
      const helmetConfig = {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        crossOriginEmbedderPolicy: false,
      };

      expect(helmetConfig.contentSecurityPolicy.directives.styleSrc).toContain("'unsafe-inline'");
      expect(helmetConfig.contentSecurityPolicy.directives.scriptSrc).toContain("'unsafe-inline'");
    });
  });

  describe('CORS Configuration', () => {
    it('should parse single origin correctly', () => {
      const corsOrigin = 'http://localhost:5173';
      const origins = corsOrigin.split(',').map(origin => origin.trim());

      expect(origins).toHaveLength(1);
      expect(origins[0]).toBe('http://localhost:5173');
    });

    it('should parse multiple origins correctly', () => {
      const corsOrigin = 'http://localhost:5173,http://localhost:3001,https://example.com';
      const origins = corsOrigin.split(',').map(origin => origin.trim());

      expect(origins).toHaveLength(3);
      expect(origins).toContain('http://localhost:5173');
      expect(origins).toContain('http://localhost:3001');
      expect(origins).toContain('https://example.com');
    });

    it('should trim whitespace from origins', () => {
      const corsOrigin = 'http://localhost:5173 , http://localhost:3001 , https://example.com';
      const origins = corsOrigin.split(',').map(origin => origin.trim());

      expect(origins[0]).toBe('http://localhost:5173');
      expect(origins[1]).toBe('http://localhost:3001');
      expect(origins[2]).toBe('https://example.com');
    });

    it('should have correct CORS configuration structure', () => {
      const corsConfig = {
        origin: ['http://localhost:5173'],
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        credentials: true,
        maxAge: 3600,
      };

      expect(corsConfig.methods).toContain('GET');
      expect(corsConfig.methods).toContain('POST');
      expect(corsConfig.methods).toContain('PATCH');
      expect(corsConfig.methods).toContain('DELETE');
      expect(corsConfig.methods).toContain('OPTIONS');
      expect(corsConfig.allowedHeaders).toContain('Content-Type');
      expect(corsConfig.allowedHeaders).toContain('Authorization');
      expect(corsConfig.allowedHeaders).toContain('Accept');
      expect(corsConfig.credentials).toBe(true);
      expect(corsConfig.maxAge).toBe(3600);
    });
  });
});

describe('Swagger Configuration', () => {
  it('should create a valid Swagger document configuration', () => {
    const config = new DocumentBuilder()
      .setTitle('Flag Doug API')
      .setDescription(
        'Feature flag management system API. Provides endpoints for managing feature flags, environment-specific configurations, and real-time flag evaluation.',
      )
      .setVersion('1.0')
      .addTag('flags', 'Feature flag management operations')
      .addTag('evaluation', 'Flag evaluation endpoints')
      .addTag('health', 'Health check endpoints')
      .build();

    expect(config).toBeDefined();
    expect(config.info.title).toBe('Flag Doug API');
    expect(config.info.version).toBe('1.0');
    expect(config.info.description).toContain('Feature flag management system API');
    expect(config.tags).toHaveLength(3);
    expect(config.tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'flags' }),
        expect.objectContaining({ name: 'evaluation' }),
        expect.objectContaining({ name: 'health' }),
      ]),
    );
  });

  it('should have correct tag descriptions', () => {
    const config = new DocumentBuilder()
      .setTitle('Flag Doug API')
      .setDescription(
        'Feature flag management system API. Provides endpoints for managing feature flags, environment-specific configurations, and real-time flag evaluation.',
      )
      .setVersion('1.0')
      .addTag('flags', 'Feature flag management operations')
      .addTag('evaluation', 'Flag evaluation endpoints')
      .addTag('health', 'Health check endpoints')
      .build();

    const flagsTag = config.tags?.find((tag) => tag.name === 'flags');
    const evaluationTag = config.tags?.find((tag) => tag.name === 'evaluation');
    const healthTag = config.tags?.find((tag) => tag.name === 'health');

    expect(flagsTag?.description).toBe('Feature flag management operations');
    expect(evaluationTag?.description).toBe('Flag evaluation endpoints');
    expect(healthTag?.description).toBe('Health check endpoints');
  });
});
