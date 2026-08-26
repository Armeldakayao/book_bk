import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Book } from './book.entity.js';

@Entity('reading_sessions')
export class ReadingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pagesRead: number;

  @Column()
  startPage: number;

  @Column()
  endPage: number;

  @CreateDateColumn()
  readAt: Date;

  @Column()
  bookId: string;

  @ManyToOne(() => Book, (book) => book.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book: Book;
}
