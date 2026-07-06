import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, Clock, ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { format } from "date-fns";

interface Meeting {
  _id: string;
  meeting_id: string;
  label: string;
  meeting_time: string;
}

export default function HistoryPage() {
  const { user } = useAuth() as any;
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const currentUserId = user?.id || user?._id;
      if (!currentUserId) return;
      try {
        const data = await apiRequest(`/meetings/list/${currentUserId}`);
        setMeetings(data || []);
      } catch (error) {
        console.error("Error fetching meeting history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user?.id, user?._id]);

  const safeFormatDate = (dateStr: string, formatStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return format(new Date(), formatStr);
      }
      return format(d, formatStr);
    } catch {
      return format(new Date(), formatStr);
    }
  };

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-10">
        <Link to="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition hover:bg-white/10">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Meeting History</h1>
          <p className="text-muted-foreground">Your most recent video sessions and room logs.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/5" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <Card className="border-white/5 bg-card/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <CalendarIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No meeting logs found</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mt-1">Your meeting logs will show up here once you join or schedule a session.</p>
            <Link to="/schedule">
              <Button variant="secondary">Schedule Meeting</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {meetings.map((meeting, i) => (
            <motion.div
              key={meeting._id || meeting.meeting_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-white/5 bg-card/50 hover:bg-white/[0.04] transition-colors group overflow-hidden relative">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          {safeFormatDate(meeting.meeting_time, 'MMM')}
                        </span>
                        <span className="text-lg font-display font-bold leading-none">
                          {safeFormatDate(meeting.meeting_time, 'd')}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold font-display mb-1">{meeting.label || "Instant Call"}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> 
                            {safeFormatDate(meeting.meeting_time, 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-mono text-muted-foreground px-3 py-1.5 rounded-md bg-black/40 border border-white/5 mr-2">
                        {meeting.meeting_id}
                      </div>
                      <Button 
                        className="glow-primary" 
                        onClick={() => navigate(`/room/${meeting.meeting_id}`)}
                        data-testid={`btn-join-${meeting.meeting_id}`}
                      >
                        Rejoin
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
