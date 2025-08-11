// src/hooks/useChat.ts
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useChatsApi } from "../api/chats";
import { useSocket } from "./useSocket";
import { useAuth } from "../context/authContext";
import {
  Chat,
  Message,
//   User,
//   CreateGroupChatData,
  UpdateChatData,
//   MessageQueryParams,
  SendMessageOptions,
} from "../types";

export interface UseChatOptions {
  autoConnect?: boolean;
  enableTypingIndicators?: boolean;
  markAsReadOnView?: boolean;
  cacheMessages?: boolean;
}

export const useChat = (options: UseChatOptions = {}) => {
  const {
    autoConnect = true,
    enableTypingIndicators = true,
    markAsReadOnView = true,
    cacheMessages = true,
  } = options;

  const { user, isAuthenticated } = useAuth();
  const chatsApi = useChatsApi();
  const queryClient = useQueryClient();

  // State management
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  // ================== QUERIES ==================

  // Fetch all chats
  const {
    data: chats = [],
    isLoading: chatsLoading,
    error: chatsError,
    refetch: refetchChats,
  } = useQuery({
    queryKey: ["chats"],
    queryFn: chatsApi.getChats,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch pinned chats
  const { data: pinnedChats = [], refetch: refetchPinnedChats } = useQuery({
    queryKey: ["chats", "pinned"],
    queryFn: chatsApi.getPinnedChats,
    enabled: isAuthenticated,
  });

  // Fetch archived chats
  const { data: archivedChats = [], refetch: refetchArchivedChats } = useQuery({
    queryKey: ["chats", "archived"],
    queryFn: chatsApi.getArchivedChats,
    enabled: isAuthenticated,
  });

  // Fetch online users
  const { data: onlineUsersList = [] } = useQuery({
    queryKey: ["users", "online"],
    queryFn: chatsApi.getOnlineUsers,
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // ================== MUTATIONS ==================

  // Create direct chat
  const createDirectChatMutation = useMutation({
    mutationFn: chatsApi.createDirectChat,
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      setSelectedChatId(newChat.id);
    },
  });

  // Create group chat
  const createGroupChatMutation = useMutation({
    mutationFn: chatsApi.createGroupChat,
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      setSelectedChatId(newChat.id);
    },
  });

  // Update chat
  const updateChatMutation = useMutation({
    mutationFn: ({ chatId, data }: { chatId: string; data: UpdateChatData }) =>
      chatsApi.updateChat(chatId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  // Delete chat
  const deleteChatMutation = useMutation({
    mutationFn: chatsApi.deleteChat,
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
      }
      // Remove messages from cache
      setMessages((prev) => {
        const newMessages = { ...prev };
        delete newMessages[chatId];
        return newMessages;
      });
    },
  });

  // Leave chat
  const leaveChatMutation = useMutation({
    mutationFn: chatsApi.leaveChat,
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
      }
    },
  });

  // Pin/Unpin chat
  const pinChatMutation = useMutation({
    mutationFn: ({ chatId, isPinned }: { chatId: string; isPinned: boolean }) =>
      chatsApi.pinChat(chatId, isPinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["chats", "pinned"] });
    },
  });

  // Archive/Unarchive chat
  const archiveChatMutation = useMutation({
    mutationFn: ({
      chatId,
      isArchived,
    }: {
      chatId: string;
      isArchived: boolean;
    }) => chatsApi.archiveChat(chatId, isArchived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["chats", "archived"] });
    },
  });

  // Mark as read
  const markAsReadMutation = useMutation({
    mutationFn: chatsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: ({
      chatId,
      data,
    }: {
      chatId: string;
      data: {
        text: string;
        type?: string;
        replyToId?: string;
        attachments?: string[];
      };
    }) => chatsApi.sendMessage(chatId, data as any),
    onSuccess: (newMessage) => {
      // Optimistically update messages
      setMessages((prev) => ({
        ...prev,
        [newMessage.chatId]: [...(prev[newMessage.chatId] || []), newMessage],
      }));
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  // ================== SOCKET INTEGRATION ==================

  const {
    sendMessage: socketSendMessage,
    joinChat: socketJoinChat,
    leaveChat: socketLeaveChat,
    getMessages: socketGetMessages,
    isConnected,
  } = useSocket({
    onMessage: (message: Message) => {
      setMessages((prev) => ({
        ...prev,
        [message.chatId]: [...(prev[message.chatId] || []), message],
      }));

      // Update chat list with new last message
      queryClient.setQueryData(["chats"], (oldChats: Chat[] = []) => {
        return oldChats.map((chat) =>
          chat.id === message.chatId
            ? {
                ...chat,
                lastMessage: message,
                unreadCount: chat.unreadCount + 1,
              }
            : chat
        );
      });

      // Auto-mark as read if chat is selected and visible
      if (markAsReadOnView && message.chatId === selectedChatId) {
        setTimeout(() => markAsReadMutation.mutate(message.chatId), 1000);
      }
    },
    onUserOnline: (userId: string) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    },
    onUserOffline: (userId: string) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    },
    onTyping: ({ userId, chatId }: { userId: string; chatId: string }) => {
      if (!enableTypingIndicators) return;

      setTypingUsers((prev) => ({
        ...prev,
        [chatId]: [
          ...(prev[chatId] || []).filter((id) => id !== userId),
          userId,
        ],
      }));

      // Auto-clear typing after 3 seconds
      setTimeout(() => {
        setTypingUsers((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || []).filter((id) => id !== userId),
        }));
      }, 3000);
    },
    onStopTyping: ({ userId, chatId }: { userId: string; chatId: string }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).filter((id) => id !== userId),
      }));
    },
  });

  // ================== HELPER FUNCTIONS ==================

  const loadMessages = useCallback(
    async (chatId: string, params?: any) => {
      if (!chatId) return;

      setLoadingStates((prev) => ({ ...prev, [chatId]: true }));

      try {
        let chatMessages: Message[];

        if (autoConnect && isConnected) {
          // Use socket for real-time messages
          chatMessages = (await socketGetMessages(
            chatId,
            params?.limit || 50,
            params?.cursor
          )) as Message[];
        } else {
          // Fallback to HTTP API
          chatMessages = await chatsApi.getMessages(chatId, params);
        }

        setMessages((prev) => ({
          ...prev,
          [chatId]: cacheMessages ? chatMessages.reverse() : chatMessages,
        }));
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setLoadingStates((prev) => ({ ...prev, [chatId]: false }));
      }
    },
    [autoConnect, isConnected, cacheMessages, socketGetMessages, chatsApi]
  );

  const selectChat = useCallback(
    (chatId: string) => {
      // Leave previous chat
      if (selectedChatId && autoConnect) {
        socketLeaveChat(selectedChatId);
      }

      setSelectedChatId(chatId);

      // Join new chat
      if (autoConnect && isConnected) {
        socketJoinChat(chatId);
      }

      // Clear typing indicators for this chat
      setTypingUsers((prev) => ({ ...prev, [chatId]: [] }));

      // Load messages if not cached
      if (!messages[chatId]) {
        loadMessages(chatId);
      }

      // Mark as read if enabled
      if (markAsReadOnView) {
        markAsReadMutation.mutate(chatId);
      }
    },
    [
      selectedChatId,
      autoConnect,
      isConnected,
      messages,
      loadMessages,
      markAsReadOnView,
    ]
  );

  const sendMessage = useCallback(
    async (text: string, options: SendMessageOptions = {}) => {
      if (!selectedChatId || !text.trim()) return;

      try {
        if (autoConnect && isConnected) {
          // Use socket for real-time sending
          socketSendMessage(
            selectedChatId,
            text,
            options.type,
            options.replyToId
          );
        } else {
          // Fallback to HTTP API
          await sendMessageMutation.mutateAsync({
            chatId: selectedChatId,
            data: {
              text: text.trim(),
              type: options.type,
              replyToId: options.replyToId,
            },
          });
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        throw error;
      }
    },
    [
      selectedChatId,
      autoConnect,
      isConnected,
      socketSendMessage,
      sendMessageMutation,
    ]
  );

  const searchChats = useCallback(
    async (query: string) => {
      if (!query.trim()) return chats;

      try {
        return await chatsApi.searchChats(query);
      } catch (error) {
        console.error("Failed to search chats:", error);
        return [];
      }
    },
    [chats, chatsApi]
  );

  const searchUsers = useCallback(
    async (query: string) => {
      if (!query.trim()) return [];

      try {
        return await chatsApi.searchUsers(query);
      } catch (error) {
        console.error("Failed to search users:", error);
        return [];
      }
    },
    [chatsApi]
  );

  // ================== COMPUTED VALUES ==================

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);
  const selectedMessages = selectedChatId ? messages[selectedChatId] || [] : [];
  const selectedChatTypingUsers = selectedChatId
    ? typingUsers[selectedChatId] || []
    : [];
  const isLoadingMessages = selectedChatId
    ? loadingStates[selectedChatId] || false
    : false;

  const unreadChatsCount = chats.reduce(
    (count, chat) => count + (chat.unreadCount > 0 ? 1 : 0),
    0
  );
  const totalUnreadCount = chats.reduce(
    (count, chat) => count + chat.unreadCount,
    0
  );

  const otherParticipant = selectedChat?.participants.find(
    (p) => p.id !== user?.id
  );

  // ================== EFFECTS ==================

  // Update online users when list changes
  useEffect(() => {
    setOnlineUsers(new Set(onlineUsersList.map((u) => u.id)));
  }, [onlineUsersList]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (selectedChatId && autoConnect) {
        socketLeaveChat(selectedChatId);
      }
    };
  }, []);

  // ================== RETURN API ==================

  return {
    // Chat data
    chats,
    pinnedChats,
    archivedChats,
    selectedChat,
    selectedChatId,

    // Messages
    messages: selectedMessages,
    isLoadingMessages,

    // Users & participants
    otherParticipant,
    onlineUsers,
    typingUsers: selectedChatTypingUsers,

    // Counts
    unreadChatsCount,
    totalUnreadCount,

    // Loading states
    isLoading: chatsLoading,
    isConnected,

    // Errors
    error: chatsError,

    // ================== ACTIONS ==================

    // Chat management
    selectChat,
    createDirectChat: createDirectChatMutation.mutateAsync,
    createGroupChat: createGroupChatMutation.mutateAsync,
    updateChat: (chatId: string, data: UpdateChatData) =>
      updateChatMutation.mutateAsync({ chatId, data }),
    deleteChat: deleteChatMutation.mutateAsync,
    leaveChat: leaveChatMutation.mutateAsync,

    // Chat actions
    pinChat: (chatId: string, isPinned: boolean) =>
      pinChatMutation.mutateAsync({ chatId, isPinned }),
    archiveChat: (chatId: string, isArchived: boolean) =>
      archiveChatMutation.mutateAsync({ chatId, isArchived }),
    markAsRead: markAsReadMutation.mutateAsync,

    // Messages
    sendMessage,
    loadMessages,
    deleteMessage: chatsApi.deleteMessage,
    editMessage: chatsApi.editMessage,
    reactToMessage: chatsApi.reactToMessage,

    // Search
    searchChats,
    searchUsers,

    // Advanced features
    uploadFile: chatsApi.uploadFile,
    getChatMedia: chatsApi.getChatMedia,
    forwardMessages: chatsApi.forwardMessages,
    exportChat: chatsApi.exportChat,

    // Participants
    addParticipants: chatsApi.addParticipants,
    removeParticipant: chatsApi.removeParticipant,
    updateParticipantRole: chatsApi.updateParticipantRole,

    // User management
    blockUser: chatsApi.blockUser,
    unblockUser: chatsApi.unblockUser,
    reportContent: chatsApi.reportContent,

    // Invites
    createInviteLink: chatsApi.createInviteLink,
    joinChatByInvite: chatsApi.joinChatByInvite,

    // Refresh functions
    refetchChats,
    refetchPinnedChats,
    refetchArchivedChats,

    // Mutation states
    isCreatingChat:
      createDirectChatMutation.isPending || createGroupChatMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
    isUpdatingChat: updateChatMutation.isPending,
  };
};
