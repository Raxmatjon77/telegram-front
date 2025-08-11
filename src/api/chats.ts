import { useApi } from "./index";
import { Chat, User } from "../types";

export const useChatsApi = () => {
  const api = useApi();

  const getChats = async (): Promise<Chat[]> => {
    const response = await api.get("/chats");
    if (!response.ok) {
      throw new Error("Failed to fetch chats");
    }
    return response.json();
  };

  const searchChats = async (query: string): Promise<Chat[]> => {
    const response = await api.get(`/chats/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error("Failed to search chats");
    }
    return response.json();
  };

  const searchUsers = async (query: string): Promise<Chat[]> => {
    const response = await api.get(`/chats/search/users?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error("Failed to search users");
    }
    return response.json();
  };

  const getPinnedChats = async (): Promise<Chat[]> => {
    const response = await api.get("/chats/pinned");
    if (!response.ok) {
      throw new Error("Failed to fetch pinned chats");
    }
    return response.json();
  };

  const createDirectChat = async (targetUserId: string): Promise<Chat> => {
    const response = await api.post(`/chats/direct/${targetUserId}`);
    if (!response.ok) {
      throw new Error("Failed to create direct chat");
    }
    return response.json();
  };

  const createGroupChat = async (data: { name: string; participantIds: string[] }): Promise<void> => {
    const response = await api.post("/chats", data);
    if (!response.ok) {
      throw new Error("Failed to create group chat");
    }
  };

  const leaveChat = async (chatId: string): Promise<void> => {
    const response = await api.del(`/chats/${chatId}/leave`);
    if (!response.ok) {
      throw new Error("Failed to leave chat");
    }
  };

  const markAsRead = async (chatId: string): Promise<void> => {
    const response = await api.put(`/chats/${chatId}/read`);
    if (!response.ok) {
      throw new Error("Failed to mark as read");
    }
  };

  const markAllAsRead = async (chatId: string): Promise<void> => {
    const response = await api.put(`/chats/${chatId}/read-all`);
    if (!response.ok) {
      throw new Error("Failed to mark all as read");
    }
  };

  const pinChat = async (chatId: string, isPinned: boolean): Promise<void> => {
    const response = await api.put(`/chats/${chatId}/pin`, { isPinned });
    if (!response.ok) {
      throw new Error("Failed to pin/unpin chat");
    }
  };

  return {
    getChats,
    searchChats,
    searchUsers,
    getPinnedChats,
    createDirectChat,
    createGroupChat,
    leaveChat,
    markAsRead,
    markAllAsRead,
    pinChat,
  };
};