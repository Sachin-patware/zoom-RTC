import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import Peer from "simple-peer";
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
        socket.on("all-users", (users, currentHostId) => {
          console.log("Existing users in room to connect with:", users);
          setHostId(currentHostId);
          const newPeers = [];
          users.forEach((userData) => {
            const peer = createPeer(userData.id, socket.id, localStream);
            newPeers.push({
              peerId: userData.id,
              name: userData.name,
              isHost: userData.isHost,
              peer
            });
          });
          peersRef.current = newPeers;
          setPeers(newPeers);
        });

        // When someone ELSE joins after me, they will call me.
        // I just need to be ready to receive their signal.
        socket.on("user-joined", (userData) => {
          console.log("New user joined:", userData.id);
          toast(`${userData.name} joined the meeting`);
          // We don't initiate here; the joiner will initiate.
        });

        socket.on("new-host", (newHostId) => {
          setHostId(newHostId);
          setPeers(prev => prev.map(p => ({ ...p, isHost: p.peerId === newHostId })));
          if (socket.id === newHostId) {
             toast("You are now the host!");
          }
        });

        socket.on("signal", (callerId, signal) => {
          console.log("Processing signal from:", callerId);
          const item = peersRef.current.find((p) => p.peerId === callerId);
          if (item) {
            item.peer.signal(signal);
          } else {
            // New incoming connection from a new joiner
            console.log("Adding new peer from signal:", callerId);
            const peer = addPeer(signal, callerId, localStream);
            const newPeerObj = {
              peerId: callerId,
              name: "Guest", // Will be properly synced via backend
              isHost: false, // New joiners are never hosts initially
              peer
            };
            peersRef.current.push(newPeerObj);
            setPeers([...peersRef.current]);
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
          if (peerObj) {
            peerObj.peer.destroy();
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
        if (peerObj.peer) {
            peerObj.peer.destroy();
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
      socket.off("signal");
      socket.off("chat-message");
      socket.off("message-history");
      socket.off("user-left");
    };
  }, [socket, roomId]);

  function createPeer(userToSignal, callerId, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: true,
      stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" }
        ]
      }
    });

    peer.on("signal", (signal) => {
      socket.emit("signal", userToSignal, signal);
    });

    return peer;
  }

  function addPeer(incomingSignal, callerId, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: true,
      stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" }
        ]
      }
    });

    peer.on("signal", (signal) => {
      socket.emit("signal", callerId, signal);
    });

    peer.signal(incomingSignal);

    return peer;
  }

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
