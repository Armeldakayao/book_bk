import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ReadingSessionsService } from './reading-sessions.service.js';
import { CreateSessionDto } from './dto/create-session.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator.js';

@ApiTags('Reading Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ReadingSessionsController {
  constructor(private readonly sessionsService: ReadingSessionsService) {}

  @Get('books/:bookId/sessions')
  @ApiOperation({ summary: 'List reading sessions for a book' })
  @ApiResponse({ status: 200, description: 'Sessions listed' })
  findByBook(
    @Param('bookId', ParseUUIDPipe) bookId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sessionsService.findByBookId(bookId, user.userId);
  }

  @Post('books/:bookId/sessions')
  @ApiOperation({ summary: 'Log a reading session' })
  @ApiResponse({ status: 201, description: 'Session created' })
  create(
    @Param('bookId', ParseUUIDPipe) bookId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSessionDto,
  ) {
    return this.sessionsService.create(bookId, user.userId, dto);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete a reading session' })
  @ApiResponse({ status: 200, description: 'Session deleted' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sessionsService.remove(id, user.userId);
  }
}
