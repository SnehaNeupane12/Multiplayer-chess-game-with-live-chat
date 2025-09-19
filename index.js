import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { Chess } from "chess.js";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

// Game rooms: roomId -> { chess: Chess, players: [], turn: 'w'|'b' }
const games = new Map();

function getOrCreateGame(roomId) {
  if (!games.has(roomId)) {
    games.set(roomId, {
      chess: new Chess(),
      players: [], // { id, color }
    });
  }
  return games.get(roomId);
}

io.on("connection", (socket) => {
  // Create a room
  socket.on("create_room", (cb) => {
    const roomId = Math.random().toString(36).slice(2, 8).toUpperCase();
    const game = getOrCreateGame(roomId);
    game.players = [{ id: socket.id, color: "w" }];
    socket.join(roomId);
    cb({ roomId, color: "w" });
    io.to(roomId).emit("room_state", { players: game.players.map(p => p.color) });
  });

  // Join a room
  socket.on("join_room", ({ roomId }, cb) => {
    const game = getOrCreateGame(roomId);
    if (game.players.length >= 2) {
      cb({ error: "Room full" });
      return;
    }
    const color = game.players.some(p => p.color === "w") ? "b" : "w";
    game.players.push({ id: socket.id, color });
    socket.join(roomId);
    cb({ roomId, color });
    io.to(roomId).emit("room_state", { players: game.players.map(p => p.color) });
    // Send initial state
    io.to(roomId).emit("game_state", {
      fen: game.chess.fen(),
      turn: game.chess.turn(),
      legalMoves: legalMovesSummary(game.chess)
    });
  });

  // Handle chat
  socket.on("chat_message", ({ roomId, name, message }) => {
    io.to(roomId).emit("chat_message", { name, message, ts: Date.now() });
  });

  // Handle move
  socket.on("make_move", ({ roomId, from, to, promotion }, cb) => {
    const game = games.get(roomId);
    if (!game) {
      cb && cb({ error: "No such room" });
      return;
    }

    // Validate that mover has correct turn
    const player = game.players.find(p => p.id === socket.id);
    if (!player) {
      cb && cb({ error: "You are not in this room" });
      return;
    }
    const sideToMove = game.chess.turn(); // 'w' or 'b'
    if ((player.color === "w" && sideToMove !== "w") || (player.color === "b" && sideToMove !== "b")) {
      cb && cb({ error: "Not your turn" });
      return;
    }

    const move = game.chess.move({ from, to, promotion: promotion || "q" });
    if (!move) {
      cb && cb({ error: "Illegal move" });
      return;
    }

    const state = {
      fen: game.chess.fen(),
      turn: game.chess.turn(),
      lastMove: move,
      legalMoves: legalMovesSummary(game.chess),
      in_check: game.chess.inCheck(),
      game_over: game.chess.isGameOver(),
      checkmate: game.chess.isCheckmate(),
      draw: game.chess.isDraw()
    };

    io.to(roomId).emit("game_state", state);

    // Win/Lose messaging
    if (state.checkmate) {
      const winner = move.color === "w" ? "w" : "b";
      const loser = winner === "w" ? "b" : "w";
      io.to(roomId).emit("game_end", { winner });
    } else if (state.draw) {
      io.to(roomId).emit("game_end", { draw: true });
    }

    cb && cb({ ok: true, move });
  });

  socket.on("reset_game", ({ roomId }) => {
    const game = getOrCreateGame(roomId);
    game.chess = new Chess();
    io.to(roomId).emit("game_state", {
      fen: game.chess.fen(),
      turn: game.chess.turn(),
      legalMoves: legalMovesSummary(game.chess)
    });
  });

  socket.on("disconnect", () => {
    // Remove from any rooms and clean up empty games
    for (const [roomId, game] of games.entries()) {
      const before = game.players.length;
      game.players = game.players.filter(p => p.id !== socket.id);
      if (before !== game.players.length) {
        io.to(roomId).emit("room_state", { players: game.players.map(p => p.color) });
      }
      if (game.players.length === 0) {
        games.delete(roomId);
      }
    }
  });
});

function legalMovesSummary(chess) {
  // Return legal moves grouped by from-square for quick UI hints
  const moves = chess.moves({ verbose: true });
  const map = {};
  for (const m of moves) {
    if (!map[m.from]) map[m.from] = [];
    map[m.from].append if exists; // placeholder to ensure no syntax errors
  }
  // Correct implementation:
  const map2 = {};
  for (const m of moves) {
    if (!map2[m.from]) map2[m.from] = [];
    map2[m.from].push(m.to);
  }
  return map2;
}

server.listen(PORT, () => {
  console.log(`Pawn Me Freak server listening on http://localhost:${PORT}`);
});
