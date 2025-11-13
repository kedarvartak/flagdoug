import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FlagsService } from './flags.service';
import { CreateFlagDto } from './dto/create-flag.dto';
import { UpdateFlagDto } from './dto/update-flag.dto';
import { ToggleFlagDto } from './dto/toggle-flag.dto';
import { PaginationDto, PaginatedResult } from './dto/pagination.dto';
import { Flag } from './entities/flag.entity';
import { FlagEnvironment, Environment } from './entities/flag-environment.entity';

@Controller('api/flags')
@ApiTags('flags')
export class FlagsController {
  constructor(private readonly flagsService: FlagsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Create a new feature flag' })
  @ApiBody({ type: CreateFlagDto })
  @ApiResponse({
    status: 201,
    description: 'The flag has been successfully created.',
    type: Flag,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or validation error.',
  })
  @ApiResponse({
    status: 409,
    description: 'Flag with the given key already exists.',
  })
  async create(@Body() createFlagDto: CreateFlagDto): Promise<Flag> {
    return await this.flagsService.create(createFlagDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all feature flags with optional pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-indexed)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (max 100)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns feature flags with their environment configurations. If pagination params are provided, returns paginated results.',
  })
  async findAll(@Query() query: any): Promise<Flag[] | PaginatedResult<Flag>> {
    // If pagination parameters are provided, return paginated results
    if (query.page !== undefined || query.limit !== undefined) {
      // Manually validate and transform the pagination DTO
      const paginationDto = new PaginationDto();
      paginationDto.page = query.page ? parseInt(query.page, 10) : 1;
      paginationDto.limit = query.limit ? parseInt(query.limit, 10) : 10;
      
      // Validate the DTO
      const validationPipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });
      const validated = await validationPipe.transform(paginationDto, {
        type: 'query',
        metatype: PaginationDto,
      });
      
      return await this.flagsService.findAllPaginated(validated);
    }
    // Otherwise, return all flags (backward compatibility)
    return await this.flagsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a feature flag by ID' })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the flag',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the flag with all its details.',
    type: Flag,
  })
  @ApiResponse({
    status: 404,
    description: 'Flag not found.',
  })
  async findOne(@Param('id') id: string): Promise<Flag> {
    return await this.flagsService.findOne(id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Update a feature flag' })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the flag',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateFlagDto })
  @ApiResponse({
    status: 200,
    description: 'The flag has been successfully updated.',
    type: Flag,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or validation error.',
  })
  @ApiResponse({
    status: 404,
    description: 'Flag not found.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateFlagDto: UpdateFlagDto,
  ): Promise<Flag> {
    return await this.flagsService.update(id, updateFlagDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a feature flag' })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the flag',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'The flag has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Flag not found.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.flagsService.remove(id);
  }

  @Patch(':id/environments/:env')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  @ApiOperation({ summary: 'Toggle flag for a specific environment' })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the flag',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'env',
    description: 'The environment to toggle',
    enum: Environment,
    example: Environment.DEVELOPMENT,
  })
  @ApiBody({ type: ToggleFlagDto })
  @ApiResponse({
    status: 200,
    description: 'The flag environment has been successfully updated.',
    type: FlagEnvironment,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or validation error.',
  })
  @ApiResponse({
    status: 404,
    description: 'Flag or environment not found.',
  })
  async toggleEnvironment(
    @Param('id') id: string,
    @Param('env') env: string,
    @Body() toggleDto: ToggleFlagDto,
  ): Promise<FlagEnvironment> {
    // Validate environment enum
    if (!Object.values(Environment).includes(env as Environment)) {
      throw new BadRequestException(
        `env must be one of the following values: ${Object.values(Environment).join(', ')}`,
      );
    }
    return await this.flagsService.toggleEnvironment(id, env as Environment, toggleDto);
  }
}
