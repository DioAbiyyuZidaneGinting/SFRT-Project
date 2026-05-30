import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  Send, 
  Trash2, 
  ArrowRight,
  MessageSquare,
  RefreshCw,
  Bell,
  Navigation
} from 'lucide-react';
import { AIService } from '../services/aiService';
import { useTranslation } from '../hooks/useTranslation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant() {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    const saved = sessionStorage.getItem('sfrt_chat_open');
    return saved === 'true';
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem('sfrt_chat_messages');
    if (saved) return JSON.parse(saved);
    
    // Default greeting in Indo or English based on app setting
    const isIndo = language === 'id';
    return [
      { 
        role: 'assistant', 
        content: isIndo 
          ? 'Halo! Saya Asisten AI SFRT. Ada yang bisa saya bantu dengan armada kendaraan Anda, riwayat pengisian bahan bakar, atau info stasiun hari ini?' 
          : 'Hi! I am your SFRT AI Assistant. How can I help you with your vehicles, refueling history, or station info today?'
      }
    ];
  });

  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync state to session storage for persistence
  useEffect(() => {
    sessionStorage.setItem('sfrt_chat_open', isOpen ? 'true' : 'false');
  }, [isOpen]);

  useEffect(() => {
    sessionStorage.setItem('sfrt_chat_messages', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom whenever messages or loading state changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage = textToSend.trim();
    setInput('');
    
    // Add user message to history
    const updatedMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Pass the conversation history (excluding the current user message, which chatWithAI takes separately)
      const { response, error } = await AIService.chatWithAI(userMessage, messages);
      
      if (error) {
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: language === 'id' 
              ? 'Maaf, saya mengalami kendala koneksi ke server AI. Silakan coba lagi.' 
              : 'I apologize, but I had trouble reaching the AI server. Please try again.'
          }
        ]);
      } else if (response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'An unexpected error occurred. Please try again.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm(language === 'id' ? 'Hapus semua riwayat obrolan?' : 'Clear all chat history?')) {
      const isIndo = language === 'id';
      setMessages([
        { 
          role: 'assistant', 
          content: isIndo 
            ? 'Halo kembali! Semua riwayat obrolan telah dibersihkan. Ada yang bisa saya bantu sekarang?' 
            : 'Hello again! All conversation history has been cleared. What can I help you with now?'
        }
      ]);
    }
  };

  // Neo-Brutalist Markdown Parser
  const renderMessageText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content = line;
      
      // Check for bullet points
      const isBullet = content.trim().startsWith('- ') || content.trim().startsWith('* ');
      if (isBullet) {
        content = content.replace(/^[\-\*]\s+/, '');
      }

      // Handle bold tags (**text**)
      const parts = content.split('**');
      const formattedParts = parts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i} className="font-bold text-text-primary">{part}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc pl-1 mt-1 text-text-secondary leading-relaxed">
            {formattedParts}
          </li>
        );
      }

      return (
        <p key={idx} className="mt-1.5 leading-relaxed text-text-secondary">
          {formattedParts}
        </p>
      );
    });
  };

  // Suggestion Chips based on Language
  const suggestions = language === 'id' 
    ? [
        { label: 'Rekomendasi Bahan Bakar', prompt: 'Bahan bakar apa yang direkomendasikan untuk kendaraan saya?' },
        { label: 'Tunjukkan Armada Saya', prompt: 'Bisa tampilkan daftar kendaraan yang saya daftarkan?' },
        { label: 'Lihat Transaksi Terakhir', prompt: 'Tampilkan riwayat pengisian bahan bakar terakhir saya' },
        { label: 'Di mana stasiun terdekat?', prompt: 'Di mana lokasi stasiun pengisian terdekat?' },
        { label: 'Apakah ada notifikasi?', prompt: 'Tampilkan peringatan atau notifikasi akun saya saat ini' }
      ]
    : [
        { label: 'Fuel Recommendation', prompt: 'What fuel is recommended for my registered vehicles?' },
        { label: 'Show My Fleet', prompt: 'Can you list all my registered vehicles?' },
        { label: 'Recent Refueling', prompt: 'Show my latest refueling transaction history' },
        { label: 'Where is the station?', prompt: 'Where is the nearest refueling station located?' },
        { label: 'Check Alerts', prompt: 'Do I have any active alerts or notifications?' }
      ];

  return (
    <div className="font-sans relative z-50">
      {/* FLOATING AI TOGGLE BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 right-4 lg:bottom-6 lg:right-6 w-14 h-14 rounded-full bg-brand-emerald text-white border-2 border-black dark:border-zinc-800 hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0 shadow-[3px_3px_0px_#000000] hover:shadow-[5px_5px_0px_#000000] active:shadow-none transition-all flex items-center justify-center cursor-pointer`}
        title="Open SFRT AI Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5.5 h-5.5" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <Sparkles className="w-5.5 h-5.5" />
              <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-sky-400 rounded-full border border-brand-emerald animate-ping" />
              <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-sky-400 rounded-full border border-brand-emerald" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* CHAT WINDOW WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="fixed bottom-[164px] right-4 lg:bottom-24 lg:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[500px] max-h-[60vh] sm:max-h-[550px] bg-panel-bg backdrop-blur-2xl border-2 border-black dark:border-zinc-800 rounded-2xl shadow-[6px_6px_0px_#000000] flex flex-col overflow-hidden"
          >
            {/* 1. Header Bar */}
            <div className="bg-bg-secondary border-b-2 border-black dark:border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-brand-emerald/10 border border-brand-emerald/20 rounded-lg flex items-center justify-center text-brand-emerald shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="font-display text-xs font-bold text-text-primary block uppercase tracking-wider">SFRT AI Assistant</span>
                  <div className="flex items-center gap-1 leading-none mt-0.5">
                    <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full animate-pulse" />
                    <span className="text-[8px] text-text-secondary uppercase font-bold tracking-widest leading-none">Online • gemini-2.5-flash</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Reset button */}
                <button
                  onClick={handleClearChat}
                  className="p-1.5 text-text-secondary hover:text-red-500 rounded-lg hover:bg-overlay transition-colors cursor-pointer"
                  title="Clear chat history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-overlay transition-colors cursor-pointer"
                  title="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Messages List Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-overlay/10">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`p-3 rounded-2xl text-[11px] text-left max-w-[85%] border-2 border-black dark:border-zinc-800 ${
                      msg.role === 'user'
                        ? 'bg-brand-emerald/10 text-text-primary rounded-tr-none shadow-[2px_2px_0px_#000000] ml-auto'
                        : 'bg-bg-secondary text-text-primary rounded-tl-none shadow-[2px_2px_0px_#000000] mr-auto'
                    }`}
                  >
                    {renderMessageText(msg.content)}
                  </div>
                </div>
              ))}

              {/* Loader/Typing indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-1.5 p-3.5 bg-bg-secondary border-2 border-black dark:border-zinc-800 rounded-2xl rounded-tl-none shadow-[2px_2px_0px_#000000] w-16 items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 3. Input & Suggestion Chips Area */}
            <div className="bg-bg-secondary border-t-2 border-black dark:border-zinc-800 p-3 space-y-3 shrink-0">
              
              {/* Suggestion Chips */}
              <div className="flex gap-2 overflow-x-auto py-0.5 custom-scrollbar select-none text-left no-scrollbar">
                {suggestions.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(chip.prompt)}
                    disabled={isLoading}
                    className="border-2 border-black dark:border-zinc-800 bg-bg-primary hover:bg-brand-emerald/10 px-2.5 py-1 rounded-xl text-[9px] font-bold text-text-secondary hover:text-brand-emerald cursor-pointer transition-all shadow-[1.5px_1.5px_0px_#000000] hover:translate-y-[-0.5px] hover:translate-x-[-0.5px] hover:shadow-[2px_2px_0px_#000000] active:translate-y-0 active:translate-x-0 active:shadow-none shrink-0 uppercase tracking-wider"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Chat Text Input Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex gap-2 items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  placeholder={
                    language === 'id' 
                      ? 'Tanyakan apa saja kepada AI...' 
                      : 'Ask anything to AI...'
                  }
                  className="flex-grow bg-overlay border-2 border-black dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-text-primary focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/10 focus:outline-none transition-colors disabled:opacity-60"
                />
                
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-brand-emerald text-white rounded-xl border-2 border-black dark:border-zinc-800 hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0 shadow-[2px_2px_0px_#000000] hover:shadow-[3.5px_3.5px_0px_#000000] active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
