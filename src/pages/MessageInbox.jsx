import React, {
    useEffect,
    useRef,
    useState,
    useMemo,
    useCallback,
} from "react";
import EmojiPicker from "emoji-picker-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
    CalendarCheck,
    Video,
    ClipboardPaste,
    Store,
    Smile,
    Trash2,
    MoreHorizontal,
    Quote,
    Mic,
    Square,
    Pin,
    MapPin,
    Play,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// VideoThumbnail component to play inline and prevent flickering on API polls
const VideoThumbnail = ({ message }) => {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const videoRef = React.useRef(null);

    // Memoize the initial URL to prevent re-fetching when signature changes during polling
    const initialSrc = React.useMemo(() => {
        const url = message.media_display_url || message.media_url;
        return url ? `${url}#t=0.001` : undefined;
    }, [message.id]);

    React.useEffect(() => {
        if (!videoRef.current) return;
        
        // Auto-pause when scrolled out of view
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting && videoRef.current && !videoRef.current.paused) {
                        videoRef.current.pause();
                    }
                });
            },
            { threshold: 0.1 } // Pause if less than 10% is visible
        );

        observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, []);

    const togglePlay = (e) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        
        if (videoRef.current.paused) {
            videoRef.current.play().catch(console.error);
        } else {
            videoRef.current.pause();
        }
    };

    return (
        <div
            className="relative bg-black rounded-md overflow-hidden max-h-64 cursor-pointer group"
            onClick={togglePlay}
        >
            <video
                ref={videoRef}
                src={initialSrc}
                preload="metadata"
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className={`w-full max-h-64 object-contain transition-opacity ${!isPlaying ? 'opacity-90 group-hover:opacity-100' : 'opacity-100'}`}
                poster={message.media_display?.thumbnail_url}
                onError={(e) => {
                    // If the hash URL fails, try falling back to the raw URL
                    const rawUrl = message.media_download_url || message.media_url;
                    if (rawUrl && e.target.src !== rawUrl) {
                        e.target.src = rawUrl;
                    }
                }}
            >
                Your browser does not support the video tag.
            </video>
            
            {/* Play Button Overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-black/60 transition-colors pointer-events-auto">
                        <Play className="w-7 h-7 text-white fill-white ml-1" />
                    </div>
                </div>
            )}
        </div>
    );
};
import { useDispatch, useSelector } from "react-redux";
import {
    fetchConversations,
    fetchLatestContacts,
    fetchConversationById,
    sendConversationMessage,
    updateConversationStatus,
    markConversationAsRead,
    addLocalMessage,
    failLocalMessage,
    assignConversation,
    tagConversation,
    createLead
} from "@/features/conversations/conversationSlice";
import { BaseLoading } from "../components/BaseLoading";
import { ImageEditor } from "../components/ImageEditor";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/config/api";

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

export const MessageInbox = () => {
    const messagesEndRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const attachmentMenuRef = useRef(null);
    const { toast } = useToast();
    const [newMessage, setNewMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [editingImageIndex, setEditingImageIndex] = useState(null);
    const [replyingToMessage, setReplyingToMessage] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeReactionMessageId, setActiveReactionMessageId] = useState(null);
    const [activeMoreMenuMessageId, setActiveMoreMenuMessageId] = useState(null);
    const [messageReactions, setMessageReactions] = useState({});
    const [localReplies, setLocalReplies] = useState({});
    const [deletedMessageIds, setDeletedMessageIds] = useState(new Set());
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [isContactListOpen, setIsContactListOpen] = useState(false);
    const [pinnedContactIds, setPinnedContactIds] = useState(new Set());
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordedAudio, setRecordedAudio] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);
    const [selectedContact, setSelectedContact] = useState(null);
    const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
    const [leadName, setLeadName] = useState("");
    const [leadEmail, setLeadEmail] = useState("");
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
    const [lastSeenMessageId, setLastSeenMessageId] = useState(null);
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    // Location sharing state
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [locationLatitude, setLocationLatitude] = useState("");
    const [locationLongitude, setLocationLongitude] = useState("");
    const [locationName, setLocationName] = useState("");
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [isSendingLocation, setIsSendingLocation] = useState(false);

    // Paste preview state
    const [pastePreviewOpen, setPastePreviewOpen] = useState(false);
    const [pastePreviewFile, setPastePreviewFile] = useState(null);
    const [pasteCaption, setPasteCaption] = useState("");
    const [isSendingPaste, setIsSendingPaste] = useState(false);

    // Messaging Window State
    const [messagingWindowActive, setMessagingWindowActive] = useState(true);
    const [messagingWindowHoursRemaining, setMessagingWindowHoursRemaining] =
        useState(0);
    const [messagingWindowStatus, setMessagingWindowStatus] =
        useState("inactive");

    const scrollAreaRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const lastMessageTimestampRef = useRef(null);

    const token = localStorage.getItem("token");
    const dispatch = useDispatch();

    const POLL_INTERVAL_MS = 5000; // 5s polling interval

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
        const apiMessages = (
            selectedConversationDetails?.messages ||
            (selectedContact ? messagesByConversation[selectedContact.id] || [] : [])
        );

        return apiMessages;
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
            // setMessagingWindowActive(windowState.isActive); // Always keep it true for testing
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
    // Close popovers on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
            if (isAttachmentMenuOpen && attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
                setIsAttachmentMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showEmojiPicker, isAttachmentMenuOpen]);
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



    // Reset bottom trigger and scroll state when conversation changes
    useEffect(() => {
        setHasTriggeredBottomApi(false);
        setUserHasScrolled(false);
    }, [selectedContact?.id]);

    const handleReactToMessage = async (messageId, emoji) => {
        // Optimistic UI — only ONE reaction allowed per message
        setMessageReactions(prev => {
            const current = prev[messageId]?.[0]; // only first (and only) reaction matters

            if (emoji && current === emoji) {
                // Same emoji clicked → toggle off
                return { ...prev, [messageId]: [] };
            }
            // New emoji → replace (single reaction only)
            return { ...prev, [messageId]: emoji ? [emoji] : [] };
        });

        const currentReaction = messageReactions[messageId]?.[0];
        const isRemoving = emoji && currentReaction === emoji;
        const apiEmoji = isRemoving ? "" : emoji;
        const conversationId = selectedContact?.id;

        if (!conversationId) return;

        try {
            const formData = new FormData();
            formData.append("emoji", apiEmoji);
            await apiService.post(
                `whatsapp/inbox/${conversationId}/messages/${messageId}/react`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
        } catch (error) {
            console.error("Failed to react to message:", error);
            toast({
                variant: "destructive",
                title: "Failed to react",
                description: "Could not send reaction.",
            });
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                if (audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    setRecordedAudio(audioBlob);
                }
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            toast({ title: "Error", description: "Microphone access denied or unavailable", variant: "destructive" });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(recordingTimerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            // Clear out the chunks so onstop won't save it
            audioChunksRef.current = [];
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(recordingTimerRef.current);
        } else if (recordedAudio) {
            setRecordedAudio(null);
        }
    };


    const handleSendMessage = async () => {
        if (!selectedContact) return;

        const tempIdBase = `temp-${Date.now()}`;
        setIsSendingMessage(true);

        const filesToSend = selectedFiles.length > 0 ? selectedFiles : [null];
        let isFirst = true;

        for (const file of filesToSend) {
            const tempId = `${tempIdBase}-${Math.random().toString(36).substring(2, 9)}`;

            const isStringFile = typeof file === 'string';
            const isImage = isStringFile ? true : file?.type?.startsWith("image/");
            const isVideo = isStringFile ? false : file?.type?.startsWith("video/");
            const isAudio = (!file && !!recordedAudio) || (!isStringFile && file?.type?.startsWith("audio/"));
            const isDocument = file && !isImage && !isVideo && !isAudio;

            let mediaUrl = null;
            let mediaType = null;
            let mediaFilename = null;

            if (recordedAudio && !file) {
                mediaUrl = URL.createObjectURL(recordedAudio);
                mediaType = 'audio/webm';
                mediaFilename = `voice_message_${Date.now()}.webm`;
            } else if (file) {
                if (isStringFile) {
                    mediaUrl = file;
                    mediaType = file.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? `image/${file.split('.').pop().toLowerCase()}` : 'image/jpeg';
                    mediaFilename = file.split('/').pop() || 'forwarded_image.jpg';
                } else {
                    mediaUrl = URL.createObjectURL(file);
                    mediaType = file.type;
                    mediaFilename = file.name;
                }
            }

            const content = isFirst ? newMessage : "";

            const optimisticMessage = {
                id: tempId,
                tempId,
                direction: "outbound",
                content: content,
                status: "sent",
                type: isImage ? "image" : isVideo ? "video" : isAudio ? "audio" : isDocument ? "document" : "text",
                media_url: mediaUrl,
                media_type: mediaType,
                media_filename: mediaFilename,
                whatsapp_timestamp: new Date().toISOString(),
                created_at: new Date().toISOString(),
                conversation_id: selectedContact.id,
            };

            if (replyingToMessage && isFirst) {
                setLocalReplies((prev) => ({
                    ...prev,
                    [newMessage]: replyingToMessage,
                    [optimisticMessage.id]: replyingToMessage,
                }));
            }

            // Dispatch local message for optimistic UI
            dispatch(addLocalMessage({ conversationId: selectedContact.id, message: optimisticMessage }));

            // Dispatch real message to backend
            const fileObj = recordedAudio && !file ? new File([recordedAudio], mediaFilename, { type: mediaType }) : (isStringFile ? null : file);
            dispatch(sendConversationMessage({
                token,
                conversationId: selectedContact.id,
                message: content,
                type: optimisticMessage.type,
                file: fileObj,
                media_url: mediaUrl,
                media_type: mediaType,
                media_filename: mediaFilename,
                reply_to_message_id: replyingToMessage ? (replyingToMessage.capabilities?.reply_to_message_id || replyingToMessage.id) : undefined,
                endpoint: replyingToMessage?.reply_endpoint || undefined
            }));

            isFirst = false;
        }

        setIsSendingMessage(false);
        setNewMessage("");
        setSelectedFiles([]);
        setRecordedAudio(null);
        setReplyingToMessage(null);
        setIsAttachmentMenuOpen(false);

        setTimeout(() => {
            scrollToBottom(true, true);
            setUserHasScrolled(false);
        }, 50);
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

    const handleTagConversation = async (tag) => {
        if (!selectedContact) return;
        try {
            await dispatch(tagConversation({ token, id: selectedContact.id, tag })).unwrap();
            toast({ title: "Tag applied", description: `Conversation tagged as ${tag}` });
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to tag", description: error.message || "Something went wrong" });
        }
    };

    const handleAssignConversation = async (userId) => {
        if (!selectedContact) return;
        try {
            await dispatch(assignConversation({ token, id: selectedContact.id, user_id: userId ? parseInt(userId) : null })).unwrap();
            toast({ title: "Assigned", description: "Conversation assigned successfully" });
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to assign", description: error.message || "Something went wrong" });
        }
    };

    const handleCreateLead = async () => {
        if (!selectedContact) return;
        if (!leadName.trim()) {
            toast({ variant: "destructive", title: "Name required", description: "Please enter a name for the lead" });
            return;
        }
        try {
            await dispatch(createLead({ token, id: selectedContact.id, name: leadName, email: leadEmail })).unwrap();
            toast({ title: "Lead Created", description: "Contact converted to lead successfully" });
            setIsLeadDialogOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to create lead", description: error.message || "Something went wrong" });
        }
    };

    const handleSendLocation = async () => {
        if (!selectedContact) return;
        const lat = parseFloat(locationLatitude);
        const lng = parseFloat(locationLongitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
            toast({ variant: "destructive", title: "Invalid latitude", description: "Latitude must be between -90 and 90." });
            return;
        }
        if (isNaN(lng) || lng < -180 || lng > 180) {
            toast({ variant: "destructive", title: "Invalid longitude", description: "Longitude must be between -180 and 180." });
            return;
        }

        setIsSendingLocation(true);

        // Optimistic message bubble
        const tempId = `temp-loc-${Date.now()}`;
        const optimisticMessage = {
            id: tempId,
            tempId,
            direction: "outbound",
            content: locationName || `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            status: "sent",
            type: "location",
            location_latitude: lat,
            location_longitude: lng,
            location_name: locationName,
            whatsapp_timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            conversation_id: selectedContact.id,
        };
        dispatch(addLocalMessage({ conversationId: selectedContact.id, message: optimisticMessage }));

        try {
            const payload = { latitude: lat, longitude: lng };
            if (locationName.trim()) payload.name = locationName.trim();
            await apiService.post(`whatsapp/inbox/${selectedContact.id}/send-location`, payload);
            toast({ title: "Location sent", description: "Location has been shared successfully." });
        } catch (error) {
            dispatch(failLocalMessage({ conversationId: selectedContact.id, tempId }));
            toast({ variant: "destructive", title: "Failed to send location", description: error?.message || "Something went wrong." });
        } finally {
            setIsSendingLocation(false);
            setIsLocationModalOpen(false);
            setLocationLatitude("");
            setLocationLongitude("");
            setLocationName("");
            setTimeout(() => { scrollToBottom(true, true); setUserHasScrolled(false); }, 50);
        }
    };

    // Direct send — no modal, uses GPS immediately
    const handleSendCurrentLocation = () => {
        if (!selectedContact) return;
        if (!navigator.geolocation) {
            toast({ variant: "destructive", title: "Not supported", description: "Geolocation is not supported by your browser." });
            return;
        }
        toast({ title: "Getting location…", description: "Fetching your GPS coordinates." });
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const tempId = `temp-loc-${Date.now()}`;
                const optimisticMessage = {
                    id: tempId,
                    tempId,
                    direction: "outbound",
                    content: `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                    status: "sent",
                    type: "location",
                    location_latitude: lat,
                    location_longitude: lng,
                    location_name: "",
                    whatsapp_timestamp: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    conversation_id: selectedContact.id,
                };
                dispatch(addLocalMessage({ conversationId: selectedContact.id, message: optimisticMessage }));
                try {
                    await apiService.post(`whatsapp/inbox/${selectedContact.id}/send-location`, { latitude: lat, longitude: lng });
                    toast({ title: "Location sent", description: "Your location has been shared." });
                } catch (error) {
                    dispatch(failLocalMessage({ conversationId: selectedContact.id, tempId }));
                    toast({ variant: "destructive", title: "Failed to send location", description: error?.message || "Something went wrong." });
                } finally {
                    setTimeout(() => { scrollToBottom(true, true); setUserHasScrolled(false); }, 50);
                }
            },
            () => {
                toast({ variant: "destructive", title: "Location denied", description: "Please allow location access in your browser." });
            },
            { timeout: 5000 }
        );
    };
    const handlePinMessage = async (messageId) => {

        if (!selectedContact) return;
        try {
            await apiService.post(`whatsapp/inbox/${selectedContact.id}/pin/${messageId}`);
            toast({ title: "Message Pinned", description: "The message has been pinned." });
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to pin", description: "Could not pin the message." });
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!selectedContact) return;
        try {
            // Optimistically hide the message
            setDeletedMessageIds(prev => new Set([...prev, messageId]));
            await apiService.delete(`whatsapp/inbox/${selectedContact.id}/messages/${messageId}`);
            toast({ title: "Message Deleted", description: "The message has been deleted." });
        } catch (error) {
            // Revert on failure
            setDeletedMessageIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(messageId);
                return newSet;
            });
            toast({ variant: "destructive", title: "Failed to delete", description: "Could not delete the message." });
        }
    };

    const handlePasteClick = async () => {
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                for (const type of item.types) {
                    if (type.startsWith("image/")) {
                        const blob = await item.getType(type);
                        const ext = type.split("/")[1] || "png";
                        const file = new File([blob], `clipboard.${ext}`, { type });
                        // Add directly to selectedFiles — shows as thumbnail in input area
                        setSelectedFiles(prev => [...prev, file]);
                        return;
                    }
                }
            }
            // If it reaches here, no image was found in clipboard
            toast({ variant: "destructive", title: "No image found", description: "Please copy an image first to paste." });
        } catch {
            // Clipboard API not permitted or clipboard is empty/unreadable
            toast({ variant: "destructive", title: "Paste failed", description: "Please copy an image first or allow clipboard permissions." });
        }
    };

    const handleSendPasteFile = async () => {
        if (!pastePreviewFile || !selectedContact) return;
        setIsSendingPaste(true);
        const file = pastePreviewFile;
        const tempId = `temp-paste-${Date.now()}`;
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        const isAudio = file.type.startsWith("audio/");
        const mediaUrl = URL.createObjectURL(file);
        const optimisticMessage = {
            id: tempId,
            tempId,
            direction: "outbound",
            content: pasteCaption,
            status: "sent",
            type: isImage ? "image" : isVideo ? "video" : isAudio ? "audio" : "document",
            media_url: mediaUrl,
            media_type: file.type,
            media_filename: file.name,
            whatsapp_timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            conversation_id: selectedContact.id,
        };
        dispatch(addLocalMessage({ conversationId: selectedContact.id, message: optimisticMessage }));
        dispatch(sendConversationMessage({
            token,
            conversationId: selectedContact.id,
            message: pasteCaption,
            type: optimisticMessage.type,
            file,
            media_url: mediaUrl,
            media_type: file.type,
            media_filename: file.name,
        }));
        setIsSendingPaste(false);
        setPastePreviewOpen(false);
        setPastePreviewFile(null);
        setPasteCaption("");
        setTimeout(() => { scrollToBottom(true, true); setUserHasScrolled(false); }, 50);
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
        // Ensure we only handle scroll events from the ScrollArea viewport
        if (!event.target.hasAttribute || !event.target.hasAttribute("data-radix-scroll-area-viewport")) return;
        
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
                return <span className="text-xs text-blue-500">✓✓</span>;
            case "failed":
                return <XCircle className="w-3 h-3 text-red-500" />;
            default:
                return null;
        }
    };

    const sourceConversations = conversations;

    const filteredContacts = Array.isArray(sourceConversations)
        ? sourceConversations.filter(
            (c) =>
                c.contact_details?.name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                c.phone_number?.includes(searchQuery) ||
                c.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.latest_message?.[0]?.content?.toLowerCase().includes(searchQuery.toLowerCase()),
        ).sort((a, b) => {
            const aPinned = pinnedContactIds.has(a.id);
            const bPinned = pinnedContactIds.has(b.id);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return 0;
        })
        : [];

    // Reset new messages count when switching conversations
    useEffect(() => {
        setNewMessagesCount(0);
        if (messages.length > 0) {
            setLastSeenMessageId(messages[messages.length - 1].id || messages[messages.length - 1]._id);
        } else {
            setLastSeenMessageId(null);
        }
    }, [selectedContact?.id]);

    // Track new messages based on ID instead of length
    useEffect(() => {
        if (messages.length === 0) return;
        
        if (!userHasScrolled) {
            // User is at bottom, they see everything, reset counter and update last seen
            setNewMessagesCount(0);
            setLastSeenMessageId(messages[messages.length - 1].id || messages[messages.length - 1]._id);
        } else if (userHasScrolled && lastSeenMessageId) {
            // User is scrolled up, count messages after lastSeenMessageId
            const index = messages.findIndex(m => (m.id || m._id) === lastSeenMessageId);
            if (index === -1) {
                // Last seen message is no longer in the array (e.g., dropped due to limit)
                setNewMessagesCount(messages.length);
            } else {
                const newCount = messages.length - 1 - index;
                if (newCount >= 0) {
                    setNewMessagesCount(newCount);
                }
            }
        }
    }, [messages, userHasScrolled, lastSeenMessageId]);

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
              lg:w-[350px] lg:flex-none transition-transform duration-300 ease-in-out relative z-0 bg-white lg:bg-transparent`}
                    >
                        <Card className="h-full flex flex-col card-elegant shadow-elegant relative z-50 w-full">
                            <div className="p-2 lg:p-2 border-b border-border/50 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm">
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
                            <div className="relative mb-0 sticky top-0 bg-white dark:bg-gray-900 z-10 p-2 pb-4">
                                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder="Search contacts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-white dark:bg-gray-800 border-2 border-border/30 focus:border-primary/50 h-12 text-sm lg:text-base rounded-full shadow-sm transition-all duration-200 focus:shadow-md"
                                />
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto pr-2 lg:pr-3 pb-4">
                                {filteredContacts.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                                        <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-3">
                                            <Search className="w-6 h-6 text-muted-foreground/50" />
                                        </div>
                                        <p className="text-sm font-medium text-foreground mb-1">No contacts found</p>
                                        <p className="text-xs text-muted-foreground">
                                            Try adjusting your search query.
                                        </p>
                                    </div>
                                ) : (
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
                                                className={`px-2 py-1 rounded-xl cursor-pointer transition-all duration-200 hover:bg-accent/50 mx-2 ${selectedContact?.id === contact?.id
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
                                                            <div className="flex items-center space-x-1 shrink-0 ml-2">
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
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Chat Area */}
                    <div
                        className={`
            ${!selectedContact ? "hidden lg:block" : "block"}
            flex-1 relative z-0`}
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
                                <div className="p-3 lg:p-4 bg-white dark:bg-[#202c33] border-b border-border/50 flex-shrink-0 relative">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2 lg:space-x-3">
                                            <button
                                                className="lg:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2a3942] text-gray-600 dark:text-gray-300"
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
                                            <Avatar className="w-10 h-10 lg:w-12 lg:h-12 ring-2 ring-primary/10 bg-primary/10">
                                                <AvatarFallback className="bg-transparent text-primary font-semibold text-xs lg:text-base">
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
                                                <h3 className="font-semibold text-sm lg:text-base text-gray-900 dark:text-gray-100">
                                                    {selectedConversationDetails?.contact_details?.name ||
                                                        selectedContact?.contact_details?.name ||
                                                        selectedConversationDetails?.contact_name ||
                                                        selectedContact?.contact_name ||
                                                        selectedConversationDetails?.phone_number ||
                                                        selectedContact?.phone_number}
                                                </h3>
                                                <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    <span>
                                                        {selectedConversationDetails?.phone_number ||
                                                            selectedContact?.phone_number}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-1 lg:space-x-3">
                                            {/* <Dialog open={isLeadDialogOpen} onOpenChange={setIsLeadDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="hidden sm:flex h-9" onClick={() => {
                                                        setLeadName(selectedContact?.contact_details?.name || selectedContact?.contact_name || "");
                                                        setLeadEmail("");
                                                    }}>
                                                        Create Lead
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Convert to Lead</DialogTitle>
                                                        <DialogDescription>Convert this contact into a CRM lead.</DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid gap-2">
                                                            <label htmlFor="leadName" className="text-sm font-medium">Name</label>
                                                            <Input id="leadName" value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Full name of the lead" />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <label htmlFor="leadEmail" className="text-sm font-medium">Email (Optional)</label>
                                                            <Input id="leadEmail" type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder="Email address" />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setIsLeadDialogOpen(false)}>Cancel</Button>
                                                        <Button onClick={handleCreateLead}>Save Lead</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog> */}

                                            {/* Dropdown menu removed */}
                                        </div>
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
                                <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12">
                                    <div className="text-center max-w-md">
                                        <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                            <Users className="w-12 h-12 text-primary" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-foreground mb-3">
                                            No Conversations Yet
                                        </h3>
                                        <p className="text-base text-muted-foreground leading-relaxed mb-6">
                                            You don't have any active conversations. When you receive or send a message, it will appear here.
                                        </p>
                                    </div>
                                </div>
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
                                    onScrollCapture={handleScroll}
                                    className="flex-1 w-full overflow-y-auto p-2 lg:px-4 bg-[#efeae2] dark:bg-[#0b141a]"
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
                                            if (deletedMessageIds.has(message.id)) return null;

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
                                                <div key={message.id} id={`message-${message.id}`}>
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
                                                        className={`flex w-full ${message.direction === "outbound"
                                                            ? "justify-end"
                                                            : "justify-start"
                                                            }`}
                                                    >
                                                        <div className={`relative group flex items-center max-w-[85%] lg:max-w-2xl ${message.direction === "outbound" ? "flex-row-reverse" : "flex-row"}`}>
                                                            <div
                                                                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md relative ${message.direction === "outbound"
                                                                    ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-gray-100 rounded-tr-none"
                                                                    : "bg-white dark:bg-[#202c33] border-none text-gray-900 dark:text-gray-100 rounded-tl-none shadow-sm"
                                                                    }`}
                                                            >
                                                                {/* Reply Context Render */}
                                                                {(() => {
                                                                    const replyContextRaw = localReplies[message.id] || localReplies[message.content] || message.context?.message || message.reply_context || message.reply_to || (message.replied_to_message_id && messages.find(m => m.id === message.replied_to_message_id)) || message.context;

                                                                    if (!replyContextRaw || (typeof replyContextRaw === 'object' && Object.keys(replyContextRaw).length === 0)) return null;

                                                                    // Try to find the actual message in our state for full content and correct DOM ID
                                                                    const actualMessage = messages.find(m =>
                                                                        m.id === replyContextRaw.id ||
                                                                        m.meta_message_id === replyContextRaw.id ||
                                                                        m.meta_message_id === replyContextRaw.message_id ||
                                                                        m.meta_message_id === message.context?.id ||
                                                                        m.meta_message_id === message.context?.message_id ||
                                                                        m.id === message.replied_to_message_id
                                                                    );

                                                                    const replyContext = actualMessage || replyContextRaw;

                                                                    return (
                                                                        <div className="mb-2 p-2 bg-black/5 dark:bg-white/10 rounded border-l-4 border-primary text-xs cursor-pointer hover:bg-black/10 transition-colors" onClick={() => {
                                                                            const targetId = replyContext.id || (replyContext.meta_message_id ? replyContext.meta_message_id : null);
                                                                            // First try by database ID, then by WAMID if applicable
                                                                            let element = document.getElementById(`message-${targetId}`);
                                                                            if (!element && actualMessage) {
                                                                                element = document.getElementById(`message-${actualMessage.id}`);
                                                                            }

                                                                            if (element) {
                                                                                element.scrollIntoView({ behavior: "smooth", block: "center" });
                                                                                const innerDiv = element.querySelector('.group > div');
                                                                                if (innerDiv) {
                                                                                    innerDiv.style.transition = "all 0.5s";
                                                                                    innerDiv.style.backgroundColor = "rgba(59, 130, 246, 0.2)"; // Highlight color
                                                                                    setTimeout(() => {
                                                                                        innerDiv.style.backgroundColor = "";
                                                                                    }, 1500);
                                                                                }
                                                                            } else {
                                                                                console.log("Message element not found for ID:", targetId);
                                                                                toast({
                                                                                    title: "Message not found",
                                                                                    description: "The original message is too old or hasn't been loaded yet.",
                                                                                    variant: "default"
                                                                                });
                                                                            }
                                                                        }}>
                                                                            <p className="font-semibold text-primary mb-1">
                                                                                {replyContext.direction === "outbound" ? "You" : (selectedContact?.contact_name || "Contact")}
                                                                            </p>
                                                                            <p className="truncate opacity-80">
                                                                                {replyContext.content || (replyContext.media_url ? "Media" : "Message")}
                                                                            </p>
                                                                        </div>
                                                                    );
                                                                })()}
                                                                {message.media_url && (
                                                                    <div className="mb-2">
                                                                        {message.type === "image" ? (
                                                                            <div className="relative group">
                                                                                <img
                                                                                    src={
                                                                                        message.media_display_url ||
                                                                                        message.media_url
                                                                                    }
                                                                                    alt={
                                                                                        message.media_display?.filename ||
                                                                                        "Image"
                                                                                    }
                                                                                    className="rounded-md max-h-48 object-cover w-full border border-border/20 cursor-pointer"
                                                                                    onClick={() => openMediaModal(message)}
                                                                                    onError={(e) => {
                                                                                        // Try fallback URLs
                                                                                        if (message.media_download_url) {
                                                                                            e.target.src =
                                                                                                message.media_download_url;
                                                                                            e.target.src = message.media_url;
                                                                                        }
                                                                                    }}
                                                                                />
                                                                                {message.content && (
                                                                                    <p className="text-sm lg:text-[15px] text-gray-800 dark:text-gray-200 mt-1.5 leading-relaxed">
                                                                                        {message.content}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        ) : resolvedType === "video" ? (
                                                                            <div className="max-w-[320px]">
                                                                                <VideoThumbnail message={message} />
                                                                                {message.content && (
                                                                                    <p className="text-sm lg:text-[15px] text-gray-800 dark:text-gray-200 mt-1.5 leading-relaxed break-words">
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
                                                                                            message.media_download_url || message.media_url
                                                                                        }
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-blue-500 hover:text-blue-700 text-sm font-medium flex-shrink-0"
                                                                                    >
                                                                                        Download
                                                                                    </a>
                                                                                </div>
                                                                                {message.content && (
                                                                                    <p className="text-sm lg:text-[15px] text-gray-800 dark:text-gray-200 mt-2 leading-relaxed">
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
                                                                                        message.media_url
                                                                                    }
                                                                                    controls
                                                                                    className="w-full mt-2"
                                                                                    onError={(e) => {
                                                                                        if (message.media_download_url) {
                                                                                            e.target.src =
                                                                                                message.media_download_url;
                                                                                            e.target.src = message.media_url;
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    Your browser does not support the audio
                                                                                    element.
                                                                                </audio>
                                                                                {message.content && (
                                                                                    <p className="text-sm lg:text-[15px] text-gray-800 dark:text-gray-200 mt-2 leading-relaxed">
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
                                                                                            message.media_download_url || message.media_url
                                                                                        }
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-blue-500 hover:text-blue-700 text-sm font-medium flex-shrink-0"
                                                                                    >
                                                                                        Download
                                                                                    </a>
                                                                                </div>
                                                                                {message.content && (
                                                                                    <p className="text-sm lg:text-[15px] text-gray-800 dark:text-gray-200 mt-2 leading-relaxed">
                                                                                        {message.content}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {/* Location Message Renderer */}
                                                                {message.type === "location" && (
                                                                    <div className="rounded-xl overflow-hidden min-w-[220px] max-w-xs">
                                                                        <a
                                                                            href={`https://www.google.com/maps?q=${message.latitude || message.location?.latitude},${message.longitude || message.location?.longitude}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="block"
                                                                        >
                                                                            <div
                                                                                className="w-full h-28 bg-cover bg-center relative"
                                                                                style={{
                                                                                    backgroundImage: `url(https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${message.longitude || message.location?.longitude},${message.latitude || message.location?.latitude}&z=14&l=map&size=400,200&pt=${message.longitude || message.location?.longitude},${message.latitude || message.location?.latitude},pm2rdm)`,
                                                                                    backgroundColor: "#e8f4e8",
                                                                                }}
                                                                            >
                                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                                    <div className="bg-white/90 rounded-full p-1.5 shadow">
                                                                                        <MapPin className="w-5 h-5 text-red-500" />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-black/20 border-t border-black/5">
                                                                                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                                                                                <div className="min-w-0">
                                                                                    {(message.name || message.location?.name) && (
                                                                                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{message.name || message.location?.name}</p>
                                                                                    )}
                                                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                                                        {Number(message.latitude || message.location?.latitude).toFixed(5)}, {Number(message.longitude || message.location?.longitude).toFixed(5)}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </a>
                                                                    </div>
                                                                )}
                                                                {message.content && !message.media_url && message.type !== "location" && (
                                                                    <p className="text-sm lg:text-[15px] leading-relaxed break-words text-gray-900 dark:text-gray-100">
                                                                        {message.content}
                                                                    </p>
                                                                )}
                                                                <div
                                                                    className={`flex items-center justify-end mt-1 lg:mt-2 space-x-1 ${message.direction === "outbound"
                                                                        ? "text-gray-500 dark:text-white/70"
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
                                                                    {(() => {
                                                                        const activeReactions = messageReactions[message.id] || message.reaction_emojis || (message.reactions?.length > 0 ? [message.reactions[0].emoji] : []);
                                                                        if (!activeReactions || activeReactions.length === 0) return null;
                                                                        return (
                                                                            <div className={`absolute -bottom-3 ${message.direction === "outbound" ? "right-2" : "left-2"} flex -space-x-1 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 p-0.5 z-10`}>
                                                                                {activeReactions.map((emoji, i) => (
                                                                                    <span key={i} className="text-xs bg-gray-50 dark:bg-gray-700 rounded-full w-5 h-5 flex items-center justify-center border border-white dark:border-gray-800">{emoji}</span>
                                                                                ))}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>

                                                            {/* Hover Actions Menu */}
                                                            <div className={`absolute -top-10 ${message.direction === "outbound" ? "right-4" : "left-4"} flex items-center bg-white dark:bg-[#2a3942] shadow-sm border border-gray-100 dark:border-gray-700 rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 space-x-1`}>
                                                                {/* Quick Emojis */}
                                                                {['👍', '❤️', '😂', '😮'].map(emoji => (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={() => {
                                                                            handleReactToMessage(message.id, emoji);
                                                                        }}
                                                                        className="p-1 hover:bg-gray-100 dark:hover:bg-[#374c58] rounded-full text-lg transition-colors leading-none"
                                                                        title={`React with ${emoji}`}
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}

                                                                <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1"></div>

                                                                {message.can_react !== false && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setActiveReactionMessageId(activeReactionMessageId === message.id ? null : message.id);
                                                                            setActiveMoreMenuMessageId(null);
                                                                        }}
                                                                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#374c58] rounded-full transition-colors relative"
                                                                        title="React"
                                                                    >
                                                                        <div className="relative flex items-center justify-center">
                                                                            <Smile className="w-4 h-4" />
                                                                            <span className="absolute -bottom-1 -right-1 bg-white dark:bg-[#2a3942] rounded-full text-[8px] font-bold">+</span>
                                                                        </div>
                                                                    </button>
                                                                )}

                                                                {activeReactionMessageId === message.id && (
                                                                    <div className={`absolute top-full mt-2 z-50 ${message.direction === "outbound" ? "right-0" : "left-0"}`}>
                                                                        <div className="fixed inset-0 z-40" onClick={() => setActiveReactionMessageId(null)}></div>
                                                                        <div className="relative z-50 shadow-xl rounded-lg">
                                                                            <EmojiPicker
                                                                                onEmojiClick={(emojiData) => {
                                                                                    handleReactToMessage(message.id, emojiData.emoji);
                                                                                    setActiveReactionMessageId(null);
                                                                                }}
                                                                                width={280}
                                                                                height={350}
                                                                                searchDisabled
                                                                                skinTonesDisabled
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1"></div>

                                                                {message.can_reply !== false && (
                                                                    <button
                                                                        onClick={() => setReplyingToMessage(message)}
                                                                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#374c58] rounded-full transition-colors"
                                                                        title="Reply"
                                                                    >
                                                                        <Quote className="w-4 h-4" fill="currentColor" />
                                                                    </button>
                                                                )}

                                                                {/* More Options menu removed */}
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

                            {/* Floating Scroll to Bottom Button */}
                            {newMessagesCount > 0 && userHasScrolled && (
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-[90px] lg:bottom-[100px] z-[50]">
                                    <button
                                        onClick={() => {
                                            scrollToBottom(true, true);
                                            setUserHasScrolled(false);
                                            setNewMessagesCount(0);
                                        }}
                                        className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg hover:bg-primary/90 transition-all animate-bounce"
                                        title="Scroll to bottom"
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

                            {/* Input */}
                            {selectedContact && (
                                <div className="p-2 lg:p-3 border-t border-border/50 bg-white flex-shrink-0 relative">
                                    {selectedFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2 max-h-[200px] overflow-y-auto p-1">
                                            {selectedFiles.map((file, index) => {
                                                const isImage = typeof file === "string" || file.type?.startsWith("image/");
                                                const isVideo = typeof file !== "string" && file.type?.startsWith("video/");
                                                return (
                                                    <div key={index} className="relative w-20 h-20 shrink-0">
                                                        {isImage ? (
                                                            <div className="relative group w-full h-full cursor-pointer" onClick={() => setEditingImageIndex(index)}>
                                                                <img
                                                                    src={typeof file === "string" ? file : URL.createObjectURL(file)}
                                                                    alt="Preview"
                                                                    className="w-20 h-20 object-cover rounded-lg border group-hover:opacity-80 transition-opacity"
                                                                />
                                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg pointer-events-none">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                                                </div>
                                                            </div>
                                                        ) : isVideo ? (
                                                            <div className="w-20 h-20 bg-gray-200 rounded-lg border flex items-center justify-center relative overflow-hidden">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-video text-gray-500">
                                                                    <polygon points="23 7 16 12 23 17 23 7" />
                                                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                                                </svg>
                                                                <span className="absolute bottom-0 w-full bg-black/50 text-white text-[10px] text-center truncate px-1 py-0.5">
                                                                    {file.name}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="w-20 h-20 bg-blue-100 rounded-lg border flex items-center justify-center relative overflow-hidden">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text text-blue-500">
                                                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                                                    <polyline points="14 2 14 8 20 8" />
                                                                    <path d="M16 13H8" />
                                                                    <path d="M16 17H8" />
                                                                    <path d="M10 9H8" />
                                                                </svg>
                                                                <span className="absolute bottom-0 w-full bg-black/50 text-white text-[10px] text-center truncate px-1 py-0.5">
                                                                    {file.name}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10 hover:bg-red-600 transition-colors"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Conditionally render input based on messaging window status */}
                                    {/* {messagingWindowActive && ( */}
                                    <div className="flex flex-col w-full relative">
                                        {/* Reply Preview */}
                                        {replyingToMessage && (
                                            <div className="w-[calc(100%-20px)] left-[10px] bg-[#f0f2f5] dark:bg-gray-800/95 border-l-[6px] border-primary p-2.5 px-3 rounded-t-xl flex items-center justify-between absolute bottom-full mb-0 z-10 shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 transition-all">
                                                <div className="flex-1 min-w-0 mr-4 flex flex-col justify-center">
                                                    <span className="text-[13px] font-bold text-primary mb-0.5 leading-none">
                                                        {replyingToMessage.direction === "outbound" ? "You" : (selectedContact?.contact_name || "Contact")}
                                                    </span>
                                                    <span className="text-[13px] text-gray-600 dark:text-gray-300 truncate leading-tight">
                                                        {replyingToMessage.content || (replyingToMessage.media_url ? "Media" : "Message")}
                                                    </span>
                                                </div>
                                                {replyingToMessage.media_url && (
                                                    <div className="w-10 h-10 mr-2 rounded overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
                                                        <img
                                                            src={replyingToMessage.media_download_url || replyingToMessage.media_url}
                                                            alt="Media preview"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none'; // Hide broken image links
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setReplyingToMessage(null)}
                                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 w-full">

                                            {/* Attachment Menu */}
                                            <div ref={attachmentMenuRef} className="relative shrink-0 flex items-center justify-center">
                                                <button
                                                    onClick={() => {
                                                        setIsAttachmentMenuOpen(!isAttachmentMenuOpen);
                                                        setShowEmojiPicker(false);
                                                    }}
                                                    className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full cursor-pointer shrink-0 transition-colors ${isAttachmentMenuOpen ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200"
                                                        }`}
                                                >
                                                    <Paperclip className="w-4 h-4 text-gray-600" />
                                                </button>

                                                {isAttachmentMenuOpen && (
                                                    <div className="absolute bottom-14 left-0 w-64 z-50">
                                                        <div className="relative z-50 bg-white rounded-2xl shadow-lg border border-gray-100 py-3 animate-in fade-in zoom-in-95 duration-200">
                                                            <button
                                                                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors text-left"
                                                                onClick={() => {
                                                                    document.getElementById("fileUpload")?.click();
                                                                    setIsAttachmentMenuOpen(false);
                                                                }}
                                                            >
                                                                <div className="text-blue-500">
                                                                    <Image className="w-5 h-5" />
                                                                </div>
                                                                <span className="text-sm text-gray-700 font-medium">Photos / Video / File</span>
                                                            </button>

                                                            <button
                                                                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                                                onClick={() => {
                                                                    setIsAttachmentMenuOpen(false);
                                                                    handlePasteClick();
                                                                }}
                                                            >
                                                                <div className="text-cyan-500">
                                                                    <ClipboardPaste className="w-5 h-5" />
                                                                </div>
                                                                <span className="text-sm text-gray-700 font-medium">Paste Image / File</span>
                                                            </button>

                                                            {/* <button
                                                                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                                                onClick={() => {
                                                                    setIsAttachmentMenuOpen(false);
                                                                    setIsLocationModalOpen(true);
                                                                }}
                                                            >
                                                                <div className="text-emerald-600">
                                                                    <Store className="w-5 h-5" />
                                                                </div>
                                                                <span className="text-sm text-gray-700 font-medium">Shop Location</span>
                                                            </button> */}

                                                            <button
                                                                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                                                onClick={() => {
                                                                    setIsAttachmentMenuOpen(false);
                                                                    handleSendCurrentLocation();
                                                                }}
                                                            >
                                                                <div className="text-red-500">
                                                                    <MapPin className="w-5 h-5" />
                                                                </div>
                                                                <span className="text-sm text-gray-700 font-medium">My Current Location</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <input
                                                type="file"
                                                id="fileUpload"
                                                multiple
                                                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.mp4,.mov,.avi,.mkv"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    if (files.length > 0) {
                                                        setSelectedFiles(prev => [...prev, ...files]);
                                                    }
                                                }}
                                            />

                                            {/* Message Input or Recording UI */}
                                            {isRecording ? (
                                                <div className="flex-1 h-10 sm:h-11 rounded-full px-4 text-sm bg-red-50 border border-red-200 flex items-center justify-between animate-in fade-in zoom-in duration-200">
                                                    <div className="flex items-center gap-2 text-red-500 font-medium">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                                                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                                    </div>
                                                    <button onClick={cancelRecording} className="text-gray-500 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : recordedAudio ? (
                                                <div className="flex-1 h-10 sm:h-11 rounded-full px-4 text-sm bg-blue-50 border border-blue-200 flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-blue-600 font-medium">
                                                        <Mic className="w-4 h-4" />
                                                        Audio Recorded
                                                    </div>
                                                    <button onClick={cancelRecording} className="text-gray-500 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <Input
                                                    placeholder="Type a message..."
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    onKeyPress={handleKeyPress}
                                                    className="flex-1 h-10 sm:h-11 rounded-full px-4 text-sm bg-gray-50 border border-gray-200 focus:border-primary"
                                                />
                                            )}

                                            {/* Send or Mic Button */}
                                            {newMessage.trim() || selectedFiles.length > 0 || recordedAudio ? (
                                                <Button
                                                    onClick={handleSendMessage}
                                                    disabled={(!newMessage.trim() && selectedFiles.length === 0 && !recordedAudio) || isSendingMessage}
                                                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary hover:bg-primary/90 shrink-0 flex items-center justify-center transition-all duration-200 scale-100 active:scale-95"
                                                >
                                                    {isSendingMessage ? (
                                                        <div className="w-4 h-4">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                        </div>
                                                    ) : (
                                                        <Send className="w-4 h-4 text-white" />
                                                    )}
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={isRecording ? stopRecording : startRecording}
                                                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full shrink-0 flex items-center justify-center transition-all duration-200 scale-100 active:scale-95 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
                                                        }`}
                                                >
                                                    {isRecording ? <Square className="w-4 h-4 text-white fill-current" /> : <Mic className="w-5 h-5 text-white" />}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    {/* )} */}
                                </div>
                            )}

                            {/* ========== Paste Image Preview (inside chat area) ========== */}
                            {pastePreviewOpen && pastePreviewFile && (
                                <div className="absolute inset-0 z-20 flex flex-col bg-[#111b21] rounded-xl overflow-hidden">
                                    {/* Top bar */}
                                    <div className="flex items-center justify-between px-4 py-3 bg-[#202c33] shrink-0">
                                        <span className="text-gray-200 text-sm font-medium truncate max-w-[70%]">
                                            {pastePreviewFile.name}
                                        </span>
                                        <button
                                            onClick={() => { setPastePreviewOpen(false); setPastePreviewFile(null); setPasteCaption(""); }}
                                            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Preview area */}
                                    <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
                                        {pastePreviewFile.type.startsWith("image/") ? (
                                            <img
                                                src={URL.createObjectURL(pastePreviewFile)}
                                                alt="Preview"
                                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                            />
                                        ) : pastePreviewFile.type.startsWith("video/") ? (
                                            <video
                                                src={URL.createObjectURL(pastePreviewFile)}
                                                controls
                                                className="max-w-full max-h-full rounded-lg shadow-2xl"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-4 text-gray-200">
                                                <div className="w-24 h-24 rounded-2xl bg-[#202c33] flex items-center justify-center">
                                                    <Paperclip className="w-10 h-10 text-gray-400" />
                                                </div>
                                                <p className="text-base font-medium">{pastePreviewFile.name}</p>
                                                <p className="text-sm text-gray-400">{(pastePreviewFile.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Filename label */}
                                    <div className="flex justify-center pb-2 shrink-0">
                                        <span className="text-xs text-gray-400 bg-black/30 px-3 py-1 rounded-full">
                                            {pastePreviewFile.name}
                                        </span>
                                    </div>

                                    {/* Bottom bar */}
                                    <div className="shrink-0 bg-[#202c33] px-3 py-3 flex items-center gap-3">
                                        <button
                                            onClick={() => { setPastePreviewOpen(false); document.getElementById("fileUpload")?.click(); }}
                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2a3942] text-gray-300 hover:text-white hover:bg-[#374c58] transition-colors shrink-0"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <input
                                            type="text"
                                            placeholder="Add a caption…"
                                            value={pasteCaption}
                                            onChange={(e) => setPasteCaption(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") handleSendPasteFile(); }}
                                            className="flex-1 h-11 rounded-full px-5 text-sm bg-[#2a3942] text-gray-100 placeholder-gray-400 border-none outline-none focus:ring-0"
                                        />
                                        <button
                                            onClick={handleSendPasteFile}
                                            disabled={isSendingPaste}
                                            className="w-12 h-12 flex items-center justify-center rounded-full bg-[#00a884] hover:bg-[#02b898] disabled:opacity-60 text-white shrink-0 shadow-lg transition-colors"
                                        >
                                            {isSendingPaste ? (
                                                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                            ) : (
                                                <Send className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
            {editingImageIndex !== null && selectedFiles[editingImageIndex] && (
                <ImageEditor
                    file={selectedFiles[editingImageIndex]}
                    isOpen={true}
                    onClose={() => setEditingImageIndex(null)}
                    onSave={(newFile) => {
                        setSelectedFiles(prev => {
                            const newFiles = [...prev];
                            newFiles[editingImageIndex] = newFile;
                            return newFiles;
                        });
                        setEditingImageIndex(null);
                    }}
                />
            )}

            {/* ========== Media Viewer Modal ========== */}
            {mediaModalOpen && selectedMedia && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm">
                    <div className="absolute top-4 left-6 text-white/90 text-lg font-medium">
                        Photo
                    </div>
                    <div className="absolute top-4 right-6 flex items-center gap-4">
                        <button
                            onClick={() => {
                                const fileUrl = selectedMedia.media_download_url || selectedMedia.media_url;
                                setSelectedFiles(prev => [...prev, fileUrl]);
                                setEditingImageIndex(selectedFiles.length);
                                closeMediaModal();
                            }}
                            className="px-4 py-1.5 rounded-full bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-colors shadow-lg"
                        >
                            Mark & Resend
                        </button>
                        <button
                            onClick={closeMediaModal}
                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center p-8 mt-12">
                        {selectedMedia.type === "video" || selectedMedia.media_url?.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video
                                src={selectedMedia.media_download_url || selectedMedia.media_url}
                                controls
                                autoPlay
                                className="max-w-full max-h-full object-contain drop-shadow-2xl"
                            />
                        ) : (
                            <img
                                src={selectedMedia.media_download_url || selectedMedia.media_url}
                                alt="Media Preview"
                                className="max-w-full max-h-full object-contain drop-shadow-2xl"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* ========== Send Location Modal ========== */}
            {isLocationModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsLocationModalOpen(false); }}
                >
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-red-500" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Share Location</h3>
                            </div>
                            <button
                                onClick={() => setIsLocationModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-5 py-4 space-y-4">
                            {isGettingLocation && (
                                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                                    Fetching your current location…
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                    Latitude <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    id="locationLatitude"
                                    type="number"
                                    step="any"
                                    min="-90"
                                    max="90"
                                    placeholder="e.g. 28.6139"
                                    value={locationLatitude}
                                    onChange={(e) => setLocationLatitude(e.target.value)}
                                    className="h-10 rounded-lg text-sm border-gray-200 focus:border-red-400 dark:border-gray-700"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                    Longitude <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    id="locationLongitude"
                                    type="number"
                                    step="any"
                                    min="-180"
                                    max="180"
                                    placeholder="e.g. 77.2090"
                                    value={locationLongitude}
                                    onChange={(e) => setLocationLongitude(e.target.value)}
                                    className="h-10 rounded-lg text-sm border-gray-200 focus:border-red-400 dark:border-gray-700"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                    Location Name <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <Input
                                    id="locationName"
                                    type="text"
                                    placeholder="e.g. India Gate, New Delhi"
                                    value={locationName}
                                    onChange={(e) => setLocationName(e.target.value)}
                                    className="h-10 rounded-lg text-sm border-gray-200 focus:border-red-400 dark:border-gray-700"
                                />
                            </div>

                            {/* Live map preview */}
                            {locationLatitude && locationLongitude &&
                                !isNaN(parseFloat(locationLatitude)) &&
                                !isNaN(parseFloat(locationLongitude)) && (
                                    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-32 relative">
                                        <img
                                            src={`https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${locationLongitude},${locationLatitude}&z=14&l=map&size=400,200&pt=${locationLongitude},${locationLatitude},pm2rdm`}
                                            alt="Map preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = "none"; }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="bg-white/90 rounded-full p-1.5 shadow">
                                                <MapPin className="w-5 h-5 text-red-500" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={() => setIsLocationModalOpen(false)}
                                className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendLocation}
                                disabled={isSendingLocation || !locationLatitude || !locationLongitude}
                                className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                                {isSendingLocation ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                                        Sending…
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="w-4 h-4" />
                                        Send Location
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );

};
