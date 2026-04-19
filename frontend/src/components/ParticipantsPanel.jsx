import { X, Search, MoreVertical, ShieldCheck } from "lucide-react";

export default function ParticipantsPanel({ peers, localName, isLocalHost, onClose }) {
  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h2 className="text-xl font-bold">Participants</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-2 transition hover:bg-white/5"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mt-4">
        <div className="relative flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 focus-within:border-indigo-400/50">
          <Search size={18} className="text-slate-500" />
          <input
            type="text"
            placeholder="Search participants..."
            className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none"
          />
        </div>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto space-y-4">
        {/* Local User */}
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold">
              {localName[0].toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                {localName} (You)
                {isLocalHost && <ShieldCheck size={14} className="text-indigo-400" />}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-tighter">
                {isLocalHost ? "Host" : "Participant"}
              </div>
            </div>
          </div>
          <button className="p-2 opacity-0 group-hover:opacity-100 transition">
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Remote Peers */}
        {peers.map((peer) => (
          <div key={peer.peerId} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-bold">
                {peer.name[0].toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  {peer.name}
                  {peer.isHost && <ShieldCheck size={14} className="text-indigo-400" />}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-tighter">
                  {peer.isHost ? "Host" : "Participant"}
                </div>
              </div>
            </div>
            <button className="p-2 opacity-0 group-hover:opacity-100 transition text-slate-400">
              <MoreVertical size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-white/5 pt-4">
        <button className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 transition">
          Mute All
        </button>
      </div>
    </div>
  );
}
