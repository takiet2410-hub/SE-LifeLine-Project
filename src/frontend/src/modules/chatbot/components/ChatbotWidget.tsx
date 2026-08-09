import React, { useState, useEffect, useRef } from 'react';
import { chatbotApi } from '../api/chatbot.api';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Send, Bot, User, Loader2, X, Minimize2, Maximize2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

interface Message {
  sender: 'User' | 'AI';
  contentText: string;
}

interface ChatbotWidgetProps {
  isFullScreen?: boolean;
  inlineMode?: boolean;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ isFullScreen = false, inlineMode = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(isFullScreen || inlineMode);
  const [isMaximized, setIsMaximized] = useState(isFullScreen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear messages and fetch history when user changes
    setMessages([]);
    if (isOpen) {
      fetchHistory();
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      fetchHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isOpen, isMaximized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchHistory = async () => {
    try {
      const res = await chatbotApi.getHistory();
      if (res.status === 'success' && res.data.messages) {
        setMessages(res.data.messages);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const requestId = crypto.randomUUID();
    const newUserMsg: Message = { sender: 'User', contentText: text };
    
    // Add user message and a blank AI message
    setMessages((prev) => [...prev, newUserMsg, { sender: 'AI', contentText: '' }]);
    setInput('');
    setIsLoading(true);

    try {
      await chatbotApi.sendMessageStream(
        { message: text, clientRequestId: requestId },
        (chunk) => {
          setIsLoading(false); // Stop loading indicator on first chunk
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMsgIdx = newMessages.length - 1;
            const lastMsg = { ...newMessages[lastMsgIdx] }; // Clone to avoid StrictMode double-mutation
            
            if (lastMsg.sender === 'AI') {
              lastMsg.contentText += chunk;
            }
            newMessages[lastMsgIdx] = lastMsg;
            return newMessages;
          });
        }
      );
    } catch (error: any) {
      console.error("Failed to send message", error);
      const msg = error?.message || "Lỗi kết nối. Vui lòng thử lại.";
      toast.error(msg);
      // Remove the blank AI message on error if it's still blank
      setMessages((prev) => prev.filter(msg => msg.contentText !== '' || msg.sender !== 'AI'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const parseInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={i} className="italic text-gray-700">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return <code key={i} className="bg-gray-100 px-1 py-0.5 rounded text-xs text-red-600 font-mono">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const formatMessageText = (text: string) => {
    if (!text) return null;

    let cleanedText = text;
    if (cleanedText.trim().startsWith('{') && cleanedText.includes('"contentText"')) {
      try {
        const parsed = JSON.parse(cleanedText);
        if (parsed.contentText) {
          cleanedText = parsed.contentText;
        }
      } catch (e) {
        const match = cleanedText.match(/"contentText"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (match && match[1]) {
          cleanedText = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
      }
    }

    const lines = cleanedText.split('\n');
    let disclaimerRendered = false;

    return lines.map((line, i) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return <div key={i} className="h-1.5" />;
      }

      if (trimmed.includes('Lưu ý:') && trimmed.includes('bác sĩ')) {
        if (disclaimerRendered) return null;
        disclaimerRendered = true;
        const disclaimerText = trimmed.replace(/^[\*\_\#\-\s]+|[\*\_\#\-\s]+$/g, '');
        return (
          <div key={i} className="mt-3 pt-2 border-t border-gray-100 text-[12px] text-gray-500 italic bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/60 leading-normal">
            💡 {disclaimerText}
          </div>
        );
      }

      if (/^[\*\-\+]\s+/.test(trimmed)) {
        const content = trimmed.replace(/^[\*\-\+]\s+/, '');
        return (
          <div key={i} className="flex items-start gap-2.5 my-1 pl-1 text-[13.5px]">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
            <span className="flex-1 leading-relaxed">{parseInlineMarkdown(content)}</span>
          </div>
        );
      }

      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={i} className="flex items-start gap-2 my-1 pl-1 text-[13.5px]">
            <span className="font-semibold text-red-600 text-xs mt-0.5 min-w-[18px]">{numMatch[1]}.</span>
            <span className="flex-1 leading-relaxed">{parseInlineMarkdown(numMatch[2])}</span>
          </div>
        );
      }

      if (trimmed.startsWith('#')) {
        const headingText = trimmed.replace(/^#+\s*/, '');
        return (
          <div key={i} className="font-bold text-gray-900 text-sm mt-3 mb-1">
            {parseInlineMarkdown(headingText)}
          </div>
        );
      }

      return (
        <div key={i} className="my-0.5 text-[13.5px] leading-relaxed">
          {parseInlineMarkdown(trimmed)}
        </div>
      );
    });
  };


  if (!isOpen && !isFullScreen && !inlineMode) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 z-50 animate-bounce-short"
      >
        <MessageSquare className="w-7 h-7" />
      </button>
    );
  }

  const containerClasses = inlineMode 
    ? "flex flex-col bg-gray-50 h-full w-full"
    : isFullScreen || isMaximized
      ? "fixed inset-0 z-50 flex flex-col bg-gray-50 transition-all duration-300"
      : "fixed bottom-6 right-6 w-[380px] h-[600px] z-50 flex flex-col bg-gray-50 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 transition-all duration-300";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">LifeLine AI</h2>
            <p className="text-[11px] text-white/80 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              Đang trực tuyến
            </p>
          </div>
        </div>
        {!isFullScreen && (
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center my-8 text-gray-500">
            <Bot className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">Hãy đặt câu hỏi về hiến máu, tôi có thể giúp bạn!</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'User' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${msg.sender === 'User' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
              <div className="flex-shrink-0 mt-1">
                {msg.sender === 'User' ? (
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-2xl ${
                msg.sender === 'User' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white border border-gray-200 text-gray-800 shadow-sm rounded-tl-none'
              }`}>
                <div className="text-[14px] leading-relaxed break-words">
                  {formatMessageText(msg.contentText)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[85%]">
              <div className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white border border-gray-200 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t p-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Nhập câu hỏi..."
            className="w-full bg-gray-100 rounded-xl pl-3 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-100 focus:bg-white transition-colors resize-none max-h-24 min-h-[44px] text-sm overflow-y-auto"
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 bottom-1.5 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
};
