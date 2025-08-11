export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  chatId: string;
  text: string;
  type?: string;
  replyToId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  isRead: boolean;
  sender: User;
  replyTo?: Message;
}

export interface Chat {
  id: string;
  name?: string;
  type: 'DIRECT' | 'GROUP';
  createdAt: string;
  updatedAt: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned?: boolean;
}

export interface CreateMessageDto {
  chatId: string;
  text: string;
  type?: string;
  replyToId?: string;
}

export interface AuthState {

  token: string | null;
  isAuthenticated: boolean;
}
