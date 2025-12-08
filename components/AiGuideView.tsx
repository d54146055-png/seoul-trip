import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { sendGeminiMessage } from '../services/geminiService';
import { Send, MapPin, Sparkles, Bot } from 'lucide-react';

const AiGuideView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: '你好！我是你的首爾 AI 導遊 🇰🇷。想知道哪裡有好吃的醬蟹，或是怎麼搭公車去南山塔嗎？隨時問我！',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate location (City Hall)
      const mockLocation = { latitude: 37.5665, longitude: 126.9780 }; 
      
      const response = await sendGeminiMessage(messages.concat(userMsg), userMsg.text, mockLocation);
      setMessages(prev => [...prev, response]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-cream-50 page-transition pb-20">
        {/* Header */}
        <div className="bg-cream-50 pt-6 pb-2 px-6 sticky top-0 z-10 border-b border-cream-100/50">
            <h1 className="text-2xl font-bold text-cream-900 flex items-center">
                <Sparkles className="text-purple-400 mr-2" size={24} fill="currentColor" fillOpacity={0.2}/>
                首爾嚮導
            </h1>
            <p className="text-sm text-cream-500">Powered by Gemini</p>
        </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                
                {/* Bubble */}
                <div
                    className={`px-5 py-3.5 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                        ? 'bg-cream-800 text-white rounded-br-none'
                        : 'bg-white text-gray-700 rounded-bl-none border border-cream-100'
                    }`}
                >
                    <div style={{whiteSpace: 'pre-wrap'}}>{msg.text}</div>
                    
                    {/* Map Links */}
                    {msg.mapLinks && msg.mapLinks.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-dashed border-gray-100 space-y-2">
                            {msg.mapLinks.map((link, idx) => (
                                <a 
                                    key={idx} 
                                    href={link.uri} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="block bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-2.5 rounded-xl text-xs flex items-center transition-colors font-medium"
                                >
                                    <MapPin size={14} className="mr-2"/>
                                    {link.title}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
                {msg.role === 'model' && (
                    <span className="text-[10px] text-cream-400 mt-1 ml-2">AI Guide</span>
                )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white px-5 py-4 rounded-[1.5rem] rounded-bl-none shadow-sm border border-cream-100">
                    <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-cream-300 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-cream-300 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-cream-300 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-cream-100 absolute bottom-20 left-0 right-0">
        <div className="relative flex items-center max-w-md mx-auto">
            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="問問看附近的咖啡廳..."
            className="w-full bg-cream-100 rounded-full py-4 pl-6 pr-14 outline-none focus:ring-2 focus:ring-cream-300 transition-all text-sm font-medium placeholder-cream-400 text-gray-800"
            />
            <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2.5 bg-cream-900 text-white rounded-full disabled:opacity-50 hover:bg-black transition-colors shadow-md"
            >
            <Send size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default AiGuideView;