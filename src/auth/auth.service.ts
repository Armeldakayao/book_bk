import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity.js';
import { MailService } from '../mail/mail.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { NotificationType } from '../entities/notification.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateSixDigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.accessSecret'),
        expiresIn: this.configService.get('jwt.accessExpiration'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiration'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const otpCode = this.generateSixDigitCode();

    const user = this.userRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
      otpCode,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await this.userRepo.save(user);
    await this.mailService.sendOtpEmail(user.email, otpCode);

    return {
      message:
        'Account created. Please verify your email with the code we sent you.',
    };
  }

  async verifyOtp(email: string, code: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    if (user.otpCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      throw new BadRequestException('Verification code has expired');
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await this.userRepo.save(user);

    await this.mailService.sendWelcomeEmail(user.email, user.firstName);
    await this.notificationsService.create(
      user.id,
      NotificationType.WELCOME,
      'Welcome to BiblioTrack!',
      `Hi ${user.firstName}, your account has been verified successfully.`,
    );

    return { message: 'Email verified successfully' };
  }

  async resendOtp(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const otpCode = this.generateSixDigitCode();
    user.otpCode = otpCode;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.userRepo.save(user);

    await this.mailService.sendOtpEmail(user.email, otpCode);

    return { message: 'A new verification code has been sent to your email' };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const tokens = await this.generateTokens(user);

    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 12);
    user.refreshToken = hashedRefreshToken;
    await this.userRepo.save(user);

    return {
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        ...tokens,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const user = await this.userRepo.findOne({
        where: { id: payload.sub },
      });
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Access denied');
      }

      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );
      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Access denied');
      }

      const tokens = await this.generateTokens(user);

      const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 12);
      user.refreshToken = hashedRefreshToken;
      await this.userRepo.save(user);

      return {
        message: 'Tokens refreshed successfully',
        data: tokens,
      };
    } catch {
      throw new UnauthorizedException('Access denied');
    }
  }

  async forgotPassword(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a reset code has been sent' };
    }

    const resetCode = this.generateSixDigitCode();
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.userRepo.save(user);

    await this.mailService.sendResetPasswordEmail(user.email, resetCode);

    return {
      message: 'If the email exists, a reset code has been sent',
    };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      user.resetPasswordToken !== code ||
      (user.resetPasswordExpiresAt && user.resetPasswordExpiresAt < new Date())
    ) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;
    user.refreshToken = null;
    await this.userRepo.save(user);

    await this.notificationsService.create(
      user.id,
      NotificationType.PASSWORD_CHANGED,
      'Password Changed',
      'Your password has been changed successfully.',
    );

    return { message: 'Password reset successfully' };
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.refreshToken = null;
    await this.userRepo.save(user);

    await this.mailService.sendActivityEmail(
      user.email,
      'Password Changed',
      'Your password has been changed successfully. If you did not make this change, please contact support immediately.',
    );

    await this.notificationsService.create(
      user.id,
      NotificationType.PASSWORD_CHANGED,
      'Password Changed',
      'Your password has been changed successfully.',
    );

    return { message: 'Password updated successfully' };
  }
}
