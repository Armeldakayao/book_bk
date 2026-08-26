import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity.js';
import { Genre } from './genre.entity.js';
import { ReadingSession } from './reading-session.entity.js';

export enum BookStatus {
  TO_READ = 'TO_READ',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  coverUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  fileUrl: string | null;

  @Column({ type: 'int', nullable: true })
  totalPages: number | null;

  @Column({ type: 'varchar', nullable: true })
  isbn: string | null;

  @Column({ type: 'varchar', nullable: true })
  publisher: string | null;

  @Column({ type: 'int', nullable: true })
  publishedYear: number | null;

  @Column({ type: 'varchar', nullable: true })
  language: string | null;

  @Column({ type: 'varchar', nullable: true })
  externalSourceId: string | null;

  @Column({ type: 'varchar', nullable: true })
  externalSource: string | null;

  @Column({ type: 'varchar', nullable: true })
  readOnlineUrl: string | null;

  @Column({ type: 'enum', enum: BookStatus, default: BookStatus.TO_READ })
  status: BookStatus;

  @Column({ type: 'int', default: 0 })
  lastReadPage: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.books, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  genreId: string | null;

  @ManyToOne(() => Genre, (genre) => genre.books, { nullable: true })
  @JoinColumn({ name: 'genreId' })
  genre: Genre;

  @OneToMany(() => ReadingSession, (session) => session.book)
  sessions: ReadingSession[];
}
