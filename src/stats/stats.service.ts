import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book, BookStatus } from '../entities/book.entity.js';
import { ReadingSession } from '../entities/reading-session.entity.js';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(ReadingSession)
    private readonly sessionRepo: Repository<ReadingSession>,
  ) {}

  async getOverview(userId: string) {
    const totalBooks = await this.bookRepo.count({ where: { userId } });
    const booksFinished = await this.bookRepo.count({
      where: { userId, status: BookStatus.FINISHED },
    });
    const booksInProgress = await this.bookRepo.count({
      where: { userId, status: BookStatus.IN_PROGRESS },
    });
    const booksToRead = await this.bookRepo.count({
      where: { userId, status: BookStatus.TO_READ },
    });

    const result = await this.sessionRepo
      .createQueryBuilder('session')
      .select('SUM(session.pagesRead)', 'totalPagesRead')
      .innerJoin('session.book', 'book')
      .where('book.userId = :userId', { userId })
      .getRawOne();

    const totalPagesRead = parseInt(result?.totalPagesRead || '0', 10);

    const totalSessions = await this.sessionRepo
      .createQueryBuilder('session')
      .innerJoin('session.book', 'book')
      .where('book.userId = :userId', { userId })
      .getCount();

    return {
      data: {
        totalBooks,
        booksFinished,
        booksInProgress,
        booksToRead,
        totalPagesRead,
        totalSessions,
      },
    };
  }

  async getProgress(userId: string) {
    const sessions = await this.sessionRepo
      .createQueryBuilder('session')
      .select("DATE_TRUNC('day', session.readAt)", 'date')
      .addSelect('SUM(session.pagesRead)', 'pagesRead')
      .innerJoin('session.book', 'book')
      .where('book.userId = :userId', { userId })
      .groupBy("DATE_TRUNC('day', session.readAt)")
      .orderBy("DATE_TRUNC('day', session.readAt)", 'ASC')
      .getRawMany();

    return {
      data: sessions.map((s) => ({
        date: s.date,
        pagesRead: parseInt(s.pagesRead, 10),
      })),
    };
  }
}
