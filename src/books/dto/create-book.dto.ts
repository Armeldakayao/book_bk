import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, IsEnum, IsUUID } from 'class-validator';
import { BookStatus } from '../../entities/book.entity.js';

export class CreateBookDto {
  @ApiProperty({ example: 'The Great Gatsby' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiProperty({ example: 'F. Scott Fitzgerald' })
  @IsString()
  @IsNotEmpty({ message: 'Author is required' })
  author: string;

  @ApiPropertyOptional({ example: 'A novel about the American dream...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/book.pdf' })
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

  @ApiPropertyOptional({ example: 'uuid-of-genre' })
  @IsOptional()
  @IsUUID()
  genreId?: string;

  @ApiPropertyOptional({ enum: BookStatus, default: BookStatus.TO_READ })
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;
}
