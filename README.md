# Pawn Me Freak

A vibrant chess game built with **React + Vite** (frontend) and **Node.js + Socket.IO** (backend).  
Play offline vs bots or online with friends — with live chat, auto-suggest messages, and flashy captures.


## Features
- Two modes:
  - Offline vs Bot
  - Online with friends via WebSockets
- Live chat with auto-suggest messages
- Capture splash: big flashes when a piece is taken.
- Endgame messages
- Colorful UI with board highlights and gradients.
- Server-side validation with [chess.js](https://github.com/jhlywa/chess.js).


## Tech Stack
- Frontend: React 18, Vite, CSS
- Backend: Node.js, Express, Socket.IO
- Game Logic: chess.js
- Bot: simple capture-loving AI


## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/my-cool-chess-game.git
cd my-cool-chess-game


### 2. Start the backend
cd server
npm install
npm start


Backend runs at http://localhost:4000

### 3. Start the frontend

Open a new terminal:

cd client
npm install
npm run dev


Frontend runs at http://localhost:5173
 (or whichever port Vite prints).


How to Play

Offline Mode: Play against the bot.

Online Mode:

One player clicks Create Room.

The other clicks Join Room with the code.

Chat, play, and try not to get roasted.

Notes

Requires Node.js 18 or higher.

If ports are busy, change PORT in server/index.js and update frontend URL in client/src/lib/socket.js.

Do not upload node_modules to GitHub (already ignored via .gitignore).
