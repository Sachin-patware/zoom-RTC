import { useState, useMemo } from "react";
import {
  ArrowRight,
  Copy,
  Plus,
  Video,
  Link as LinkIcon,
  CheckCircle2,
  Share2
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import Navbar from "../components/Navbar";

function createRoomId() {
  return `ZRTC-${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 5)}`.toUpperCase();
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const saveMeeting = async (nextRoomId, label) => {
    const currentUserId = user?._id || user?.id;
    if (!currentUserId) return;
    try {
      await apiRequest("/meetings/save", {
        method: "POST",
        body: {
          user_id: currentUserId,
          meeting_id: nextRoomId,
          label
        }
      });
    } catch (error) {
      console.error("Error saving meeting:", error);
    }
  };

  const handleStartMeeting = async () => {
    const nextRoomId = createRoomId();
    await saveMeeting(nextRoomId, "Instant Meeting");
    toast.success("Meeting started!");
    navigate(`/room/${nextRoomId}`);
  };

  const handleCreateLink = () => {
    const nextRoomId = createRoomId();
    const fullUrl = `${window.location.origin}/room/${nextRoomId}`;
    setGeneratedLink(fullUrl);
    setIsLinkCopied(false);
    toast.success("Meeting link generated");
  };

  const copyGeneratedLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setIsLinkCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setIsLinkCopied(false), 3000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleJoinMeeting = () => {
    let normalized = roomId.trim();
    if (normalized.includes("/room/")) {
      normalized = normalized.split("/room/").pop();
    }

    if (!normalized) {
      toast.error("Please enter a meeting ID");
      return;
    }

    saveMeeting(normalized, "Joined Call");
    navigate(`/room/${normalized}`);
  };

  return (
    <div className="min-h-screen bg-hero-grid text-white overflow-hidden">
      <Navbar />

      <main className="flex min-h-screen flex-col items-center justify-center px-4 pb-20 pt-16">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
            Launch a meeting in seconds
          </h1>
          <p className="mt-4 text-lg text-slate-400 sm:text-xl">
            Start or join a video meeting quickly by using the options below.
          </p>
        </div>

        <div className="grid w-full max-w-5xl gap-8 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          {/* Start Meeting Card */}
          <div className="surface-card flex flex-col items-center justify-center p-8 text-center ring-1 ring-white/5 transition-all hover:ring-indigo-500/30 group">
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-indigo-500/10 text-indigo-400 transition-transform group-hover:scale-110 duration-500 group-hover:rotate-3 shadow-2xl">
              <Video size={36} />
            </div>
            
            <h2 className="mt-8 text-3xl font-bold text-white">Start a New Meeting</h2>
            <p className="mt-3 text-slate-400 max-w-[280px]">
              Generate a new meeting link to start an instant video call.
            </p>

            <button
              onClick={handleStartMeeting}
              className="mt-8 brand-button w-full sm:max-w-[240px] shadow-glow-indigo active:scale-95"
            >
              New Meeting
            </button>

            <div className="mt-8 flex flex-col items-center gap-3 w-full">
              {!generatedLink ? (
                <button 
                  onClick={handleCreateLink}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-indigo-300"
                >
                  <LinkIcon size={16} />
                  Create Meeting Link
                </button>
              ) : (
                <div className="flex w-full items-center gap-2 rounded-2xl bg-white/5 p-2 ring-1 ring-white/10">
                  <div className="flex-1 truncate px-3 text-xs text-slate-400">
                    {generatedLink}
                  </div>
                  <button 
                    onClick={copyGeneratedLink}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-indigo-300 transition hover:bg-white/20"
                    title="Copy Link"
                  >
                    {isLinkCopied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Join Meeting Card */}
          <div className="surface-card flex flex-col items-center justify-center p-8 text-center ring-1 ring-white/5 transition-all hover:ring-cyan-500/30 group">
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-cyan-500/10 text-cyan-400 transition-transform group-hover:scale-110 duration-500 group-hover:-rotate-3 shadow-2xl">
              <ArrowRight size={36} />
            </div>

            <h2 className="mt-8 text-3xl font-bold text-white">Join a Meeting</h2>
            <p className="mt-3 text-slate-400 max-w-[280px]">
              Enter a meeting ID to join an existing video call.
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:max-w-[340px]">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter meeting ID"
                className="input-shell flex-1 h-12 px-6 bg-white/[0.03] !rounded-2xl"
              />
              <button
                onClick={handleJoinMeeting}
                className="brand-button !bg-cyan-500 !from-cyan-500 !to-blue-600 sm:w-auto h-12 px-8 flex items-center justify-center shadow-glow-cyan active:scale-95"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <footer className="mt-16 text-center text-sm text-slate-500">
          <p>© 2026 ZoomRTC Platform. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
