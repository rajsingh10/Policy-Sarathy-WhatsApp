import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API, { apiService } from "../../config/api";

// Fetch all conversations
export const fetchConversations = createAsyncThunk(
    "conversations/fetchAll",
    async ({ token, status = "active", search = "", limit = 20 }, thunkAPI) => {
        try {
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (search) params.append('search', search);
            params.append('limit', limit);

            const res = await apiService.get(`${API.ENDPOINTS.CONVERSATIONS}?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return res.data.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Fetch conversation by ID with messages
export const fetchConversationById = createAsyncThunk(
    "conversations/fetchById",
    async ({ token, id, limit = 50, page = null, offset = null }, thunkAPI) => {
        try {
            const params = new URLSearchParams();
            params.append('limit', limit);
            if (page) params.append('page', page);
            if (offset !== null) params.append('offset', offset);

            const res = await apiService.get(`${API.ENDPOINTS.CONVERSATION_BY_ID}/${id}?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Get latest contacts from conversations
export const fetchLatestContacts = createAsyncThunk(
    "conversations/fetchLatestContacts",
    async ({ token, limit = 10, hours = 24 }, thunkAPI) => {
        try {
            const params = new URLSearchParams();
            params.append('limit', limit);
            params.append('hours', hours);

            const res = await apiService.get(`${API.ENDPOINTS.LATEST_CONTACTS}?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Get unread conversations
export const fetchUnreadConversations = createAsyncThunk(
    "conversations/fetchUnread",
    async ({ token }, thunkAPI) => {
        try {
            const res = await apiService.get(API.ENDPOINTS.UNREAD_CONVERSATIONS, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Update conversation status
export const updateConversationStatus = createAsyncThunk(
    "conversations/updateStatus",
    async ({ token, id, status }, thunkAPI) => {
        try {
            const res = await apiService.put(`${API.ENDPOINTS.UPDATE_CONVERSATION_STATUS}/${id}/status`,
                { status },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Get conversation stats
export const fetchConversationStats = createAsyncThunk(
    "conversations/fetchStats",
    async (token, thunkAPI) => {
        try {
            const res = await apiService.get(API.ENDPOINTS.CONVERSATION_STATS, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Send message in conversation
export const sendConversationMessage = createAsyncThunk(
    "conversations/sendMessage",
    async ({ token, conversationId, message, image, file, type = "text", media_url, media_type, media_filename }, thunkAPI) => {
        try {
            const formData = new FormData();
            formData.append("conversation_id", conversationId);
            formData.append("message", message || ""); // Ensure message is never undefined
            formData.append("type", type);

            if (file) {
                // Send binary file when available (for media types)
                formData.append("file", file);
            } else if (image) {
                // Fallback to image if file isn't provided
                formData.append("image", image);
            }
            if (media_url) {
                // Only append media_url if we're not sending a file
                if (!file) {
                    formData.append("media_url", media_url);
                }
            }
            if (media_type) {
                formData.append("media_type", media_type);
            }
            if (media_filename) {
                formData.append("media_filename", media_filename);
            }

            const res = await apiService.post(`${API.ENDPOINTS.CONVERSATIONS_MESSAGES}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            // Return both the response data and the original arguments for proper handling
            return {
                ...res.data,
                conversationId: conversationId,
                originalMessage: message
            };
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Fetch specific media by conversation ID and media ID
export const fetchMediaByConversationAndMediaId = createAsyncThunk(
    "conversations/fetchMediaByConversationAndMediaId",
    async ({ token, conversationId, mediaId }, thunkAPI) => {
        try {
            const res = await apiService.get(`${API.ENDPOINTS.CONVERSATIONS}/${conversationId}/media/${mediaId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Fetch messages for a conversation
export const fetchConversationMessages = createAsyncThunk(
    "conversations/fetchMessages",
    async ({ token, conversationId }, thunkAPI) => {
        try {
            const res = await apiService.get(`${API.ENDPOINTS.CONVERSATIONS}/${conversationId}/messages`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return { conversationId, messages: res.data };
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

const conversationSlice = createSlice({
    name: "conversations",
    initialState: {
        list: [],
        selected: null,
        latestContacts: [],
        unreadConversations: [],
        stats: null,
        messagesByConversation: {}, // { [conversationId]: [messages] }
        loading: false,
        messagesLoading: false,
        error: null,
    },
    reducers: {
        clearSelectedConversation: (state) => {
            state.selected = null;
        },
        // Add a local (optimistic) message so the UI updates instantly
        addLocalMessage: (state, action) => {
            const { conversationId, message } = action.payload;

            if (!state.messagesByConversation[conversationId]) {
                state.messagesByConversation[conversationId] = [];
            }
            state.messagesByConversation[conversationId].push(message);

            if (state.selected && state.selected.id === conversationId) {
                if (!state.selected.messages) {
                    state.selected.messages = [];
                }
                state.selected.messages.push(message);
            }
        },
        // Replace a local temp message with the server-confirmed one
        replaceLocalMessage: (state, action) => {
            const { conversationId, tempId, message } = action.payload;

            const replaceInArray = (arr = []) => {
                const idx = arr.findIndex(
                    (msg) => msg.id === tempId || msg.tempId === tempId
                );
                if (idx !== -1) {
                    arr[idx] = {
                        ...arr[idx],
                        ...message,
                        id: message.id || arr[idx].id,
                        tempId: undefined,
                        status: message.status || arr[idx].status,
                    };
                    return true;
                }
                return false;
            };

            replaceInArray(state.messagesByConversation[conversationId]);
            if (state.selected && state.selected.id === conversationId) {
                replaceInArray(state.selected.messages);
            }
        },
        // Mark a local message as failed so the UI can show an error state
        failLocalMessage: (state, action) => {
            const { conversationId, tempId } = action.payload;
            const markFailed = (arr = []) => {
                const msg = arr.find(
                    (m) => m.id === tempId || m.tempId === tempId
                );
                if (msg) {
                    msg.status = "failed";
                }
            };
            markFailed(state.messagesByConversation[conversationId]);
            if (state.selected && state.selected.id === conversationId) {
                markFailed(state.selected.messages);
            }
        },
        markConversationAsRead: (state, action) => {
            const conversationId = action.payload;
            const conversation = state.list.find(conv => conv.id === conversationId);
            if (conversation) {
                conversation.is_unread = false;
                conversation.status = 'read';
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch All Conversations
            .addCase(fetchConversations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.loading = false;
                const response = action.payload;
                // Handle the paginated response structure
                const data = response.data || response;
                state.list = Array.isArray(data) ? data : [];
            })
            .addCase(fetchConversations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Conversation By ID
            .addCase(fetchConversationById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchConversationById.fulfilled, (state, action) => {
                state.loading = false;
                const response = action.payload;
                const conversationData = response.success ? response.data : response.data || response;

                if (conversationData) {
                    // If this is the first load (offset 0), replace the conversation
                    if (action.meta.arg.offset === 0) {
                        state.selected = conversationData;
                    } else {
                        // For pagination (offset > 0), append new messages to existing ones
                        if (state.selected && state.selected.messages && conversationData.messages) {
                            // Prepend new messages to the beginning of the array
                            state.selected.messages = [...conversationData.messages, ...state.selected.messages];
                        } else {
                            state.selected = conversationData;
                        }
                    }

                    // For polling updates (real-time), merge new messages
                    if (action.meta.arg.offset === 0 && state.selected && state.selected.id === conversationData.id) {
                        // Merge new messages with existing ones, avoiding duplicates
                        const existingMessages = state.selected.messages || [];
                        const newMessages = conversationData.messages || [];

                        // Create a set of existing message IDs for quick lookup
                        const existingMessageIds = new Set(existingMessages.map(msg => msg.id));

                        // Filter out messages that already exist
                        const trulyNewMessages = newMessages.filter(msg => !existingMessageIds.has(msg.id));

                        // If there are new messages, add them to the conversation
                        if (trulyNewMessages.length > 0) {
                            state.selected.messages = [...existingMessages, ...trulyNewMessages];
                        }
                    }
                }
            })
            .addCase(fetchConversationById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Latest Contacts
            .addCase(fetchLatestContacts.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchLatestContacts.fulfilled, (state, action) => {
                state.loading = false;
                const data = action.payload.data || action.payload;
                state.latestContacts = Array.isArray(data) ? data : [];
            })
            .addCase(fetchLatestContacts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Unread Conversations
            .addCase(fetchUnreadConversations.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUnreadConversations.fulfilled, (state, action) => {
                state.loading = false;
                const data = action.payload.data || action.payload;
                state.unreadConversations = Array.isArray(data) ? data : [];
            })
            .addCase(fetchUnreadConversations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update Conversation Status
            .addCase(updateConversationStatus.fulfilled, (state, action) => {
                const updatedConversation = action.payload.data || action.payload;
                const index = state.list.findIndex(conv => conv.id === updatedConversation.id);
                if (index !== -1) {
                    state.list[index] = updatedConversation;
                }
                if (state.selected && state.selected.id === updatedConversation.id) {
                    state.selected = updatedConversation;
                }
            })

            // Fetch Conversation Stats
            .addCase(fetchConversationStats.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchConversationStats.fulfilled, (state, action) => {
                state.loading = false;
                state.stats = action.payload.data || action.payload;
            })
            .addCase(fetchConversationStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Send Message
            .addCase(sendConversationMessage.pending, (state) => {
                state.messagesLoading = true;
            })
            .addCase(sendConversationMessage.fulfilled, (state, action) => {
                state.messagesLoading = false;

                // Handle the response structure we created
                const messageData = action.payload.data || action.payload;
                const conversationId = action.payload.conversationId || messageData.conversation_id;
                const tempId = action.meta?.arg?.tempId;

                const tryReplace = (arr = []) => {
                    const idx = arr.findIndex(
                        (msg) => msg.id === tempId || msg.tempId === tempId
                    );
                    if (idx !== -1) {
                        arr[idx] = {
                            ...arr[idx],
                            ...messageData,
                            id: messageData.id || arr[idx].id,
                            tempId: undefined,
                            status: messageData.status || "sent",
                        };
                        return true;
                    }
                    return false;
                };

                let replaced = tryReplace(state.messagesByConversation[conversationId]);

                if (state.selected && state.selected.id === conversationId) {
                    const replacedInSelected = tryReplace(state.selected.messages);
                    replaced = replaced || replacedInSelected;
                }

                // If there was no optimistic message, just append the server one
                if (!replaced) {
                    if (!state.messagesByConversation[conversationId]) {
                        state.messagesByConversation[conversationId] = [];
                    }
                    state.messagesByConversation[conversationId].push(messageData);

                    if (state.selected && state.selected.id === conversationId) {
                        if (!state.selected.messages) {
                            state.selected.messages = [];
                        }
                        state.selected.messages.push(messageData);
                    }
                }
            })
            .addCase(sendConversationMessage.rejected, (state, action) => {
                state.messagesLoading = false;
                state.error = action.payload;
                const tempId = action.meta?.arg?.tempId;
                const conversationId = action.meta?.arg?.conversationId;
                if (tempId && conversationId) {
                    const markFailed = (arr = []) => {
                        const msg = arr.find(
                            (m) => m.id === tempId || m.tempId === tempId
                        );
                        if (msg) {
                            msg.status = "failed";
                        }
                    };
                    markFailed(state.messagesByConversation[conversationId]);
                    if (state.selected && state.selected.id === conversationId) {
                        markFailed(state.selected.messages);
                    }
                }
            })

            // Fetch Messages
            .addCase(fetchConversationMessages.pending, (state) => {
                state.messagesLoading = true;
            })
            .addCase(fetchConversationMessages.fulfilled, (state, action) => {
                state.messagesLoading = false;
                const { conversationId, messages } = action.payload;
                const messageData = messages.data || messages;
                state.messagesByConversation[conversationId] = Array.isArray(messageData) ? messageData : [];
            })
            .addCase(fetchConversationMessages.rejected, (state, action) => {
                state.messagesLoading = false;
                state.error = action.payload;
            });
    },
});

export const {
    clearSelectedConversation,
    markConversationAsRead,
    addLocalMessage,
    replaceLocalMessage,
    failLocalMessage,
} = conversationSlice.actions;
export default conversationSlice.reducer;
