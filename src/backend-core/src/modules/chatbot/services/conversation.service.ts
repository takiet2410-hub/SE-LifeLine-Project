import { ChatConversation, IChatConversation } from '../models/chat-conversation.model';
import { Types } from 'mongoose';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export class ConversationService {
  /**
   * Retrieves the active conversation or creates a new one.
   * Also lazily times out old conversations if they exceed 30 mins of inactivity.
   */
  public static async getOrCreateActiveConversation(
    anonymousSessionIdHash: string,
    donorId: string | null
  ): Promise<IChatConversation> {
    const now = new Date();

    if (donorId && Types.ObjectId.isValid(donorId)) {
      const userObjectId = new Types.ObjectId(donorId);

      // 1. Check if user already has an active conversation
      let activeConversation = await ChatConversation.findOne({
        donorId: userObjectId,
        status: 'Active'
      });

      if (activeConversation) {
        const timeSinceLastActivity = now.getTime() - activeConversation.lastActivityAt.getTime();

        if (timeSinceLastActivity > TIMEOUT_MS) {
          activeConversation.status = 'TimedOut';
          await activeConversation.save();
          activeConversation = null;
        } else {
          activeConversation.lastActivityAt = now;
          await activeConversation.save();
          return activeConversation;
        }
      }

      // 2. Strictly create a fresh active conversation for this user (NO merging/adopting anonymous session)
      activeConversation = await ChatConversation.create({
        donorId: userObjectId,
        startedAt: now,
        lastActivityAt: now,
        status: 'Active'
      });

      return activeConversation;
    } else {
      // Anonymous user flow strictly isolated
      let activeConversation = await ChatConversation.findOne({
        anonymousSessionIdHash,
        donorId: null,
        status: 'Active'
      });

      if (activeConversation) {
        const timeSinceLastActivity = now.getTime() - activeConversation.lastActivityAt.getTime();

        if (timeSinceLastActivity > TIMEOUT_MS) {
          activeConversation.status = 'TimedOut';
          await activeConversation.save();
          activeConversation = null;
        } else {
          activeConversation.lastActivityAt = now;
          await activeConversation.save();
          return activeConversation;
        }
      }

      activeConversation = await ChatConversation.create({
        donorId: null,
        anonymousSessionIdHash,
        startedAt: now,
        lastActivityAt: now,
        status: 'Active'
      });

      return activeConversation;
    }
  }

  /**
   * Used when we just want to fetch history, without updating the activity timestamp.
   * If an active conversation is older than timeout, it will be marked TimedOut.
   */
  public static async getConversationHistory(
    anonymousSessionIdHash: string,
    donorId: string | null,
    limit: number = 50,
    offset: number = 0
  ) {
    const query: any = {};
    if (donorId && Types.ObjectId.isValid(donorId)) {
      query.donorId = new Types.ObjectId(donorId);
    } else {
      query.anonymousSessionIdHash = anonymousSessionIdHash;
      query.donorId = null;
    }

    // Process timeouts before returning history
    const activeConv = await ChatConversation.findOne({ ...query, status: 'Active' });
    if (activeConv) {
      const now = new Date();
      if (now.getTime() - activeConv.lastActivityAt.getTime() > TIMEOUT_MS) {
        activeConv.status = 'TimedOut';
        await activeConv.save();
      }
    }

    const conversations = await ChatConversation.find(query).sort({ startedAt: -1 });
    return conversations;
  }
}
