import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, RotateCcw, Package, ChevronRight, Headphones } from 'lucide-react';
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
  text: 'Xin chào! Em là **Trợ lý hỗ trợ GiaoTín**.\n\nEm có thể hỗ trợ bạn:\n- 🔍 **Tra cứu đơn hàng**: Gửi mã vận đơn dạng `VT12345678`\n- 💰 **Báo giá & Cước phí**: Tiêu chuẩn, Hỏa tốc, tiền thu hộ COD\n- ⏱️ **Thời gian giao hàng** & Chính sách bảo hiểm hàng hóa\n\nBạn cần em hỗ trợ điều gì hôm nay?',
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
  { label: '💰 Phí vận chuyển', action: 'send', value: 'Cách tính phí vận chuyển của Viettel Delivery như thế nào?' },
  { label: '⚡ Gói Hỏa tốc', action: 'send', value: 'Gói Hỏa tốc giao trong bao lâu và cước phí thế nào?' },
  { label: '🛡️ Bồi thường hàng hóa', action: 'send', value: 'Chính sách bồi thường hàng hóa khi bị mất hoặc hỏng?' },
  { label: '🎟️ Mã giảm giá', action: 'send', value: 'Hôm nay có những mã voucher khuyến mãi nào?' },
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

      const res: any = await aiChatApi(textToSend, historyPayload);
      const aiData = res?.data?.reply ? res.data : res?.reply ? res : res?.data;

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
        text: 'Dạ hiện tại kết nối đang gián đoạn một chút. Bạn vui lòng thử lại sau ít giây hoặc liên hệ tổng đài 1900.8095 nhé!',
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
                <strong key={pIdx} className="font-600 text-slate-900">
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
          aria-label="Cửa sổ hỗ trợ khách hàng GiaoTín"
          className="mb-3 w-[92vw] sm:w-[380px] h-[530px] max-h-[80vh] bg-white rounded-2xl shadow-xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-150"
        >
          {/* Header */}
          <div className="bg-blue-600 text-white p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white">
                <Headphones size={17} />
              </div>
              <div>
                <h3 className="font-600 text-xs sm:text-sm leading-tight">Hỗ trợ khách hàng GiaoTín</h3>
                <p className="text-[11px] text-blue-100 leading-tight">Tư vấn cước phí & tra cứu đơn hàng</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Làm mới đoạn chat"
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Đóng chat"
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex-shrink-0 flex items-center justify-center text-xs font-600 mt-0.5">
                    <Headphones size={13} />
                  </div>
                )}

                <div
                  className={`max-w-[84%] rounded-xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200/60 rounded-tl-xs shadow-xs'
                  }`}
                >
                  {renderFormattedText(msg.text)}

                  {/* Order Preview Card if tracking data grounded */}
                  {msg.actionData && msg.actionData.trackingNumber && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 bg-slate-50 -mx-1 p-2.5 rounded-lg border border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Package size={13} className="text-blue-600" />
                          <span className="font-600 text-xs text-blue-700">
                            {msg.actionData.trackingNumber}
                          </span>
                        </div>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-500 border border-blue-100">
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
                        className="mt-2 w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-500 flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>Xem chi tiết lộ trình</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  )}

                  {/* Quick Question suggestions attached to message */}
                  {msg.sender === 'assistant' && msg.quickQuestions && msg.quickQuestions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.quickQuestions.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => handleSend(q)}
                          disabled={loading}
                          className="text-[11px] text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/70 rounded-full px-2.5 py-0.5 transition-colors text-left font-500 disabled:opacity-50"
                        >
                          {q}
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
              <div className="flex gap-2 items-center text-slate-400 text-xs pl-1 py-1">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Headphones size={13} />
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200/60 px-3 py-1.5 rounded-xl shadow-xs">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                  <span className="text-[11px] text-slate-500 ml-1">Đang xử lý câu trả lời...</span>
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
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/70 text-[11px] text-slate-600 transition-colors flex-shrink-0 disabled:opacity-50 font-500"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi hoặc mã đơn VT..."
              disabled={loading}
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Đóng hỗ trợ' : 'Mở tư vấn & hỗ trợ'}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:scale-102 active:scale-98 transition-all duration-150"
      >
        <MessageCircle size={18} className="text-white" />
        <span className="font-600 text-xs tracking-tight">Hỗ trợ khách hàng</span>
      </button>
    </div>
  );
}
