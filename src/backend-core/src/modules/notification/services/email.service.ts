import { sendEmailViaBrevo } from '../../../utils/email.util';
import { env } from '../../../config/env.config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

class EmailServiceImpl {
  async send(options: EmailOptions): Promise<boolean> {
    try {
      // The sendEmailViaBrevo function requires html content
      // If we only have text, we wrap it in a basic HTML structure
      const htmlContent = options.html || `<p>${options.text}</p>`;
      
      return await sendEmailViaBrevo(options.to, options.subject, htmlContent);
    } catch (error) {
      console.error('Email send error via Brevo:', error);
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    // Since Brevo API uses HTTP requests, we just check if the API key is configured
    if (env.BREVO_API_KEY && env.BREVO_API_KEY.length > 0) {
      return true;
    }
    return false;
  }
}

export const EmailService = new EmailServiceImpl();
