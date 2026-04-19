import { useEffect, useRef, useState } from "react";
import { Send, X, Smile } from "lucide-react";

export default function MeetingChat({ messages, onSendMessage, onClose, currentUser }) {
  const [text, setText] = useState("");
  const scrollRef = useRef();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text);
      setText("");
    }
  };

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h2 className="text-xl font-bold">Chat</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-2 transition hover:bg-white/5"
        >
          <X size={20} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-6 space-y-4 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="text-center text-sm text-slate-500 mt-20">
            No messages yet. Say hello!
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.sender === currentUser;
          return (
            <div
              key={idx}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 px-1 mb-1">
                 {!isMe && <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">{msg.sender}</span>}
                 <span className="text-[10px] text-slate-500">
                   {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
              </div>
              <div
                className={`max-w-[85%] rounded-[20px] px-4 py-2.5 text-sm ${
                  isMe
                    ? "bg-brand-gradient text-white"
                    : "bg-white/5 text-slate-200"
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="relative flex items-center rounded-2xl border border-white/10 bg-white/5 p-2 transition-all focus-within:border-indigo-400/40 focus-within:bg-white/[0.08]">
          <button type="button" className="p-2 text-slate-500 hover:text-white">
            <Smile size={20} />
          </button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Send a message..."
            className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-indigo-500 text-white shadow-glow transition disabled:opacity-50 disabled:grayscale hover:scale-105"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
