import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { BooksController } from './books.controller.js';
import { BooksService } from './books.service.js';
import { Book } from '../entities/book.entity.js';
import { ReadingSession } from '../entities/reading-session.entity.js';
import { GenresModule } from '../genres/genres.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, ReadingSession]),
    HttpModule.register({ timeout: 10000 }),
    GenresModule,
    NotificationsModule,
    CloudinaryModule,
  ],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
