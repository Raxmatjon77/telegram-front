// src/api/chats.ts
import { useApi } from "./index";
import { Chat, User, Message } from "../types";

export interface CreateGroupChatData {
  name: string;
  participantIds: string[];
  description?: string;
}

export interface UpdateChatData {
  name?: string;
  description?: string;
}

export interface MessageQueryParams {
  limit?: number;
  cursor?: string;
  before?: string;
  after?: string;
}

export interface ChatMember {
  userId: string;
  role: "admin" | "member" | "user" | "bot";
  joinedAt: string;
}

export const useChatsApi = () => {
  const api = useApi();

  // ================== CHAT MANAGEMENT ==================

  /**
   * Get all chats for the current user
   */
  const getChats = async (): Promise<Chat[]> => {
    const response = await api.get("/chats");
    if (!response.ok) {
      throw new Error("Failed to fetch chats");
    }
    return response.json();
  };

  /**
   * Get a specific chat by ID
   */
  const getChat = async (chatId: string): Promise<Chat> => {
    const response = await api.get(`/chats/${chatId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch chat");
    }
    return response.json();
  };

  /**
   * Create a direct (1-on-1) chat with another user
   */
  const createDirectChat = async (targetUserId: string): Promise<Chat> => {
    const response = await api.post(`/chats/direct/${targetUserId}`);
    if (!response.ok) {
      throw new Error("Failed to create direct chat");
    }
    return response.json();
  };

  /**
   * Create a group chat with multiple participants
   */
  const createGroupChat = async (data: CreateGroupChatData): Promise<Chat> => {
    const response = await api.post("/chats/group", data);
    if (!response.ok) {
      throw new Error("Failed to create group chat");
    }
    return response.json();
  };

  /**
   * Update chat information (name, description, etc.)
   */
  const updateChat = async (
    chatId: string,
    data: UpdateChatData
  ): Promise<Chat> => {
    const response = await api.put(`/chats/${chatId}`, data);
    if (!response.ok) {
      throw new Error("Failed to update chat");
    }
    return response.json();
  };

  /**
   * Delete a chat (admin only for groups, anyone for direct chats)
   */
  const deleteChat = async (chatId: string): Promise<void> => {
    const response = await api.delete(`/chats/${chatId}`);
    if (!response.ok) {
      throw new Error("Failed to delete chat");
    }
  };

  /**
   * Leave a chat (removes user from participants)
   */
  const leaveChat = async (chatId: string): Promise<void> => {
    const response = await api.delete(`/chats/${chatId}/leave`);
    if (!response.ok) {
      throw new Error("Failed to leave chat");
    }
  };

  // ================== SEARCH & DISCOVERY ==================

  /**
   * Search chats by name or participant name
   */
  const searchChats = async (query: string): Promise<Chat[]> => {
    const response = await api.get(
      `/chats/search?query=${encodeURIComponent(query)}`
    );
    if (!response.ok) {
      throw new Error("Failed to search chats");
    }
    return response.json();
  };

  /**
   * Search users to start new chats
   */
  const searchUsers = async (query: string): Promise<User[]> => {
    const response = await api.get(
      `/users/search?query=${encodeURIComponent(query)}`
    );
    if (!response.ok) {
      throw new Error("Failed to search users");
    }
    return response.json();
  };

  /**
   * Get suggested users based on mutual connections or activity
   */
  const getSuggestedUsers = async (): Promise<User[]> => {
    const response = await api.get("/users/suggestions");
    if (!response.ok) {
      throw new Error("Failed to fetch suggested users");
    }
    return response.json();
  };

  // ================== PINNED & FAVORITES ==================

  /**
   * Get pinned chats
   */
  const getPinnedChats = async (): Promise<Chat[]> => {
    const response = await api.get("/chats/pinned");
    if (!response.ok) {
      throw new Error("Failed to fetch pinned chats");
    }
    return response.json();
  };

  /**
   * Pin or unpin a chat
   */
  const pinChat = async (chatId: string, isPinned: boolean): Promise<void> => {
    const response = await api.put(`/chats/${chatId}/pin`, { isPinned });
    if (!response.ok) {
      throw new Error("Failed to pin/unpin chat");
    }
  };

  /**
   * Get archived chats
   */
  const getArchivedChats = async (): Promise<Chat[]> => {
    const response = await api.get("/chats/archived");
    if (!response.ok) {
      throw new Error("Failed to fetch archived chats");
    }
    return response.json();
  };

  /**
   * Archive or unarchive a chat
   */
  const archiveChat = async (
    chatId: string,
    isArchived: boolean
  ): Promise<void> => {
    const response = await api.put(`/chats/${chatId}/archive`, { isArchived });
    if (!response.ok) {
      throw new Error("Failed to archive/unarchive chat");
    }
  };

  // ================== MESSAGES ==================

  /**
   * Get messages for a specific chat with pagination
   */
  const getMessages = async (
    chatId: string,
    params?: MessageQueryParams
  ): Promise<Message[]> => {
    const queryString = new URLSearchParams();
    if (params?.limit) queryString.set("limit", params.limit.toString());
    if (params?.cursor) queryString.set("cursor", params.cursor);
    if (params?.before) queryString.set("before", params.before);
    if (params?.after) queryString.set("after", params.after);

    const url = `/chats/${chatId}/messages${
      queryString.toString() ? `?${queryString}` : ""
    }`;
    const response = await api.get(url);
    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }
    return response.json();
  };

  /**
   * Send a new message to a chat
   */
  const sendMessage = async (
    chatId: string,
    data: {
      text: string;
      type?: "text" | "image" | "file" | "voice";
      replyToId?: string;
      attachments?: string[];
    }
  ): Promise<Message> => {
    const response = await api.post(`/chats/${chatId}/messages`, data);
    if (!response.ok) {
      throw new Error("Failed to send message");
    }
    return response.json();
  };

  /**
   * Delete a message
   */
  const deleteMessage = async (
    chatId: string,
    messageId: string
  ): Promise<void> => {
    const response = await api.delete(`/chats/${chatId}/messages/${messageId}`);
    if (!response.ok) {
      throw new Error("Failed to delete message");
    }
  };

  /**
   * Edit a message
   */
  const editMessage = async (
    chatId: string,
    messageId: string,
    text: string
  ): Promise<Message> => {
    const response = await api.put(`/chats/${chatId}/messages/${messageId}`, {
      text,
    });
    if (!response.ok) {
      throw new Error("Failed to edit message");
    }
    return response.json();
  };

  /**
   * React to a message (like, heart, etc.)
   */
  const reactToMessage = async (
    chatId: string,
    messageId: string,
    reaction: string
  ): Promise<void> => {
    const response = await api.post(
      `/chats/${chatId}/messages/${messageId}/react`,
      {
        reaction,
      }
    );
    if (!response.ok) {
      throw new Error("Failed to react to message");
    }
  };

  /**
   * Remove reaction from a message
   */
  const removeReaction = async (
    chatId: string,
    messageId: string,
    reaction: string
  ): Promise<void> => {
    const response = await api.delete(
      `/chats/${chatId}/messages/${messageId}/react/${reaction}`
    );
    if (!response.ok) {
      throw new Error("Failed to remove reaction");
    }
  };

  // ================== READ STATUS ==================

  /**
   * Mark a chat as read (all messages)
   */
  const markAsRead = async (chatId: string): Promise<void> => {
    const response = await api.put(`/chats/${chatId}/read`);
    if (!response.ok) {
      throw new Error("Failed to mark as read");
    }
  };

  /**
   * Mark all chats as read
   */
  const markAllAsRead = async (): Promise<void> => {
    const response = await api.put(`/chats/read-all`);
    if (!response.ok) {
      throw new Error("Failed to mark all as read");
    }
  };

  /**
   * Mark specific message as read
   */
  const markMessageAsRead = async (
    chatId: string,
    messageId: string
  ): Promise<void> => {
    const response = await api.put(
      `/chats/${chatId}/messages/${messageId}/read`
    );
    if (!response.ok) {
      throw new Error("Failed to mark message as read");
    }
  };

  /**
   * Get read status for messages in a chat
   */
  const getReadStatus = async (
    chatId: string
  ): Promise<Record<string, string[]>> => {
    const response = await api.get(`/chats/${chatId}/read-status`);
    if (!response.ok) {
      throw new Error("Failed to fetch read status");
    }
    return response.json();
  };

  // ================== PARTICIPANTS MANAGEMENT ==================

  /**
   * Get chat participants
   */
  const getParticipants = async (chatId: string): Promise<User[]> => {
    const response = await api.get(`/chats/${chatId}/participants`);
    if (!response.ok) {
      throw new Error("Failed to fetch participants");
    }
    return response.json();
  };

  /**
   * Add participants to a group chat
   */
  const addParticipants = async (
    chatId: string,
    userIds: string[]
  ): Promise<void> => {
    const response = await api.post(`/chats/${chatId}/participants`, {
      userIds,
    });
    if (!response.ok) {
      throw new Error("Failed to add participants");
    }
  };

  /**
   * Remove a participant from a group chat
   */
  const removeParticipant = async (
    chatId: string,
    userId: string
  ): Promise<void> => {
    const response = await api.delete(
      `/chats/${chatId}/participants/${userId}`
    );
    if (!response.ok) {
      throw new Error("Failed to remove participant");
    }
  };

  /**
   * Update participant role (admin/member)
   */
  const updateParticipantRole = async (
    chatId: string,
    userId: string,
    role: "admin" | "member"
  ): Promise<void> => {
    const response = await api.put(
      `/chats/${chatId}/participants/${userId}/role`,
      {
        role,
      }
    );
    if (!response.ok) {
      throw new Error("Failed to update participant role");
    }
  };

  // ================== CHAT SETTINGS ==================

  /**
   * Update chat settings (notifications, etc.)
   */
  const updateChatSettings = async (
    chatId: string,
    settings: {
      notifications?: boolean;
      sound?: boolean;
      preview?: boolean;
    }
  ): Promise<void> => {
    const response = await api.put(`/chats/${chatId}/settings`, settings);
    if (!response.ok) {
      throw new Error("Failed to update chat settings");
    }
  };

  /**
   * Get chat settings
   */
  const getChatSettings = async (chatId: string): Promise<any> => {
    const response = await api.get(`/chats/${chatId}/settings`);
    if (!response.ok) {
      throw new Error("Failed to fetch chat settings");
    }
    return response.json();
  };

  // ================== MEDIA & FILES ==================

  /**
   * Upload file/image for a chat
   */
  const uploadFile = async (
    chatId: string,
    file: File,
    type: "image" | "file" | "voice"
  ): Promise<{ url: string; filename: string; size: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await api.apiCall(`/chats/${chatId}/upload`, {
      method: "POST",
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
      },
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }
    return response.json();
  };

  /**
   * Get media files from a chat
   */
  const getChatMedia = async (
    chatId: string,
    type?: "image" | "file" | "voice"
  ): Promise<any[]> => {
    const url = `/chats/${chatId}/media${type ? `?type=${type}` : ""}`;
    const response = await api.get(url);
    if (!response.ok) {
      throw new Error("Failed to fetch chat media");
    }
    return response.json();
  };

  // ================== TYPING INDICATORS ==================

  /**
   * Send typing indicator
   */
  const sendTyping = async (chatId: string): Promise<void> => {
    const response = await api.post(`/chats/${chatId}/typing`);
    if (!response.ok) {
      throw new Error("Failed to send typing indicator");
    }
  };

  /**
   * Stop typing indicator
   */
  const stopTyping = async (chatId: string): Promise<void> => {
    const response = await api.delete(`/chats/${chatId}/typing`);
    if (!response.ok) {
      throw new Error("Failed to stop typing indicator");
    }
  };

  // ================== CHAT HISTORY & ANALYTICS ==================

  /**
   * Get chat history with advanced filtering
   */
  const getChatHistory = async (
    chatId: string,
    options?: {
      from?: string;
      to?: string;
      searchText?: string;
      messageType?: string;
      senderId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ messages: Message[]; total: number; hasMore: boolean }> => {
    const queryString = new URLSearchParams();
    if (options?.from) queryString.set("from", options.from);
    if (options?.to) queryString.set("to", options.to);
    if (options?.searchText) queryString.set("search", options.searchText);
    if (options?.messageType) queryString.set("type", options.messageType);
    if (options?.senderId) queryString.set("senderId", options.senderId);
    if (options?.limit) queryString.set("limit", options.limit.toString());
    if (options?.offset) queryString.set("offset", options.offset.toString());

    const url = `/chats/${chatId}/history${
      queryString.toString() ? `?${queryString}` : ""
    }`;
    const response = await api.get(url);
    if (!response.ok) {
      throw new Error("Failed to fetch chat history");
    }
    return response.json();
  };

  /**
   * Search messages within a chat
   */
  const searchMessages = async (
    chatId: string,
    query: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ messages: Message[]; total: number }> => {
    const queryString = new URLSearchParams();
    queryString.set("query", query);
    if (options?.limit) queryString.set("limit", options.limit.toString());
    if (options?.offset) queryString.set("offset", options.offset.toString());

    const response = await api.get(`/chats/${chatId}/search?${queryString}`);
    if (!response.ok) {
      throw new Error("Failed to search messages");
    }
    return response.json();
  };

  // ================== NOTIFICATIONS ==================

  /**
   * Mute/unmute chat notifications
   */
  const muteChat = async (
    chatId: string,
    duration?: number // minutes, undefined means permanently
  ): Promise<void> => {
    const response = await api.put(`/chats/${chatId}/mute`, {
      duration,
    });
    if (!response.ok) {
      throw new Error("Failed to mute chat");
    }
  };

  /**
   * Unmute chat notifications
   */
  const unmuteChat = async (chatId: string): Promise<void> => {
    const response = await api.delete(`/chats/${chatId}/mute`);
    if (!response.ok) {
      throw new Error("Failed to unmute chat");
    }
  };

  // ================== ADVANCED FEATURES ==================

  /**
   * Forward messages to other chats
   */
  const forwardMessages = async (
    messageIds: string[],
    targetChatIds: string[]
  ): Promise<void> => {
    const response = await api.post("/messages/forward", {
      messageIds,
      targetChatIds,
    });
    if (!response.ok) {
      throw new Error("Failed to forward messages");
    }
  };

  /**
   * Get chat statistics
   */
  const getChatStats = async (
    chatId: string
  ): Promise<{
    messageCount: number;
    participantCount: number;
    mediaCount: number;
    createdAt: string;
    lastActivity: string;
  }> => {
    const response = await api.get(`/chats/${chatId}/stats`);
    if (!response.ok) {
      throw new Error("Failed to fetch chat statistics");
    }
    return response.json();
  };

  /**
   * Export chat data
   */
  const exportChat = async (
    chatId: string,
    format: "json" | "txt" | "html" = "json"
  ): Promise<Blob> => {
    const response = await api.get(`/chats/${chatId}/export?format=${format}`);
    if (!response.ok) {
      throw new Error("Failed to export chat");
    }
    return response.blob();
  };

  /**
   * Clear chat history (delete all messages)
   */
  const clearChatHistory = async (chatId: string): Promise<void> => {
    const response = await api.delete(`/chats/${chatId}/messages`);
    if (!response.ok) {
      throw new Error("Failed to clear chat history");
    }
  };

  /**
   * Block/unblock a user
   */
  const blockUser = async (userId: string): Promise<void> => {
    const response = await api.post(`/users/${userId}/block`);
    if (!response.ok) {
      throw new Error("Failed to block user");
    }
  };

  const unblockUser = async (userId: string): Promise<void> => {
    const response = await api.delete(`/users/${userId}/block`);
    if (!response.ok) {
      throw new Error("Failed to unblock user");
    }
  };

  /**
   * Get blocked users
   */
  const getBlockedUsers = async (): Promise<User[]> => {
    const response = await api.get("/users/blocked");
    if (!response.ok) {
      throw new Error("Failed to fetch blocked users");
    }
    return response.json();
  };

  /**
   * Report a chat or message
   */
  const reportContent = async (data: {
    chatId?: string;
    messageId?: string;
    reason: string;
    description?: string;
  }): Promise<void> => {
    const response = await api.post("/reports", data);
    if (!response.ok) {
      throw new Error("Failed to report content");
    }
  };

  // ================== ONLINE STATUS ==================

  /**
   * Update user's online status
   */
  const updateOnlineStatus = async (isOnline: boolean): Promise<void> => {
    const response = await api.put("/user/status", { isOnline });
    if (!response.ok) {
      throw new Error("Failed to update online status");
    }
  };

  /**
   * Get online users
   */
  const getOnlineUsers = async (): Promise<User[]> => {
    const response = await api.get("/users/online");
    if (!response.ok) {
      throw new Error("Failed to fetch online users");
    }
    return response.json();
  };

  // ================== CHAT INVITES ==================

  /**
   * Create a chat invite link
   */
  const createInviteLink = async (
    chatId: string,
    options?: {
      expiresAt?: string;
      maxUses?: number;
    }
  ): Promise<{ inviteCode: string; url: string }> => {
    const response = await api.post(`/chats/${chatId}/invite`, options);
    if (!response.ok) {
      throw new Error("Failed to create invite link");
    }
    return response.json();
  };

  /**
   * Join chat via invite code
   */
  const joinChatByInvite = async (inviteCode: string): Promise<Chat> => {
    const response = await api.post(`/chats/join/${inviteCode}`);
    if (!response.ok) {
      throw new Error("Failed to join chat");
    }
    return response.json();
  };

  /**
   * Get active invite links for a chat
   */
  const getInviteLinks = async (chatId: string): Promise<any[]> => {
    const response = await api.get(`/chats/${chatId}/invites`);
    if (!response.ok) {
      throw new Error("Failed to fetch invite links");
    }
    return response.json();
  };

  /**
   * Revoke an invite link
   */
  const revokeInviteLink = async (
    chatId: string,
    inviteId: string
  ): Promise<void> => {
    const response = await api.delete(`/chats/${chatId}/invites/${inviteId}`);
    if (!response.ok) {
      throw new Error("Failed to revoke invite link");
    }
  };

  // ================== RETURN ALL METHODS ==================

  return {
    // Chat Management
    getChats,
    getChat,
    createDirectChat,
    createGroupChat,
    updateChat,
    deleteChat,
    leaveChat,

    // Search & Discovery
    searchChats,
    searchUsers,
    getSuggestedUsers,

    // Pinned & Archives
    getPinnedChats,
    pinChat,
    getArchivedChats,
    archiveChat,

    // Messages
    getMessages,
    sendMessage,
    deleteMessage,
    editMessage,
    reactToMessage,
    removeReaction,

    // Read Status
    markAsRead,
    markAllAsRead,
    markMessageAsRead,
    getReadStatus,

    // Participants
    getParticipants,
    addParticipants,
    removeParticipant,
    updateParticipantRole,

    // Settings
    updateChatSettings,
    getChatSettings,

    // Media & Files
    uploadFile,
    getChatMedia,

    // Typing
    sendTyping,
    stopTyping,

    // Advanced
    getChatHistory,
    searchMessages,
    muteChat,
    unmuteChat,
    forwardMessages,
    getChatStats,
    exportChat,
    clearChatHistory,

    // User Management
    blockUser,
    unblockUser,
    getBlockedUsers,
    reportContent,

    // Online Status
    updateOnlineStatus,
    getOnlineUsers,

    // Invites
    createInviteLink,
    joinChatByInvite,
    getInviteLinks,
    revokeInviteLink,
  };
};
