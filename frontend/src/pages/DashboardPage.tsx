import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, Users, Calendar as CalendarIcon, Clock, Plus, ArrowRight, Play, LayoutDashboard, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function DashboardPage() {
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

  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "SM";

  const now = Date.now();
  const upcomingMeetings = meetings.filter(m => m.meeting_time && new Date(m.meeting_time).getTime() > now);
  const pastMeetings = meetings.filter(m => !m.meeting_time || new Date(m.meeting_time).getTime() <= now);
  const liveNowMeetings = upcomingMeetings.filter(m => Math.abs(new Date(m.meeting_time).getTime() - now) < 15 * 60 * 1000);

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

  const handleStartInstantMeeting = () => {
    const roomId = Math.random().toString(36).substring(2, 12);
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name || "User"}. You have {meetings.length} recent sessions.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={handleStartInstantMeeting}
            className="glow-primary bg-gradient-to-r from-primary to-accent border-none font-semibold cursor-pointer" 
            data-testid="btn-instant-dashboard"
          >
            <Video className="mr-2 h-4 w-4" /> Instant Meeting
          </Button>
          <Link to="/join">
            <Button variant="outline" className="border-white/10 glass-panel cursor-pointer" data-testid="btn-join-dashboard">
              <Plus className="mr-2 h-4 w-4" /> Join with Code
            </Button>
          </Link>
          <Link to="/schedule">
            <Button variant="secondary" className="border-white/5 bg-white/5 hover:bg-white/10 cursor-pointer" data-testid="btn-schedule-dashboard">
              <CalendarIcon className="mr-2 h-4 w-4" /> Schedule
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { title: "Total Meetings", value: pastMeetings.length, icon: LayoutDashboard, loading },
          { title: "Hours This Week", value: (pastMeetings.length * 0.5).toFixed(1), icon: Clock, loading },
          { title: "Most Active Day", value: pastMeetings.length > 0 ? "Today" : "-", icon: CalendarIcon, loading },
          { title: "Live Now", value: liveNowMeetings.length, icon: Play, loading, highlight: true }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`border-white/5 bg-card/50 backdrop-blur-sm ${stat.highlight && typeof stat.value === 'number' && stat.value > 0 ? 'border-primary/50 shadow-[0_0_15px_-3px_hsl(var(--primary)/0.2)]' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.highlight && typeof stat.value === 'number' && stat.value > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                {stat.loading ? (
                  <Skeleton className="h-8 w-16 bg-white/5" />
                ) : (
                  <div className="text-2xl font-bold font-mono">
                    {stat.highlight && typeof stat.value === 'number' && stat.value > 0 && (
                      <span className="relative inline-flex h-3 w-3 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                      </span>
                    )}
                    {stat.value !== undefined ? stat.value : '-'}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Meetings Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" /> Upcoming Meetings
            </h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/5" />
              ))}
            </div>
          ) : upcomingMeetings.length === 0 ? (
            <Card className="border-white/5 bg-card/30 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="font-medium">No upcoming meetings</p>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mt-1">Schedule a meeting to prepare and invite your team.</p>
                <Link to="/schedule">
                  <Button variant="secondary" size="sm">Schedule Meeting</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingMeetings.map((meeting, i) => (
                <motion.div
                  key={meeting._id || meeting.meeting_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-white/5 bg-card/50 hover:bg-white/[0.04] transition-colors group overflow-hidden relative">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                            <span className="text-[10px] font-semibold uppercase tracking-wider">
                              {safeFormatDate(meeting.meeting_time, 'MMM')}
                            </span>
                            <span className="text-base font-display font-bold leading-none">
                              {safeFormatDate(meeting.meeting_time, 'd')}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-base leading-tight mb-1">{meeting.label || "Scheduled Call"}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              {safeFormatDate(meeting.meeting_time, 'h:mm a')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-mono text-muted-foreground px-2 py-1 rounded bg-black/40 border border-white/5 hidden sm:block">
                            {meeting.meeting_id}
                          </div>
                          <Button 
                            size="sm"
                            className="glow-primary text-xs h-8 px-3" 
                            onClick={() => navigate(`/room/${meeting.meeting_id}`)}
                            data-testid={`btn-start-${meeting.meeting_id}`}
                          >
                            Start
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

        {/* Meeting History Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" /> Meeting History
            </h2>
            <Link to="/history">
              <Button variant="link" className="text-muted-foreground hover:text-foreground text-xs p-0 h-auto flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/5" />
              ))}
            </div>
          ) : pastMeetings.length === 0 ? (
            <Card className="border-white/5 bg-card/30 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <History className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="font-medium">No past meetings</p>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mt-1">Your logs will show up here after hosting or joining calls.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pastMeetings.slice(0, 4).map((meeting, i) => (
                <motion.div
                  key={meeting._id || meeting.meeting_id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-white/5 bg-card/50 hover:bg-white/[0.04] transition-colors group overflow-hidden relative">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              {safeFormatDate(meeting.meeting_time, 'MMM')}
                            </span>
                            <span className="text-base font-display font-bold leading-none text-muted-foreground">
                              {safeFormatDate(meeting.meeting_time, 'd')}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white/80 text-base leading-tight mb-1">{meeting.label || "Instant Call"}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              {safeFormatDate(meeting.meeting_time, 'h:mm a')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-mono text-muted-foreground px-2 py-1 rounded bg-black/40 border border-white/5 hidden sm:block">
                            {meeting.meeting_id}
                          </div>
                          <Button 
                            size="sm"
                            variant="secondary"
                            className="text-xs h-8 px-3" 
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
      </div>
    </div>
  );
}
