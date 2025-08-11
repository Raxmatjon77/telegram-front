import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChatList } from "./ChatList";
import { ChatRoom } from "./ChatRoom";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../context/authContext";
import { useChatsApi } from "../../api/chats";
import { Message, Chat } from "../../types";
import { LogOut, MessageCircle } from "lucide-react";

export const ChatApp: React.FC = () => {
  const { user, logout } = useAuth();
  const chatsApi = useChatsApi();

  // Fetch chats from API
  const { data: chats = [], refetch: refetchChats } = useQuery({
    queryKey: ["chats"],
    queryFn: chatsApi.getChats,
    enabled: !!user,
  });

  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const {
    sendMessage: socketSendMessage,
    joinChat,
    leaveChat,
    getMessages,
  } = useSocket({
    onMessage: (message: Message) => {
      setMessages((prev) => ({
        ...prev,
        [message.chatId]: [...(prev[message.chatId] || []), message],
      }));
      // Refetch chats to update last message and unread count
      refetchChats();
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

  const handleSendMessage = (text: string) => {
    if (!selectedChatId || !user) return;

    // Send via socket
    socketSendMessage(selectedChatId, text);
  };

  const handleChatSelect = (chatId: string) => {
    if (selectedChatId) {
      leaveChat(selectedChatId);
    }
    setSelectedChatId(chatId);
    joinChat(chatId);
    setTypingUsers([]);

    // Load messages for this chat if not already loaded
    if (!messages[chatId]) {
      loadMessages(chatId);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const chatMessages = (await getMessages(chatId, 50)) as Message[];
      setMessages((prev) => ({
        ...prev,
        [chatId]: chatMessages.reverse(), // Reverse because backend returns in desc order
      }));
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleTyping = () => {
    if (selectedChatId) {
      // socket.startTyping(selectedChatId);
    }
  };

  const handleStopTyping = () => {
    if (selectedChatId) {
      // socket.stopTyping(selectedChatId);
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
