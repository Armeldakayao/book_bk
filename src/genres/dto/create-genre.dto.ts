import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateGenreDto {
  @ApiProperty({ example: 'Science Fiction' })
  @IsString()
  @IsNotEmpty({ message: 'Genre name is required' })
  name: string;
}
