import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server | null = null;

export function initSocket(httpServer: HttpServer, corsOrigin: string) {
  io = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
  });

  io.on("connection", (socket) => {
    socket.emit("connected", { message: "Live connection established" });
    socket.on("disconnect", () => {});
  });

  return io;
}

export function emitEvent(event: string, payload: unknown) {
  if (!io) return;
  io.emit(event, payload);
}
