import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  ArrowLeft,
  Image,
  CheckCircle,
  Clock,
  XCircle,
  Phone,
  Mail,
  Tag,
  Users,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchConversationById,
  sendConversationMessage,
  updateConversationStatus,
} from "../features/conversations/conversationSlice";
import { BaseLoading } from "../components/BaseLoading";

export const ConversationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const token = localStorage.getItem("token");
  const dispatch = useDispatch();

  const {
    selected: conversation,
    loading: conversationLoading,
    messagesLoading,
  } = useSelector((state) => state.conversations);

  // Scroll to bottom when messages change
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (id && token) {
      dispatch(fetchConversationById({ token, id }));
    }
  }, [id, token, dispatch]);

  useEffect(() => {
    if (conversation?.messages) {
      scrollToBottom();
    }
  }, [conversation?.messages]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!conversation || !newMessage.trim()) return;

    dispatch(
      sendConversationMessage({
        token,
        conversationId: conversation.id,
        message: newMessage,
        image: selectedImage,
      })
    );

    setNewMessage("");
    setSelectedImage(null);
  };

  const handleStatusUpdate = (status) => {
    if (conversation) {
      dispatch(
        updateConversationStatus({ token, id: conversation.id, status })
      );
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "sent":
        return <span className="text-xs">✓</span>;
      case "delivered":
        return <span className="text-xs">✓✓</span>;
      case "read":
        return <span className="text-xs text-blue-200">✓✓</span>;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "closed":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  if (conversationLoading) {
    return <BaseLoading message="Loading conversation..." />;
  }

  if (!conversation) {
    return (
      <div className="h-full bg-gradient-subtle flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Conversation Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The conversation you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/chat")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Button>
        </Card>
      </div>
    );
  }

  const { contact_details, messages = [] } = conversation;

  return (
    <div className="h-full bg-gradient-subtle">
      <div className="h-full max-w-7xl mx-auto sm:px-4">
        <div className="flex flex-col h-[calc(100vh-180px)] gap-4">
          {/* Header */}
          <Card className="p-4 card-elegant shadow-elegant">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => navigate("/chat")}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Avatar className="w-12 h-12 ring-2 ring-border/20">
                  <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                    {contact_details?.name
                      ?.split(" ")
                      ?.map((n) => n[0])
                      ?.join("") || conversation.phone_number?.slice(-2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    {contact_details?.name ||
                      conversation.contact_name ||
                      conversation.phone_number}
                  </h1>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{conversation.phone_number}</span>
                    {contact_details?.email && (
                      <>
                        <Mail className="w-4 h-4 ml-2" />
                        <span>{contact_details.email}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusUpdate("active")}
                  className={`h-8 px-3 ${getStatusColor("active")}`}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Active
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusUpdate("pending")}
                  className={`h-8 px-3 ${getStatusColor("pending")}`}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Pending
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusUpdate("closed")}
                  className={`h-8 px-3 ${getStatusColor("closed")}`}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Closed
                </Button>
              </div>
            </div>
          </Card>

          {/* Contact Details */}
          {contact_details && (
            <Card className="p-4 card-elegant shadow-elegant">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{contact_details.phone}</span>
                    </div>
                    {contact_details.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{contact_details.email}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="w-4 h-4 text-muted-foreground">📧</span>
                      <span>Status: {contact_details.status}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Tags & Groups</h3>
                  <div className="space-y-2">
                    {contact_details.tags &&
                      contact_details.tags.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Tag className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Tags:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {contact_details.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    {contact_details.groups &&
                      contact_details.groups.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Groups:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {contact_details.groups.slice(0, 3).map((group) => (
                              <Badge
                                key={group.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {group.name}
                              </Badge>
                            ))}
                            {contact_details.groups.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{contact_details.groups.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Messages */}
          <Card className="flex-1 flex flex-col card-elegant shadow-elegant">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">
                  No messages yet. Start the conversation!
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-background/50 to-muted/20">
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const showDate =
                      index === 0 ||
                      formatDate(message.whatsapp_timestamp) !==
                        formatDate(messages[index - 1]?.whatsapp_timestamp);

                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <Badge variant="secondary" className="text-xs">
                              {formatDate(message.whatsapp_timestamp)}
                            </Badge>
                          </div>
                        )}
                        <div
                          className={`flex ${
                            message.direction === "outbound"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm ${
                              message.direction === "outbound"
                                ? "bg-gradient-primary text-white rounded-br-md"
                                : "bg-card border border-border/20 text-foreground rounded-bl-md"
                            }`}
                          >
                            {message.media_url && (
                              <img
                                src={message.media_url}
                                alt="sent"
                                className="rounded-md mb-2 max-h-48 object-cover"
                              />
                            )}
                            {message.content && (
                              <p className="text-sm leading-relaxed break-words">
                                {message.content}
                              </p>
                            )}
                            <div
                              className={`flex items-center justify-end mt-2 space-x-1 ${
                                message.direction === "outbound"
                                  ? "text-white/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <span className="text-xs font-medium">
                                {formatTime(message.whatsapp_timestamp)}
                              </span>
                              {message.direction === "outbound" &&
                                message.status && (
                                  <div className="text-xs ml-1">
                                    {getStatusIcon(message.status)}
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-border/50 bg-card/50">
              {selectedImage && (
                <div className="relative w-fit mb-2">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg border border-border/50"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <label
                    htmlFor="imageUpload"
                    className="flex items-center justify-center w-11 h-11 rounded-full bg-muted hover:bg-muted/70 cursor-pointer transition"
                  >
                    <Image className="w-5 h-5 text-muted-foreground" />
                  </label>
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedImage(file);
                    }}
                  />
                </div>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-background/50 border-border/50 focus:border-primary/50 h-11"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() && !selectedImage}
                  size="sm"
                  className="bg-gradient-primary hover:shadow-glow h-11 px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
