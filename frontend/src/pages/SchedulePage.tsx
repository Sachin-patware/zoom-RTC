import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Users, Video, Mic, Disc, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import toast from "react-hot-toast";

const scheduleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.date({ required_error: "Date is required" }),
  time: z.string().min(1, "Time is required"),
  duration: z.coerce.number().min(15, "Minimum 15 minutes"),
  maxParticipants: z.coerce.number().optional(),
  videoEnabled: z.boolean().default(true),
  audioEnabled: z.boolean().default(true),
  recordingEnabled: z.boolean().default(false),
  inviteEmails: z.string().optional(),
});

export default function SchedulePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      title: "",
      description: "",
      time: "10:00",
      duration: 30,
      videoEnabled: true,
      audioEnabled: true,
      recordingEnabled: false,
      inviteEmails: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof scheduleSchema>) => {
    setIsPending(true);
    try {
      const roomId = Math.random().toString(36).substring(2, 12);
      const currentUserId = user?.id || user?._id;

      // Combine date and time
      const [hours, minutes] = values.time.split(':');
      const startTime = new Date(values.date);
      startTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      if (currentUserId) {
        await apiRequest("/meetings/save", {
          method: "POST",
          body: {
            user_id: currentUserId,
            meeting_id: roomId,
            label: values.title,
            meeting_time: startTime.toISOString()
          }
        });
      }

      toast.success("Meeting scheduled successfully!");
      navigate(`/dashboard`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to schedule meeting.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <div className="mb-10">
        <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Schedule Meeting</h1>
        <p className="text-muted-foreground">Set up a new session and invite your team.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">General Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Quarterly Planning" className="bg-black/40 border-white/10" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Agenda items, preparation notes..." 
                          className="bg-black/40 border-white/10 min-h-[100px] resize-none" 
                          {...field} 
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal bg-black/40 border-white/10",
                                  !field.value && "text-muted-foreground"
                                )}
                                data-testid="input-date"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-white/10" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                              className="bg-card"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input type="time" className="pl-9 bg-black/40 border-white/10" {...field} data-testid="input-time" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (min)</FormLabel>
                          <FormControl>
                            <Input type="number" min="15" step="15" className="bg-black/40 border-white/10" {...field} data-testid="input-duration" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Participants</CardTitle>
                <CardDescription>Invite people by email</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="inviteEmails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emails (comma separated)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="sarah@example.com, john@example.com" 
                          className="bg-black/40 border-white/10 min-h-[80px]" 
                          {...field} 
                          data-testid="input-emails"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Participants (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative w-1/3">
                          <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input type="number" min="2" className="pl-9 bg-black/40 border-white/10" placeholder="No limit" {...field} data-testid="input-max-participants" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-white/5 bg-card/50 backdrop-blur-sm sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Room Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="videoEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          <Video className="h-4 w-4" /> Start with Video
                        </FormLabel>
                        <FormDescription>
                          Participants join with cameras on
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-video"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="audioEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          <Mic className="h-4 w-4" /> Start with Audio
                        </FormLabel>
                        <FormDescription>
                          Participants join unmuted
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-audio"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recordingEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          <Disc className="h-4 w-4" /> Auto-Record
                        </FormLabel>
                        <FormDescription>
                          Start recording automatically
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-record"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="pt-4 border-t border-white/5">
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base glow-primary" 
                    disabled={isPending}
                    data-testid="btn-submit"
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-r-transparent animate-spin"></span>
                        Scheduling...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" /> Schedule Meeting
                      </span>
                    )}
                  </Button>
                  <Button variant="ghost" className="w-full mt-2" type="button" onClick={() => navigate('/dashboard')}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
        </form>
      </Form>
    </div>
  );
}
