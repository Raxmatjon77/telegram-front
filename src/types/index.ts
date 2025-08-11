// src/types/index.ts

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
  status?: "online" | "offline" | "away" | "busy";
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId?: string; // For direct messages
  text: string;
  type: "text" | "image" | "file" | "voice" | "system";
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  editedAt?: string;
  isRead: boolean;
  readBy?: string[]; // Array of user IDs who have read this message
  sender?: User;
  replyToId?: string;
  replyTo?: Message;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
  metadata?: {
    isForwarded?: boolean;
    originalSenderId?: string;
    editHistory?: string[];
  };
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  reaction: string; // emoji or reaction type
  createdAt: string;
  user?: User;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  filename: string;
  originalName: string;
  url: string;
  type: "image" | "file" | "voice";
  size: number;
  mimeType: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  name?: string; // Group chats have names, direct chats usually don't
  description?: string;
  type: "direct" | "group";
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  muteUntil?: string;
  settings?: ChatSettings;
  adminIds?: string[]; // For group chats
  inviteCode?: string;
  metadata?: {
    messageCount?: number;
    mediaCount?: number;
    memberCount?: number;
  };
}

export interface ChatSettings {
  notifications: boolean;
  sound: boolean;
  preview: boolean; // Show message preview in notifications
  theme?: "light" | "dark" | "auto";
  fontSize?: "small" | "medium" | "large";
  enterToSend?: boolean;
  readReceipts?: boolean;
  lastSeenVisible?: boolean;
  autoDownloadMedia?: boolean;
}

export interface ChatMember {
  userId: string;
  chatId: string;
  role: "admin" | "member";
  joinedAt: string;
  addedBy?: string;
  user?: User;
}

export interface ChatInvite {
  id: string;
  chatId: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  chat?: Chat;
  creator?: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface TypingUser {
  userId: string;
  chatId: string;
  username: string;
  startedAt: string;
}

export interface OnlineStatus {
  userId: string;
  status: "online" | "offline" | "away" | "busy";
  lastSeen?: string;
  device?: string;
}

export interface ChatReport {
  id: string;
  reporterId: string;
  chatId?: string;
  messageId?: string;
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface BlockedUser {
  id: string;
  userId: string; // User who blocked
  blockedUserId: string; // User who was blocked
  createdAt: string;
  reason?: string;
  user?: User;
  blockedUser?: User;
}

export interface ChatExport {
  chat: Chat;
  messages: Message[];
  participants: User[];
  exportedAt: string;
  exportedBy: string;
  format: "json" | "txt" | "html";
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: any;
}

// Socket event types
export interface SocketEvents {
  // Incoming events
  newMessage: (message: Message) => void;
  messageDeleted: (messageId: string, chatId: string) => void;
  messageEdited: (message: Message) => void;
  messageReaction: (data: {
    messageId: string;
    reaction: MessageReaction;
  }) => void;
  typing: (data: { userId: string; chatId: string; username: string }) => void;
  // stopTyping: (data: { userId: string; chatId: string }) => void;
  userOnline: (userId: string) => void;
  userOffline: (userId: string) => void;
  chatUpdated: (chat: Chat) => void;
  participantAdded: (data: { chatId: string; user: User }) => void;
  participantRemoved: (data: { chatId: string; userId: string }) => void;
  chatDeleted: (chatId: string) => void;
  messageRead: (data: {
    messageId: string;
    userId: string;
    chatId: string;
  }) => void;

  // Outgoing events
  sendMessage: (data: {
    chatId: string;
    text: string;
    type?: string;
    replyToId?: string;
    attachments?: string[];
  }) => void;
  joinChat: (data: { chatId: string }) => void;
  leaveChat: (data: { chatId: string }) => void;
  getMessages: (
    data: {
      chatId: string;
      limit?: number;
      cursor?: string;
    },
    callback: (messages: Message[]) => void
  ) => void;
  deleteMessage: (data: { messageId: string }) => void;
  editMessage: (data: { messageId: string; text: string }) => void;
  markAsRead: (data: { chatId: string; messageId?: string }) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
}

// Hook return types
export interface UseChatsReturn {
  chats: Chat[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createDirectChat: (userId: string) => Promise<Chat>;
  createGroupChat: (data: CreateGroupChatData) => Promise<Chat>;
  updateChat: (chatId: string, data: UpdateChatData) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
}

export interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  sendMessage: (text: string, options?: SendMessageOptions) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, text: string) => Promise<void>;
  reactToMessage: (messageId: string, reaction: string) => Promise<void>;
}

// Form data types
export interface CreateGroupChatData {
  name: string;
  description?: string;
  participantIds: string[];
}

export interface UpdateChatData {
  name?: string;
  description?: string;
}

export interface SendMessageOptions {
  type?: "text" | "image" | "file" | "voice";
  replyToId?: string;
  attachments?: File[];
}

export interface SearchFilters {
  type?: "all" | "direct" | "group";
  hasUnread?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  participantId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Notification types
export interface ChatNotification {
  id: string;
  chatId: string;
  messageId?: string;
  type:
    | "message"
    | "mention"
    | "reaction"
    | "participant_added"
    | "participant_removed";
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

// WebSocket connection states
export type SocketConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

// Chat activity types
export interface ChatActivity {
  id: string;
  chatId: string;
  userId: string;
  type:
    | "joined"
    | "left"
    | "added"
    | "removed"
    | "promoted"
    | "demoted"
    | "name_changed";
  description: string;
  createdAt: string;
  user?: User;
  metadata?: any;
}
