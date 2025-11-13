import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters';

describe('Swagger Documentation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Configure global exception filter
    app.useGlobalFilters(new HttpExceptionFilter());

    // Configure Swagger documentation
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

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Swagger UI', () => {
    it('should serve Swagger UI at /api/docs', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs')
        .expect(301); // Redirect to /api/docs/

      expect(response.headers.location).toBe('/api/docs/');
    });

    it('should serve Swagger UI HTML at /api/docs/', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs/')
        .expect(200);

      expect(response.text).toContain('Swagger UI');
      expect(response.headers['content-type']).toContain('text/html');
    });
  });

  describe('Swagger JSON', () => {
    it('should serve OpenAPI JSON specification', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      expect(response.body).toHaveProperty('openapi');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
      expect(response.body).toHaveProperty('components');
    });

    it('should have correct API metadata', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      expect(response.body.info.title).toBe('Flag Doug API');
      expect(response.body.info.version).toBe('1.0');
      expect(response.body.info.description).toContain('Feature flag management system API');
    });

    it('should have all required tags', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const tags = response.body.tags.map((tag: any) => tag.name);
      expect(tags).toContain('flags');
      expect(tags).toContain('evaluation');
      expect(tags).toContain('health');
    });
  });

  describe('API Endpoints Documentation', () => {
    let swaggerDoc: any;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);
      swaggerDoc = response.body;
    });

    it('should document all flags endpoints', () => {
      expect(swaggerDoc.paths).toHaveProperty('/api/flags');
      expect(swaggerDoc.paths).toHaveProperty('/api/flags/{id}');
      expect(swaggerDoc.paths).toHaveProperty('/api/flags/{id}/environments/{env}');

      // POST /api/flags
      expect(swaggerDoc.paths['/api/flags'].post).toBeDefined();
      expect(swaggerDoc.paths['/api/flags'].post.summary).toBe('Create a new feature flag');
      expect(swaggerDoc.paths['/api/flags'].post.responses['201']).toBeDefined();
      expect(swaggerDoc.paths['/api/flags'].post.responses['400']).toBeDefined();
      expect(swaggerDoc.paths['/api/flags'].post.responses['409']).toBeDefined();

      // GET /api/flags
      expect(swaggerDoc.paths['/api/flags'].get).toBeDefined();
      expect(swaggerDoc.paths['/api/flags'].get.summary).toBe('Get all feature flags');
      expect(swaggerDoc.paths['/api/flags'].get.responses['200']).toBeDefined();

      // GET /api/flags/{id}
      expect(swaggerDoc.paths['/api/flags/{id}'].get).toBeDefined();
      expect(swaggerDoc.paths['/api/flags/{id}'].get.summary).toBe('Get a feature flag by ID');
      expect(swaggerDoc.paths['/api/flags/{id}'].get.responses['200']).toBeDefined();
      expect(swaggerDoc.paths['/api/flags/{id}'].get.responses['404']).toBeDefined();

      // PATCH /api/flags/{id}
      expect(swaggerDoc.paths['/api/flags/{id}'].patch).toBeDefined();
      expect(swaggerDoc.paths['/api/flags/{id}'].patch.summary).toBe('Update a feature flag');
      expect(swaggerDoc.paths['/api/flags/{id}'].patch.responses['200']).toBeDefined();
      expect(swaggerDoc.paths['/api/flags/{id}'].patch.responses['400']).toBeDefined();
      expect(swaggerDoc.paths['/api/flags/{id}'].patch.responses['404']).toBeDefined();

      // DELETE /api/flags/{id}
      expect(swaggerDoc.paths['/api/flags/{id}'].delete).toBeDefined();
      expect(swaggerDoc.paths['/api/flags/{id}'].delete.summary).toBe('Delete a feature flag');
      expect(swaggerDoc.paths['/api/flags/{id}'].delete.responses['204']).toBeDefined();
      expect(swaggerDoc.paths['/api/flags/{id}'].delete.responses['404']).toBeDefined();

      // PATCH /api/flags/{id}/environments/{env}
      expect(swaggerDoc.paths['/api/flags/{id}/environments/{env}'].patch).toBeDefined();
      expect(swaggerDoc.paths['/api/flags/{id}/environments/{env}'].patch.summary).toBe(
        'Toggle flag for a specific environment',
      );
      expect(swaggerDoc.paths['/api/flags/{id}/environments/{env}'].patch.responses['200']).toBeDefined();
      expect(swaggerDoc.paths['/api/flags/{id}/environments/{env}'].patch.responses['400']).toBeDefined();
      expect(swaggerDoc.paths['/api/flags/{id}/environments/{env}'].patch.responses['404']).toBeDefined();
    });

    it('should document evaluation endpoint', () => {
      expect(swaggerDoc.paths).toHaveProperty('/api/evaluate/{key}');
      expect(swaggerDoc.paths['/api/evaluate/{key}'].get).toBeDefined();
      expect(swaggerDoc.paths['/api/evaluate/{key}'].get.summary).toBe('Evaluate flag');
      expect(swaggerDoc.paths['/api/evaluate/{key}'].get.responses['200']).toBeDefined();
      expect(swaggerDoc.paths['/api/evaluate/{key}'].get.responses['400']).toBeDefined();
    });

    it('should document health check endpoint', () => {
      expect(swaggerDoc.paths).toHaveProperty('/health');
      expect(swaggerDoc.paths['/health'].get).toBeDefined();
      expect(swaggerDoc.paths['/health'].get.summary).toBe('Check application health status');
      expect(swaggerDoc.paths['/health'].get.responses['200']).toBeDefined();
      expect(swaggerDoc.paths['/health'].get.responses['503']).toBeDefined();
    });
  });

  describe('Schema Documentation', () => {
    let swaggerDoc: any;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);
      swaggerDoc = response.body;
    });

    it('should document CreateFlagDto schema', () => {
      expect(swaggerDoc.components.schemas).toHaveProperty('CreateFlagDto');
      const schema = swaggerDoc.components.schemas.CreateFlagDto;

      expect(schema.properties).toHaveProperty('key');
      expect(schema.properties).toHaveProperty('name');
      expect(schema.properties).toHaveProperty('description');
      expect(schema.properties).toHaveProperty('type');
      expect(schema.properties).toHaveProperty('enabled');
      expect(schema.properties).toHaveProperty('environments');

      // Check examples
      expect(schema.properties.key.example).toBe('new_feature_toggle');
      expect(schema.properties.name.example).toBe('New Feature Toggle');
    });

    it('should document UpdateFlagDto schema', () => {
      expect(swaggerDoc.components.schemas).toHaveProperty('UpdateFlagDto');
      const schema = swaggerDoc.components.schemas.UpdateFlagDto;

      expect(schema.properties).toHaveProperty('name');
      expect(schema.properties).toHaveProperty('description');
      expect(schema.properties).toHaveProperty('enabled');
    });

    it('should document ToggleFlagDto schema', () => {
      expect(swaggerDoc.components.schemas).toHaveProperty('ToggleFlagDto');
      const schema = swaggerDoc.components.schemas.ToggleFlagDto;

      expect(schema.properties).toHaveProperty('enabled');
      expect(schema.properties).toHaveProperty('rolloutPercentage');

      // Check validation constraints
      expect(schema.properties.rolloutPercentage.minimum).toBe(0);
      expect(schema.properties.rolloutPercentage.maximum).toBe(100);
    });

    it('should document Flag entity schema', () => {
      expect(swaggerDoc.components.schemas).toHaveProperty('Flag');
      const schema = swaggerDoc.components.schemas.Flag;

      expect(schema.properties).toHaveProperty('id');
      expect(schema.properties).toHaveProperty('key');
      expect(schema.properties).toHaveProperty('name');
      expect(schema.properties).toHaveProperty('description');
      expect(schema.properties).toHaveProperty('type');
      expect(schema.properties).toHaveProperty('enabled');
      expect(schema.properties).toHaveProperty('environments');
      expect(schema.properties).toHaveProperty('createdAt');
      expect(schema.properties).toHaveProperty('updatedAt');
      expect(schema.properties).toHaveProperty('deletedAt');
    });

    it('should document FlagEnvironment entity schema', () => {
      expect(swaggerDoc.components.schemas).toHaveProperty('FlagEnvironment');
      const schema = swaggerDoc.components.schemas.FlagEnvironment;

      expect(schema.properties).toHaveProperty('id');
      expect(schema.properties).toHaveProperty('flagId');
      expect(schema.properties).toHaveProperty('environment');
      expect(schema.properties).toHaveProperty('enabled');
      expect(schema.properties).toHaveProperty('rolloutPercentage');
      expect(schema.properties).toHaveProperty('targetingRules');
      expect(schema.properties).toHaveProperty('createdAt');
      expect(schema.properties).toHaveProperty('updatedAt');
    });

    it('should document CreateFlagEnvironmentDto schema', () => {
      expect(swaggerDoc.components.schemas).toHaveProperty('CreateFlagEnvironmentDto');
      const schema = swaggerDoc.components.schemas.CreateFlagEnvironmentDto;

      expect(schema.properties).toHaveProperty('environment');
      expect(schema.properties).toHaveProperty('enabled');
      expect(schema.properties).toHaveProperty('rolloutPercentage');
      expect(schema.properties).toHaveProperty('targetingRules');
    });
  });

  describe('Request/Response Examples', () => {
    let swaggerDoc: any;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);
      swaggerDoc = response.body;
    });

    it('should include example request for creating a flag', () => {
      const createFlagSchema = swaggerDoc.components.schemas.CreateFlagDto;
      expect(createFlagSchema.properties.key.example).toBeDefined();
      expect(createFlagSchema.properties.name.example).toBeDefined();
      expect(createFlagSchema.properties.environments.example).toBeDefined();
    });

    it('should include example response for evaluation endpoint', () => {
      const evaluationResponse = swaggerDoc.paths['/api/evaluate/{key}'].get.responses['200'];
      expect(evaluationResponse.content['application/json'].schema.properties).toHaveProperty('enabled');
      expect(evaluationResponse.content['application/json'].schema.properties).toHaveProperty('key');
      expect(evaluationResponse.content['application/json'].schema.properties).toHaveProperty('variant');
    });

    it('should include example response for health check', () => {
      const healthResponse = swaggerDoc.paths['/health'].get.responses['200'];
      expect(healthResponse.content['application/json'].schema.example).toBeDefined();
      expect(healthResponse.content['application/json'].schema.example.status).toBe('ok');
    });
  });
});
