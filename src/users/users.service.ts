import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private sanitizeUser(user: User) {
    const { password, refreshToken, otpCode, otpExpiresAt, resetPasswordToken, resetPasswordExpiresAt, ...result } = user;
    return result;
  }

  async findById(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(id: string, data: { firstName?: string; lastName?: string }) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;

    const saved = await this.userRepo.save(user);
    return this.sanitizeUser(saved);
  }

  async updateAvatar(id: string, file: Express.Multer.File) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.avatarUrl) {
      const oldPublicId = user.avatarUrl.split('/').slice(-2).join('/').split('.')[0];
      if (oldPublicId) {
        await this.cloudinaryService.deleteFile(oldPublicId);
      }
    }

    const { url } = await this.cloudinaryService.uploadImage(file, 'avatars');
    user.avatarUrl = url;
    const saved = await this.userRepo.save(user);
    return this.sanitizeUser(saved);
  }

  async removeAvatar(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.avatarUrl) {
      const oldPublicId = user.avatarUrl.split('/').slice(-2).join('/').split('.')[0];
      if (oldPublicId) {
        await this.cloudinaryService.deleteFile(oldPublicId);
      }
      user.avatarUrl = null;
      const saved = await this.userRepo.save(user);
      return this.sanitizeUser(saved);
    }

    return this.sanitizeUser(user);
  }
}
