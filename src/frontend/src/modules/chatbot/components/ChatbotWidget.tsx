import React, { useState, useEffect, useRef } from 'react';
import { chatbotApi } from '../api/chatbot.api';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Send, Bot, User, X, Minimize2, Maximize2, MessageSquare, Calendar, MapPin, Droplet, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

interface Message {
  sender: 'User' | 'AI';
  contentText: string;
}

interface ChatbotWidgetProps {
  isFullScreen?: boolean;
  inlineMode?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Tôi có đủ điều kiện để hiến máu không?",
  "Bao lâu thì tôi có thể hiến máu lại?",
  "Trước khi hiến máu cần chuẩn bị gì?",
  "Sau khi hiến máu cần làm gì?",
  "Đang uống thuốc/bị bệnh có hiến được không?"
];

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ isFullScreen = false, inlineMode = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(isFullScreen || inlineMode);
  const [isMaximized, setIsMaximized] = useState(isFullScreen);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any>(null);

  // Floating Position & Drag State for floating icon
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('lifeline_chatbot_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return null;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Keep floating icon inside screen on resize
  useEffect(() => {
    const handleResize = () => {
      if (position) {
        const widget = widgetRef.current;
        const widgetWidth = widget ? widget.offsetWidth : 70;
        const widgetHeight = widget ? widget.offsetHeight : 70;
        const clampedX = Math.max(16, Math.min(window.innerWidth - widgetWidth - 16, position.x));
        const clampedY = Math.max(16, Math.min(window.innerHeight - widgetHeight - 16, position.y));
        if (clampedX !== position.x || clampedY !== position.y) {
          setPosition({ x: clampedX, y: clampedY });
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    const widget = widgetRef.current;
    const currentRect = widget
      ? widget.getBoundingClientRect()
      : { left: window.innerWidth - 80, top: window.innerHeight - 90 };
    const currentX = position ? position.x : currentRect.left;
    const currentY = position ? position.y : currentRect.top;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: currentX,
      posY: currentY,
    };
    hasDraggedRef.current = false;
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    if (Math.hypot(deltaX, deltaY) > 5) {
      hasDraggedRef.current = true;
    }

    if (hasDraggedRef.current) {
      const widget = widgetRef.current;
      const widgetWidth = widget ? widget.offsetWidth : 70;
      const widgetHeight = widget ? widget.offsetHeight : 70;

      const rawX = dragStartRef.current.posX + deltaX;
      const rawY = dragStartRef.current.posY + deltaY;

      const clampedX = Math.max(12, Math.min(window.innerWidth - widgetWidth - 12, rawX));
      const clampedY = Math.max(12, Math.min(window.innerHeight - widgetHeight - 12, rawY));

      setPosition({ x: clampedX, y: clampedY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;

    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {}

    const wasDragged = hasDraggedRef.current;
    dragStartRef.current = null;
    setIsDragging(false);

    if (wasDragged) {
      if (position) {
        try {
          localStorage.setItem('lifeline_chatbot_pos', JSON.stringify(position));
        } catch {}
      }
    } else {
      setIsOpen(true);
    }
  };

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsTimedOut(true);
    }, 30 * 60 * 1000); // 30 minutes
  };

  useEffect(() => {
    if (isOpen && !isTimedOut) {
      resetTimer();
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen, messages, input, isTimedOut]);

  const getWelcomeMessage = (currentUser: any): Message => {
    const name = currentUser?.fullName?.trim();
    const greeting = name ? `Xin chào **${name}**! 👋` : 'Xin chào bạn! 👋';
    return {
      sender: 'AI',
      contentText: `${greeting}\n\nTôi là **Trợ lý AI LifeLine** đồng hành cùng bạn. Tôi có thể hỗ trợ bạn:\n- 🩺 **Kiểm tra điều kiện hiến máu** & khoảng cách 84 ngày\n- 📍 **Tìm kiếm điểm hiến máu** & chiến dịch gần nhất\n- 📝 **Hướng dẫn đặt lịch** & chuẩn bị sức khỏe trước/sau hiến\n- 🏆 **Tra cứu quyền lợi**, bồi hoàn máu & điểm thưởng XP\n\nBạn cần LifeLine hỗ trợ điều gì hôm nay?`,
    };
  };

  useEffect(() => {
    // Clear messages and initialize welcome message when user changes
    setMessages([getWelcomeMessage(user)]);
    if (isOpen) {
      fetchHistory();
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0) {
        setMessages([getWelcomeMessage(user)]);
      }
      fetchHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isFullScreen) {
      setIsMaximized(false);
    }
  }, [location.pathname, isFullScreen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isOpen, isMaximized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchHistory = async () => {
    try {
      const res = await chatbotApi.getHistory();
      if (res.status === 'success') {
        if (res.data.messages && res.data.messages.length > 0) {
          setMessages(res.data.messages);
        } else {
          setMessages([getWelcomeMessage(user)]);
        }
        if (res.data.status === 'TimedOut') {
          setIsTimedOut(true);
        } else {
          setIsTimedOut(false);
          resetTimer();
        }
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
      if (messages.length === 0) {
        setMessages([getWelcomeMessage(user)]);
      }
    }
  };

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => {
          console.warn('Geolocation permission not granted or unavailable:', err);
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTimedOut) return;

    resetTimer();

    const requestId = crypto.randomUUID();
    const newUserMsg: Message = { sender: 'User', contentText: text };
    
    // Add user message and a blank AI message
    setMessages((prev) => [...prev, newUserMsg, { sender: 'AI', contentText: '' }]);
    setInput('');
    setIsLoading(true);

    try {
      await chatbotApi.sendMessageStream(
        { 
          message: text, 
          clientRequestId: requestId,
          lat: userLocation?.lat,
          lng: userLocation?.lng
        },
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
      
      if (msg.includes('502') || msg.includes('503') || msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
        setIsMaintenanceMode(true);
      } else {
        toast.error(msg);
      }
      
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
    // Match markdown links [text](url), raw URLs (http://... or https://...), bold **text**, italic *text*, inline code `code`
    const parts = text.split(/(\[[^\]]+\]\s*\([^\)]+\)|\bhttps?:\/\/[^\s<]+|\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      // 1. Markdown link: [text](url) or [text] (url)
      const linkMatch = part.match(/^\[([^\]]+)\]\s*\(([^)]+)\)$/);
      if (linkMatch) {
        const linkText = linkMatch[1].trim();
        const linkUrl = linkMatch[2].trim();
        const isInternal = linkUrl.startsWith('/') || linkUrl.includes('localhost:5173');
        const routePath = linkUrl.includes('localhost:5173')
          ? linkUrl.replace(/^https?:\/\/localhost:5173/, '')
          : linkUrl;

        // If it's a schedule link or mentions booking, render as a styled interactive button
        if (linkUrl.includes('schedule') || linkText.toLowerCase().includes('đặt lịch')) {
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                navigate(routePath || '/my-appointments/schedule/step-1');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer align-middle"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{linkText}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          );
        }

        return (
          <a
            key={i}
            href={linkUrl}
            onClick={(e) => {
              if (isInternal) {
                e.preventDefault();
                navigate(routePath || '/my-appointments/schedule/step-1');
              }
            }}
            target={isInternal ? undefined : '_blank'}
            rel={isInternal ? undefined : 'noopener noreferrer'}
            className="text-red-600 hover:text-red-700 underline font-semibold cursor-pointer inline-flex items-center gap-0.5"
          >
            {linkText}
          </a>
        );
      }

      // 2. Raw URL: http://localhost:5173/... or https://...
      if (/^https?:\/\//.test(part)) {
        const isInternal = part.includes('localhost:5173');
        const routePath = isInternal ? part.replace(/^https?:\/\/localhost:5173/, '') : part;
        
        if (part.includes('schedule')) {
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                navigate(routePath || '/my-appointments/schedule/step-1');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer align-middle"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Đặt lịch hiến máu ngay</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          );
        }

        return (
          <a
            key={i}
            href={part}
            onClick={(e) => {
              if (isInternal) {
                e.preventDefault();
                navigate(routePath || '/my-appointments/schedule/step-1');
              }
            }}
            target={isInternal ? undefined : '_blank'}
            rel={isInternal ? undefined : 'noopener noreferrer'}
            className="text-red-600 hover:text-red-700 underline font-semibold cursor-pointer break-all"
          >
            {part}
          </a>
        );
      }

      // 3. Bold text
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      }

      // 4. Italic text
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={i} className="italic text-gray-700">{part.slice(1, -1)}</em>;
      }

      // 5. Inline code
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

    // Fix broken multiline markdown links like [Text]\n(http://...) or [Text] (http://...)
    cleanedText = cleanedText.replace(/\[([^\]]+)\]\s*\(([^)]+)\)/g, (_match, p1, p2) => {
      return `[${p1.trim()}](${p2.trim()})`;
    });

    // Clean LaTeX math symbols (e.g., $O^+$, $A^+$, $AB^-$, $O$, \dots) into clean standard text
    cleanedText = cleanedText
      .replace(/\$([A-Za-z0-9]+)\^\{?([\+\-])\}?\$/g, '$1$2')
      .replace(/\$([A-Za-z0-9\+\-]+)\$/g, '$1')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\dots/g, '...');

    const lines = cleanedText.split('\n');
    let disclaimerRendered = false;

    const renderElements: React.ReactNode[] = [];
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check for Schedule CTA Card
      const ctaMatch = trimmed.match(/\[SCHEDULE_PAGE_CTA(?::(.*?))?\]/);
      if (ctaMatch) {
        let ctaData = {
          title: 'Trang Đặt Lịch Hiến Máu LifeLine',
          description: 'Tra cứu điểm tiếp nhận gần bạn & chọn khung giờ 30 phút thuận tiện',
          url: '/my-appointments/schedule/step-1'
        };
        if (ctaMatch[1]) {
          try {
            ctaData = { ...ctaData, ...JSON.parse(ctaMatch[1]) };
          } catch (e) {}
        }
        renderElements.push(
          <div key={`cta-${i}`} className="my-3 p-4 bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl text-white shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm leading-tight text-white">{ctaData.title}</h4>
                <p className="text-xs text-red-100 mt-0.5 leading-snug">{ctaData.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                navigate('/my-appointments/schedule/step-1');
              }}
              className="mt-3 w-full py-2.5 px-4 bg-white hover:bg-red-50 active:scale-98 text-red-700 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-red-600" />
              <span>Truy cập trang Đặt lịch hẹn ngay</span>
              <ArrowRight className="w-3.5 h-3.5 text-red-600" />
            </button>
          </div>
        );
        i++;
        continue;
      }

      // Check for Campaign Card
      const cardMatch = trimmed.match(/\[CAMPAIGN_CARD:(.*?)\]/);
      if (cardMatch) {
        try {
          const data = JSON.parse(cardMatch[1]);
          renderElements.push(
            <div key={`card-${i}`} className="my-3 border border-red-100 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-red-50 to-rose-50 p-3.5 border-b border-red-100 flex items-center justify-between gap-2">
                <h3 className="font-bold text-red-800 text-[13.5px] leading-snug flex-1">{data.name}</h3>
                {(data.distanceKm !== undefined && data.distanceKm !== null) && (
                  <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    ~{data.distanceKm} km
                  </span>
                )}
              </div>
              <div className="p-3.5 space-y-2 text-[13px] text-gray-700">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <span><span className="font-semibold text-gray-900">Địa điểm:</span> {data.location} {data.address && data.address !== data.location ? `(${data.address})` : ''}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <span><span className="font-semibold text-gray-900">Thời gian:</span> {data.date}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Droplet className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <span><span className="font-semibold text-gray-900">Nhóm máu:</span> {data.bloodTypes}</span>
                </div>
                <div className="pt-2">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/my-appointments/schedule/step-1');
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Đặt lịch hẹn ngay</span>
                  </button>
                </div>
              </div>
            </div>
          );
        } catch (e) {
          console.error("Failed to parse campaign card", e);
        }
        i++;
        continue;
      }

      if (!trimmed) {
        renderElements.push(<div key={i} className="h-1.5" />);
        i++;
        continue;
      }

      if (trimmed.includes('Lưu ý:') && trimmed.includes('bác sĩ')) {
        if (!disclaimerRendered) {
          disclaimerRendered = true;
          const disclaimerText = trimmed.replace(/^[\*\_\#\-\s]+|[\*\_\#\-\s]+$/g, '');
          renderElements.push(
            <div key={i} className="mt-3 pt-2 border-t border-gray-100 text-[12px] text-gray-500 italic bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/60 leading-normal">
              💡 {disclaimerText}
            </div>
          );
        }
        i++;
        continue;
      }

      if (/^[\*\-\+]\s+/.test(trimmed)) {
        const content = trimmed.replace(/^[\*\-\+]\s+/, '');
        renderElements.push(
          <div key={i} className="flex items-start gap-2.5 my-1 pl-1 text-[13.5px]">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
            <span className="flex-1 leading-relaxed">{parseInlineMarkdown(content)}</span>
          </div>
        );
        i++;
        continue;
      }

      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        renderElements.push(
          <div key={i} className="flex items-start gap-2 my-1 pl-1 text-[13.5px]">
            <span className="font-semibold text-red-600 text-xs mt-0.5 min-w-[18px]">{numMatch[1]}.</span>
            <span className="flex-1 leading-relaxed">{parseInlineMarkdown(numMatch[2])}</span>
          </div>
        );
        i++;
        continue;
      }

      if (trimmed.startsWith('#')) {
        const headingText = trimmed.replace(/^#+\s*/, '');
        renderElements.push(
          <div key={i} className="font-bold text-gray-900 text-sm mt-3 mb-1">
            {parseInlineMarkdown(headingText)}
          </div>
        );
        i++;
        continue;
      }

      renderElements.push(
        <div key={i} className="my-0.5 text-[13.5px] leading-relaxed">
          {parseInlineMarkdown(trimmed)}
        </div>
      );
      
      i++;
    }

    return renderElements;
  };


  if (!isOpen && !isFullScreen && !inlineMode) {
    const isNearLeft = position ? position.x < window.innerWidth / 2 : false;
    const isNearTop = position ? position.y < 120 : false;

    const style: React.CSSProperties = position
      ? { left: `${position.x}px`, top: `${position.y}px` }
      : { right: '24px', bottom: '24px' };

    return (
      <div
        ref={widgetRef}
        style={style}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragStartRef.current = null;
          setIsDragging(false);
        }}
        className={`fixed z-50 flex ${isNearTop ? 'flex-col-reverse' : 'flex-col'} ${
          isNearLeft ? 'items-start' : 'items-end'
        } gap-2.5 select-none touch-none cursor-grab active:cursor-grabbing ${
          isDragging ? 'scale-105 opacity-90 transition-none' : 'transition-transform duration-200 hover:scale-105'
        }`}
        title="Nhấp để trò chuyện | Giữ và kéo để di chuyển vị trí"
      >
        {/* Tooltip speech bubble */}
        <div
          className={`relative bg-white px-3.5 py-2 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-2 transition-all ${
            isDragging ? 'shadow-2xl' : 'hover:scale-102'
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-[12.5px] font-semibold text-gray-700 whitespace-nowrap">
            Trợ lý AI LifeLine
          </span>
          {/* Tooltip arrow */}
          <div
            className={`absolute w-3 h-3 bg-white border-b border-r border-gray-100 transform rotate-45 ${
              isNearTop
                ? '-top-1.5 ' + (isNearLeft ? 'left-4' : 'right-4')
                : '-bottom-1.5 ' + (isNearLeft ? 'left-4' : 'right-4')
            }`}
          />
        </div>

        {/* Floating circular button with drag indicator */}
        <div className="relative group">
          <button
            type="button"
            className="w-14 h-14 bg-gradient-to-tr from-red-700 to-red-500 hover:from-red-800 hover:to-red-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-red-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none scale-110" />
        </div>
      </div>
    );
  }

  const containerClasses = inlineMode 
    ? "flex flex-col bg-gray-50 h-full w-full"
    : isFullScreen || isMaximized
      ? "fixed inset-0 z-50 flex flex-col bg-gray-50 transition-all duration-300"
      : "fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-32px)] h-[600px] max-h-[calc(100vh-64px)] z-50 flex flex-col bg-gray-50 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 transition-all duration-300";

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
          <div className="text-center my-6 text-gray-500">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Bot className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm mb-5 font-medium text-gray-700">Hãy đặt câu hỏi, tôi có thể giúp bạn!</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          if (msg.sender === ('System' as any)) {
            return (
              <div key={idx} className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-[11px] text-gray-400 font-semibold uppercase tracking-wider text-center">Khởi tạo cuộc hội thoại mới</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
            );
          }
          return (
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
          );
        })}

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
      <footer className="bg-white border-t p-3 relative">
        {(messages.length <= 1 || (messages[messages.length - 1]?.sender as string) === 'System') && !isTimedOut && !isMaintenanceMode && (
          <div className="absolute bottom-[calc(100%+8px)] left-0 w-full px-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="whitespace-nowrap px-3 py-1.5 bg-white text-red-600 text-[12.5px] border border-red-200 rounded-full hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {isTimedOut ? (
          <div className="flex flex-col items-center justify-center p-2">
            <div className="text-gray-500 text-xs mb-3">Phiên trò chuyện đã kết thúc do không hoạt động.</div>
            <button
              onClick={() => {
                setMessages((prev) => [
                  ...prev,
                  { sender: 'System' as any, contentText: 'DIVIDER_NEW_SESSION' },
                  getWelcomeMessage(user),
                ]);
                setIsTimedOut(false);
                resetTimer();
              }}
              className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
            >
              Khởi tạo cuộc hội thoại mới
            </button>
          </div>
        ) : (
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
        )}
      </footer>

      {/* Maintenance Overlay */}
      {isMaintenanceMode && (
        <div className="absolute inset-0 top-[60px] bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <Bot className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-2">Chatbot đang bảo trì</h3>
          <p className="text-[13.5px] text-gray-600 mb-6 leading-relaxed">
            Chúng tôi đang nâng cấp hệ thống để phục vụ bạn tốt hơn. Vui lòng quay lại sau ít phút.
          </p>
          <button 
            onClick={() => setIsMaintenanceMode(false)}
            className="bg-red-600 text-white px-8 py-2.5 rounded-xl font-medium hover:bg-red-700 transition-colors shadow-sm"
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
};
