import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API, { apiService } from "../../config/api";

// ---------------------- Async Thunks ---------------------- //

// Fetch credit balance for a user
export const fetchCreditBalance = createAsyncThunk(
  "credit/fetchBalance",
  async ({ token, userId }, thunkAPI) => {
    try {
      const res = await apiService.get(`${API.ENDPOINTS.GET_CREDITS}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { userId },
      });

      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Add or update credit balance
export const addCreditBalance = createAsyncThunk(
  "credit/addBalance",
  async ({ token, balanceData }, thunkAPI) => {
    try {
      const res = await apiService.post(API.ENDPOINTS.CREATE_CREDITS, balanceData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.order; // backend se naya balance object
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);
export const creditVerify = createAsyncThunk(
  "credit/creditVerify",
  async ({ token, creditData }, thunkAPI) => {
    try {
      const res = await apiService.post(API.ENDPOINTS.VERIFY_CREDITS, creditData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data; // backend verification result
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);
export const getBalanceHistory = createAsyncThunk(
  "credit/getBalanceHistory",
  async ({ token, userId }, thunkAPI) => {
    try {
      const res = await apiService.get(API.ENDPOINTS.HISTORY_CREDITS, {
        headers: { Authorization: `Bearer ${token}` },
        params: { userId },
      });
      return res.data.history; // backend should return an array of history
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getReport = createAsyncThunk(
  "credit/getReport",
  async ({ token, userId, filters }, thunkAPI) => {
    try {
      const res = await apiService.get(API.ENDPOINTS.REPORT_CREDITS, {
        headers: { Authorization: `Bearer ${token}` },
        params: { userId, ...filters }, // pass optional filters
      });
      return res.data; // backend should return report data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);
// ---------------------- Slice ---------------------- //

const creditSlice = createSlice({
  name: "credit",
  initialState: {
    balance: null,
    fetchLoading: false,
    addLoading: false,
    verifyLoading: false,
    error: null,
    history: [],
    creditVerification: null,
    report: null,
    reportLoading: false, // 🆕

  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch balance
      .addCase(fetchCreditBalance.pending, (state) => {
        state.fetchLoading = true;
        state.error = null;
      })
      .addCase(fetchCreditBalance.fulfilled, (state, action) => {
        state.fetchLoading = false;
        state.balance = action.payload;
      })
      .addCase(fetchCreditBalance.rejected, (state, action) => {
        state.fetchLoading = false;
        state.error = action.payload;
      })

      // Add balance
      .addCase(addCreditBalance.pending, (state) => {
        state.addLoading = true;
        state.error = null;
      })
      .addCase(addCreditBalance.fulfilled, (state, action) => {
        state.addLoading = false;
        state.balance = action.payload;
      })
      .addCase(addCreditBalance.rejected, (state, action) => {
        state.addLoading = false;
        state.error = action.payload;
      })
      .addCase(creditVerify.pending, (state) => {
        state.verifyLoading = true;
        state.error = null;
        state.creditVerification = null;
      })
      .addCase(creditVerify.fulfilled, (state, action) => {
        state.verifyLoading = false;
        state.creditVerification = action.payload;
      })
      .addCase(creditVerify.rejected, (state, action) => {
        state.verifyLoading = false;
        state.error = action.payload;
        state.creditVerification = null;
      })
      .addCase(getBalanceHistory.pending, (state) => {
        state.historyLoading = true;
        state.error = null;
      })
      .addCase(getBalanceHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload;
      })
      .addCase(getBalanceHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.payload;
      })
      .addCase(getReport.pending, (state) => {
        state.reportLoading = true;
        state.error = null;
      })
      .addCase(getReport.fulfilled, (state, action) => {
        state.reportLoading = false;
        state.report = action.payload;
      })
      .addCase(getReport.rejected, (state, action) => {
        state.reportLoading = false;
        state.error = action.payload;
      });
  },
});

export default creditSlice.reducer;
