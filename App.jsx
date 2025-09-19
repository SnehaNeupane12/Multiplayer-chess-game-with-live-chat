import React, { useState } from "react";
import Lobby from "./components/Lobby.jsx";
import Board from "./components/Board.jsx";
import Chat from "./components/Chat.jsx";
import EmojiSplash from "./components/EmojiSplash.jsx";

export default function App() {
  const [mode, setMode] = useState(null); // 'offline' | 'online'
  const [room, setRoom] = useState(null);
  const [myColor, setMyColor] = useState(null);
  const [splash, setSplash] = useState(false);
  const [result, setResult] = useState(null); // 'win' | 'lose' | 'draw' | null

  return (
    <div className="app">
      <header className="app-header">
        <h1>Pawn Me Freak</h1>
        <p className="tag">Vibrant chess with chat & bots</p>
      </header>

      {!mode && (
        <div className="mode-picker">
          <button className="btn primary" onClick={() => setMode("offline")}>Play Offline vs Bot</button>
          <button className="btn secondary" onClick={() => setMode("online")}>Play Online</button>
        </div>
      )}

      {mode === "online" && !room && (
        <Lobby
          onJoin={(r, color) => { setRoom(r); setMyColor(color); }}
        />
      )}

      {mode && (
        <div className="game-area">
          <Board
            mode={mode}
            room={room}
            myColor={myColor}
            onCapture={() => { setSplash(true); setTimeout(() => setSplash(false), 1000); }}
            onGameEnd={(payload) => {
              if (payload.draw) setResult("draw");
              else if (payload.winner) {
                setResult(payload.winner === myColor ? "win" : "lose");
              }
            }}
          />
          <Chat room={room} enabled={mode === "online"} />
        </div>
      )}

      {splash && <EmojiSplash emojis="👅💦" />}

      {result && (
        <div className="toast">
          {result === "win" && "you've won you freaky dreaky"}
          {result === "lose" && "youre not a real freak"}
          {result === "draw" && "draw"}
          <button className="btn tiny" onClick={() => setResult(null)}>x</button>
        </div>
      )}
    </div>
  );
}
