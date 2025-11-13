import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Flag } from './flag.entity';

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export interface TargetingRule {
  attribute: string;
  operator: 'equals' | 'contains' | 'in' | 'greaterThan' | 'lessThan';
  value: string | string[] | number;
}

@Entity('flag_environments')
export class FlagEnvironment {
  @ApiProperty({
    description: 'Unique identifier for the flag environment configuration',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'The flag this environment configuration belongs to',
    type: () => Flag,
  })
  @ManyToOne(() => Flag, (flag) => flag.environments, { onDelete: 'CASCADE' })
  flag!: Flag;

  @ApiProperty({
    description: 'The ID of the flag this environment configuration belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column()
  @Index()
  flagId!: string;

  @ApiProperty({
    description: 'The environment for this flag configuration',
    enum: Environment,
    example: Environment.PRODUCTION,
  })
  @Column({
    type: 'enum',
    enum: Environment,
  })
  @Index()
  environment!: Environment;

  @ApiProperty({
    description: 'Whether the flag is enabled in this environment',
    example: true,
  })
  @Column({ default: false })
  enabled!: boolean;

  @ApiProperty({
    description: 'Percentage rollout (0-100) for gradual feature releases',
    example: 50,
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  rolloutPercentage!: number;

  @ApiProperty({
    description: 'Targeting rules for conditional flag evaluation',
    example: [
      {
        attribute: 'userId',
        operator: 'equals',
        value: 'user123',
      },
    ],
    nullable: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  targetingRules!: TargetingRule[];

  @ApiProperty({
    description: 'Timestamp when the environment configuration was created',
    example: '2024-01-11T10:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp when the environment configuration was last updated',
    example: '2024-01-11T12:00:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt!: Date;
}
