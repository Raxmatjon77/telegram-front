import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { useAuth } from "../context/authContext";
import { Message } from "../types";

const SOCKET_URL = "http://localhost:4001";

interface SocketEvents {
  onMessage: (message: Message) => void;
  onUserOnline: (userId: string) => void;
  onUserOffline: (userId: string) => void;
  onTyping: (data: { userId: string; chatId: string }) => void;
  onStopTyping: (data: { userId: string; chatId: string }) => void;
}

export const useSocket = (events: SocketEvents) => {
  const {  token, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated  || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    socketRef.current = io(SOCKET_URL, {
      auth: {
        token,
        userId: 'dwdw',
      },
      transports: ["websocket"],
    });

    const socket = socketRef.current;

    // Connection events
    socket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    // Message events
    socket.on("message", events.onMessage);
    socket.on("user_online", events.onUserOnline);
    socket.on("user_offline", events.onUserOffline);
    socket.on("typing", events.onTyping);
    socket.on("stop_typing", events.onStopTyping);

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, 'user', token]);

  const sendMessage = (receiverId: string, content: string) => {
    if (socketRef.current && isConnected) {
      const message = {
        receiverId,
        content,
        timestamp: new Date().toISOString(),
      };
      socketRef.current.emit("send_message", message);
    }
  };

  const joinChat = (chatId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("join_chat", chatId);
    }
  };

  const leaveChat = (chatId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("leave_chat", chatId);
    }
  };

  const startTyping = (chatId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("typing", chatId);
    }
  };

  const stopTyping = (chatId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("stop_typing", chatId);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
  };
};
