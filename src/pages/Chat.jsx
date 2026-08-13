import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  MoreVertical,
  Search,
  Image,
  CheckCircle,
  Clock,
  XCircle,
  Phone,
  Mail,
  Tag,
  Users,
  PhoneCall,
  PhoneCallIcon,
  PhoneIcon,
  X,
  Download,
  Paperclip,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchConversations,
  fetchLatestContacts,
  // fetchUnreadConversations,
  fetchConversationById,
  sendConversationMessage,
  updateConversationStatus,
  markConversationAsRead,
  addLocalMessage,
  failLocalMessage,
} from "../features/conversations/conversationSlice";
import { BaseLoading } from "../components/BaseLoading";
import { useToast } from "@/hooks/use-toast";

const MIME_LABELS = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-powerpoint": "PPT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PPTX",
  "text/csv": "CSV",
  "text/plain": "TXT",
  "application/zip": "ZIP",
  "audio/mpeg": "MP3",
  "audio/mp4": "M4A",
  "audio/aac": "AAC",
  "audio/ogg": "OGG",
  "audio/wav": "WAV",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/gif": "GIF",
  "image/webp": "WEBP",
  "video/mp4": "MP4",
  "video/quicktime": "MOV",
  "video/x-msvideo": "AVI",
};

export const Chat = () => {
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isContactListOpen, setIsContactListOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [hasTriggeredBottomApi, setHasTriggeredBottomApi] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Messaging Window State
  const [messagingWindowActive, setMessagingWindowActive] = useState(false);
  const [messagingWindowHoursRemaining, setMessagingWindowHoursRemaining] =
    useState(0);
  const [messagingWindowStatus, setMessagingWindowStatus] =
    useState("inactive");

  const scrollAreaRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const lastMessageTimestampRef = useRef(null);

  const token = localStorage.getItem("token");
  const dispatch = useDispatch();
  const API_BASE_URL = "https://policysarthi-whatsapp.fableadtech.in/services/api";
  const POLL_INTERVAL_MS = 1000; // ~1s polling for near real-time updates

  // Safely derive messaging window flags from API shapes (root or nested .conversation)
  const getMessagingWindowState = useCallback((data) => {
    const source = data?.conversation || data || {};
    return {
      isActive: Boolean(source.messaging_window_active),
      hoursRemaining: source.messaging_window_hours_remaining || 0,
      status: source.messaging_window_status || "inactive",
    };
  }, []);

  // Function to open media modal
  const openMediaModal = (message) => {
    setSelectedMedia(message);
    setMediaModalOpen(true);
  };

  // Function to close media modal
  const closeMediaModal = () => {
    setMediaModalOpen(false);
    setSelectedMedia(null);
  };

  // Function to handle download
  const handleDownload = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "media-file";
    // link.target = "_blank";
    // link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resolveMessageType = useCallback((message) => {
    if (!message) return "text";

    const baseType = message.type;
    const mediaType = message.media_type || message.mediaType;
    const filename =
      message.media_display?.filename ||
      message.media_filename ||
      (typeof message.media_url === "string"
        ? message.media_url.split("/").pop()
        : "");

    // If backend already tells us it's not a document/text, trust it
    if (baseType && baseType !== "document" && baseType !== "text") {
      return baseType;
    }

    // Derive from MIME when everything comes in as "document"
    if (mediaType) {
      if (mediaType.startsWith("image/")) return "image";
      if (mediaType.startsWith("video/")) return "video";
      if (mediaType.startsWith("audio/")) return "audio";
    }

    // Derive from file extension when MIME is missing
    const extension = filename?.includes(".")
      ? filename.split(".").pop()?.toLowerCase()
      : null;
    if (extension) {
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
        return "image";
      }
      if (["mp4", "mov", "avi", "mkv"].includes(extension)) {
        return "video";
      }
      if (["mp3", "m4a", "aac", "wav", "ogg"].includes(extension)) {
        return "audio";
      }
    }

    return baseType || (mediaType ? "document" : "text");
  }, []);

  const getFileBadgeLabel = useCallback((message) => {
    const mediaType = message?.media_type || message?.mediaType;
    if (mediaType && MIME_LABELS[mediaType]) return MIME_LABELS[mediaType];

    const filename =
      message?.media_display?.filename ||
      message?.media_filename ||
      (typeof message?.media_url === "string"
        ? message.media_url.split("/").pop()
        : "");

    const extension = filename?.includes(".") ? filename.split(".").pop() : "";

    if (extension) {
      const cleanedExt = extension.replace(/[^a-zA-Z0-9]/g, "");
      if (cleanedExt.length <= 6 && cleanedExt.length > 0) {
        return cleanedExt.toUpperCase();
      }
    }

    if (mediaType?.includes("/")) {
      const subtype = mediaType.split("/")[1];
      if (subtype) {
        return subtype.slice(0, 8).toUpperCase();
      }
    }

    return "FILE";
  }, []);

  const getFileBadgeClasses = useCallback((label) => {
    const normalized = (label || "").toUpperCase();
    if (normalized === "PDF") return "bg-red-100 text-red-700";
    if (["XLS", "XLSX", "CSV"].includes(normalized))
      return "bg-green-100 text-green-700";
    if (["DOC", "DOCX"].includes(normalized))
      return "bg-blue-100 text-blue-700";
    if (["MP3", "MPEG", "M4A", "WAV", "AAC", "OGG"].includes(normalized))
      return "bg-purple-100 text-purple-700";
    if (["JPEG", "JPG", "PNG", "GIF", "WEBP"].includes(normalized))
      return "bg-amber-100 text-amber-700";
    if (["MP4", "MOV", "AVI", "MKV"].includes(normalized))
      return "bg-sky-100 text-sky-700";
    if (normalized === "ZIP") return "bg-orange-100 text-orange-700";
    return "bg-gray-100 text-gray-700";
  }, []);

  const {
    list: conversations = [],
    latestContacts = [],
    unreadConversations = [],
    stats = null,
    messagesByConversation = {},
    selected: selectedConversationDetails = null,
    loading: conversationsLoading,
    messagesLoading,
  } = useSelector((state) => state.conversations);

  // Enable scroll-related functionality
  const SCROLL_FEATURES_ENABLED = true;

  // Get messages for selected conversation - use detailed conversation data if available
  const messages = useMemo(() => {
    return (
      selectedConversationDetails?.messages ||
      (selectedContact ? messagesByConversation[selectedContact.id] || [] : [])
    );
  }, [
    selectedConversationDetails?.messages,
    selectedContact?.id,
    messagesByConversation,
  ]);

  // Scroll to bottom
  const scrollToBottom = (immediate = false, force = false) => {
    // Don't auto-scroll if user has manually scrolled up and not forcing
    if (!force && userHasScrolled) {
      return;
    }

    const scrollAction = () => {
      if (scrollAreaRef.current) {
        // For ScrollArea component, we need to scroll the viewport
        const viewport = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]",
        );
        if (viewport) {
          // Use a slight delay to ensure content is rendered
          setTimeout(() => {
            viewport.scrollTop = viewport.scrollHeight;
            // Reset user scrolled state after successful scroll to bottom
            if (!userHasScrolled) {
              setUserHasScrolled(false);
            }
          }, 10);
        }
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    };

    if (immediate) {
      scrollAction();
    } else {
      // Wait for the DOM to update, then scroll to bottom
      setTimeout(scrollAction, 10); // Reduced timeout for smoother experience
    }
  };

  useEffect(() => {
    if (!SCROLL_FEATURES_ENABLED) return;
    // Only scroll to bottom for new messages if user hasn't scrolled up
    // or if it's the initial load
    const isInitialLoad = messages.length > 0 && !userHasScrolled;
    if (isInitialLoad || !userHasScrolled) {
      scrollToBottom(false, true); // Force scroll for new messages
    }

    // Also ensure we reset the bottom API trigger when new messages arrive
    setHasTriggeredBottomApi(false);

    // Update messaging window state if selected conversation details have changed
    if (selectedConversationDetails) {
      const windowState = getMessagingWindowState(selectedConversationDetails);
      setMessagingWindowActive(windowState.isActive);
      setMessagingWindowHoursRemaining(windowState.hoursRemaining);
      setMessagingWindowStatus(windowState.status);
    }
  }, [
    messages,
    selectedConversationDetails,
    getMessagingWindowState,
    userHasScrolled,
  ]);

  // Load conversations and stats on mount
  useEffect(() => {
    if (token) {
      dispatch(fetchConversations({ token, status: "active", limit: 20 }));
      dispatch(fetchLatestContacts({ token, limit: 10, hours: 24 }));
      // dispatch(fetchUnreadConversations({ token }));
    }
  }, [token, dispatch]);
  // Handle initial loading completion
  useEffect(() => {
    if (conversationsLoading === false && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [conversationsLoading, isInitialLoad]);

  // When the user returns to the tab, pull the freshest messages immediately
  useEffect(() => {
    const handleFocus = () => {
      if (selectedContact && token) {
        dispatch(
          fetchConversationById({
            token,
            id: selectedContact.id,
            limit: 50,
            offset: 0,
          }),
        );
      }
    };
    const handleVisibility = () => {
      if (!document.hidden) handleFocus();
    };
    const handleOnline = handleFocus;

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
    };
  }, [selectedContact?.id, token, dispatch]);

  // Manage polling lifecycle with self-scheduling timeout (prevents overlapping requests)
  useEffect(() => {
    if (!selectedContact || !token) return;

    let cancelled = false;
    let timerId = null;

    const poll = async () => {
      if (cancelled) return;
      try {
        const result = await dispatch(
          fetchConversationById({
            token,
            id: selectedContact.id,
            limit: 50,
            offset: 0,
          }),
        ).unwrap();

        if (result?.data) {
          const windowState = getMessagingWindowState(result.data);
          setMessagingWindowActive(windowState.isActive);
          setMessagingWindowHoursRemaining(windowState.hoursRemaining);
          setMessagingWindowStatus(windowState.status);
        }
      } catch (error) {
        console.error("Error polling for new messages:", error);
      } finally {
        if (!cancelled) {
          timerId = setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    };

    poll(); // immediate first pull

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [selectedContact?.id, token, dispatch, getMessagingWindowState]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Initialize messaging window state
  useEffect(() => {
    // Initialize with default values
    setMessagingWindowActive(false);
    setMessagingWindowStatus("inactive");
    setMessagingWindowHoursRemaining(0);
  }, []);

  // Attach scroll event to the ScrollArea viewport when component mounts and when SCROLL_FEATURES_ENABLED changes
  useEffect(() => {
    if (!SCROLL_FEATURES_ENABLED || !scrollAreaRef.current) return;

    const timer = setTimeout(() => {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );

      if (scrollContainer) {
        scrollContainer.addEventListener("scroll", handleScroll);

        // Clean up the event listener
        return () => {
          scrollContainer.removeEventListener("scroll", handleScroll);
        };
      }
    }, 100); // Delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, [SCROLL_FEATURES_ENABLED, selectedContact]);

  // Reset bottom trigger and scroll state when conversation changes
  useEffect(() => {
    setHasTriggeredBottomApi(false);
    setUserHasScrolled(false);
  }, [selectedContact?.id]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!selectedContact) return;
    if (!messagingWindowActive) {
      // Show a toast notification that messaging window is inactive
      toast({
        title: "Messaging Window Inactive",
        description: "You cannot send messages during inactive window periods.",
        variant: "destructive",
      });
      return;
    }

    const tempId = `temp-${Date.now()}`;

    // Set sending state to show loading indicator
    setIsSendingMessage(true);

    // Determine the media type based on the selected file
    const isImage =
      selectedImage &&
      selectedImage.type &&
      selectedImage.type.startsWith("image/");
    const isVideo =
      selectedImage &&
      selectedImage.type &&
      selectedImage.type.startsWith("video/");
    const isAudio =
      selectedImage &&
      selectedImage.type &&
      selectedImage.type.startsWith("audio/");
    const isDocument =
      selectedImage && selectedImage.type && !isImage && !isVideo && !isAudio;

    // Optimistic message so the sender sees it instantly
    const optimisticMessage = {
      id: tempId,
      tempId,
      direction: "outbound",
      content: newMessage,
      status: "sending",
      type: isImage
        ? "image"
        : isVideo
          ? "video"
          : isAudio
            ? "audio"
            : isDocument
              ? "document"
              : "text",
      media_url:
        selectedImage && (isImage || isVideo || isAudio || isDocument)
          ? URL.createObjectURL(selectedImage)
          : null,
      media_type: selectedImage?.type,
      media_filename: selectedImage?.name,
      whatsapp_timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      conversation_id: selectedContact.id,
    };

    dispatch(
      addLocalMessage({
        conversationId: selectedContact.id,
        message: optimisticMessage,
      }),
    );

    try {
      await dispatch(
        sendConversationMessage({
          token,
          conversationId: selectedContact.id, // integer database ID
          message: newMessage,
          type: isImage
            ? "image"
            : isVideo
              ? "video"
              : isAudio
                ? "audio"
                : isDocument
                  ? "document"
                  : "text",
          // Include media details when sending media
          ...(selectedImage && {
            // For media files, send the binary file directly instead of URL
            ...(isImage || isVideo || isAudio || isDocument
              ? {
                file: selectedImage, // Send the actual file object in binary format
                media_type:
                  selectedImage.type ||
                  (isImage
                    ? "image/jpeg"
                    : isVideo
                      ? "video/mp4"
                      : isAudio
                        ? "audio/mpeg"
                        : "application/octet-stream"),
                media_filename:
                  selectedImage.name ||
                  (isImage
                    ? "image.jpg"
                    : isVideo
                      ? "video.mp4"
                      : isAudio
                        ? "audio.mp3"
                        : "document.pdf"),
              }
              : {
                // For text messages, just send the message
                message: newMessage,
              }),
          }),
          tempId,
        }),
      ).unwrap();

      // Force refresh to pull server copy immediately
      await dispatch(
        fetchConversationById({
          token,
          id: selectedContact.id,
          limit: 50,
          offset: 0,
        }),
      );
    } catch (error) {
      toast({
        title: "Message failed",
        description: "Could not send the message. Please try again.",
        variant: "destructive",
      });
      dispatch(
        failLocalMessage({
          conversationId: selectedContact.id,
          tempId,
        }),
      );
    } finally {
      // Reset sending state regardless of success or failure
      setIsSendingMessage(false);
      setNewMessage("");
      setSelectedImage(null);

      // Ensure we scroll to bottom after sending a message
      setTimeout(() => {
        scrollToBottom(true, true); // Force scroll after sending message
        setUserHasScrolled(false); // Reset scroll state after sending
      }, 100);
    }
  };

  // Function to reset messaging window (for testing purposes)
  const resetMessagingWindow = () => {
    setMessagingWindowActive(true);
    setMessagingWindowStatus("active");
    setMessagingWindowHoursRemaining(24);
  };

  const handleStatusUpdate = (status) => {
    if (selectedContact) {
      dispatch(
        updateConversationStatus({
          token,
          id: selectedContact.id,
          status,
        }),
      );
    }
  };

  // Load more messages when scrolling to top
  const loadMoreMessages = async () => {
    if (!selectedContact || isLoadingMore || !hasMoreMessages) return;

    setIsLoadingMore(true);
    const newOffset = currentOffset + 1;

    try {
      const result = await dispatch(
        fetchConversationById({
          token,
          id: selectedContact.id,
          offset: newOffset,
          limit: 50,
        }),
      ).unwrap();

      // Update messaging window state based on conversation data
      if (result?.data) {
        const windowState = getMessagingWindowState(result.data);
        setMessagingWindowActive(windowState.isActive);
        setMessagingWindowHoursRemaining(windowState.hoursRemaining);
        setMessagingWindowStatus(windowState.status);
      }

      if (result?.data?.messages?.length < 50) {
        setHasMoreMessages(false);
      }

      setCurrentOffset(newOffset);
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle scroll to top for pagination and hide content while scrolling
  const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;

    // Check if user has scrolled up from bottom
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    if (!isAtBottom && !userHasScrolled) {
      setUserHasScrolled(true);
    } else if (isAtBottom && userHasScrolled) {
      // User has scrolled back to bottom
      setUserHasScrolled(false);
    }

    // Show scrolling state
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Hide scrolling state after 150ms of no scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    // Load more messages when scrolled to top (but don't show loading indicator during normal scrolling)
    if (scrollTop === 0 && hasMoreMessages && !isLoadingMore) {
      // Only trigger loading when user intentionally scrolls to top
      const scrollPosition = scrollTop;
      setTimeout(() => {
        const currentScrollTop = event.target.scrollTop;
        // Check if user is still at top after a brief delay
        if (currentScrollTop === 0 && hasMoreMessages && !isLoadingMore) {
          loadMoreMessages();
        }
      }, 100);
    }

    // Note: Removed bottom API call from scroll handler to prevent multiple calls
    // Bottom API is now handled separately when needed
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
    if (!status) return null;
    switch (status) {
      case "sending":
        return <Clock className="w-3 h-3" />;
      case "sent":
        return <span className="text-xs">✓</span>;
      case "delivered":
        return <span className="text-xs">✓✓</span>;
      case "read":
        return <span className="text-xs text-blue-200">✓✓</span>;
      case "failed":
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const filteredContacts = Array.isArray(conversations)
    ? conversations.filter(
      (c) =>
        c.contact_details?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        c.phone_number?.includes(searchQuery) ||
        c.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    : [];

  // Reset new messages count when switching conversations
  useEffect(() => {
    setNewMessagesCount(0);
    setLastMessageCount(messages.length);
  }, [selectedContact?.id]);

  // Track new messages
  useEffect(() => {
    if (messages.length > lastMessageCount && userHasScrolled) {
      const newCount = messages.length - lastMessageCount;
      setNewMessagesCount((prev) => prev + newCount);
    }
    setLastMessageCount(messages.length);
  }, [messages.length, lastMessageCount, userHasScrolled]);

  // Show loading only on initial page load
  if (isInitialLoad && conversationsLoading) {
    return <BaseLoading message="Loading conversations..." />;
  }

  return (
    <div className="h-full bg-gradient-subtle overflow-hidden">
      <div className="h-full max-w-7xl mx-auto sm:px-4">
        <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-2 lg:gap-4">
          {/* Contacts Sidebar */}
          <div
            className={`
              ${selectedContact ? "hidden lg:block" : "block"}
              lg:basis-1/3 transition-transform duration-300 ease-in-out relative z-0 bg-white lg:bg-transparent`}
          >
            <Card className="h-full flex flex-col card-elegant shadow-elegant relative z-50 w-full">
              <div className="p-4 lg:p-6 border-b border-border/50 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-base lg:text-lg text-foreground">
                      Conversations
                    </h2>
                    <p className="text-muted-foreground mt-0 hidden sm:block">
                      {stats
                        ? `${stats.total} conversations`
                        : "Communicate with your contacts instantly"}
                    </p>
                  </div>
                  {unreadConversations && unreadConversations.length > 0 && (
                    <div className="bg-primary text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {unreadConversations.length}
                    </div>
                  )}
                </div>
              </div>
              <div className="relative mb-0 sticky top-0 bg-white dark:bg-gray-900 z-10 p-4 pb-4">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800 border-2 border-border/30 focus:border-primary/50 h-12 text-sm lg:text-base rounded-full shadow-sm transition-all duration-200 focus:shadow-md"
                />
              </div>
              <div
                className="p-2 lg:px-2"
                style={{ height: "calc(100vh - 120px)", overflowY: "auto" }}
              >
                {filteredContacts.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-2 lg:p-4">
                    <p className="text-xs lg:text-sm text-muted-foreground">
                      No contacts found.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="flex-1">
                    <div className="space-y-1 lg:space-y-1">
                      {filteredContacts.map((contact) => (
                        <div
                          key={contact.id}
                          onClick={() => {
                            setSelectedContact(contact);
                            // Reset pagination state for new conversation
                            setCurrentOffset(0);
                            setHasMoreMessages(true);
                            setIsLoadingMore(false);
                            setHasTriggeredBottomApi(false); // Reset bottom API trigger for new conversation
                            setUserHasScrolled(false); // Reset scroll state for new conversation

                            // Update messaging window state based on contact data
                            const windowState =
                              getMessagingWindowState(contact);
                            setMessagingWindowActive(windowState.isActive);
                            setMessagingWindowHoursRemaining(
                              windowState.hoursRemaining,
                            );
                            setMessagingWindowStatus(windowState.status);

                            // Fetch detailed conversation data with messages
                            dispatch(
                              fetchConversationById({
                                token,
                                id: contact.id,
                                limit: 50,
                                offset: 0,
                              }),
                            ).then((result) => {
                              // Update messaging window state based on conversation data
                              if (result.payload?.data) {
                                const windowState = getMessagingWindowState(
                                  result.payload.data,
                                );
                                setMessagingWindowActive(windowState.isActive);
                                setMessagingWindowHoursRemaining(
                                  windowState.hoursRemaining,
                                );
                                setMessagingWindowStatus(windowState.status);
                              }
                              // Scroll to bottom after messages are loaded
                              setTimeout(() => {
                                scrollToBottom(true, true); // Force scroll when selecting contact
                              }, 100);
                            });
                            // Mark as read when selected
                            dispatch(markConversationAsRead(contact.id));
                            if (window.innerWidth < 1024) {
                              setIsContactListOpen(false);
                            }
                          }}
                          className={`p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-accent/50 mb-2 mx-2 ${selectedContact?.id === contact?.id
                              ? "bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary/30 shadow-md"
                              : "border border-border/20 bg-white dark:bg-gray-800 hover:shadow-sm"
                            }`}
                        >
                          <div className="flex items-center space-x-2 lg:space-x-3">
                            <Avatar className="w-10 h-10 lg:w-10 lg:h-10 ring-2 ring-border/20">
                              <AvatarFallback className="bg-gradient-primary text-white font-semibold text-xs lg:text-base">
                                {contact.contact_details?.name
                                  ?.split(" ")
                                  ?.map((n) => n[0])
                                  ?.join("") || contact.phone_number?.slice(-2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5 lg:mb-1">
                                <h3 className="font-semibold text-sm lg:text-base text-foreground truncate">
                                  {contact.contact_details?.name ||
                                    contact.contact_name ||
                                    contact.phone_number}
                                </h3>
                                <div className="flex items-center space-x-1">
                                  {contact.is_unread && (
                                    <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                      1
                                    </span>
                                  )}
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {contact.last_message_at
                                      ? new Date(
                                        contact.last_message_at,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                      : new Date().toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs lg:text-sm text-muted-foreground truncate">
                                {contact.latest_message &&
                                  contact.latest_message.length > 0
                                  ? contact.latest_message[0].content
                                  : contact.last_message_preview ||
                                  "No messages yet."}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </Card>
          </div>

          {/* Chat Area */}
          <div
            className={`
            ${!selectedContact ? "hidden lg:block" : "block"}
            flex-1 lg:basis-2/3 relative z-0`}
          >
            <Card
              className="h-full flex flex-col card-elegant shadow-elegant relative z-0"
              style={{
                maxHeight: "calc(100vh - 100px)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Chat Header - Only show when contact is selected */}
              {selectedContact && (
                <div className="p-4 lg:p-6 border-b border-border/50 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm flex-shrink-0 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <button
                        className="lg:hidden p-2 rounded-full hover:bg-muted"
                        onClick={() => {
                          setSelectedContact(null);
                          setIsContactListOpen(true);
                        }}
                        aria-label="Back to contacts"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-chevron-left"
                        >
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </button>
                      <Avatar className="w-10 h-10 lg:w-12 lg:h-12 ring-2 ring-border/20">
                        <AvatarFallback className="bg-gradient-primary text-white font-semibold text-xs lg:text-base">
                          {(
                            selectedConversationDetails?.contact_details
                              ?.name || selectedContact?.contact_details?.name
                          )
                            ?.split(" ")
                            ?.map((n) => n[0])
                            ?.join("") ||
                            (
                              selectedConversationDetails?.phone_number ||
                              selectedContact?.phone_number
                            )?.slice(-2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <h3 className="font-semibold text-sm lg:text-base text-foreground">
                          {selectedConversationDetails?.contact_details?.name ||
                            selectedContact?.contact_details?.name ||
                            selectedConversationDetails?.contact_name ||
                            selectedContact?.contact_name ||
                            selectedConversationDetails?.phone_number ||
                            selectedContact?.phone_number}
                        </h3>
                        <div className="flex flex-col text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 shrink-0" />
                            <span>
                              {selectedConversationDetails?.phone_number ||
                                selectedContact?.phone_number}
                            </span>
                          </div>

                          {(selectedConversationDetails?.contact_details
                            ?.email ||
                            selectedContact?.contact_details?.email) && (
                              <div className="flex items-center gap-2 mt-1">
                                <Mail className="w-4 h-4 shrink-0" />
                                <span>
                                  {selectedConversationDetails?.contact_details
                                    ?.email ||
                                    selectedContact?.contact_details?.email}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2"></div>
                  </div>
                </div>
              )}
              {/* ======================== Messages ======================== */}
              {!selectedContact && conversations.length > 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12">
                  <div className="text-center max-w-md">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Users className="w-12 h-12 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">
                      Welcome to Chat
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed mb-6">
                      Select a conversation from the sidebar to start messaging.
                      Your conversations will appear here once you choose a
                      contact.
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span>Ready to chat</span>
                    </div>
                  </div>
                </div>
              ) : !selectedContact ? (
                <div className="flex-1"></div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12">
                  <div className="text-center max-w-sm">
                    {/* Show messaging window status when no messages exist */}
                    {messagingWindowActive ? (
                      <>
                        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Send className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Start the conversation
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Send your first message to begin chatting with{" "}
                          {selectedContact?.contact_details?.name ||
                            selectedContact?.contact_name ||
                            selectedContact?.phone_number}
                        </p>
                      </>
                    ) : (
                      <div className="text-center max-w-sm">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900/20 dark:to-gray-800/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Clock className="w-10 h-10 text-gray-600 dark:text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Messaging Window Inactive
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Currently unable to send messages to{" "}
                          {selectedContact?.contact_details?.name ||
                            selectedContact?.contact_name ||
                            selectedContact?.phone_number}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <ScrollArea
                  ref={scrollAreaRef}
                  className="flex-1 w-full overflow-y-auto p-2 lg:px-4 bg-gradient-to-b from-background/50 to-muted/20"
                  style={{ flex: 1, minHeight: 0 }}
                >
                  <div
                    className={`space-y-2 lg:space-y-4 transition-opacity duration-200 ${SCROLL_FEATURES_ENABLED && isScrolling
                        ? "opacity-30"
                        : "opacity-100"
                      }`}
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Loading indicator for pagination - only show when actively loading */}
                    {isLoadingMore && hasMoreMessages && (
                      <div className="flex justify-center py-3">
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-white/80 dark:bg-gray-800/80 px-3 py-2 rounded-full shadow-sm">
                          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading more messages...</span>
                        </div>
                      </div>
                    )}
                    {messages.map((message, index) => {
                      const showDate =
                        index === 0 ||
                        formatDate(
                          message.whatsapp_timestamp || message.created_at,
                        ) !==
                        formatDate(
                          messages[index - 1]?.whatsapp_timestamp ||
                          messages[index - 1]?.created_at,
                        );

                      const resolvedType = resolveMessageType(message);
                      const fileBadgeLabel = getFileBadgeLabel(message);
                      const fileBadgeClass =
                        getFileBadgeClasses(fileBadgeLabel);

                      return (
                        <div key={message.id}>
                          {showDate && (
                            <div className="flex justify-center my-4">
                              <Badge variant="secondary" className="text-xs">
                                {formatDate(
                                  message.whatsapp_timestamp ||
                                  message.created_at,
                                )}
                              </Badge>
                            </div>
                          )}
                          <div
                            className={`flex ${message.direction === "outbound"
                                ? "justify-end"
                                : "justify-start"
                              }`}
                          >
                            <div
                              className={`max-w-[75%] lg:max-w-md px-4 lg:px-5 py-3 lg:py-4 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${message.direction === "outbound"
                                  ? "bg-gradient-to-r from-primary to-primary/90 text-white rounded-br-lg ml-auto"
                                  : "bg-white dark:bg-gray-800 border border-border/30 text-foreground rounded-bl-lg shadow-sm"
                                }`}
                            >
                              {message.media_url && (
                                <div className="mb-2">
                                  {message.type === "image" ? (
                                    <div className="relative group">
                                      <img
                                        src={
                                          message.media_display_url ||
                                          `${API_BASE_URL}/conversations/${message.conversation_id}/media/${message.media_url}`
                                        }
                                        alt={
                                          message.media_display?.filename ||
                                          "Image"
                                        }
                                        className="rounded-md max-h-64 object-cover w-full border border-border/20 cursor-pointer"
                                        onClick={() => openMediaModal(message)}
                                        onError={(e) => {
                                          // Try fallback URLs
                                          if (message.media_download_url) {
                                            e.target.src =
                                              message.media_download_url;
                                          } else if (
                                            message.media_url &&
                                            !message.media_url.startsWith(
                                              "http",
                                            )
                                          ) {
                                            e.target.src = `${API_BASE_URL}/conversations/${message.conversation_id}/media/${message.media_url}`;
                                          }
                                        }}
                                      />
                                      {message.content && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {message.content}
                                        </p>
                                      )}
                                    </div>
                                  ) : resolvedType === "video" ? (
                                    <div
                                      className="relative bg-black rounded-md overflow-hidden max-h-64 cursor-pointer"
                                      onClick={() => openMediaModal(message)}
                                    >
                                      <video
                                        src={
                                          message.media_display_url ||
                                          `${API_BASE_URL}/conversations/${message.conversation_id}/media/${message.media_url}`
                                        }
                                        controls
                                        className="w-full max-h-64 object-contain"
                                        poster={
                                          message.media_display?.thumbnail_url
                                        }
                                        onError={(e) => {
                                          if (message.media_download_url) {
                                            e.target.src =
                                              message.media_download_url;
                                          } else if (
                                            message.media_url &&
                                            !message.media_url.startsWith(
                                              "http",
                                            )
                                          ) {
                                            e.target.src = `${API_BASE_URL}/conversations/${message.conversation_id}/media/${message.media_url}`;
                                          }
                                        }}
                                      >
                                        Your browser does not support the video
                                        tag.
                                      </video>
                                      {message.content && (
                                        <p className="text-xs text-white/80 mt-2 bg-black/50 px-2 py-1 rounded">
                                          {message.content}
                                        </p>
                                      )}
                                    </div>
                                  ) : message.type === "document" ? (
                                    <div
                                      className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 max-w-sm border border-border/20 cursor-pointer"
                                      onClick={() => openMediaModal(message)}
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div
                                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-semibold text-xs uppercase border ${fileBadgeClass}`}
                                        >
                                          {fileBadgeLabel}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-foreground truncate">
                                            {message.media_display?.filename ||
                                              message.media_filename ||
                                              "Document"}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {message.media_type
                                              ?.split("/")[1]
                                              ?.toUpperCase() || "FILE"}
                                          </p>
                                        </div>
                                        <a
                                          href={
                                            message.media_download_url ||
                                            (message.media_url.startsWith(
                                              "http",
                                            )
                                              ? message.media_url
                                              : `${API_BASE_URL}/conversations/${message.conversation_id}/media/${message.media_url}?download=1`)
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-500 hover:text-blue-700 text-sm font-medium flex-shrink-0"
                                        >
                                          Download
                                        </a>
                                      </div>
                                      {message.content && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                          {message.content}
                                        </p>
                                      )}
                                    </div>
                                  ) : resolvedType === "audio" ? (
                                    <div
                                      className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-border/20 cursor-pointer"
                                      onClick={() => openMediaModal(message)}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <div
                                          className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[10px] uppercase border ${fileBadgeClass}`}
                                        >
                                          {fileBadgeLabel}
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm font-medium">
                                            Audio Message
                                          </p>
                                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                                            <Badge
                                              variant="outline"
                                              className={`text-[10px] px-2 py-0.5 ${fileBadgeClass}`}
                                            >
                                              {fileBadgeLabel}
                                            </Badge>
                                            <span className="truncate">
                                              {message.media_display
                                                ?.filename ||
                                                message.media_filename ||
                                                "Audio"}
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                      <audio
                                        src={
                                          message.media_display_url ||
                                          `${API_BASE_URL}/conversations/${message.conversation_id}/media/${message.media_url}`
                                        }
                                        controls
                                        className="w-full mt-2"
                                        onError={(e) => {
                                          if (message.media_download_url) {
                                            e.target.src =
                                              message.media_download_url;
                                          } else if (
                                            message.media_url &&
                                            !message.media_url.startsWith(
                                              "http",
                                            )
                                          ) {
                                            e.target.src = `${API_BASE_URL}/conversations/${message.conversation_id}/media/${message.media_url}`;
                                          }
                                        }}
                                      >
                                        Your browser does not support the audio
                                        element.
                                      </audio>
                                      {message.content && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                          {message.content}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    // Generic media handler
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-border/20">
                                      <div className="flex items-center space-x-3">
                                        <div
                                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-semibold text-xs uppercase border ${fileBadgeClass}`}
                                        >
                                          {fileBadgeLabel}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-foreground truncate">
                                            {message.media_display?.filename ||
                                              message.media_filename ||
                                              "Media File"}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {fileBadgeLabel}
                                          </p>
                                        </div>
                                        <a
                                          href={
                                            message.media_download_url ||
                                            (message.media_url.startsWith(
                                              "http",
                                            )
                                              ? message.media_url
                                              : `${API_BASE_URL}/conversations/${message.conversation_id}/media/${message.media_url}?download=1`)
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-500 hover:text-blue-700 text-sm font-medium flex-shrink-0"
                                        >
                                          Download
                                        </a>
                                      </div>
                                      {message.content && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                          {message.content}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {message.content && !message.media_url && (
                                <p className="text-xs lg:text-sm leading-relaxed break-words">
                                  {message.content}
                                </p>
                              )}
                              <div
                                className={`flex items-center justify-end mt-1 lg:mt-2 space-x-1 ${message.direction === "outbound"
                                    ? "text-white/70"
                                    : "text-muted-foreground"
                                  }`}
                              >
                                <span className="text-xs font-medium">
                                  {formatTime(
                                    message.whatsapp_timestamp ||
                                    message.created_at,
                                  )}
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
                    {/* New Messages Indicator at End of Chat */}
                    {newMessagesCount > 0 && userHasScrolled && (
                      <div className="flex justify-center my-4">
                        <button
                          onClick={() => {
                            scrollToBottom(true, true);
                            setUserHasScrolled(false);
                            setNewMessagesCount(0);
                          }}
                          className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg hover:bg-primary/90 transition-all animate-bounce"
                        >
                          <span>
                            {newMessagesCount} new message
                            {newMessagesCount > 1 ? "s" : ""}
                          </span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m18 15-6-6-6 6" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              )}

              {/* Input */}
              {selectedContact && (
                <div className="p-3 lg:p-5 border-t border-border/50 bg-white flex-shrink-0 relative">
                  {selectedImage && (
                    <div className="relative w-fit mb-2">
                      {selectedImage.type &&
                        selectedImage.type.startsWith("image/") ? (
                        <img
                          src={
                            typeof selectedImage === "string"
                              ? selectedImage
                              : URL.createObjectURL(selectedImage)
                          }
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                      ) : selectedImage.type &&
                        selectedImage.type.startsWith("video/") ? (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg border flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-video"
                          >
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect
                              x="1"
                              y="5"
                              width="15"
                              height="14"
                              rx="2"
                              ry="2"
                            />
                          </svg>
                          <span className="absolute text-xs text-center break-words px-1">
                            {selectedImage.name}
                          </span>
                        </div>
                      ) : (
                        // For other file types (documents, etc.)
                        <div className="w-20 h-20 bg-blue-100 rounded-lg border flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-file-text"
                          >
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                            <path d="M16 13H8" />
                            <path d="M16 17H8" />
                            <path d="M10 9H8" />
                          </svg>
                          <span className="absolute text-xs text-center break-words px-1">
                            {selectedImage.name}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Conditionally render input based on messaging window status */}
                  {messagingWindowActive && (
                    <div className="flex items-center gap-2 w-full">
                      {/* File Upload Button - supports multiple file types */}
                      <label
                        htmlFor="fileUpload"
                        className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer shrink-0"
                      >
                        <Paperclip className="w-4 h-4 text-gray-600" />
                      </label>

                      <input
                        type="file"
                        id="fileUpload"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.mp4,.mov,.avi,.mkv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedImage(file);

                            // If it's a video or other file type, show a preview or just the filename
                            if (file.type.startsWith("video/")) {
                              // Video preview would go here if needed
                            } else if (file.type.startsWith("image/")) {
                              // Image preview is already handled
                            }
                          }
                        }}
                      />

                      {/* Message Input */}
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 h-10 sm:h-11 rounded-full px-4 text-sm bg-gray-50 border border-gray-200 focus:border-primary"
                      />

                      {/* Send Button */}
                      <Button
                        onClick={handleSendMessage}
                        disabled={(!newMessage.trim() && !selectedImage) || isSendingMessage}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary hover:bg-primary/90 shrink-0 flex items-center justify-center"
                      >
                        {isSendingMessage ? (
                          <div className="w-4 h-4">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          </div>
                        ) : (
                          <Send className="w-4 h-4 text-white" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
