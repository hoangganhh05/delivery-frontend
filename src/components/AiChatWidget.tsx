import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Send, RotateCcw, Package, ChevronRight, HelpCircle } from 'lucide-react';
import { aiChatApi, type AiChatMessage } from '../api/deliveryApi';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  suggestedAction?: string;
  actionData?: any;
  quickQuestions?: string[];
}

const DEFAULT_WELCOME: Message = {
  id: 'welcome',
  sender: 'assistant',
  text: 'Xin chào! Em là **GiaoTín AI** - Trợ lý thông minh của Viettel Delivery. 🤖✨\n\nEm có thể giúp bạn:\n- 🔍 **Tra cứu đơn hàng**: Gửi mã vận đơn dạng `VT12345678`\n- 💰 **Báo giá & Cước phí**: Tiêu chuẩn, Hỏa tốc, tiền thu COD\n- ⏱️ **Thời gian giao hàng** & Chính sách bảo hiểm hàng hóa\n\nBạn cần em hỗ trợ điều gì hôm nay?',
  timestamp: new Date(),
  quickQuestions: [
    'Cách tính phí vận chuyển?',
    'Gói Hỏa tốc giao trong bao lâu?',
    'Chính sách bồi thường hàng hóa',
    'Voucher giảm giá hôm nay',
  ],
};

interface QuickPrompt {
  label: string;
  action: 'prefill' | 'send';
  value: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  { label: '🔍 Tra cứu đơn hàng', action: 'prefill', value: 'Tra cứu đơn ' },
  { label: '💰 Phí vận chuyển?', action: 'send', value: 'Cách tính phí vận chuyển của Viettel Delivery như thế nào?' },
  { label: '⚡ Gói Hỏa tốc?', action: 'send', value: 'Gói Hỏa tốc giao trong bao lâu và cước phí thế nào?' },
  { label: '🛡️ Bồi thường hàng hóa', action: 'send', value: 'Chính sách bồi thường hàng hóa khi bị mất hoặc hỏng?' },
  { label: '🎟️ Voucher giảm giá', action: 'send', value: 'Hôm nay có những mã voucher khuyến mãi nào?' },
];

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([DEFAULT_WELCOME]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload: AiChatMessage[] = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      const res = await aiChatApi(textToSend, historyPayload);
      const aiData = res.data;

      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: aiData?.reply || 'Dạ em đã nhận thông tin. Bạn có cần hỗ trợ thêm gì không ạ?',
        timestamp: new Date(),
        suggestedAction: aiData?.suggestedAction,
        actionData: aiData?.actionData,
        quickQuestions: aiData?.quickQuestions,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: 'Dạ hiện tại kết nối AI đang gián đoạn một chút. Bạn vui lòng thử lại sau ít giây hoặc liên hệ tổng đài hỗ trợ nhé!',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt: QuickPrompt) => {
    if (prompt.action === 'prefill') {
      setInput(prompt.value);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      handleSend(prompt.value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        ...DEFAULT_WELCOME,
        timestamp: new Date(),
      },
    ]);
  };

  // Helper format simple markdown bold **text** and bullet points
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let formatted = line;
      const parts = formatted.split(/(\*\*.*?\*\*)/g);

      return (
        <div key={idx} className={line.trim().startsWith('-') ? 'pl-2 text-xs py-0.5' : 'text-xs leading-relaxed my-0.5'}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-700 text-slate-900">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Cửa sổ Trợ lý AI GiaoTín"
          className="mb-3 w-[92vw] sm:w-[390px] h-[560px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Bot size={20} className="text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-700 text-sm leading-tight">GiaoTín AI Assistant</h3>
                  <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded-md font-600">Gemini</span>
                </div>
                <p className="text-[11px] text-white/80 leading-tight">Trợ lý hỗ trợ giao nhận thông minh</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Làm mới đoạn chat"
                className="w-8 h-8 rounded-xl hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Đóng chat"
                className="w-8 h-8 rounded-xl hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex-shrink-0 flex items-center justify-center shadow-xs text-xs font-700 mt-0.5">
                    <Sparkles size={13} />
                  </div>
                )}

                <div
                  className={`max-w-[84%] rounded-2xl p-3 shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-red-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200/70 rounded-tl-xs'
                  }`}
                >
                  {renderFormattedText(msg.text)}

                  {/* Order Preview Card if AI found grounded tracking data */}
                  {msg.actionData && msg.actionData.trackingNumber && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 bg-red-50/60 -mx-1 p-2.5 rounded-xl border border-red-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Package size={14} className="text-red-600" />
                          <span className="font-700 text-xs text-red-700">
                            {msg.actionData.trackingNumber}
                          </span>
                        </div>
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-600">
                          {msg.actionData.currentStatus || 'Đang vận chuyển'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 truncate">
                        Người nhận: <strong className="text-slate-800">{msg.actionData.receiverName}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          navigate(`/tracking?code=${msg.actionData.trackingNumber}`);
                        }}
                        className="mt-2 w-full py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-600 flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>Xem chi tiết lộ trình GPS</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  )}

                  {/* Quick Question suggestions attached to this message */}
                  {msg.sender === 'assistant' && msg.quickQuestions && msg.quickQuestions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex flex-wrap gap-1.5">
                      {msg.quickQuestions.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => handleSend(q)}
                          disabled={loading}
                          className="text-[11px] text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-full px-2.5 py-0.5 transition-colors text-left font-500 disabled:opacity-50"
                        >
                          💬 {q}
                        </button>
                      ))}
                    </div>
                  )}

                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-white/70' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-slate-400 text-xs pl-2 py-1">
                <div className="w-7 h-7 rounded-xl bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
                  <Sparkles size={13} />
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-2 rounded-2xl shadow-xs">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></span>
                  <span className="text-[11px] text-slate-500 ml-1">AI đang suy nghĩ...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-200 text-[11px] text-slate-600 transition-colors flex-shrink-0 disabled:opacity-50 font-500"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi hoặc mã VT12345678..."
              disabled={loading}
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white flex items-center justify-center shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Đóng Trợ lý AI' : 'Mở Trợ lý AI GiaoTín'}
        className="group relative flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <div className="flex items-center gap-1.5 font-700 text-xs sm:text-sm tracking-wide">
          <Sparkles size={16} className="text-amber-300 animate-pulse" />
          <span>GiaoTín AI</span>
        </div>
        <span className="hidden group-hover:inline-block text-[11px] bg-white/20 px-1.5 py-0.5 rounded font-500 text-white/90">
          {isOpen ? 'Thu nhỏ' : 'Hỏi ngay'}
        </span>
      </button>
    </div>
  );
}
