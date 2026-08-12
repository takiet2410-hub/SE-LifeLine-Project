import { Request, Response } from 'express';
import { ChatMessage } from '../models/chat-message.model';
import { ConversationService } from '../services/conversation.service';
import { FormatterService } from '../services/formatter.service';
import { AIServiceClient, AIServiceError } from '../services/ai-service.client';
import { Types } from 'mongoose';

export class ChatbotController {
  
  public static async sendMessage(req: Request, res: Response) {
    try {
      const { message, clientRequestId } = req.body;
      const { anonymousSessionIdHash, donorId } = req.chatbotSession!;

      if (!message || !clientRequestId) {
        return res.status(400).json({ error: 'Message and clientRequestId are required' });
      }

      let conversationIdStr = "guest-" + Date.now();
      let history: any[] = [];
      let donorContext = null;

      // Only use DB and Context if user is authenticated (donorId exists)
      if (donorId) {
        const conversation = await ConversationService.getOrCreateActiveConversation(
          anonymousSessionIdHash,
          donorId
        );
        conversationIdStr = conversation._id.toString();

        // Check Idempotency
        const existingAiMsg = await ChatMessage.findOne({ 
          conversationId: conversation._id, 
          clientRequestId: clientRequestId + '-ai' 
        });
        if (existingAiMsg) {
          return res.status(200).json({ 
            status: 'success', 
            data: {
              message: existingAiMsg,
              conversationId: conversation._id
            }
          });
        }

        // Save User Message
        let userMsg = await ChatMessage.findOne({
          conversationId: conversation._id,
          clientRequestId: clientRequestId + '-user'
        });
        if (!userMsg) {
          await ChatMessage.create({
            conversationId: conversation._id,
            clientRequestId: clientRequestId + '-user',
            sender: 'User',
            contentText: message
          });
        }

        // Fetch context and history
        donorContext = await FormatterService.prepareDonorContext(donorId);
        const historyRaw = await ChatMessage.find({ conversationId: conversation._id })
          .sort({ sentAt: 1 })
          .limit(20);
          
        history = historyRaw.map(msg => ({
          role: msg.sender === 'User' ? 'user' : 'model',
          parts: [{ text: msg.contentText }]
        }));
      }

      // Send to AI Service (Streaming)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const aiResponseText = await AIServiceClient.streamMessage({
        message,
        donorContext,
        history,
        conversationId: conversationIdStr,
        clientRequestId
      }, res);

      const finalContent = FormatterService.appendMedicalDisclaimer(aiResponseText);

      if (finalContent !== aiResponseText) {
        const disclaimer = finalContent.replace(aiResponseText, '').trim();
        if (disclaimer) {
          res.write(`data: ${JSON.stringify({ text: '\n\n' + disclaimer })}\n\n`);
        }
      }

      // Save AI Response to DB ONLY if authenticated
      if (donorId) {
        await ChatMessage.create({
          conversationId: conversationIdStr,
          clientRequestId: clientRequestId + '-ai',
          sender: 'AI',
          contentText: finalContent,
          citations: [],
          confidenceScore: 1.0
        });
      }

      res.end();
      return;
    } catch (error: any) {
      console.error('Chatbot sendMessage error details:', error);
      if (res.headersSent) {
        const fallbackText = "Rất tiếc, đã xảy ra lỗi trong quá trình xử lý câu hỏi. Vui lòng thử lại sau.";
        res.write(`data: ${JSON.stringify({ text: fallbackText })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }
      const isAIServiceErr = error instanceof AIServiceError || 
        error?.name === 'AIServiceError' || 
        error?.statusCode === 503 ||
        (typeof error?.message === 'string' && error.message.includes('AI Service'));

      if (isAIServiceErr) {
        return res.status(503).json({
          error: 'AI service is temporarily unavailable. Please try again shortly.'
        });
      }
      const details = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: 'Internal server error processing message', details });
    }
  }

  public static async getHistory(req: Request, res: Response) {
    try {
      const { anonymousSessionIdHash, donorId } = req.chatbotSession!;
      
      // Do not return history for Guests
      if (!donorId) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return res.status(200).json({ status: 'success', data: { messages: [], activeConversationId: null } });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const conversations = await ConversationService.getConversationHistory(
        anonymousSessionIdHash,
        donorId
      );

      if (!conversations.length) {
        return res.status(200).json({ status: 'success', data: { messages: [], activeConversationId: null } });
      }

      const latestConversation = conversations[0];

      const messages = await ChatMessage.find({ conversationId: latestConversation._id })
        .sort({ sentAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      messages.reverse();

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      return res.status(200).json({
        status: 'success',
        data: {
          messages,
          conversationId: latestConversation._id,
          status: latestConversation.status
        }
      });
    } catch (error) {
      console.error('Chatbot getHistory error:', error);
      return res.status(500).json({ error: 'Internal server error retrieving history' });
    }
  }
}
