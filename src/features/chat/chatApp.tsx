import React, { useState } from "react";
import { ChatList } from "./ChatList";
import { ChatRoom } from "./ChatRoom";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../context/authContext";
import { Message, Chat } from "../../types";
import { LogOut, MessageCircle } from "lucide-react";

// Mock data for development
const mockChats: Chat[] = [
  {
    id: "1",
    participants: [
      {
        id: "user-1",
        username: "Alice Johnson",
        email: "alice@example.com",
        avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Alice",
        isOnline: true,
      },
      {
        id: "user-2",
        username: "Bob Smith",
        email: "bob@example.com",
        avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Bob",
        isOnline: false,
      },
    ],
    lastMessage: {
      id: "1",
      senderId: "user-1",
      receiverId: "user-2",
      content: "Hey there! How are you doing?",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      isRead: false,
    },
    unreadCount: 2,
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "2",
    participants: [
      {
        id: "user-3",
        username: "Charlie Wilson",
        email: "charlie@example.com",
        avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Charlie",
        isOnline: true,
      },
    ],
    lastMessage: {
      id: "2",
      senderId: "user-3",
      receiverId: "current-user",
      content: "Thanks for your help earlier!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      isRead: true,
    },
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

const mockMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "1",
      senderId: "user-1",
      receiverId: "current-user",
      content: "Hey there! How are you doing?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      isRead: true,
    },
    {
      id: "2",
      senderId: "current-user",
      receiverId: "user-1",
      content:
        "I'm doing great, thanks! Just working on some new projects. How about you?",
      timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      isRead: false,
    },
    {
      id: "3",
      senderId: "user-1",
      receiverId: "current-user",
      content:
        "That sounds exciting! I'd love to hear more about your projects sometime.",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      isRead: false,
    },
  ],
  "2": [
    {
      id: "4",
      senderId: "user-3",
      receiverId: "current-user",
      content: "Thanks for your help earlier!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      isRead: true,
    },
    {
      id: "5",
      senderId: "current-user",
      receiverId: "user-3",
      content: "You're welcome! Always happy to help.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
      isRead: true,
    },
  ],
};

export const ChatApp: React.FC = () => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [messages, setMessages] =
    useState<Record<string, Message[]>>(mockMessages);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const socket = useSocket({
    onMessage: (message: Message) => {
      setMessages((prev) => ({
        ...prev,
        [selectedChatId || ""]: [
          ...(prev[selectedChatId || ""] || []),
          message,
        ],
      }));
    },
    onUserOnline: (userId: string) => {
      // Update user online status
      console.log(`User ${userId} is now online`);
    },
    onUserOffline: (userId: string) => {
      // Update user offline status
      console.log(`User ${userId} is now offline`);
    },
    onTyping: (data: { userId: string; chatId: string }) => {
      if (data.chatId === selectedChatId) {
        setTypingUsers((prev) => [
          ...prev.filter((id) => id !== data.userId),
          data.userId,
        ]);
      }
    },
    onStopTyping: (data: { userId: string; chatId: string }) => {
      if (data.chatId === selectedChatId) {
        setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
      }
    },
  });

  const handleSendMessage = (content: string) => {
    if (!selectedChatId || !user) return;

    const selectedChat = chats.find((chat) => chat.id === selectedChatId);
    if (!selectedChat) return;

    const otherParticipant =
      selectedChat.participants.find((p) => p.id !== user.id) ||
      selectedChat.participants[0];

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user.id,
      receiverId: otherParticipant.id,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    // Add message locally
    setMessages((prev) => ({
      ...prev,
      [selectedChatId]: [...(prev[selectedChatId] || []), newMessage],
    }));

    // Send via socket
    socket.sendMessage(otherParticipant.id, content);
  };

  const handleChatSelect = (chatId: string) => {
    if (selectedChatId) {
      socket.leaveChat(selectedChatId);
    }
    setSelectedChatId(chatId);
    socket.joinChat(chatId);
    setTypingUsers([]);
  };

  const handleTyping = () => {
    if (selectedChatId) {
      socket.startTyping(selectedChatId);
    }
  };

  const handleStopTyping = () => {
    if (selectedChatId) {
      socket.stopTyping(selectedChatId);
    }
  };

  const handleNewChat = () => {
    // In a real app, this would open a user search dialog
    console.log("New chat functionality would go here");
  };

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);
  const selectedMessages = selectedChatId ? messages[selectedChatId] || [] : [];
  const otherParticipant =
    selectedChat?.participants.find((p) => p.id !== user?.id) ||
    selectedChat?.participants[0];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="flex flex-col">
        {/* User header */}
        <div className="bg-white border-r border-gray-200 p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-6 h-6 text-blue-500" />
                <span className="font-semibold text-gray-900">ChatApp</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          {user && (
            <div className="mt-3 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.username[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user.username}
                </p>
                <p className="text-xs text-green-600 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Online
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chat List */}
        <ChatList
          chats={chats}
          selectedChatId={selectedChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Main Chat Area */}
      {selectedChatId && selectedChat && otherParticipant ? (
        <ChatRoom
          chatId={selectedChatId}
          messages={selectedMessages}
          otherParticipant={otherParticipant}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onStopTyping={handleStopTyping}
          typingUsers={typingUsers}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Welcome to ChatApp</h3>
            <p>Select a chat from the sidebar to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};
