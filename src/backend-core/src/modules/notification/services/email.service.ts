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
    if (!env.BREVO_API_KEY) return false;

    try {
      const response = await fetch('https://api.brevo.com/v3/senders', {
        headers: {
          Accept: 'application/json',
          'api-key': env.BREVO_API_KEY,
        },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return false;

      const data = await response.json() as { senders?: Array<{ email?: string; active?: boolean }> };
      return Boolean(data.senders?.some(sender =>
        sender.email?.toLowerCase() === env.SENDER_EMAIL.toLowerCase() && sender.active !== false
      ));
    } catch (error) {
      console.error('[EmailService] Brevo connection verification failed:', error);
      return false;
    }
  }
}

export const EmailService = new EmailServiceImpl();
