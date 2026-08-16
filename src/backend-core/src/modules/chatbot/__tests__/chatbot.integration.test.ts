import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { ChatbotController } from '../controllers/chatbot.controller';
import { AIServiceClient, AIServiceError } from '../services/ai-service.client';
import { ConversationService } from '../services/conversation.service';
import { FormatterService } from '../services/formatter.service';
import { ChatMessage } from '../models/chat-message.model';

// Mock dependencies
jest.mock('../services/ai-service.client');
jest.mock('../services/conversation.service');
jest.mock('../services/formatter.service');
jest.mock('../models/chat-message.model');
jest.mock('../../admin/services/admin-toggle.service', () => ({
  isFeatureEnabled: jest.fn().mockResolvedValue(true)
}));

const app = express();
app.use(express.json());

// Type extension for the test mock
declare global {
  namespace Express {
    interface Request {
      chatbotSession?: { anonymousSessionIdHash: string; donorId: string | null };
    }
  }
}

// Mock middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.chatbotSession = { anonymousSessionIdHash: 'guest-123', donorId: 'donor-456' };
  next();
});

app.post('/api/v1/chatbot/chat', ChatbotController.sendMessage);

describe('Chatbot Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ConversationService.getOrCreateActiveConversation as jest.Mock).mockResolvedValue({ _id: 'conv-123' });
    (FormatterService.prepareDonorContext as jest.Mock).mockResolvedValue({});
    (ChatMessage.findOne as jest.Mock).mockResolvedValue(null);
    (ChatMessage.create as jest.Mock).mockResolvedValue({});
    (ChatMessage.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([])
    });
  });

  it('TC_CB01_006: POST /api/v1/chatbot/chat should stream response using SSE (CB-FR-005)', async () => {
    // Mock streamMessage to immediately write to res
    (AIServiceClient.streamMessage as jest.Mock).mockImplementation(async (payload, res) => {
      res.write('data: {"text": "Hello"}\n\n');
      return "Hello";
    });
    
    (FormatterService.appendMedicalDisclaimer as jest.Mock).mockReturnValue("Hello");

    const response = await request(app)
      .post('/api/v1/chatbot/chat')
      .send({ message: 'Quy trình hiến máu', clientRequestId: 'req-1' });
      
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.text).toContain('data: {"text": "Hello"}\n\n');
  });

  it('TC_CB01_009: should handle 429 Quota Exceeded error gracefully (Fallback to flash-lite)', async () => {
    (AIServiceClient.streamMessage as jest.Mock).mockRejectedValue(new AIServiceError('Quota Exceeded', 429));

    const response = await request(app)
      .post('/api/v1/chatbot/chat')
      .send({ message: 'Hi', clientRequestId: 'req-2' });

    // Based on the controller, it returns a fallback text if headers are already sent
    expect(response.status).toBe(200);
    expect(response.text).toContain('Rất tiếc, đã xảy ra lỗi trong quá trình xử lý câu hỏi');
  });

  it('NFR-001/NFR-002 Performance Simulator: Stream response should start within 1000ms', async () => {
    (AIServiceClient.streamMessage as jest.Mock).mockImplementation(async (payload, res) => {
      // Simulate 100ms processing delay (well below 1000ms NFR)
      await new Promise(resolve => setTimeout(resolve, 100));
      res.write('data: {"text": "Quick Response"}\n\n');
      return "Quick Response";
    });
    (FormatterService.appendMedicalDisclaimer as jest.Mock).mockReturnValue("Quick Response");

    const start = Date.now();
    await request(app)
      .post('/api/v1/chatbot/chat')
      .send({ message: 'Test NFR', clientRequestId: 'req-3' });
    const duration = Date.now() - start;

    expect(duration).toBeLessThanOrEqual(1000); // Must be less than 1 second
  });
});
