import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadingSessionsController } from './reading-sessions.controller.js';
import { ReadingSessionsService } from './reading-sessions.service.js';
import { ReadingSession } from '../entities/reading-session.entity.js';
import { Book } from '../entities/book.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { BooksModule } from '../books/books.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReadingSession, Book]),
    NotificationsModule,
    BooksModule,
  ],
  controllers: [ReadingSessionsController],
  providers: [ReadingSessionsService],
  exports: [ReadingSessionsService],
})
export class ReadingSessionsModule {}
