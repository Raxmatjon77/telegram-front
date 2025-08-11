import React, { useState, useEffect, useRef } from "react";
import { Avatar } from "../../components/avatar";
import { MessageInput } from "./MessageInput";
import { Message, User } from "../../types";
import { useAuth } from "../../context/authContext";
import { MoreVertical, Phone, Video } from "lucide-react";

interface ChatRoomProps {
  chatId: string;
  messages: Message[];
  otherParticipant: User;
  onSendMessage: (content: string) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  typingUsers: string[];
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  chatId,
  messages,
  otherParticipant,
  onSendMessage,
  onTyping,
  onStopTyping,
  typingUsers,
}) => {
  // const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateHeader = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  const shouldShowDateHeader = (
    currentMessage: Message,
    previousMessage?: Message
  ) => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();

    return currentDate !== previousDate;
  };

  const shouldGroupMessage = (
    currentMessage: Message,
    previousMessage?: Message
  ) => {
    if (!previousMessage) return false;

    const timeDiff =
      new Date(currentMessage.createdAt).getTime() -
      new Date(previousMessage.createdAt).getTime();
    const fiveMinutes = 5 * 60 * 1000;

    return (
      previousMessage.senderId === currentMessage.senderId &&
      timeDiff < fiveMinutes &&
      !shouldShowDateHeader(currentMessage, previousMessage)
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar
            src={otherParticipant.avatar}
            alt={otherParticipant.username}
            size="md"
            isOnline={otherParticipant.isOnline}
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {otherParticipant.username}
            </h3>
            <p className="text-sm text-gray-500">
              {otherParticipant.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Voice call"
          >
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Video call"
          >
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="More options"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <Avatar
                src={otherParticipant.avatar}
                alt={otherParticipant.username}
                size="lg"
                className="mx-auto mb-4"
              />
              <p className="text-lg font-medium">Start a conversation</p>
              <p className="text-sm">
                Send a message to {otherParticipant.username}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const previousMessage = messages[index - 1];
              const isOwnMessage = message.senderId === user?.id;
              const showDateHeader = shouldShowDateHeader(
                message,
                previousMessage
              );
              const isGrouped = shouldGroupMessage(message, previousMessage);

              return (
                <div key={message.id}>
                  {/* Date header */}
                  {showDateHeader && (
                    <div className="flex justify-center my-4">
                      <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDateHeader(message.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* Message */}
                  <div
                    className={`flex ${
                      isOwnMessage ? "justify-end" : "justify-start"
                    } ${isGrouped ? "mb-1" : "mb-4"}`}
                  >
                    <div
                      className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                        isOwnMessage ? "flex-row-reverse space-x-reverse" : ""
                      }`}
                    >
                      {/* Avatar (only show if not grouped or if first in group) */}
                      {!isOwnMessage && !isGrouped && (
                        <Avatar
                          src={otherParticipant.avatar}
                          alt={otherParticipant.username}
                          size="sm"
                        />
                      )}

                      {/* Spacer for grouped messages */}
                      {!isOwnMessage && isGrouped && <div className="w-8" />}

                      {/* Message bubble */}
                      <div
                        className={`relative px-4 py-2 rounded-2xl ${
                          isOwnMessage
                            ? "bg-blue-500 text-white"
                            : "bg-white text-gray-900 border border-gray-200"
                        } ${
                          isGrouped
                            ? isOwnMessage
                              ? "rounded-br-md"
                              : "rounded-bl-md"
                            : ""
                        }`}
                      >
                        {message.deletedAt ? (
                          <p className="text-sm italic text-gray-500">
                            This message was deleted
                          </p>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">
                            {message.text}
                          </p>
                        )}
                        <div
                          className={`flex items-center justify-end space-x-1 mt-1 ${
                            isOwnMessage ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          <span className="text-xs">
                            {formatMessageTime(message.createdAt)}
                          </span>
                          {isOwnMessage && (
                            <span className="text-xs">
                              {message.isRead ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                  <Avatar
                    src={otherParticipant.avatar}
                    alt={otherParticipant.username}
                    size="sm"
                  />
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        onStopTyping={onStopTyping}
      />
    </div>
  );
};
