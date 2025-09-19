import React, { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { socket } from "../lib/socket.js";
import { pickBotMove } from "../lib/bot.js";
import EmojiSplash from "./EmojiSplash.jsx";

const pieceSymbols = {
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
};

function fenToBoard(fen) {
  const rows = fen.split(" ")[0].split("/");
  return rows.map(r => {
    const row = [];
    for (const ch of r) {
      if (/\d/.test(ch)) {
        const n = parseInt(ch,10);
        for (let i=0;i<n;i++) row.push(null);
      } else {
        row.push(ch);
      }
    }
    return row;
  });
}

export default function Board({ mode, room, myColor, onCapture, onGameEnd }) {
  const [fen, setFen] = useState(new Chess().fen());
  const [turn, setTurn] = useState("w");
  const [selected, setSelected] = useState(null);
  const [legal, setLegal] = useState({});
  const [flash, setFlash] = useState(null);

  const chessRef = useRef(new Chess());

  // ONLINE: listen for server game state
  useEffect(() => {
    if (mode !== "online") return;
    const onState = (state) => {
      setFen(state.fen);
      setTurn(state.turn);
      setLegal(state.legalMoves || {});
      chessRef.current.load(state.fen);
      if (state.lastMove?.flags?.includes("c")) onCapture && onCapture();
      if (state.game_over) {
        if (state.checkmate) onGameEnd && onGameEnd({ winner: state.turn === "w" ? "b" : "w" });
        else onGameEnd && onGameEnd({ draw: true });
      }
    };
    const onEnd = (payload) => onGameEnd && onGameEnd(payload);
    socket.on("game_state", onState);
    socket.on("game_end", onEnd);
    return () => {
      socket.off("game_state", onState);
      socket.off("game_end", onEnd);
    };
  }, [mode, onCapture, onGameEnd]);

  // OFFLINE: initialize
  useEffect(() => {
    if (mode !== "offline") return;
    chessRef.current = new Chess();
    setFen(chessRef.current.fen());
    setTurn(chessRef.current.turn());
    setLegal(groupLegal(chessRef.current));
  }, [mode]);

  function groupLegal(chess) {
    const moves = chess.moves({ verbose: true });
    const map = {};
    for (const m of moves) {
      if (!map[m.from]) map[m.from] = [];
      map[m.from].push(m.to);
    }
    return map;
  }

  function coordToSquare(r, c) {
    const file = "abcdefgh"[c];
    const rank = 8 - r;
    return `${file}${rank}`;
  }

  function onClickSquare(r, c) {
    const sq = coordToSquare(r, c);
    const current = chessRef.current;
    const isMyTurn = mode === "offline" || (mode === "online" && ((myColor || "w") === current.turn()));

    if (!isMyTurn) return;

    if (selected && legal[selected]?.includes(sq)) {
      // attempt move
      const moveObj = { from: selected, to: sq, promotion: "q" };
      if (mode === "offline") {
        const move = current.move(moveObj);
        if (!move) { setSelected(null); return; }
        if (move.flags.includes("c")) onCapture && onCapture();
        setFen(current.fen());
        setTurn(current.turn());
        setLegal(groupLegal(current));
        setSelected(null);

        // Check game end
        if (current.isGameOver()) {
          if (current.isCheckmate()) {
            // Player just moved; winner is the side who made the move
            // Determine "me" as white in offline by default
            onGameEnd && onGameEnd({ winner: move.color });
          } else {
            onGameEnd && onGameEnd({ draw: true });
          }
          return;
        }

        // Bot move
        setTimeout(() => {
          const botMove = pickBotMove(current);
          if (botMove) {
            const mv = current.move(botMove);
            if (mv?.flags?.includes("c")) onCapture && onCapture();
            setFen(current.fen());
            setTurn(current.turn());
            setLegal(groupLegal(current));

            if (current.isGameOver()) {
              if (current.isCheckmate()) {
                onGameEnd && onGameEnd({ winner: mv.color });
              } else {
                onGameEnd && onGameEnd({ draw: true });
              }
            }
          }
        }, 350);
      } else {
        socket.emit("make_move", { roomId: room, ...moveObj }, (res) => {
          if (res?.error) {
            setFlash(res.error);
            setTimeout(()=>setFlash(null), 900);
          } else {
            // server will broadcast new state
            setSelected(null);
          }
        });
      }
    } else {
      // select if there are legal moves from this sq
      if (legal[sq]?.length) setSelected(sq);
      else setSelected(null);
    }
  }

  const board = useMemo(() => fenToBoard(fen), [fen]);
  const rotated = (myColor === "b");

  return (
    <div>
      <div className="turn-indicator">
        Turn: {turn === "w" ? "White" : "Black"}
        {flash && <span style={{marginLeft:8,color:"#d00"}}>• {flash}</span>}
      </div>
      <div className="board" style={{transform: rotated ? "rotate(180deg)" : "none"}}>
        {board.map((row, rIdx) => (
          <div className="row" key={rIdx}>
            {row.map((cell, cIdx) => {
              const isLight = (rIdx + cIdx) % 2 === 0;
              const sq = coordToSquare(rIdx, cIdx);
              const isSel = selected === sq;
              const can = legal[selected]?.includes(sq);

              const content = cell ? (
                <span style={{transform: rotated ? "rotate(180deg)" : "none"}}>
                  {pieceSymbols[cell] ?? ""}
                </span>
              ) : null;

              return (
                <div
                  key={cIdx}
                  className={`square ${isLight ? "light" : "dark"} ${isSel ? "highlight" : ""} ${can ? "can-move" : ""}`}
                  onClick={() => onClickSquare(rIdx, cIdx)}
                >
                  {content}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
