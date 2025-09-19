import { io } from "socket.io-client";

// Change if your backend isn't the default:
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export const socket = io(SERVER_URL, { autoConnect: true });
