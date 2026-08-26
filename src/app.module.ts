import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { GenresModule } from './genres/genres.module.js';
import { BooksModule } from './books/books.module.js';
import { ReadingSessionsModule } from './reading-sessions/reading-sessions.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { StatsModule } from './stats/stats.module.js';
import { MailModule } from './mail/mail.module.js';
import { User } from './entities/user.entity.js';
import { Genre } from './entities/genre.entity.js';
import { Book } from './entities/book.entity.js';
import { ReadingSession } from './entities/reading-session.entity.js';
import { Notification } from './entities/notification.entity.js';
import configuration from './config/configuration.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.name'),
        entities: [User, Genre, Book, ReadingSession, Notification],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    GenresModule,
    BooksModule,
    ReadingSessionsModule,
    NotificationsModule,
    StatsModule,
    MailModule,
  ],
})
export class AppModule {}
