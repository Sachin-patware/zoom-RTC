import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Monitor, Volume2, Camera, Palette, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { LogOut } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

const hardwareSchema = z.object({
  camera: z.string(),
  microphone: z.string(),
  speaker: z.string(),
  noiseCancellation: z.boolean().default(true),
  hdVideo: z.boolean().default(true),
});

export default function SettingsPage() {
  const { user, logout } = useAuth() as any;
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch {
      toast.error("Logout failed");
    }
  };

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  const hardwareForm = useForm<z.infer<typeof hardwareSchema>>({
    resolver: zodResolver(hardwareSchema),
    defaultValues: {
      camera: "cam1",
      microphone: "mic1",
      speaker: "spk1",
      noiseCancellation: true,
      hdVideo: true,
    },
  });

  const onProfileSubmit = (values: z.infer<typeof profileSchema>) => {
    toast.success("Profile Updated locally! Profile changes have been saved.");
  };

  const onHardwareSubmit = (values: z.infer<typeof hardwareSchema>) => {
    toast.success("Device Settings Saved successfully.");
  };

  const userInitials = user?.name ? user.name.slice(0, 2).toUpperCase() : "SM";

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
      <div className="mb-10">
        <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and devices.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-8 bg-card/50 border border-white/5 h-12 p-1 gap-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md px-6">
            <User className="h-4 w-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="hardware" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md px-6">
            <Monitor className="h-4 w-4 mr-2" /> Audio & Video
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-md px-6">
            <Palette className="h-4 w-4 mr-2" /> Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your photo and personal details.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-8">
                <div className="h-24 w-24 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl font-display font-bold text-primary ring-2 ring-primary/30 shadow-[0_0_15px_-3px_hsl(var(--primary)/0.4)]">
                  {userInitials}
                </div>
                <div className="space-y-2">
                  <Button variant="outline" className="border-white/10 bg-white/5" size="sm">Change Avatar</Button>
                  <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input className="bg-black/40 border-white/10" {...field} data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" disabled className="bg-black/40 border-white/10 opacity-70" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="glow-primary" data-testid="btn-save-profile">Save Changes</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="border-red-900/30 bg-red-950/10 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-500 mb-1">
                <Shield className="h-5 w-5" />
                <CardTitle className="text-red-500">Danger Zone</CardTitle>
              </div>
              <CardDescription className="text-red-500/70">Irreversible account actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <div>
                  <h4 className="font-medium text-sm text-white">Log Out</h4>
                  <p className="text-sm text-muted-foreground mt-1">Sign out of your active session on this device.</p>
                </div>
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> Log Out
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">Delete Account</h4>
                  <p className="text-sm text-muted-foreground mt-1">Permanently remove your account and all meeting history.</p>
                </div>
                <Button variant="destructive" className="bg-red-600/20 text-red-500 hover:bg-red-600/30 hover:text-red-400 border border-red-900/50">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hardware" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Devices</CardTitle>
              <CardDescription>Configure your camera and audio equipment.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...hardwareForm}>
                <form onSubmit={hardwareForm.handleSubmit(onHardwareSubmit)} className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2"><Camera className="h-4 w-4" /> Video</h3>
                    <FormField
                      control={hardwareForm.control}
                      name="camera"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Camera</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-black/40 border-white/10" data-testid="select-camera">
                                <SelectValue placeholder="Select a camera" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="border-white/10 bg-zinc-950 text-white">
                              <SelectItem value="cam1">FaceTime HD Camera (Built-in)</SelectItem>
                              <SelectItem value="cam2">Logitech Brio 4K</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={hardwareForm.control}
                      name="hdVideo"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4 mt-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable HD Video</FormLabel>
                            <FormDescription>Send 720p/1080p video when bandwidth permits</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-hd" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-sm font-medium flex items-center gap-2"><Volume2 className="h-4 w-4" /> Audio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={hardwareForm.control}
                        name="microphone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">Microphone</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-black/40 border-white/10" data-testid="select-mic">
                                  <SelectValue placeholder="Select a microphone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="border-white/10 bg-zinc-950 text-white">
                                <SelectItem value="mic1">MacBook Pro Microphone</SelectItem>
                                <SelectItem value="mic2">External USB Audio</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={hardwareForm.control}
                        name="speaker"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">Speakers</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-black/40 border-white/10" data-testid="select-speaker">
                                  <SelectValue placeholder="Select speakers" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="border-white/10 bg-zinc-950 text-white">
                                <SelectItem value="spk1">MacBook Pro Speakers</SelectItem>
                                <SelectItem value="spk2">External Headphones</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={hardwareForm.control}
                      name="noiseCancellation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4 mt-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">AI Noise Cancellation</FormLabel>
                            <FormDescription>Filter out keyboard typing and background noise</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-noise" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="glow-primary" data-testid="btn-save-hardware">Save Device Settings</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>SyncMeet is designed as a dark-first experience.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                <div className="border-2 border-primary rounded-xl p-4 bg-zinc-950 cursor-pointer relative overflow-hidden">
                  <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-black"></div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <div className="w-8 h-8 rounded-md bg-zinc-800"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-2 bg-zinc-800 rounded w-3/4"></div>
                      <div className="h-2 bg-zinc-800 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-white">Cockpit Dark</div>
                  <div className="text-xs text-muted-foreground mt-1">High contrast, electric accents</div>
                </div>

                <div className="border border-white/10 rounded-xl p-4 bg-zinc-900 cursor-not-allowed opacity-50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-sm font-medium text-white mb-1">Light Mode</div>
                    <div className="text-xs text-muted-foreground">Not available in 2.0</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
