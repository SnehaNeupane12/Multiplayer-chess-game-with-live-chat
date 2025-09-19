import React, { useEffect, useRef, useState } from "react";
import { socket } from "../lib/socket.js";

const suggests = [
  "you'll never win, you ain't real freak🥀🥀",
  "sybau bum"
];

export default function Chat({ room, enabled }) {
  const [name, setName] = useState(() => "Player" + Math.floor(Math.random()*90+10));
  const [msg, setMsg] = useState("");
  const [log, setLog] = useState([]);
  const endRef = useRef(null);

  useEffect(() => {
    function onMsg(m) {
      setLog(prev => [...prev, m]);
    }
    if (enabled) {
      socket.on("chat_message", onMsg);
      return () => socket.off("chat_message", onMsg);
    }
  }, [enabled]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  function send() {
    if (!enabled) return;
    if (!msg.trim()) return;
    socket.emit("chat_message", { roomId: room, name, message: msg });
    setMsg("");
  }

  return (
    <div className="chat">
      <h3>Live Chat</h3>
      <div className="chat-log">
        {log.map((l, i) => (
          <div className="chat-line" key={i}>
            <span className="name">{l.name}:</span> <span>{l.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="chat-input">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={{maxWidth:160}} />
        <input value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Type message..." onKeyDown={e=>e.key==="Enter"&&send()} />
        <button className="btn primary" onClick={send}>Send</button>
      </div>
      <div className="suggests">
        {suggests.map((s,i)=>(
          <button key={i} onClick={()=>setMsg(s)}>{s}</button>
        ))}
      </div>
    </div>
  );
}
