import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller.js';
import { StatsService } from './stats.service.js';
import { Book } from '../entities/book.entity.js';
import { ReadingSession } from '../entities/reading-session.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Book, ReadingSession])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
