import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Video, ArrowRight, Keyboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const joinSchema = z.object({
  code: z.string().min(5, "Meeting code must be at least 5 characters").max(12, "Meeting code is too long"),
});

export default function JoinPage() {
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);

  const form = useForm<z.infer<typeof joinSchema>>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof joinSchema>) => {
    setIsJoining(true);
    setTimeout(() => {
      navigate(`/room/${values.code}`);
      setIsJoining(false);
    }, 600);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 w-full">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary mb-6 ring-1 ring-primary/30 glow-primary">
            <Video className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">Join Meeting</h1>
          <p className="text-muted-foreground">Enter the meeting code provided by the host.</p>
        </div>

        <Card className="border-white/10 bg-card/60 backdrop-blur-xl shadow-2xl">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Meeting Code</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Keyboard className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input 
                            placeholder="abc-defg-hij" 
                            className="pl-10 h-12 bg-black/40 border-white/10 font-mono text-lg tracking-wider"
                            {...field} 
                            data-testid="input-meeting-code"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base glow-primary" 
                  disabled={isJoining}
                  data-testid="btn-join-submit"
                >
                  {isJoining ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-r-transparent animate-spin"></span>
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Join Room <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center flex items-center justify-center text-sm text-muted-foreground">
          <Shield className="h-4 w-4 mr-2 text-primary" />
          End-to-end encrypted sessions
        </div>
      </div>
    </div>
  );
}
