import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API, { apiService } from "../../config/api";


// ---------------------- Async Thunks ---------------------- //

// Fetch all groups
export const fetchGroups = createAsyncThunk(
  "groups/fetchAll",
  async ({ token, page = 1, limit = 15, search = "" } = {}, thunkAPI) => {
    try {
      const res = await apiService.get(API.ENDPOINTS.GROUPS, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit, search }
      });
      return res.data;

    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);
// ---------------------- Async Thunks ---------------------- //

// Fetch group by ID
export const fetchGroupById = createAsyncThunk(
  "groups/fetchById",
  async ({ token, id }, thunkAPI) => {
    try {
      const res = await apiService.get(
        `${API.ENDPOINTS.GROUPS}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data.data; // backend से आने वाला पूरा group object
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Add group
export const addGroup = createAsyncThunk(
  "groups/add",
  async ({ token, groupData }, thunkAPI) => {
    try {
      const res = await apiService.post(API.ENDPOINTS.ADD_GROUP, groupData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Update group
export const editGroup = createAsyncThunk(
  "groups/edit",
  async ({ token, groupId, groupData }, thunkAPI) => {
    try {
      const res = await apiService.put(
        `${API.ENDPOINTS.UPDATE_GROUP}/${groupId}`,
        groupData,
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

// Delete group
export const removeGroup = createAsyncThunk(
  "groups/remove",
  async ({ token, contactIds }, thunkAPI) => {
    try {
      const formData = new FormData();
      if (Array.isArray(contactIds)) {
        contactIds.forEach((id) => formData.append("contactIds[]", id));
      } else {
        formData.append("contactIds[]", contactIds);
      }

      const res = await apiService.post(
        API.ENDPOINTS.REMOVE_MULTIPLE_CONTACT,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return res.data; // backend से क्या आता है उस हिसाब से
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const addContactToGroup = createAsyncThunk(
  "groups/addContactToGroup",
  async ({ token, contactsGroup }, thunkAPI) => {
    try {
      const res = await apiService.post(
        API.ENDPOINTS.ADD_CONTACT_TO_GROUPS,
        contactsGroup,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const removeSingleGroup = createAsyncThunk(
  "groups/removeSingleGroup",
  async ({ token, id }, thunkAPI) => {
    console.log(token)
    try {
      const res = await apiService.delete(
        `${API.ENDPOINTS.REMOVE_SINGLE_CONTACT}/${id}`,
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

export const assignContactsToGroup = createAsyncThunk(
  "groups/assignContactsToGroup",
  async ({ token, groupId, contactIds }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("groupId[]", groupId);
      contactIds.forEach((id) => formData.append("contactIds[]", id));

      const res = await apiService.post(
        API.ENDPOINTS.ADD_CONTACT_TO_GROUPS,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ---------------------- Slice ---------------------- //

const groupSlice = createSlice({
  name: "groups",
  initialState: {
    items: [],
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
      from: 0,
      to: 0
    },
    selectedGroup: null,
    addtocontacts: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false;
        // Check if response has pagination wrapper
        if (action.payload && action.payload.data) {
          state.items = action.payload.data;
          if (action.payload.pagination) {
            state.pagination = action.payload.pagination;
          }
        } else {
          // Fallback
          state.items = Array.isArray(action.payload) ? action.payload : [];
        }
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addGroup.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(editGroup.fulfilled, (state, action) => {
        const index = state.items.findIndex((g) => g.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(removeGroup.fulfilled, (state, action) => {
        const deletedId = action.payload.deleted_contact_id; // मान लो response में यही key आती है
        state.items = state.items.filter((g) => g.id !== deletedId);
      })
      .addCase(fetchGroupById.pending, (state) => {
        state.loading = true;
        state.selectedGroup = null;
      })
      .addCase(fetchGroupById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedGroup = action.payload;
      })
      .addCase(fetchGroupById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addContactToGroup.pending, (state) => {
        state.loading = true;
        state.selectedGroup = null;
      })
      .addCase(addContactToGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.addtocontacts = action.payload;
      })
      .addCase(addContactToGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeSingleGroup.fulfilled, (state, action) => {
        const deletedId = action.payload.deleted_contact_id;
        state.items = state.items.filter((g) => g.id !== deletedId);
      })
      .addCase(assignContactsToGroup.pending, (state) => {
        state.loading = true;
      })
      .addCase(assignContactsToGroup.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally update state based on response
      })
      .addCase(assignContactsToGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export default groupSlice.reducer;
