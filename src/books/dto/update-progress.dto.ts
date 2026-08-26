import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class UpdateProgressDto {
  @ApiProperty({ example: 42 })
  @IsInt()
  @IsPositive({ message: 'Current page must be a positive number' })
  currentPage: number;
}
