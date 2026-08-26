import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class ImportByExternalIdDto {
  @ApiProperty({
    example: '/works/OL82563W',
    description: 'Open Library key or Google Books volume ID',
  })
  @IsString()
  @IsNotEmpty({ message: 'External source ID is required' })
  externalSourceId: string;

  @ApiProperty({
    example: 'open_library',
    enum: ['open_library', 'google_books'],
  })
  @IsString()
  @IsNotEmpty({ message: 'External source is required' })
  externalSource: 'open_library' | 'google_books';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  genreId?: string;
}
