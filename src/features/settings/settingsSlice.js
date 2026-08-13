// store/settingsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API, { apiService } from "../../config/api";

// ---------------------------
// Thunks
// ---------------------------

// Refresh Token
export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (token, thunkAPI) => {
    console.log(token);
    try {
      const response = await apiService.post(
        API.ENDPOINTS.REFRESH_TOKEN,
        {}, // empty body if API doesn't need data
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Save Settings
export const saveSettings = createAsyncThunk(
  "settings/saveSettings",
  async ({ token, data }, thunkAPI) => {
    try {
      const response = await apiService.post(
        API.ENDPOINTS.UPDATE_SETTINGS,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Get Settings
export const getSettings = createAsyncThunk(
  "settings/getSettings",
  async (token, thunkAPI) => {
    try {
      const response = await apiService.get(API.ENDPOINTS.GET_SETTINGS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Test Settings (connection)
export const testSettings = createAsyncThunk(
  "settings/testSettings",
  async (token, thunkAPI) => {
    try {
      const response = await apiService.get(API.ENDPOINTS.TEST_SETTINGS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Send Test WhatsApp Message
export const sendTestMessage = createAsyncThunk(
  "settings/sendTestMessage",
  async ({ token, to }, thunkAPI) => {
    try {
      const response = await apiService.post(
        API.ENDPOINTS.SEND_TEST_MESSAGE,
        { to },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ---------------------------
// Initial State
// ---------------------------
const initialState = {
  token: null,
  settings: null,
  loading: false,
  error: null,
};

// ---------------------------
// Slice
// ---------------------------
const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setToken(state, action) {
      state.token = action.payload;
    },
    clearSettings(state) {
      state.settings = null;
      state.token = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // refreshToken
    builder.addCase(refreshToken.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(refreshToken.fulfilled, (state, action) => {
      state.loading = false;
      state.token = action.payload.access_token;
    });
    builder.addCase(refreshToken.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to refresh token";
    });

    // saveSettings
    builder.addCase(saveSettings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(saveSettings.fulfilled, (state, action) => {
      state.loading = false;
      state.settings = action.payload.data; // assume backend returns updated settings
    });
    builder.addCase(saveSettings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to save settings";
    });

    // getSettings
    builder.addCase(getSettings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getSettings.fulfilled, (state, action) => {
      state.loading = false;
      state.settings = action.payload;
    });
    builder.addCase(getSettings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch settings";
    });
  },
});

// ---------------------------
// Exports
// ---------------------------
export const { setToken, clearSettings } = settingsSlice.actions;

export default settingsSlice.reducer;
