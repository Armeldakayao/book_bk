import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get('smtp.host');
    const port = this.configService.get('smtp.port');
    const user = this.configService.get('smtp.user');
    const pass = this.configService.get('smtp.pass');

    this.logger.log(`[MailService] Initializing transporter`);
    this.logger.log(`[MailService] SMTP_HOST: ${host}`);
    this.logger.log(`[MailService] SMTP_PORT: ${port}`);
    this.logger.log(`[MailService] SMTP_USER: ${user}`);
    this.logger.log(`[MailService] SMTP_PASS: ${pass ? '***set***' : '***EMPTY***'}`);
    this.logger.log(`[MailService] SMTP_FROM: ${this.configService.get('smtp.from')}`);

    if (!host || !user || !pass) {
      this.logger.error(`[MailService] Missing SMTP configuration! Check your environment variables.`);
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      family: 4,
      auth: {
        user,
        pass,
      },
      logger: true,
      debug: true,
    } as any);

    this.logger.log(`[MailService] Transporter created, verifying connection...`);

    this.transporter.verify()
      .then(() => this.logger.log(`[MailService] SMTP connection verified successfully`))
      .catch((error) => this.logger.error(`[MailService] SMTP connection verification failed`, error));
  }

  private get from(): string {
    return this.configService.get<string>('smtp.from') ?? 'BiblioTrack <no-reply@bibliotrack.app>';
  }

  async sendOtpEmail(to: string, code: string): Promise<void> {
    this.logger.log(`[MailService] Sending OTP email to ${to}`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p>Thank you for signing up for BiblioTrack. Please use the following code to verify your email address:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${code}</span>
        </div>
        <p style="color: #666;">This code will expire in 10 minutes.</p>
        <p style="color: #999; font-size: 12px;">If you did not create an account, please ignore this email.</p>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject: 'Your verification code - BiblioTrack',
        html,
      });
      this.logger.log(`[MailService] OTP email sent successfully to ${to}`);
      this.logger.log(`[MailService] Message ID: ${info.messageId}`);
      this.logger.log(`[MailService] Response: ${info.response}`);
    } catch (error) {
      this.logger.error(`[MailService] Failed to send OTP email to ${to}`);
      this.logger.error(`[MailService] Error name: ${error.name}`);
      this.logger.error(`[MailService] Error message: ${error.message}`);
      this.logger.error(`[MailService] Error code: ${error.code}`);
      if (error.command) this.logger.error(`[MailService] Error command: ${error.command}`);
      if (error.syscall) this.logger.error(`[MailService] Error syscall: ${error.syscall}`);
      if (error.address) this.logger.error(`[MailService] Error address: ${error.address}`);
      if (error.port) this.logger.error(`[MailService] Error port: ${error.port}`);
      this.logger.error(`[MailService] Full error:`, error);
    }
  }

  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    this.logger.log(`[MailService] Sending welcome email to ${to}`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to BiblioTrack, ${firstName}!</h2>
        <p>Your account has been verified successfully.</p>
        <p>BiblioTrack is your personal book library. You can:</p>
        <ul>
          <li>Add books manually or import them from Open Library</li>
          <li>Track your reading progress</li>
          <li>Get insights on your reading habits</li>
        </ul>
        <p>Start by adding your first book!</p>
        <p style="color: #999; font-size: 12px;">Happy reading!</p>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject: 'Welcome to BiblioTrack!',
        html,
      });
      this.logger.log(`[MailService] Welcome email sent successfully to ${to}`);
      this.logger.log(`[MailService] Message ID: ${info.messageId}`);
      this.logger.log(`[MailService] Response: ${info.response}`);
    } catch (error) {
      this.logger.error(`[MailService] Failed to send welcome email to ${to}`);
      this.logger.error(`[MailService] Error name: ${error.name}`);
      this.logger.error(`[MailService] Error message: ${error.message}`);
      this.logger.error(`[MailService] Error code: ${error.code}`);
      if (error.command) this.logger.error(`[MailService] Error command: ${error.command}`);
      if (error.syscall) this.logger.error(`[MailService] Error syscall: ${error.syscall}`);
      if (error.address) this.logger.error(`[MailService] Error address: ${error.address}`);
      if (error.port) this.logger.error(`[MailService] Error port: ${error.port}`);
      this.logger.error(`[MailService] Full error:`, error);
    }
  }

  async sendActivityEmail(
    to: string,
    title: string,
    message: string,
  ): Promise<void> {
    this.logger.log(`[MailService] Sending activity email to ${to}: ${title}`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${title}</h2>
        <p>${message}</p>
        <p style="color: #999; font-size: 12px;">- The BiblioTrack Team</p>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject: title,
        html,
      });
      this.logger.log(`[MailService] Activity email sent successfully to ${to}: ${title}`);
      this.logger.log(`[MailService] Message ID: ${info.messageId}`);
      this.logger.log(`[MailService] Response: ${info.response}`);
    } catch (error) {
      this.logger.error(`[MailService] Failed to send activity email to ${to}: ${title}`);
      this.logger.error(`[MailService] Error name: ${error.name}`);
      this.logger.error(`[MailService] Error message: ${error.message}`);
      this.logger.error(`[MailService] Error code: ${error.code}`);
      if (error.command) this.logger.error(`[MailService] Error command: ${error.command}`);
      if (error.syscall) this.logger.error(`[MailService] Error syscall: ${error.syscall}`);
      if (error.address) this.logger.error(`[MailService] Error address: ${error.address}`);
      if (error.port) this.logger.error(`[MailService] Error port: ${error.port}`);
      this.logger.error(`[MailService] Full error:`, error);
    }
  }

  async sendResetPasswordEmail(
    to: string,
    resetCode: string,
  ): Promise<void> {
    this.logger.log(`[MailService] Sending reset password email to ${to}`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>You requested a password reset. Use the following code to reset your password:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${resetCode}</span>
        </div>
        <p style="color: #666;">This code will expire in 15 minutes.</p>
        <p style="color: #999; font-size: 12px;">If you did not request a password reset, please ignore this email.</p>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject: 'Reset Your Password - BiblioTrack',
        html,
      });
      this.logger.log(`[MailService] Reset password email sent successfully to ${to}`);
      this.logger.log(`[MailService] Message ID: ${info.messageId}`);
      this.logger.log(`[MailService] Response: ${info.response}`);
    } catch (error) {
      this.logger.error(`[MailService] Failed to send reset password email to ${to}`);
      this.logger.error(`[MailService] Error name: ${error.name}`);
      this.logger.error(`[MailService] Error message: ${error.message}`);
      this.logger.error(`[MailService] Error code: ${error.code}`);
      if (error.command) this.logger.error(`[MailService] Error command: ${error.command}`);
      if (error.syscall) this.logger.error(`[MailService] Error syscall: ${error.syscall}`);
      if (error.address) this.logger.error(`[MailService] Error address: ${error.address}`);
      if (error.port) this.logger.error(`[MailService] Error port: ${error.port}`);
      this.logger.error(`[MailService] Full error:`, error);
    }
  }
}
