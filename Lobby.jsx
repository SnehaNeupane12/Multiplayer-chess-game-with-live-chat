import React, { useEffect, useState } from "react";
import { socket } from "../lib/socket.js";

export default function Lobby({ onJoin }) {
  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    function onRoomState(data) {
      setStatus(`Room players: ${data.players.join(", ")}`);
    }
    socket.on("room_state", onRoomState);
    return () => { socket.off("room_state", onRoomState); };
  }, []);

  const createRoom = () => {
    socket.emit("create_room", ({ roomId, color }) => {
      onJoin(roomId, color);
    });
  };

  const joinRoom = () => {
    if (!roomId) return;
    socket.emit("join_room", { roomId }, (res) => {
      if (res?.error) { setStatus(res.error); return; }
      onJoin(res.roomId, res.color);
    });
  };

  return (
    <div className="lobby">
      <h2>Online Lobby</h2>
      <div style={{display:"flex", gap:8, alignItems:"center"}}>
        <button className="btn primary" onClick={createRoom}>Create Room</button>
        <span>or</span>
        <input value={roomId} onChange={e=>setRoomId(e.target.value.toUpperCase())} placeholder="ROOMID" />
        <button className="btn secondary" onClick={joinRoom}>Join</button>
      </div>
      <p style={{marginTop:8}}>{status}</p>
    </div>
  );
}
