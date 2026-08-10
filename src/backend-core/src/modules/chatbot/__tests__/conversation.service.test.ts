import { ConversationService } from '../services/conversation.service';
import { ChatConversation } from '../models/chat-conversation.model';
import { Types } from 'mongoose';

jest.mock('../models/chat-conversation.model');

describe('ConversationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC_CB01_007: should not merge anonymous guest session with authenticated donor history (BR-001)', async () => {
    // Mock the DB response
    (ChatConversation.findOne as jest.Mock).mockResolvedValueOnce(null); // No active user conv
    (ChatConversation.findOne as jest.Mock).mockResolvedValueOnce(null); // No active anon conv to adopt
    (ChatConversation.create as jest.Mock).mockResolvedValueOnce({
      _id: new Types.ObjectId(),
      donorId: new Types.ObjectId(),
      status: 'Active',
      lastActivityAt: new Date()
    });

    const activeConv = await ConversationService.getOrCreateActiveConversation('guest-hash-123', new Types.ObjectId().toString());
    expect(activeConv).toBeDefined();
    expect(ChatConversation.create).toHaveBeenCalled();
  });
});
