import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StatsService } from './stats.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator.js';

@ApiTags('Stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get reading statistics overview' })
  @ApiResponse({ status: 200, description: 'Stats overview' })
  getOverview(@CurrentUser() user: JwtPayload) {
    return this.statsService.getOverview(user.userId);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get reading progress over time' })
  @ApiResponse({ status: 200, description: 'Progress chart data' })
  getProgress(@CurrentUser() user: JwtPayload) {
    return this.statsService.getProgress(user.userId);
  }
}
