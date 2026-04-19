import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock3,
  Copy,
  LogOut,
  Plus,
  Video,
  VideoIcon
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RECENT_KEY = "zoomrtc_recent_meetings";

function createRoomId() {
  return `zrtc-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [recentMeetings, setRecentMeetings] = useState([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(RECENT_KEY);
    setRecentMeetings(raw ? JSON.parse(raw) : []);
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const saveMeeting = (nextRoomId, label) => {
    setRecentMeetings((current) => {
      const next = [
        {
          id: nextRoomId,
          label,
          time: new Date().toLocaleString()
        },
        ...current.filter((item) => item.id !== nextRoomId)
      ].slice(0, 5);

      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleStartMeeting = async () => {
    const nextRoomId = createRoomId();
    saveMeeting(nextRoomId, "Started new meeting");
    try {
      await navigator.clipboard.writeText(nextRoomId);
    } catch {
      // Copy support depends on browser permissions; the meeting ID is still created.
    }
    toast.success(`Meeting ID copied: ${nextRoomId}`);
    navigate(`/room/${nextRoomId}`);
  };

  const handleJoinMeeting = () => {
    let normalized = roomId.trim();

    // If a full URL was pasted, extract only the room ID (e.g. from http://localhost:5174/room/XYZ -> XYZ)
    if (normalized.includes("/room/")) {
      normalized = normalized.split("/room/").pop();
    }

    if (!normalized) {
      toast.error("Enter a room ID first.");
      return;
    }

    saveMeeting(normalized, "Joined meeting room");
    toast.success(`Joining room: ${normalized}`);
    navigate(`/room/${normalized}`);
    setRoomId("");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-hero-grid text-white">
      <header className="border-b border-white/10 bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
              <Video size={22} />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-white">ZoomRTC</div>
              <div className="text-sm text-slate-400">
                {greeting}, {user?.name || "there"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 sm:inline-flex">
              {user?.email}
            </div>
            <button type="button" onClick={handleLogout} className="ghost-button">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <div className="surface-card p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-indigo-200">
                <VideoIcon size={14} />
                Meeting controls
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Launch your next room in seconds
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                Start a new meeting instantly or join an existing room with a room ID.
                This dashboard is ready to sit in front of your existing RTC backend.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <button type="button" onClick={handleStartMeeting} className="surface-card group p-5 text-left transition hover:-translate-y-1 hover:bg-white/[0.07]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-200 transition group-hover:scale-105">
                    <Plus size={20} />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-white">Start New Meeting</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Generate a meeting ID and jump into your next session flow.
                  </p>
                </button>

                <div className="surface-card p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-200">
                    <ArrowRight size={20} />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-white">Join Meeting</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Enter an existing room ID to prepare the meeting experience.
                  </p>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={roomId}
                      onChange={(event) => setRoomId(event.target.value)}
                      placeholder="Enter room ID"
                      className="input-shell"
                    />
                    <button type="button" onClick={handleJoinMeeting} className="brand-button sm:min-w-[132px]">
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="surface-card p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Recent meetings</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Placeholder activity that you can later connect to real meeting history.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
                  {recentMeetings.length} items
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {recentMeetings.length ? (
                  recentMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white">{meeting.id}</div>
                        <div className="mt-1 text-sm text-slate-400">{meeting.label}</div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock3 size={16} />
                        {meeting.time}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-slate-400">
                    No meetings yet. Start one to populate this list.
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="surface-card p-6">
              <div className="rounded-[24px] border border-white/10 bg-ink-900/90 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Profile</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                      Active session
                    </div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-lg font-bold text-white">
                    {(user?.name || "U").slice(0, 1).toUpperCase()}
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="text-slate-500">Name</div>
                    <div className="mt-1 font-semibold text-white">{user?.name || "User"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="text-slate-500">Email</div>
                    <div className="mt-1 font-semibold text-white">{user?.email}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="text-slate-500">Provider</div>
                    <div className="mt-1 font-semibold capitalize text-white">{user?.provider || "local"}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="surface-card overflow-hidden p-0">
              <div className="bg-brand-gradient px-6 py-5">
                <div className="text-lg font-bold text-white">Quick actions</div>
                <div className="mt-1 text-sm text-indigo-100/80">
                  Useful shortcuts for your meeting flow
                </div>
              </div>
              <div className="space-y-3 p-6">
                <button
                  type="button"
                  onClick={handleStartMeeting}
                  className="ghost-button w-full justify-between"
                >
                  Copy new meeting ID
                  <Copy size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="ghost-button w-full justify-between"
                >
                  Back to home
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
