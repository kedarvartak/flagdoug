import { validationSchema } from './validation.schema';

describe('Environment Variable Validation', () => {
  it('should validate correct environment variables', () => {
    const validEnv = {
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_URL: 'postgresql://localhost:5432/test',
      CORS_ORIGIN: 'http://localhost:5173',
    };

    const { error } = validationSchema.validate(validEnv);
    expect(error).toBeUndefined();
  });

  it('should fail when DATABASE_URL is missing', () => {
    const invalidEnv = {
      NODE_ENV: 'development',
      PORT: 3000,
      CORS_ORIGIN: 'http://localhost:5173',
    };

    const { error } = validationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.message).toContain('DATABASE_URL');
  });

  it('should use default values for optional fields', () => {
    const minimalEnv = {
      DATABASE_URL: 'postgresql://localhost:5432/test',
    };

    const { error, value } = validationSchema.validate(minimalEnv);
    expect(error).toBeUndefined();
    expect(value.NODE_ENV).toBe('development');
    expect(value.PORT).toBe(3000);
    expect(value.CORS_ORIGIN).toBe('http://localhost:5173');
  });

  it('should reject invalid NODE_ENV values', () => {
    const invalidEnv = {
      NODE_ENV: 'invalid',
      PORT: 3000,
      DATABASE_URL: 'postgresql://localhost:5432/test',
      CORS_ORIGIN: 'http://localhost:5173',
    };

    const { error } = validationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.message).toContain('NODE_ENV');
  });

  it('should accept valid NODE_ENV values', () => {
    const validEnvironments = ['development', 'staging', 'production', 'test'];

    validEnvironments.forEach((env) => {
      const validEnv = {
        NODE_ENV: env,
        PORT: 3000,
        DATABASE_URL: 'postgresql://localhost:5432/test',
        CORS_ORIGIN: 'http://localhost:5173',
      };

      const { error } = validationSchema.validate(validEnv);
      expect(error).toBeUndefined();
    });
  });

  describe('Database Connection Pool Configuration', () => {
    it('should use default values for connection pool settings', () => {
      const minimalEnv = {
        DATABASE_URL: 'postgresql://localhost:5432/test',
      };

      const { error, value } = validationSchema.validate(minimalEnv);
      expect(error).toBeUndefined();
      expect(value.DB_POOL_MAX).toBe(10);
      expect(value.DB_POOL_MIN).toBe(2);
      expect(value.DB_IDLE_TIMEOUT).toBe(30000);
      expect(value.DB_CONNECTION_TIMEOUT).toBe(2000);
    });

    it('should accept valid connection pool settings', () => {
      const validEnv = {
        DATABASE_URL: 'postgresql://localhost:5432/test',
        DB_POOL_MAX: 20,
        DB_POOL_MIN: 5,
        DB_IDLE_TIMEOUT: 60000,
        DB_CONNECTION_TIMEOUT: 5000,
      };

      const { error } = validationSchema.validate(validEnv);
      expect(error).toBeUndefined();
    });

    it('should reject DB_POOL_MAX less than 1', () => {
      const invalidEnv = {
        DATABASE_URL: 'postgresql://localhost:5432/test',
        DB_POOL_MAX: 0,
      };

      const { error } = validationSchema.validate(invalidEnv);
      expect(error).toBeDefined();
      expect(error?.message).toContain('DB_POOL_MAX');
    });

    it('should reject DB_POOL_MAX greater than 100', () => {
      const invalidEnv = {
        DATABASE_URL: 'postgresql://localhost:5432/test',
        DB_POOL_MAX: 101,
      };

      const { error } = validationSchema.validate(invalidEnv);
      expect(error).toBeDefined();
      expect(error?.message).toContain('DB_POOL_MAX');
    });

    it('should reject DB_POOL_MIN less than 1', () => {
      const invalidEnv = {
        DATABASE_URL: 'postgresql://localhost:5432/test',
        DB_POOL_MIN: 0,
      };

      const { error } = validationSchema.validate(invalidEnv);
      expect(error).toBeDefined();
      expect(error?.message).toContain('DB_POOL_MIN');
    });

    it('should reject DB_IDLE_TIMEOUT less than 1000ms', () => {
      const invalidEnv = {
        DATABASE_URL: 'postgresql://localhost:5432/test',
        DB_IDLE_TIMEOUT: 500,
      };

      const { error } = validationSchema.validate(invalidEnv);
      expect(error).toBeDefined();
      expect(error?.message).toContain('DB_IDLE_TIMEOUT');
    });

    it('should reject DB_CONNECTION_TIMEOUT less than 100ms', () => {
      const invalidEnv = {
        DATABASE_URL: 'postgresql://localhost:5432/test',
        DB_CONNECTION_TIMEOUT: 50,
      };

      const { error } = validationSchema.validate(invalidEnv);
      expect(error).toBeDefined();
      expect(error?.message).toContain('DB_CONNECTION_TIMEOUT');
    });
  });
});
