import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, Max } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ example: 10 })
  @IsInt()
  @IsPositive({ message: 'Pages read must be a positive number' })
  pagesRead: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  startPage: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @IsPositive()
  endPage: number;
}
