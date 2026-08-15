import { Schema, model, Document, Types } from 'mongoose';

export interface IChatMessage extends Document {
  conversationId: Types.ObjectId;
  clientRequestId: string;
  sender: 'User' | 'AI';
  contentText: string;
  richContent?: object;
  citations?: string[];
  confidenceScore?: number;
  sentAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'ChatConversation', required: true },
  clientRequestId: { type: String, required: true },
  sender: { type: String, enum: ['User', 'AI'], required: true },
  contentText: { type: String, required: true },
  richContent: { type: Schema.Types.Mixed },
  citations: [{ type: String }],
  confidenceScore: { type: Number },
  sentAt: { type: Date, default: Date.now }
});

// Compound unique index to guarantee idempotency
chatMessageSchema.index({ conversationId: 1, clientRequestId: 1 }, { unique: true });

export const ChatMessage = model<IChatMessage>('ChatMessage', chatMessageSchema);
