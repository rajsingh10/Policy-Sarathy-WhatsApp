import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API, { apiService } from "../../config/api";

// -------------------- Async Thunks -------------------- //

// Fetch all users
export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (token, thunkAPI) => {
    try {
      const res = await apiService.get(API.ENDPOINTS.ALL_USERS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(res);
      return res.data.data; // API should return array of users
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Add user
export const addUser = createAsyncThunk(
  "users/add",
  async ({ userData, token }, thunkAPI) => {
    try {
      const res = await apiService.post(API.ENDPOINTS.ADD_USERS, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Update user
export const updateUser = createAsyncThunk(
  "users/update",
  async ({ userId, userData, token }, thunkAPI) => {
    try {
      const res = await apiService.put(
        `${API.ENDPOINTS.UPDATE_USERS}/${userId}`,
        userData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  "users/delete",
  async ({ userId, token }, thunkAPI) => {
    try {
      await apiService.delete(`${API.ENDPOINTS.DELETE_USERS}/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return userId;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Toggle status
export const toggleUserStatus = createAsyncThunk(
  "users/toggleStatus",
  async ({ userId, token, status }, thunkAPI) => {
    try {
      const res = await apiService.put(
        `${API.ENDPOINTS.UPDATE_STATUS}/${userId}`,
        status, // pass FormData here
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);
export const fetchSingleUser = createAsyncThunk(
  "users/fetchSingle",
  async ({ userId, token }, thunkAPI) => {
    try {
      const res = await apiService.get(
        `${API.ENDPOINTS.SINGLE_USER}/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// -------------------- Slice -------------------- //
const userSlice = createSlice({
  name: "users",
  initialState: {
    data: [],
    singleData: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add
      .addCase(addUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data.push(action.payload);
      })
      .addCase(addUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.map((user) =>
          user.id === action.payload.id ? action.payload : user
        );
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter((user) => user.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Toggle status
      .addCase(toggleUserStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.map((user) =>
          user.id === action.payload.id ? action.payload : user
        );
      })
      .addCase(toggleUserStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single user
      .addCase(fetchSingleUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSingleUser.fulfilled, (state, action) => {
        state.loading = false;
        state.singleData = action.payload;
      })
      .addCase(fetchSingleUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default userSlice.reducer;
