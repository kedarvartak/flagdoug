import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { FlagEnvironment } from './flag-environment.entity';

export enum FlagType {
  BOOLEAN = 'boolean',
  PERCENTAGE = 'percentage',
  MULTIVARIATE = 'multivariate',
}

@Entity('flags')
export class Flag {
  @ApiProperty({
    description: 'Unique identifier for the flag',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Unique key for the flag (lowercase letters, numbers, and underscores only)',
    example: 'new_feature_toggle',
  })
  @Column({ unique: true })
  @Index()
  key!: string;

  @ApiProperty({
    description: 'Human-readable name for the flag',
    example: 'New Feature Toggle',
  })
  @Column()
  name!: string;

  @ApiProperty({
    description: 'Detailed description of what this flag controls',
    example: 'Enables the new dashboard feature for users',
    nullable: true,
  })
  @Column({ nullable: true })
  description!: string;

  @ApiProperty({
    description: 'Type of flag',
    enum: FlagType,
    example: FlagType.BOOLEAN,
  })
  @Column({
    type: 'enum',
    enum: FlagType,
    default: FlagType.BOOLEAN,
  })
  type!: FlagType;

  @ApiProperty({
    description: 'Global enabled state for the flag',
    example: false,
  })
  @Column({ default: false })
  enabled!: boolean;

  @ApiProperty({
    description: 'Environment-specific configurations for this flag',
    type: () => [FlagEnvironment],
  })
  @OneToMany(() => FlagEnvironment, (env) => env.flag, { cascade: true })
  environments!: FlagEnvironment[];

  @ApiProperty({
    description: 'Timestamp when the flag was created',
    example: '2024-01-11T10:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp when the flag was last updated',
    example: '2024-01-11T12:00:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt!: Date;

  @ApiProperty({
    description: 'Timestamp when the flag was soft deleted',
    example: null,
    nullable: true,
  })
  @DeleteDateColumn()
  deletedAt!: Date;
}
