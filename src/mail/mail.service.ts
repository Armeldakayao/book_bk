import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey: string;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('mail.apiKey') ?? '';
    this.from = this.configService.get<string>('mail.from') ?? 'BiblioTrack <no-reply@bibliotrack.app>';

    this.logger.log(`[MailService] Initializing Elastic Email client`);
    this.logger.log(`[MailService] ELASTICEMAIL_API_KEY: ${this.apiKey ? '***set***' : '***EMPTY***'}`);
    this.logger.log(`[MailService] EMAIL_FROM: ${this.from}`);

    if (!this.apiKey) {
      this.logger.error(`[MailService] Missing ELASTICEMAIL_API_KEY! Check your environment variables.`);
    }
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const url = 'https://api.elasticemail.com/v4/emails/transactional';

    const body = {
      Recipients: { To: [to] },
      Content: {
        Body: [{ ContentType: 'HTML', Content: html }],
        From: this.from,
        Subject: subject,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ElasticEmail-ApiKey': this.apiKey,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Elastic Email API error: ${JSON.stringify(result)}`);
    }

    this.logger.log(`[MailService] Email sent successfully. Response: ${JSON.stringify(result)}`);
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
      await this.sendEmail(to, 'Your verification code - BiblioTrack', html);
      this.logger.log(`[MailService] OTP email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`[MailService] Failed to send OTP email to ${to}`);
      this.logger.error(`[MailService] Error name: ${error.name}`);
      this.logger.error(`[MailService] Error message: ${error.message}`);
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
      await this.sendEmail(to, 'Welcome to BiblioTrack!', html);
      this.logger.log(`[MailService] Welcome email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`[MailService] Failed to send welcome email to ${to}`);
      this.logger.error(`[MailService] Error name: ${error.name}`);
      this.logger.error(`[MailService] Error message: ${error.message}`);
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
      await this.sendEmail(to, title, html);
      this.logger.log(`[MailService] Activity email sent successfully to ${to}: ${title}`);
    } catch (error) {
      this.logger.error(`[MailService] Failed to send activity email to ${to}: ${title}`);
      this.logger.error(`[MailService] Error name: ${error.name}`);
      this.logger.error(`[MailService] Error message: ${error.message}`);
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
      await this.sendEmail(to, 'Reset Your Password - BiblioTrack', html);
      this.logger.log(`[MailService] Reset password email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`[MailService] Failed to send reset password email to ${to}`);
      this.logger.error(`[MailService] Error name: ${error.name}`);
      this.logger.error(`[MailService] Error message: ${error.message}`);
    }
  }
}
