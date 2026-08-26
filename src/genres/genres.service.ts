import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from '../entities/genre.entity.js';

@Injectable()
export class GenresService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
  ) {}

  async findAll() {
    return this.genreRepo.find({ order: { name: 'ASC' } });
  }

  async create(name: string) {
    const existing = await this.genreRepo.findOne({ where: { name } });
    if (existing) {
      throw new ConflictException('Genre already exists');
    }

    const genre = this.genreRepo.create({ name });
    return this.genreRepo.save(genre);
  }

  async findById(id: string) {
    const genre = await this.genreRepo.findOne({ where: { id } });
    if (!genre) {
      throw new NotFoundException('Genre not found');
    }
    return genre;
  }

  async update(id: string, name: string) {
    const genre = await this.genreRepo.findOne({ where: { id } });
    if (!genre) {
      throw new NotFoundException('Genre not found');
    }

    const existing = await this.genreRepo.findOne({ where: { name } });
    if (existing && existing.id !== id) {
      throw new ConflictException('Genre name already exists');
    }

    genre.name = name;
    return this.genreRepo.save(genre);
  }

  async remove(id: string) {
    const genre = await this.genreRepo.findOne({ where: { id } });
    if (!genre) {
      throw new NotFoundException('Genre not found');
    }

    await this.genreRepo.remove(genre);
    return { message: 'Genre deleted successfully' };
  }
}
