import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  AlertTriangle, 
  Info, 
  Loader2, 
  HelpCircle,
  Pill,
  Heart,
  Droplet,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

const SUGGESTED_PROMPTS = [
  { icon: Pill, text: "Explain how to take Lisinopril safely" },
  { icon: Droplet, text: "Hydration & daily water intake tips for seniors" },
  { icon: AlertTriangle, text: "What should I do if I forgot a dose?" },
  { icon: Heart, text: "Gentle exercises to maintain joint mobility" },
  { icon: HelpCircle, text: "How do I mark my medicine as taken on ElderCare?" },
  { icon: ShieldCheck, text: "What is the emergency SOS protocol?" },
];

const AICareAssistant = () => {
  const { user } = useAuth();
  const { playTone } = useAccessibility();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! I am your **ElderCare Assistant**.\n\nI am here to help you understand your daily medications, explore healthy wellness habits, and answer questions about using the ElderCare platform. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      // Build history for backend
      const historyPayload = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: m.content
      }));

      const res = await aiService.chat(text, historyPayload);
      playTone('chime');

      const botMsg = {
        role: 'assistant',
        content: res.reply,
        isFallback: res.is_fallback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("AI Assistant error:", err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I apologize, but I am currently having trouble connecting to the network. Please make sure your server is running and try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Conversation restarted! I am ready to answer any elderly wellness or medication management questions.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 flex flex-col h-[calc(100vh-140px)]">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">ElderCare Assistant</h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                Google Gemini
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Empathetic, clear wellness guidance & medication instruction explanations
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title="Restart conversation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Mandatory Safety Notice */}
      <div className="bg-amber-50/70 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs shrink-0">
        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Clinical Safety Guardrail:</strong> ElderCare Assistant does not prescribe medicine or alter dosages. For emergencies, always dial 911 or tap SOS.
        </span>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 overflow-y-auto space-y-4 shadow-2xs">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold ${
                isUser ? 'bg-blue-600' : 'bg-gradient-to-tr from-indigo-600 to-blue-600'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[80%] rounded-3xl p-4 sm:p-5 text-sm leading-relaxed ${
                isUser 
                  ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs' 
                  : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200'
              }`}>
                <div className="whitespace-pre-wrap space-y-1">
                  {msg.content}
                </div>
                <div className={`text-[10px] mt-2 ${isUser ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-100 border border-slate-200 rounded-3xl rounded-tl-xs p-4 flex items-center gap-2 text-xs text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>ElderCare Assistant is reviewing wellness guidance...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Inquiries */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 shrink-0 no-scrollbar">
        {SUGGESTED_PROMPTS.map((prompt, idx) => {
          const Icon = prompt.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt.text)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 text-xs font-semibold whitespace-nowrap shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <Icon className="w-3.5 h-3.5 text-blue-600" />
              <span>{prompt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Input Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs shrink-0 flex items-center gap-2">
        <input 
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder="Ask a question about healthy habits, pills, or platform instructions..."
          className="flex-1 px-4 py-2.5 text-sm bg-transparent focus:outline-hidden text-slate-900"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !inputMessage.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold p-3 rounded-xl transition-transform active:scale-95 cursor-pointer"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

export default AICareAssistant;
