import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlagsController } from './flags.controller';
import { FlagsService } from './flags.service';
import { Flag } from './entities/flag.entity';
import { FlagEnvironment } from './entities/flag-environment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Flag, FlagEnvironment])],
  controllers: [FlagsController],
  providers: [FlagsService],
  exports: [FlagsService],
})
export class FlagsModule {}
