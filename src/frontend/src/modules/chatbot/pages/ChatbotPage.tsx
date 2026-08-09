import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { ArrowLeft, Bot, User } from 'lucide-react';
import { ChatbotWidget } from '../components/ChatbotWidget';

export const ChatbotPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white border-b shadow-sm z-10 relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => user ? navigate('/dashboard') : navigate('/')}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-800">LifeLine AI</h1>
              <p className="text-xs text-green-600 font-medium">Đang trực tuyến</p>
            </div>
          </div>
        </div>
        <div>
          {!user ? (
            <button 
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 px-4 py-2 rounded-lg"
            >
              Đăng nhập
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
              <User className="w-4 h-4" />
              <span className="max-w-[100px] truncate">{user.email}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 relative">
        <ChatbotWidget isFullScreen={true} />
      </div>
    </div>
  );
};
