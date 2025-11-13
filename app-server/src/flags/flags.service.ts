import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flag } from './entities/flag.entity';
import { FlagEnvironment, Environment } from './entities/flag-environment.entity';
import { CreateFlagDto } from './dto/create-flag.dto';
import { UpdateFlagDto } from './dto/update-flag.dto';
import { ToggleFlagDto } from './dto/toggle-flag.dto';
import { PaginationDto, PaginatedResult } from './dto/pagination.dto';
import {
  DuplicateFlagKeyException,
  FlagNotFoundException,
} from '../common/exceptions';

@Injectable()
export class FlagsService {
  constructor(
    @InjectRepository(Flag)
    private readonly flagsRepository: Repository<Flag>,
    @InjectRepository(FlagEnvironment)
    private readonly flagEnvRepository: Repository<FlagEnvironment>,
  ) {}

  async create(createFlagDto: CreateFlagDto): Promise<Flag> {
    // Check for duplicate key
    const existingFlag = await this.flagsRepository.findOne({
      where: { key: createFlagDto.key },
    });

    if (existingFlag) {
      throw new DuplicateFlagKeyException(createFlagDto.key);
    }

    // Create flag with environments
    const flag = this.flagsRepository.create({
      key: createFlagDto.key,
      name: createFlagDto.name,
      description: createFlagDto.description,
      type: createFlagDto.type,
      enabled: createFlagDto.enabled ?? false,
      environments: createFlagDto.environments.map((env) => ({
        environment: env.environment,
        enabled: env.enabled ?? false,
        rolloutPercentage: env.rolloutPercentage,
        targetingRules: env.targetingRules,
      })),
    });

    return await this.flagsRepository.save(flag);
  }

  async findAll(): Promise<Flag[]> {
    return await this.flagsRepository.find({
      relations: ['environments'],
    });
  }

  async findAllPaginated(paginationDto: PaginationDto): Promise<PaginatedResult<Flag>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Get total count
    const total = await this.flagsRepository.count();

    // Get paginated results with optimized select
    const flags = await this.flagsRepository.find({
      relations: ['environments'],
      skip,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: flags,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Flag> {
    const flag = await this.flagsRepository.findOne({
      where: { id },
      relations: ['environments'],
    });

    if (!flag) {
      throw new FlagNotFoundException(id);
    }

    return flag;
  }

  async findByKey(key: string): Promise<Flag | null> {
    return await this.flagsRepository.findOne({
      where: { key },
      relations: ['environments'],
    });
  }

  async update(id: string, updateFlagDto: UpdateFlagDto): Promise<Flag> {
    const flag = await this.findOne(id);

    // Update only provided fields
    if (updateFlagDto.name !== undefined) {
      flag.name = updateFlagDto.name;
    }
    if (updateFlagDto.description !== undefined) {
      flag.description = updateFlagDto.description;
    }
    if (updateFlagDto.enabled !== undefined) {
      flag.enabled = updateFlagDto.enabled;
    }

    return await this.flagsRepository.save(flag);
  }

  async remove(id: string): Promise<void> {
    const flag = await this.findOne(id);
    await this.flagsRepository.softDelete(flag.id);
  }

  async toggleEnvironment(
    id: string,
    environment: Environment,
    toggleDto: ToggleFlagDto,
  ): Promise<FlagEnvironment> {
    const flag = await this.findOne(id);

    // Find the environment configuration
    const flagEnv = flag.environments.find(
      (env) => env.environment === environment,
    );

    if (!flagEnv) {
      throw new NotFoundException(
        `Environment '${environment}' not found for flag with ID '${id}'`,
      );
    }

    // Update the environment configuration
    flagEnv.enabled = toggleDto.enabled;
    if (toggleDto.rolloutPercentage !== undefined) {
      flagEnv.rolloutPercentage = toggleDto.rolloutPercentage;
    }

    return await this.flagEnvRepository.save(flagEnv);
  }
}
