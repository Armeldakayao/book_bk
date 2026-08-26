import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsEnum, IsUUID } from 'class-validator';
import { BookStatus } from '../../entities/book.entity.js';

export class UpdateBookDto {
  @ApiPropertyOptional({ example: 'The Great Gatsby' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'F. Scott Fitzgerald' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ example: 'A novel about the American dream...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ example: 180 })
  @IsOptional()
  @IsInt()
  totalPages?: number;

  @ApiPropertyOptional({ example: '9780743273565' })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiPropertyOptional({ example: 'Scribner' })
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional({ example: 1925 })
  @IsOptional()
  @IsInt()
  publishedYear?: number;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  genreId?: string;

  @ApiPropertyOptional({ enum: BookStatus })
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;
}
