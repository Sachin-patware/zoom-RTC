import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, 
  MonitorUp, Hand, MessageSquare, Users, 
  Settings, PhoneOff, MoreVertical, LayoutGrid,
  ShieldAlert, Circle, Maximize, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";

interface Peer {
  peerId: string;
  name: string;
  isHost: boolean;
  stream: MediaStream | null;
}

interface Message {
  message: string;
  sender: string;
  timestamp: number;
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const socket = useSocket();
  const { user } = useAuth();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarActive, setSidebarActive] = useState<'chat' | 'people' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [hasJoined, setHasJoined] = useState(() => {
    return sessionStorage.getItem(`joined_${roomId}`) === "true";
  });
  const [hostId, setHostId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const peersRef = useRef<any[]>([]);
  const userVideo = useRef<HTMLVideoElement>(null);
  const lobbyVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Hide main layout navigation for this screen
  useEffect(() => {
    document.body.classList.add("room-active");
    return () => {
      document.body.classList.remove("room-active");
    };
  }, []);

  // Fetch media for lobby before joining
  useEffect(() => {
    if (hasJoined) return;
    const getLobbyMedia = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setStream(localStream);
        streamRef.current = localStream;
        if (lobbyVideoRef.current) {
          lobbyVideoRef.current.srcObject = localStream;
        }
      } catch (e) {
        console.error(e);
        toast.error("Could not access camera/microphone");
      }
    };
    getLobbyMedia();
  }, [hasJoined]);

  // WebRTC signaling
  useEffect(() => {
    if (!socket || !hasJoined) return;

    const startCall = async () => {
      if (socket && !socket.connected) {
        socket.connect();
      }

      // Save meeting to user's history when they join
      const currentUserId = user?.id || user?._id;
      if (currentUserId && roomId) {
        try {
          let label = "Instant Call";
          try {
            const details = await apiRequest(`/meetings/details/${roomId}`);
            if (details && details.label) {
              label = details.label;
            }
          } catch {
            // Meeting details not found (e.g. instant call), default to "Instant Call"
          }
          
          await apiRequest("/meetings/save", {
            method: "POST",
            body: {
              user_id: currentUserId,
              meeting_id: roomId,
              label
            }
          });
        } catch (err) {
          console.error("Failed to save meeting to history:", err);
        }
      }

      try {
        let localStream = streamRef.current;
        if (!localStream) {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          setStream(localStream);
          streamRef.current = localStream;
        }
        if (userVideo.current) {
          userVideo.current.srcObject = localStream;
        }

        socket.emit("join-call", roomId, user?.name);

        socket.on("all-users", async (users: any[], currentHostId: string) => {
          setHostId(currentHostId);
          const newPeers: any[] = [];
          
          for (const userData of users) {
             const pc = createPeerConnection(userData.id, localStream!, userData.name);
             const peerObj = {
               peerId: userData.id,
               name: userData.name,
               isHost: userData.isHost,
               pc,
               stream: null,
               candidateQueue: [],
               isRemoteDescriptionSet: false
             };
             newPeers.push(peerObj);
          }
          
          peersRef.current = newPeers;
          setPeers(newPeers.map(p => ({ 
            peerId: p.peerId, 
            name: p.name, 
            isHost: p.isHost, 
            stream: null 
          })));

          for (const peerObj of peersRef.current) {
            try {
              const offer = await peerObj.pc.createOffer();
              await peerObj.pc.setLocalDescription(offer);
              socket.emit("offer", peerObj.peerId, { offer, name: user?.name });
            } catch (err) {
              console.error("Error creating offer:", err);
            }
          }
        });

        socket.on("user-joined", (userData: any) => {
          if (socket.id === hostId) {
            toast.success(`${userData.name} joined. You are the Host.`, {
              icon: "👑",
              duration: 4000
            });
          } else {
            toast(`${userData.name} joined the meeting`);
          }
        });

        socket.on("new-host", (newHostId: string) => {
          setHostId(newHostId);
          setPeers(prev => prev.map(p => ({ ...p, isHost: p.peerId === newHostId })));
          if (socket.id === newHostId) {
             toast("You are now the host!", { icon: "👑" });
          }
        });

        socket.on("offer", async (callerId: string, { offer, name }: any) => {
          let peerObj = peersRef.current.find((p) => p.peerId === callerId);
          
          if (!peerObj) {
            const pc = createPeerConnection(callerId, localStream!, name);
            peerObj = {
              peerId: callerId,
              name: name || "Guest",
              isHost: false,
              pc,
              stream: null,
              candidateQueue: [],
              isRemoteDescriptionSet: false
            };
            peersRef.current.push(peerObj);
            setPeers(prev => [...prev, { 
              peerId: callerId, 
              name: name || "Guest", 
              isHost: false, 
              stream: null 
            }]);
          }

          try {
            await peerObj.pc.setRemoteDescription(new RTCSessionDescription(offer));
            peerObj.isRemoteDescriptionSet = true;
            
            while (peerObj.candidateQueue.length > 0) {
              const candidate = peerObj.candidateQueue.shift();
              await peerObj.pc.addIceCandidate(new RTCIceCandidate(candidate));
            }

            const answer = await peerObj.pc.createAnswer();
            await peerObj.pc.setLocalDescription(answer);
            socket.emit("answer", callerId, { answer, name: user?.name });
          } catch (err) {
            console.error("Error handling offer:", err);
          }
        });

        socket.on("answer", async (callerId: string, { answer, name }: any) => {
          const peerObj = peersRef.current.find((p) => p.peerId === callerId);
          if (peerObj) {
            try {
              await peerObj.pc.setRemoteDescription(new RTCSessionDescription(answer));
              peerObj.isRemoteDescriptionSet = true;
              
              while (peerObj.candidateQueue.length > 0) {
                const candidate = peerObj.candidateQueue.shift();
                await peerObj.pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
            } catch (err) {
              console.error("Error setting remote description:", err);
            }
          }
        });

        socket.on("ice-candidate", async (callerId: string, candidate: any) => {
          const peerObj = peersRef.current.find((p) => p.peerId === callerId);
          if (peerObj && candidate) {
            try {
              if (peerObj.isRemoteDescriptionSet) {
                await peerObj.pc.addIceCandidate(new RTCIceCandidate(candidate));
              } else {
                peerObj.candidateQueue.push(candidate);
              }
            } catch (err) {
              console.error("Error handling ice candidate:", err);
            }
          }
        });

        socket.on("chat-message", (message: string, sender: string) => {
          setMessages((prev) => [...prev, { message, sender, timestamp: Date.now() }]);
        });

        socket.on("message-history", (history: Message[]) => {
          setMessages(history);
        });

        socket.on("user-left", (userId: string) => {
          const peerObj = peersRef.current.find((p) => p.peerId === userId);
          if (peerObj) {
            if (peerObj.pc) {
                peerObj.pc.close();
            }
            toast(`${peerObj.name || "Participant"} left the room`);
          }
          
          peersRef.current = peersRef.current.filter((p) => p.peerId !== userId);
          setPeers(prev => prev.filter(p => p.peerId !== userId));
        });

        socket.on("screen-share-started", (userId: string) => {
          const peer = peersRef.current.find(p => p.peerId === userId);
          if (peer) {
            toast(`${peer.name} started sharing their screen`);
          }
        });

        socket.on("screen-share-stopped", (userId: string) => {
          const peer = peersRef.current.find(p => p.peerId === userId);
          if (peer) {
            toast(`${peer.name} stopped sharing their screen`);
          }
        });

        socket.on("recording-started", () => {
          setIsRecording(true);
          toast("Recording started by the host", { icon: "⏺️" });
        });

        socket.on("recording-stopped", () => {
          setIsRecording(false);
          toast("Recording stopped by the host");
        });
      } catch (err) {
        console.error("Failed to get media devices:", err);
        toast.error("Could not access camera/microphone");
      }
    };

    startCall();

    const handleUnload = () => {
      socket.disconnect();
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (socket) {
         if (socket.connected) {
           socket.emit("leave-call", roomId);
         }
         socket.disconnect();
      }

      peersRef.current.forEach((peerObj) => {
        if (peerObj.pc) {
            peerObj.pc.close();
        }
      });
      peersRef.current = [];

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }

      socket.off("all-users");
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("screen-share-started");
      socket.off("screen-share-stopped");
      socket.off("recording-started");
      socket.off("recording-stopped");
      socket.off("chat-message");
      socket.off("message-history");
      socket.off("user-left");
    };
  }, [socket, roomId, hasJoined]);

  const createPeerConnection = (targetId: string, localStream: MediaStream, targetName: string) => {
    const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" }
        ]
    });

    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", targetId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      setPeers((prev) => 
        prev.map((p) => p.peerId === targetId ? { ...p, stream: remoteStream } : p)
      );
    };

    return pc;
  };

  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        peersRef.current.forEach((peerObj) => {
          if (peerObj.pc) {
            const sender = peerObj.pc.getSenders().find((s: any) => s.track && s.track.kind === "video");
            if (sender) {
              sender.replaceTrack(screenTrack);
            }
          }
        });

        if (userVideo.current) {
          userVideo.current.srcObject = screenStream;
        }

        setIsScreenSharing(true);
        socket.emit("screen-share-started", roomId);

        screenTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.error("Error sharing screen:", err);
        toast.error("Could not share screen");
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      peersRef.current.forEach((peerObj) => {
        if (peerObj.pc) {
          const sender = peerObj.pc.getSenders().find((s: any) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }
      });
    }

    if (userVideo.current && streamRef.current) {
      userVideo.current.srcObject = streamRef.current;
    }

    setIsScreenSharing(false);
    socket.emit("screen-share-stopped", roomId);
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (isVideoOff) {
      // Turn camera back ON
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = mediaStream.getVideoTracks()[0];
        
        if (streamRef.current) {
          streamRef.current.getVideoTracks().forEach(track => {
            track.stop();
            streamRef.current?.removeTrack(track);
          });
          streamRef.current.addTrack(videoTrack);
        }

        peersRef.current.forEach((peerObj) => {
          if (peerObj.pc) {
            const sender = peerObj.pc.getSenders().find((s: any) => s.track && s.track.kind === "video");
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          }
        });

        if (userVideo.current && streamRef.current) {
          userVideo.current.srcObject = null;
          userVideo.current.srcObject = streamRef.current;
          userVideo.current.play().catch(e => console.error("Error playing video:", e));
        }
        if (lobbyVideoRef.current && streamRef.current) {
          lobbyVideoRef.current.srcObject = null;
          lobbyVideoRef.current.srcObject = streamRef.current;
          lobbyVideoRef.current.play().catch(e => console.error("Error playing lobby video:", e));
        }

        setIsVideoOff(false);
      } catch (err) {
        console.error("Error enabling camera:", err);
        toast.error("Could not turn on camera");
      }
    } else {
      // Turn camera OFF
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => {
          track.enabled = false;
          track.stop();
        });
      }
      setIsVideoOff(true);
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      socket?.emit("stop-recording", roomId);
    } else {
      try {
        toast("Please select this tab or screen to record", { icon: "🎥" });
        const recordStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        recordedChunksRef.current = [];
        
        // Use supported MIME type
        let options = { mimeType: "video/webm; codecs=vp9" };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: "video/webm" };
        }
        
        const mediaRecorder = new MediaRecorder(recordStream, options);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          document.body.appendChild(a);
          a.style.display = "none";
          a.href = url;
          a.download = `SyncMeet-Recording-${roomId}-${new Date().toISOString().slice(0, 10)}.webm`;
          a.click();
          window.URL.revokeObjectURL(url);
          
          recordStream.getTracks().forEach(track => track.stop());
          toast.success("Recording downloaded successfully!");
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
        socket?.emit("start-recording", roomId);
        toast.success("Recording started.");
      } catch (err) {
        console.error("Error starting recording:", err);
        toast.error("Recording cancelled or failed.");
      }
    }
  };

  const leaveMeeting = () => {
    sessionStorage.removeItem(`joined_${roomId}`);
    if (socket) {
      socket.emit("leave-call", roomId);
      socket.disconnect();
    }
    navigate("/dashboard");
  };

  const handleSendMessage = () => {
    if (socket && chatInput.trim()) {
      socket.emit("chat-message", { path: roomId, message: chatInput }, user?.name || "Guest");
      setChatInput("");
    }
  };

  const toggleSidebar = (panel: 'chat' | 'people') => {
    setSidebarActive(current => current === panel ? null : panel);
  };

  if (!hasJoined) {
    // Elegant Lobby Pre-call UI matching modern template style
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white px-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
        <div className="noise-bg" />

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 bg-card/40 p-6 md:p-8 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl relative z-10">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-display font-bold tracking-tight">Ready to join?</h1>
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-white/10 shadow-inner flex items-center justify-center">
              <video
                ref={lobbyVideoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover rounded-2xl ${isVideoOff ? "hidden" : ""}`}
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-primary ring-2 ring-primary/30 text-3xl font-bold">
                    {(user?.name || "U").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="mt-4 text-sm text-muted-foreground">Camera is off</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-4 mt-2">
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                onClick={toggleMute}
                className="h-12 w-12 rounded-full"
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </Button>
              <Button
                variant={isVideoOff ? "destructive" : "secondary"}
                onClick={toggleVideo}
                className="h-12 w-12 rounded-full"
              >
                {isVideoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-8">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Meeting ID</div>
              <div className="text-md font-mono bg-black/50 px-4 py-3 rounded-xl border border-white/10 truncate">{roomId}</div>
            </div>
            <Button
              onClick={() => {
                sessionStorage.setItem(`joined_${roomId}`, "true");
                setHasJoined(true);
              }}
              className="h-14 text-lg glow-primary font-bold"
            >
              Join Meeting
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              className="h-14 mt-3 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate grid layouts based on participant count
  const totalTiles = peers.length + 1;
  const gridCols = 
    totalTiles === 1 
      ? "grid-cols-1" 
      : totalTiles === 2 
        ? "grid-cols-1 sm:grid-cols-2" 
        : totalTiles <= 4 
          ? "grid-cols-1 sm:grid-cols-2" 
          : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden z-[100]">
      {/* Top Bar */}
      <header className="h-14 flex items-center justify-between px-4 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10">
            <ShieldAlert className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium">Team Call</span>
            <span className="text-xs text-muted-foreground border-l border-white/10 pl-2 ml-1">{roomId}</span>
          </div>
          {socket && socket.id === hostId ? (
            <button 
              onClick={handleToggleRecording}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border transition-all duration-300 pointer-events-auto ${
                isRecording 
                  ? 'bg-red-500 text-white border-red-600 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
                  : 'bg-black/40 text-muted-foreground border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              <Circle className={`h-2.5 w-2.5 fill-current ${isRecording ? 'text-white animate-pulse' : 'text-red-500'}`} />
              {isRecording ? "STOP REC" : "START REC"}
            </button>
          ) : (
            isRecording && (
              <div className="flex items-center gap-1.5 bg-red-500/10 text-red-500 px-2.5 py-1.5 rounded-md border border-red-500/20 text-xs font-semibold animate-pulse">
                <Circle className="h-2.5 w-2.5 fill-current" /> REC
              </div>
            )
          )}
        </div>
        
        <div className="flex items-center gap-2 pointer-events-auto">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-full">
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-full">
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden pt-14 pb-20">
        {/* Video Grid */}
        <div className="flex-1 p-4 flex items-center justify-center relative transition-all duration-300">
          <div className={`grid ${gridCols} gap-3 w-full max-w-[1600px] h-full max-h-[90vh] auto-rows-fr`}>
            
            {/* Local Video Tile */}
            <div className={`relative rounded-xl overflow-hidden bg-zinc-900 border ${isVideoOff ? 'border-white/5' : 'border-primary ring-2 ring-primary/30'} flex items-center justify-center transition-all duration-300`}>
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
                  <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-display font-bold text-primary shadow-xl">
                    {(user?.name || "You").slice(0, 2).toUpperCase()}
                  </div>
                </div>
              )}
              <video
                ref={userVideo}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover scale-x-[-1]"
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 z-10">
                {isMuted ? <MicOff className="h-3.5 w-3.5 text-red-400" /> : <Mic className="h-3.5 w-3.5 text-green-400" />}
                <span className="text-sm font-medium text-white shadow-sm">{user?.name || "You"} (You)</span>
              </div>
            </div>

            {/* Remote Peer Tiles */}
            {peers.map((peer, index) => {
              const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500"];
              const randomColor = colors[index % colors.length];
              return (
                <RemoteVideoTile 
                  key={peer.peerId} 
                  peer={peer} 
                  avatarColor={randomColor} 
                />
              );
            })}
          </div>
        </div>

        {/* Sidebars */}
        <AnimatePresence>
          {sidebarActive && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full bg-zinc-950 border-l border-white/5 flex flex-col z-50 fixed sm:relative right-0 top-0 bottom-0 w-full sm:w-80 shadow-2xl sm:shadow-none"
            >
              <div className="h-14 border-b border-white/5 flex items-center justify-between px-4">
                <h3 className="font-medium text-sm">
                  {sidebarActive === 'chat' ? 'In-call Messages' : `Participants (${totalTiles})`}
                </h3>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-white/10" onClick={() => setSidebarActive(null)}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {sidebarActive === 'chat' ? (
                  <>
                    <div className="flex-1 flex flex-col justify-end gap-3 pb-4 overflow-y-auto">
                      {messages.map((msg, i) => {
                        const isSelf = msg.sender === (user?.name || "Guest");
                        return (
                          <div 
                            key={i} 
                            className={`p-3 rounded-xl text-sm max-w-[85%] ${
                              isSelf 
                                ? 'bg-primary/20 border border-primary/20 self-end rounded-tr-sm' 
                                : 'bg-white/5 self-start rounded-tl-sm'
                            }`}
                          >
                            {!isSelf && <span className="text-xs text-primary font-medium mb-1 block">{msg.sender}</span>}
                            {msg.message}
                          </div>
                        );
                      })}
                    </div>
                    <div className="relative mt-auto flex gap-2">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="Send message..." 
                        className="w-full bg-black/40 border border-white/10 rounded-full py-2.5 px-4 text-sm focus:outline-none focus:border-primary/50"
                      />
                      <Button onClick={handleSendMessage} size="icon" className="rounded-full shrink-0 h-10 w-10">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {(user?.name || "You").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{user?.name || "You"} (You)</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {isMuted ? <MicOff className="h-3.5 w-3.5 text-red-400" /> : <Mic className="h-3.5 w-3.5 text-green-400" />}
                      </div>
                    </div>
                    {peers.map(p => (
                      <div key={p.peerId} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold">
                            {(p.name || "Guest").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">{p.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] sm:w-auto max-w-[420px] sm:max-w-none">
        <div className="bg-zinc-900/85 backdrop-blur-xl border border-white/10 p-1.5 sm:p-2 rounded-2xl flex items-center justify-between sm:justify-center gap-1 sm:gap-2 shadow-2xl overflow-x-auto no-scrollbar">
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={isMuted ? "destructive" : "secondary"}
                size="icon" 
                className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl transition-all duration-300 shrink-0 ${!isMuted ? 'bg-white/10 hover:bg-white/20' : ''}`}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-4.5 w-4.5 sm:h-5 sm:w-5" /> : <Mic className="h-4.5 w-4.5 sm:h-5 sm:w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Microphone</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={isVideoOff ? "destructive" : "secondary"}
                size="icon" 
                className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl transition-all duration-300 shrink-0 ${!isVideoOff ? 'bg-white/10 hover:bg-white/20' : ''}`}
                onClick={toggleVideo}
              >
                {isVideoOff ? <VideoOff className="h-4.5 w-4.5 sm:h-5 sm:w-5" /> : <VideoIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Camera</TooltipContent>
          </Tooltip>

          <div className="hidden sm:block w-px h-8 bg-white/10 mx-1 shrink-0"></div>

          {/* Hide screen sharing on mobile since mobile browsers don't support tab/screen capture */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="secondary"
                size="icon" 
                className={`hidden sm:inline-flex h-12 w-12 rounded-xl bg-white/5 hover:bg-white/15 transition-all duration-300 shrink-0 ${isScreenSharing ? 'text-primary bg-primary/20 hover:bg-primary/30' : ''}`}
                onClick={handleToggleScreenShare}
              >
                <MonitorUp className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share Screen</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="secondary"
                size="icon" 
                className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/5 hover:bg-white/15 transition-all duration-300 shrink-0 ${isHandRaised ? 'text-amber-400 bg-amber-400/20 hover:bg-amber-400/30' : ''}`}
                onClick={() => setIsHandRaised(!isHandRaised)}
              >
                <Hand className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Raise Hand</TooltipContent>
          </Tooltip>

          <div className="hidden sm:block w-px h-8 bg-white/10 mx-1 shrink-0"></div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="secondary"
                size="icon" 
                className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/5 hover:bg-white/15 transition-all duration-300 shrink-0 ${sidebarActive === 'people' ? 'bg-white/20 text-white' : ''}`}
                onClick={() => toggleSidebar('people')}
              >
                <Users className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Participants</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="secondary"
                size="icon" 
                className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/5 hover:bg-white/15 relative transition-all duration-300 shrink-0 ${sidebarActive === 'chat' ? 'bg-white/20 text-white' : ''}`}
                onClick={() => toggleSidebar('chat')}
              >
                <MessageSquare className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 sm:top-2 sm:right-2 sm:h-2 sm:w-2 rounded-full bg-primary ring-2 ring-zinc-900"></span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chat</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="secondary"
                size="icon" 
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/5 hover:bg-white/15 shrink-0"
              >
                <Settings className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          <div className="hidden sm:block w-px h-8 bg-white/10 mx-1 shrink-0"></div>

          <Button 
            variant="destructive"
            className="h-10 px-3 sm:h-12 sm:px-6 rounded-xl font-medium shadow-[0_0_15px_-3px_hsl(var(--destructive)/0.5)] hover:bg-red-600 transition-all duration-300 shrink-0 flex items-center justify-center gap-1.5"
            onClick={leaveMeeting}
          >
            <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" /> 
            <span className="text-xs sm:text-sm font-semibold">Leave</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function RemoteVideoTile({ peer, avatarColor }: { peer: Peer; avatarColor: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideoOff = !peer.stream || peer.stream.getVideoTracks().length === 0;

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-white/5 flex items-center justify-center transition-all duration-300">
      {isVideoOff ? (
        <div className={`h-24 w-24 rounded-full ${avatarColor} flex items-center justify-center text-3xl font-display font-bold text-white shadow-xl`}>
          {(peer.name || "Guest").slice(0, 2).toUpperCase()}
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />
      )}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 z-10">
        <span className="text-sm font-medium text-white shadow-sm">{peer.name}</span>
      </div>
    </div>
  );
}
