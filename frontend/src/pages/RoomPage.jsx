import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Users,
  Send,
  X
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import MeetingControls from "../components/MeetingControls";
import MeetingChat from "../components/MeetingChat";
import ParticipantsPanel from "../components/ParticipantsPanel";
import VideoGrid from "../components/VideoGrid";

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { user } = useAuth();

  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [hostId, setHostId] = useState(null);

  const peersRef = useRef([]); // To keep track of peer objects
  const userVideo = useRef();
  const streamRef = useRef(null); // Keep a ref to the stream for reliable cleanup
  const screenStreamRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const startCall = async () => {
      // Connect specifically when entering the room
      if (socket && !socket.connected) {
        socket.connect();
      }

      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setStream(localStream);
        streamRef.current = localStream;
        if (userVideo.current) {
          userVideo.current.srcObject = localStream;
        }

        socket.emit("join-call", roomId, user?.name);

        // When I join, I get the list of everyone else already there
        socket.on("all-users", async (users, currentHostId) => {
          console.log("Existing users in room:", users);
          setHostId(currentHostId);
          const newPeers = [];
          
          for (const userData of users) {
             // Create PC for each existing user
             const pc = createPeerConnection(userData.id, localStream, userData.name);
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

          // Now create offers for everyone
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

        // When someone ELSE joins after me, they will call me.
        socket.on("user-joined", (userData) => {
          console.log("New user joined:", userData.id);
          
          if (socket.id === hostId) {
            toast.success(`${userData.name} joined. You are the Host.`, {
              icon: "👑",
              duration: 4000
            });
          } else {
            toast(`${userData.name} joined the meeting`);
          }
        });

        socket.on("new-host", (newHostId) => {
          setHostId(newHostId);
          setPeers(prev => prev.map(p => ({ ...p, isHost: p.peerId === newHostId })));
          if (socket.id === newHostId) {
             toast("You are now the host!", { icon: "👑" });
          }
        });

        // WebRTC Signaling Listeners
        socket.on("offer", async (callerId, { offer, name }) => {
          console.log("Received offer from:", name || callerId);
          let peerObj = peersRef.current.find((p) => p.peerId === callerId);
          
          if (!peerObj) {
            const pc = createPeerConnection(callerId, localStream, name);
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
            
            // Process queued candidates
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

        socket.on("answer", async (callerId, { answer, name }) => {
          console.log("Received answer from:", name || callerId);
          const peerObj = peersRef.current.find((p) => p.peerId === callerId);
          if (peerObj) {
            try {
              await peerObj.pc.setRemoteDescription(new RTCSessionDescription(answer));
              peerObj.isRemoteDescriptionSet = true;
              
              // Process queued candidates
              while (peerObj.candidateQueue.length > 0) {
                const candidate = peerObj.candidateQueue.shift();
                await peerObj.pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
            } catch (err) {
              console.error("Error setting remote description from answer:", err);
            }
          }
        });

        socket.on("ice-candidate", async (callerId, candidate) => {
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

        socket.on("chat-message", (message, sender) => {
          setMessages((prev) => [...prev, { message, sender, timestamp: Date.now() }]);
        });

        socket.on("message-history", (history) => {
          setMessages(history);
        });

        socket.on("user-left", (userId) => {
          console.log("User left syncing:", userId);
          
          // Handle own cleanup if signaled (though usually handled by state/cleanup)
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

        socket.on("screen-share-started", (userId) => {
          const peer = peersRef.current.find(p => p.peerId === userId);
          if (peer) {
            toast(`${peer.name} started sharing their screen`);
          }
        });

        socket.on("screen-share-stopped", (userId) => {
          const peer = peersRef.current.find(p => p.peerId === userId);
          if (peer) {
            toast(`${peer.name} stopped sharing their screen`);
          }
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
      // Emit leave call and DISCONNECT immediately
      if (socket) {
         if (socket.connected) {
           socket.emit("leave-call", roomId);
         }
         socket.disconnect();
      }

      // 1. Destroy all WebRTC peer connections
      peersRef.current.forEach((peerObj) => {
        if (peerObj.pc) {
            peerObj.pc.close();
        }
      });
      peersRef.current = [];

      // 2. Stop all local camera/mic tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } else if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      
      // Stop screen share if active
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // 3. Remove socket listeners
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("screen-share-started");
      socket.off("screen-share-stopped");
      socket.off("chat-message");
      socket.off("message-history");
      socket.off("user-left");
    };
  }, [socket, roomId]);

  const handleToggleScreenShare = async () => {
    if (!isSharingScreen) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace track for all peers
        replaceVideoTrackForAllPeers(screenTrack);

        // Update local video
        if (userVideo.current) {
          userVideo.current.srcObject = screenStream;
        }

        setIsSharingScreen(true);
        socket.emit("screen-share-started", roomId);

        // Handle manual stop share (browser button)
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

    const videoTrack = streamRef.current.getVideoTracks()[0];
    replaceVideoTrackForAllPeers(videoTrack);

    // Revert local video
    if (userVideo.current) {
      userVideo.current.srcObject = streamRef.current;
    }

    setIsSharingScreen(false);
    socket.emit("screen-share-stopped", roomId);
  };

  const replaceVideoTrackForAllPeers = (newTrack) => {
    peersRef.current.forEach((peerObj) => {
      if (peerObj.pc) {
        const sender = peerObj.pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(newTrack);
        }
      }
    });
  };

  const createPeerConnection = (targetId, localStream, targetName) => {
    const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
    });

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", targetId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      console.log(`Received ${event.track.kind} track from:`, targetName || targetId);
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      
      setPeers((prev) => 
        prev.map((p) => p.peerId === targetId ? { ...p, stream: remoteStream } : p)
      );
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${targetId}:`, pc.connectionState);
      if (pc.connectionState === "failed") {
         pc.restartIce();
      }
    };

    return pc;
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  const leaveMeeting = () => {
    if (socket) {
      socket.emit("leave-call", roomId);
      socket.disconnect(); // Close connection to prevent ghosting
    }
    navigate("/dashboard");
  };

  const sendMessage = (text) => {
    if (socket && text.trim()) {
      socket.emit("chat-message", { path: roomId, message: text }, user.name);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ink-950 text-white">
      {/* Header / Info */}
      <div className="flex items-center justify-between border-b border-white/5 bg-ink-900/50 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient">
            <Video size={20} />
          </div>
          <div>
            <h1 className="font-bold">Meeting Room</h1>
            <p className="text-xs text-slate-400">Room ID: {roomId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-sm font-bold">
            {peers.length + 1}
          </div>
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-2 transition rounded-xl ${isChatOpen ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 hover:bg-white/10'}`}
          >
            <MessageSquare size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Video Area */}
        <div className={`flex-1 transition-all duration-300 ${(isChatOpen || isParticipantsOpen) ? 'mr-[380px]' : ''}`}>
          <VideoGrid
            localStream={stream}
            peers={peers}
            userVideoRef={userVideo}
            isMuted={isMuted}
            localName={user?.name || "You"}
          />
        </div>

        {/* Side Panel (Chat or Participants) */}
        <aside
          className={`absolute top-0 right-0 h-full w-[380px] border-l border-white/5 bg-ink-900/80 backdrop-blur-3xl shadow-2xl transition-transform duration-300 transform ${
            (isChatOpen || isParticipantsOpen) ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {isChatOpen && (
            <MeetingChat
              messages={messages}
              onSendMessage={sendMessage}
              onClose={() => setIsChatOpen(false)}
              currentUser={user?.name}
            />
          )}

          {isParticipantsOpen && (
            <ParticipantsPanel
              peers={peers}
              localName={user?.name || "User"}
              isLocalHost={socket?.id === hostId}
              onClose={() => setIsParticipantsOpen(false)}
            />
          )}
        </aside>
      </div>

      {/* Controls Bar */}
      <MeetingControls
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isSharingScreen={isSharingScreen}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onLeave={leaveMeeting}
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          setIsParticipantsOpen(false);
        }}
        isChatOpen={isChatOpen}
        onToggleParticipants={() => {
          setIsParticipantsOpen(!isParticipantsOpen);
          setIsChatOpen(false);
        }}
        isParticipantsOpen={isParticipantsOpen}
      />
    </div>
  );
}
