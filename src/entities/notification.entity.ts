import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity.js';

export enum NotificationType {
  WELCOME = 'WELCOME',
  BOOK_ADDED = 'BOOK_ADDED',
  BOOK_IMPORTED = 'BOOK_IMPORTED',
  BOOK_FINISHED = 'BOOK_FINISHED',
  SESSION_LOGGED = 'SESSION_LOGGED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
