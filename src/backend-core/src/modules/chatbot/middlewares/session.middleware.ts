import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface ChatbotSession {
  anonymousSessionIdHash: string;
  donorId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      chatbotSession?: ChatbotSession;
      user?: any; // To access authenticated user if any
    }
  }
}

export const chatbotSessionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  let anonymousSessionId = req.signedCookies['chatbot_session'];

  if (!anonymousSessionId) {
    anonymousSessionId = crypto.randomUUID();
    // Use true for secure in production
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('chatbot_session', anonymousSessionId, {
      httpOnly: true,
      secure: isProd,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      signed: true,
      sameSite: 'lax',
    });
  }

  const hash = crypto.createHash('sha256').update(anonymousSessionId).digest('hex');

  const donorId = req.user ? req.user.id : null;

  req.chatbotSession = {
    anonymousSessionIdHash: hash,
    donorId: donorId
  };

  next();
};
