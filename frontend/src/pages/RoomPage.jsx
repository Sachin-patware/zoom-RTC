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
  const [hostId, setHostId] = useState(null);

  const peersRef = useRef([]); // To keep track of peer objects
  const userVideo = useRef();
  const streamRef = useRef(null); // Keep a ref to the stream for reliable cleanup

  useEffect(() => {
    if (!socket) return;

    const startCall = async () => {
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
          console.log("Existing users in room to connect with:", users);
          setHostId(currentHostId);
          const newPeers = [];
          
          for (const userData of users) {
            const pc = createPeerConnection(userData.id, localStream);
            newPeers.push({
              peerId: userData.id,
              name: userData.name,
              isHost: userData.isHost,
              pc,
              stream: null
            });
          }
          peersRef.current = newPeers;
          setPeers(newPeers.map(p => ({ ...p, pc: undefined }))); // Avoid setting PC in React state

          // Create an offer for everyone in the room
          for (const peerObj of peersRef.current) {
            try {
              const offer = await peerObj.pc.createOffer();
              await peerObj.pc.setLocalDescription(offer);
              socket.emit("offer", peerObj.peerId, offer);
            } catch (err) {
              console.error("Error creating offer for", peerObj.peerId, err);
            }
          }
        });

        // When someone ELSE joins after me, they will call me.
        socket.on("user-joined", (userData) => {
          console.log("New user joined:", userData.id);
          toast(`${userData.name} joined the meeting`);
          // We wait for their "offer" emitted from their all-users flow
        });

        socket.on("new-host", (newHostId) => {
          setHostId(newHostId);
          setPeers(prev => prev.map(p => ({ ...p, isHost: p.peerId === newHostId })));
          if (socket.id === newHostId) {
             toast("You are now the host!");
          }
        });

        // WebRTC Signaling Listeners
        socket.on("offer", async (callerId, offer) => {
          console.log("Received offer from:", callerId);
          let peerObj = peersRef.current.find((p) => p.peerId === callerId);
          
          if (!peerObj) {
            const pc = createPeerConnection(callerId, localStream);
            peerObj = {
              peerId: callerId,
              name: "Guest", // You can sync actual names via a separate metadata event later
              isHost: false,
              pc,
              stream: null
            };
            peersRef.current.push(peerObj);
            setPeers(prev => [...prev, { peerId: callerId, name: "Guest", isHost: false, stream: null }]);
          }

          try {
            await peerObj.pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerObj.pc.createAnswer();
            await peerObj.pc.setLocalDescription(answer);
            socket.emit("answer", callerId, answer);
          } catch (err) {
            console.error("Error handling offer:", err);
          }
        });

        socket.on("answer", async (callerId, answer) => {
          console.log("Received answer from:", callerId);
          const peerObj = peersRef.current.find((p) => p.peerId === callerId);
          if (peerObj) {
            try {
              await peerObj.pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (err) {
              console.error("Error setting remote description from answer:", err);
            }
          }
        });

        socket.on("ice-candidate", async (callerId, candidate) => {
          const peerObj = peersRef.current.find((p) => p.peerId === callerId);
          if (peerObj && candidate) {
            try {
              await peerObj.pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("Error adding ice candidate:", err);
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
          console.log("User left:", userId);
          const peerObj = peersRef.current.find((p) => p.peerId === userId);
          if (peerObj && peerObj.pc) {
            peerObj.pc.close();
          }
          peersRef.current = peersRef.current.filter((p) => p.peerId !== userId);
          setPeers([...peersRef.current]);
        });
      } catch (err) {
        console.error("Failed to get media devices:", err);
        toast.error("Could not access camera/microphone");
      }
    };

    startCall();

    return () => {
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
      
      // 3. Remove socket listeners
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("chat-message");
      socket.off("message-history");
      socket.off("user-left");
    };
  }, [socket, roomId]);

  const createPeerConnection = (targetId, localStream) => {
    const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" }
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
      console.log("Received remote track from:", targetId);
      const [remoteStream] = event.streams;
      setPeers((prev) => 
        prev.map((p) => p.peerId === targetId ? { ...p, stream: remoteStream } : p)
      );
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
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
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
