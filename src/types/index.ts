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
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  sender?: User;
}

export interface Chat {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface AuthState {

  token: string | null;
  isAuthenticated: boolean;
}
