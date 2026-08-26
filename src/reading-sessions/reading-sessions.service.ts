import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadingSession } from '../entities/reading-session.entity.js';
import { Book } from '../entities/book.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { NotificationType } from '../entities/notification.entity.js';

@Injectable()
export class ReadingSessionsService {
  constructor(
    @InjectRepository(ReadingSession)
    private readonly sessionRepo: Repository<ReadingSession>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findByBookId(bookId: string, userId: string) {
    const book = await this.bookRepo.findOne({ where: { id: bookId, userId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return this.sessionRepo.find({
      where: { bookId },
      order: { readAt: 'DESC' },
    });
  }

  async create(
    bookId: string,
    userId: string,
    data: { pagesRead: number; startPage: number; endPage: number },
  ) {
    const book = await this.bookRepo.findOne({ where: { id: bookId, userId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const session = this.sessionRepo.create({
      bookId,
      pagesRead: data.pagesRead,
      startPage: data.startPage,
      endPage: data.endPage,
    });

    const saved = await this.sessionRepo.save(session);

    await this.notificationsService.create(
      userId,
      NotificationType.SESSION_LOGGED,
      'Reading Session Logged',
      `You read ${data.pagesRead} pages of "${book.title}".`,
    );

    return { message: 'Session logged successfully', data: saved };
  }

  async remove(id: string, userId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id },
      relations: { book: true },
    });

    if (!session || session.book.userId !== userId) {
      throw new NotFoundException('Session not found');
    }

    await this.sessionRepo.remove(session);

    return { message: 'Session deleted successfully' };
  }
}
