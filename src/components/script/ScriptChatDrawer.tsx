import React, { useState, useRef, useEffect } from 'react';
import { PodcastProject, ScriptLine } from '../../types';
import { MessageSquare, X, Send, Sparkles, Loader2, Bot, User } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ScriptChatDrawerProps {
  project: PodcastProject;
  onUpdateProject: (updated: PodcastProject) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ScriptChatDrawer: React.FC<ScriptChatDrawerProps> = ({
  project,
  onUpdateProject,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: `Hello! I'm your AI co-creator. Let's craft this podcast script together. Ask me to brainstorm ideas, add witty banter, adjust dialogue tones, or write new scenes!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/script-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characters: project.characters,
          existingScript: project.script,
          messages: messages.concat(userMsg),
          newMessage: text,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      if (data.lines && Array.isArray(data.lines)) {
        const newScriptLines: ScriptLine[] = data.lines.map((l: any, i: number) => {
          const matchedChar = project.characters.find(
            (c) => c.name.toLowerCase() === (l.characterName || '').toLowerCase()
          ) || project.characters[i % project.characters.length] || { id: 'char-1', name: 'Host' };

          return {
            id: l.id || 'line-' + Date.now() + '-' + i,
            characterId: matchedChar.id,
            characterName: matchedChar.name,
            text: l.text || '',
            emotionNote: l.emotionNote || '',
            sfxCue: l.sfxCue || '',
            isSceneHeader: l.isSceneHeader || false,
            sceneTitle: l.sceneTitle || undefined,
          };
        });

        onUpdateProject({
          ...project,
          script: newScriptLines,
          updatedAt: new Date().toISOString(),
        });
      }

      const assistantMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: data.reply || 'I have updated the script based on your request!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: 'Sorry, I encountered an error while updating the script. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "Make the banter punchier & funnier",
    "Add a dramatic sound effect cue",
    "Expand on the technical details",
    "Rewrite the intro hook",
  ];

  return (
    <div className="w-80 md:w-96 bg-[#FAF6EE] border-l border-[#E0D4C3] flex flex-col h-full shadow-lg z-20 shrink-0 font-sans text-xs">
      {/* Drawer Header */}
      <div className="h-12 px-4 border-b border-[#E0D4C3] flex items-center justify-between bg-[#EDE5D8]">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-[#C85A32]/10 flex items-center justify-center text-[#C85A32]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-[#2E2623]">AI Co-Creation Chat</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[#786B62] hover:text-[#2E2623] hover:bg-[#E0D4C3]/40 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2.5 ${
              msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-[#2E2623] text-white'
                  : 'bg-[#C85A32]/15 text-[#C85A32]'
              }`}
            >
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div
              className={`max-w-[75%] p-3 rounded-xl shadow-xs text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#2E2623] text-white rounded-tr-xs'
                  : 'bg-[#EDE5D8] text-[#2E2623] border border-[#E0D4C3] rounded-tl-xs'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <div
                className={`text-[10px] mt-1 text-right ${
                  msg.role === 'user' ? 'text-white/60' : 'text-[#786B62]'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 text-[#786B62] py-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#C85A32]" />
            <span>AI is brainstorming & updating script...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="p-3 border-t border-[#E0D4C3] bg-[#F5EFE6]">
        <div className="text-[10px] font-semibold text-[#786B62] mb-1.5 uppercase tracking-wider">
          Suggested Prompts
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="text-[11px] bg-[#FAF6EE] border border-[#E0D4C3] text-[#2E2623] px-2.5 py-1 rounded-md hover:bg-[#EDE5D8] transition text-left truncate max-w-full"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-[#E0D4C3] bg-[#EDE5D8]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask AI to co-create or edit script..."
            className="flex-1 bg-[#FAF6EE] border border-[#E0D4C3] rounded-lg px-3 py-2 text-xs text-[#2E2623] placeholder-[#A39587] focus:outline-none focus:ring-1 focus:ring-[#C85A32]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="bg-[#C85A32] hover:bg-[#B04C28] text-white p-2 rounded-lg transition disabled:opacity-50 shrink-0 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
