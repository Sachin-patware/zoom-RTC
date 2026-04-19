import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Users,
  Settings
} from "lucide-react";

export default function MeetingControls({
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onLeave,
  onToggleChat,
  isChatOpen,
  onToggleParticipants,
  isParticipantsOpen
}) {
  return (
    <div className="flex h-24 items-center justify-center gap-4 bg-ink-950/80 px-6 backdrop-blur-xl border-t border-white/5">
      <div className="flex items-center gap-3">
        <ControlButton
          onClick={onToggleMute}
          active={!isMuted}
          icon={isMuted ? <MicOff size={22} className="text-rose-400" /> : <Mic size={22} />}
          tooltip={isMuted ? "Unmute" : "Mute"}
        />
        <ControlButton
          onClick={onToggleVideo}
          active={!isVideoOff}
          icon={isVideoOff ? <VideoOff size={22} className="text-rose-400" /> : <Video size={22} />}
          tooltip={isVideoOff ? "Start Video" : "Stop Video"}
        />
      </div>

      <div className="mx-4 h-8 w-px bg-white/10" />

      <button
        onClick={onLeave}
        className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.3)] transition-all hover:scale-110 hover:-rotate-12 active:scale-95"
      >
        <PhoneOff size={24} />
      </button>

      <div className="mx-4 h-8 w-px bg-white/10" />

      <div className="flex items-center gap-3">
        <ControlButton
          onClick={onToggleChat}
          active={isChatOpen}
          icon={<MessageSquare size={22} />}
          tooltip="Chat"
          dot={true}
        />
        <ControlButton
          onClick={onToggleParticipants}
          active={isParticipantsOpen}
          icon={<Users size={22} />}
          tooltip="Participants"
        />
        <ControlButton
          onClick={() => {}}
          icon={<Settings size={22} />}
          tooltip="Settings"
        />
      </div>
    </div>
  );
}

function ControlButton({ onClick, active = false, icon, tooltip, dot = false }) {
  return (
    <div className="group relative flex flex-col items-center">
      <button
        onClick={onClick}
        className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 active:scale-95 ${
          active
            ? "bg-white/10 text-white hover:bg-white/15 shadow-inner"
            : "bg-white/5 text-slate-400 hover:bg-white/10"
        }`}
      >
        {icon}
        {dot && (
           <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-indigo-500 border border-ink-950" />
        )}
      </button>
      
      <span className="absolute -top-10 scale-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-[10px] font-bold text-white transition-all group-hover:scale-100 uppercase tracking-wider">
        {tooltip}
      </span>
    </div>
  );
}
