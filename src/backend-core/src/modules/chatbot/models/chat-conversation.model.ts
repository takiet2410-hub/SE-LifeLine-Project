import { Schema, model, Document, Types } from 'mongoose';

export interface IChatConversation extends Document {
  donorId?: Types.ObjectId | null;
  anonymousSessionIdHash?: string;
  startedAt: Date;
  lastActivityAt: Date;
  status: 'Active' | 'TimedOut' | 'Closed';
}

const chatConversationSchema = new Schema<IChatConversation>({
  donorId: { type: Schema.Types.ObjectId, ref: 'DonorProfile', default: null },
  anonymousSessionIdHash: { type: String, default: null },
  startedAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['Active', 'TimedOut', 'Closed'],
    default: 'Active',
    required: true
  }
});

// Partial unique index for anonymous sessions to ensure only one Active session per browser
chatConversationSchema.index(
  { anonymousSessionIdHash: 1 },
  { unique: true, partialFilterExpression: { status: 'Active', anonymousSessionIdHash: { $type: 'string' } } }
);

export const ChatConversation = model<IChatConversation>('ChatConversation', chatConversationSchema);
