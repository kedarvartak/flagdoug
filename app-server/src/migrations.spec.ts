import { InitialSchema1730000000000 } from '../migrations/1730000000000-InitialSchema';

describe('InitialSchema Migration', () => {
  let migration: InitialSchema1730000000000;
  let mockQueryRunner: any;
  let queries: string[];

  beforeEach(() => {
    migration = new InitialSchema1730000000000();
    queries = [];
    
    mockQueryRunner = {
      query: jest.fn((sql: string) => {
        queries.push(sql);
        return Promise.resolve();
      }),
    };
  });

  describe('up', () => {
    it('should create flags table with correct structure', async () => {
      await migration.up(mockQueryRunner);

      // Verify flag_type_enum was created
      expect(queries.some(q => q.includes('CREATE TYPE "flag_type_enum"'))).toBe(true);
      expect(queries.some(q => q.includes("'boolean', 'percentage', 'multivariate'"))).toBe(true);

      // Verify flags table was created
      const flagsTableQuery = queries.find(q => q.includes('CREATE TABLE "flags"'));
      expect(flagsTableQuery).toBeDefined();
      expect(flagsTableQuery).toContain('"id" uuid');
      expect(flagsTableQuery).toContain('"key" character varying NOT NULL');
      expect(flagsTableQuery).toContain('"name" character varying NOT NULL');
      expect(flagsTableQuery).toContain('"description" character varying');
      expect(flagsTableQuery).toContain('"type" "flag_type_enum"');
      expect(flagsTableQuery).toContain('"enabled" boolean NOT NULL DEFAULT false');
      expect(flagsTableQuery).toContain('"createdAt" TIMESTAMP');
      expect(flagsTableQuery).toContain('"updatedAt" TIMESTAMP');
      expect(flagsTableQuery).toContain('"deletedAt" TIMESTAMP');
      expect(flagsTableQuery).toContain('CONSTRAINT "UQ_flag_key" UNIQUE ("key")');
    });

    it('should create index on flag key', async () => {
      await migration.up(mockQueryRunner);

      const indexQuery = queries.find(q => q.includes('CREATE INDEX "IDX_flag_key"'));
      expect(indexQuery).toBeDefined();
      expect(indexQuery).toContain('ON "flags" ("key")');
    });

    it('should create flag_environments table with correct structure', async () => {
      await migration.up(mockQueryRunner);

      // Verify environment_enum was created
      expect(queries.some(q => q.includes('CREATE TYPE "environment_enum"'))).toBe(true);
      expect(queries.some(q => q.includes("'development', 'staging', 'production'"))).toBe(true);

      // Verify flag_environments table was created
      const envTableQuery = queries.find(q => q.includes('CREATE TABLE "flag_environments"'));
      expect(envTableQuery).toBeDefined();
      expect(envTableQuery).toContain('"id" uuid');
      expect(envTableQuery).toContain('"flagId" uuid NOT NULL');
      expect(envTableQuery).toContain('"environment" "environment_enum"');
      expect(envTableQuery).toContain('"enabled" boolean NOT NULL DEFAULT false');
      expect(envTableQuery).toContain('"rolloutPercentage" integer');
      expect(envTableQuery).toContain('"targetingRules" jsonb');
      expect(envTableQuery).toContain('"createdAt" TIMESTAMP');
      expect(envTableQuery).toContain('"updatedAt" TIMESTAMP');
    });

    it('should create indexes on flag_environments', async () => {
      await migration.up(mockQueryRunner);

      const flagIdIndex = queries.find(q => q.includes('CREATE INDEX "IDX_flag_environment_flagId"'));
      expect(flagIdIndex).toBeDefined();
      expect(flagIdIndex).toContain('ON "flag_environments" ("flagId")');

      const envIndex = queries.find(q => q.includes('CREATE INDEX "IDX_flag_environment_environment"'));
      expect(envIndex).toBeDefined();
      expect(envIndex).toContain('ON "flag_environments" ("environment")');
    });

    it('should create foreign key with cascade delete', async () => {
      await migration.up(mockQueryRunner);

      const fkQuery = queries.find(q => q.includes('ALTER TABLE "flag_environments"') && q.includes('ADD CONSTRAINT'));
      expect(fkQuery).toBeDefined();
      expect(fkQuery).toContain('FOREIGN KEY ("flagId")');
      expect(fkQuery).toContain('REFERENCES "flags"("id")');
      expect(fkQuery).toContain('ON DELETE CASCADE');
    });
  });

  describe('down', () => {
    it('should drop all tables and types in reverse order', async () => {
      await migration.down(mockQueryRunner);

      // Verify foreign key is dropped first
      expect(queries[0]).toContain('DROP CONSTRAINT "FK_flag_environments_flag"');

      // Verify indexes are dropped
      expect(queries.some(q => q.includes('DROP INDEX "IDX_flag_environment_environment"'))).toBe(true);
      expect(queries.some(q => q.includes('DROP INDEX "IDX_flag_environment_flagId"'))).toBe(true);
      expect(queries.some(q => q.includes('DROP INDEX "IDX_flag_key"'))).toBe(true);

      // Verify tables are dropped
      expect(queries.some(q => q.includes('DROP TABLE "flag_environments"'))).toBe(true);
      expect(queries.some(q => q.includes('DROP TABLE "flags"'))).toBe(true);

      // Verify types are dropped
      expect(queries.some(q => q.includes('DROP TYPE "environment_enum"'))).toBe(true);
      expect(queries.some(q => q.includes('DROP TYPE "flag_type_enum"'))).toBe(true);
    });
  });
});
