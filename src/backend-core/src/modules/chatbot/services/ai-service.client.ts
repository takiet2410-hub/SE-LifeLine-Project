import jwt from 'jsonwebtoken';
import { env } from '../../../config/env.config';

interface AIRequestPayload {
  message: string;
  donorContext?: any;
  history?: any[];
  conversationId: string;
  clientRequestId: string;
}

export class AIServiceError extends Error {
  constructor(message: string, public readonly statusCode: number = 503) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class AIServiceClient {
  private static generateToken(): string {
    const payload = {
      iss: 'lifeline-gateway',
      sub: 'ai-service',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60, // 1 minute expiration for tight security
    };

    return jwt.sign(payload, env.AI_SERVICE_TOKEN_SECRET_CURRENT, {
      algorithm: 'HS256',
      keyid: env.AI_SERVICE_TOKEN_KID,
    });
  }

  public static async sendMessage(payload: AIRequestPayload): Promise<any> {
    try {
      const token = this.generateToken();
      const url = `${env.AI_SERVICE_URL}/api/v1/ai/chat`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.error(`AI Service HTTP error ${response.status}:`, errBody);
        throw new AIServiceError(`AI Service error: ${response.status} ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to communicate with AI Service:', error);
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError('Unable to reach the AI Service');
    }
  }

  public static async streamMessage(payload: AIRequestPayload, res: any): Promise<string> {
    try {
      const token = this.generateToken();
      const url = `${env.AI_SERVICE_URL}/api/v1/ai/chat`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new AIServiceError(`AI Service error: ${response.status}`, response.status);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      let fullText = "";
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        // The chunk is already in SSE format "data: {...}\n\n" from Python
        // Parse it to append to fullText
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.substring(6));
              if (parsed.text) fullText += parsed.text;
            } catch (e) {
              // ignore parse errors
            }
          }
        }
        
        // Pass the raw SSE chunk to the client
        res.write(chunk);
      }
      
      return fullText;
    } catch (error) {
      console.error('Failed to stream from AI Service:', error);
      throw error;
    }
  }
}
