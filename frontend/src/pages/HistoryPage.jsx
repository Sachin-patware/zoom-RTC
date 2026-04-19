import { useEffect, useState } from "react";
import { Clock3, Video, ArrowLeft, Calendar, Play } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import Navbar from "../components/Navbar";

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const currentUserId = user?._id || user?.id;
      if (!currentUserId) return;
      try {
        const data = await apiRequest(`/meetings/list/${currentUserId}`);
        setRecentMeetings(data || []);
      } catch (error) {
        console.error("Error fetching meeting history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user?._id, user?.id]);

  return (
    <div className="min-h-screen bg-hero-grid text-white">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition hover:bg-white/10">
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Meeting History</h1>
                <p className="mt-1 text-slate-400">Your most recent video sessions and room logs</p>
              </div>
            </div>
            <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 sm:block">
              {recentMeetings.length} Recorded Sessions
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-white" />
                <p className="text-slate-500 animate-pulse">Loading meeting logs...</p>
              </div>
            ) : recentMeetings.length ? (
              recentMeetings.map((meeting) => (
                <div
                  key={meeting._id || meeting.meeting_id}
                  className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-white/[0.04] transition group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300 group-hover:scale-105 transition">
                      <Video size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-white">{meeting.meeting_id}</div>
                      <div className="mt-1 flex items-center gap-4 text-xs font-medium text-slate-500 uppercase tracking-widest">
                         <span className="flex items-center gap-1.5 underline decoration-indigo-500/50 underline-offset-4">{meeting.label}</span>
                         <span className="flex items-center gap-1.5"><Calendar size={12}/> {new Date(meeting.meeting_time).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-4 sm:pt-0 border-t border-white/5 sm:border-0">
                    <div className="flex flex-col text-right">
                       <span className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Last join</span>
                       <span className="text-sm font-medium text-slate-300">{new Date(meeting.meeting_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <button 
                      onClick={() => navigate(`/room/${meeting.meeting_id}`)}
                      className="brand-button h-11 w-11 !p-0 flex items-center justify-center rounded-full"
                    >
                      <Play size={18} fill="currentColor" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-24 rounded-[40px] border-2 border-dashed border-white/5 bg-white/[0.01]">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-slate-600 mb-6">
                   <Clock3 size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-400">Ambient Silence</h3>
                <p className="mt-2 text-slate-500 text-center max-w-xs">
                  Your meeting history is empty. Once you start or join a call, it will appear here.
                </p>
                <Link to="/dashboard" className="mt-8 ghost-button">Back to Dashboard</Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
