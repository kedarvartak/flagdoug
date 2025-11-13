import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1730000000000 implements MigrationInterface {
  name = 'InitialSchema1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create flags table
    await queryRunner.query(`
      CREATE TYPE "flag_type_enum" AS ENUM('boolean', 'percentage', 'multivariate')
    `);

    await queryRunner.query(`
      CREATE TABLE "flags" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "type" "flag_type_enum" NOT NULL DEFAULT 'boolean',
        "enabled" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "UQ_flag_key" UNIQUE ("key"),
        CONSTRAINT "PK_flags" PRIMARY KEY ("id")
      )
    `);

    // Create index on flag key for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_flag_key" ON "flags" ("key")
    `);

    // Create flag_environments table
    await queryRunner.query(`
      CREATE TYPE "environment_enum" AS ENUM('development', 'staging', 'production')
    `);

    await queryRunner.query(`
      CREATE TABLE "flag_environments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "flagId" uuid NOT NULL,
        "environment" "environment_enum" NOT NULL,
        "enabled" boolean NOT NULL DEFAULT false,
        "rolloutPercentage" integer,
        "targetingRules" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_flag_environments" PRIMARY KEY ("id")
      )
    `);

    // Create indexes on flag_environments
    await queryRunner.query(`
      CREATE INDEX "IDX_flag_environment_flagId" ON "flag_environments" ("flagId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_flag_environment_environment" ON "flag_environments" ("environment")
    `);

    // Add foreign key constraint with cascade delete
    await queryRunner.query(`
      ALTER TABLE "flag_environments"
      ADD CONSTRAINT "FK_flag_environments_flag"
      FOREIGN KEY ("flagId")
      REFERENCES "flags"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "flag_environments"
      DROP CONSTRAINT "FK_flag_environments_flag"
    `);

    // Drop indexes on flag_environments
    await queryRunner.query(`
      DROP INDEX "IDX_flag_environment_environment"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_flag_environment_flagId"
    `);

    // Drop flag_environments table
    await queryRunner.query(`
      DROP TABLE "flag_environments"
    `);

    await queryRunner.query(`
      DROP TYPE "environment_enum"
    `);

    // Drop index on flags
    await queryRunner.query(`
      DROP INDEX "IDX_flag_key"
    `);

    // Drop flags table
    await queryRunner.query(`
      DROP TABLE "flags"
    `);

    await queryRunner.query(`
      DROP TYPE "flag_type_enum"
    `);
  }
}
