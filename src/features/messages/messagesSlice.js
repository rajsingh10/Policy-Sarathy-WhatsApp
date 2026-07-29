import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import API, { apiService } from "../../config/api";

// Send message via backend WhatsApp API
export const sendMessageAPI = createAsyncThunk(
    "messages/send",
    async ({ phone, message, imageUrl }, thunkAPI) => {
        try {
            const res = await apiService.post(API.ENDPOINTS.SEND_MESSAGE, { phone, message, imageUrl });
            return { phone, message, imageUrl };
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const fetchMessages = createAsyncThunk(
    "messages/fetch",
    async (contactId, thunkAPI) => {
        try {
            const res = await apiService.get(`${API.ENDPOINTS.GET_MESSAGES}/${contactId}`);
            return { contactId, messages: res.data.data };
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

const messagesSlice = createSlice({
    name: "messages",
    initialState: {
        byContact: {}, // { [contactId]: [messages] }
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMessages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.loading = false;
                state.byContact[action.payload.contactId] = action.payload.messages;
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(sendMessageAPI.fulfilled, (state, action) => {
                const { phone, message, imageUrl } = action.payload;
                const contactId = phone; // using phone as key
                if (!state.byContact[contactId]) state.byContact[contactId] = [];
                state.byContact[contactId].push({
                    id: Date.now().toString(),
                    sender: "user",
                    message,
                    image: imageUrl || null,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    status: "sent",
                });
            });
    },
});

export default messagesSlice.reducer;
