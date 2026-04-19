import { useEffect, useRef } from "react";

export default function VideoGrid({ localStream, peers, userVideoRef, isMuted, localName }) {
  // Calculate grid layout based on number of participants
  const total = peers.length + 1;
  const getGridCols = () => {
    if (total === 1) return "grid-cols-1";
    if (total === 2) return "grid-cols-1 sm:grid-cols-2";
    if (total <= 4) return "grid-cols-2";
    return "grid-cols-2 lg:grid-cols-3";
  };

  return (
    <div className={`grid ${getGridCols()} h-full gap-4 p-4 auto-rows-fr`}>
      {/* Local Video */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-ink-900 shadow-2xl">
        <video
          muted
          ref={userVideoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover scale-x-[-1]"
        />
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
          <span className="text-white">{localName} (You)</span>
          {isMuted && <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
        </div>
      </div>

      {/* Remote Peers */}
      {peers.map((peerObj) => (
        <RemoteVideo 
          key={peerObj.peerId} 
          peer={peerObj.peer} 
          peerId={peerObj.peerId} 
          name={peerObj.name} 
        />
      ))}
    </div>
  );
}

function RemoteVideo({ peer, peerId, name }) {
  const ref = useRef();

  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    });
  }, [peer]);

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-ink-900 shadow-2xl">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
      />
      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
        <span className="text-white">{name || "Guest"}</span>
      </div>
    </div>
  );
}
