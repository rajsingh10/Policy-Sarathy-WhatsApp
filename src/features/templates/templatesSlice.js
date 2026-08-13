import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API, { apiService } from "../../config/api";

// ---------------------- Async Thunks ---------------------- //
// Fetch all template
export const fetchSyncTemplate = createAsyncThunk(
    "template/fetchSync",
    async (token, thunkAPI) => {
        try {
            const res = await apiService.get(API.ENDPOINTS.sync_templates, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Fetch filtered templates by type
export const fetchFilteredTemplates = createAsyncThunk(
    "template/fetchFiltered",
    async ({ token, type = "default" }, thunkAPI) => {
        try {
            const res = await apiService.get(`templates/filtered?type=${type}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const fetchTemplateById = createAsyncThunk(
    "template/fetchById",
    async ({ token, id }, thunkAPI) => {
        try {
            const res = await apiService.get(`${API.ENDPOINTS.templates_user}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const fetchUserTemplate = createAsyncThunk(
    "template/fetchUser",
    async (token, thunkAPI) => {
        try {
            const res = await apiService.get(API.ENDPOINTS.user_templates, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const addTemplate = createAsyncThunk(
    "template/add",
    async ({ token, groupData }, thunkAPI) => {
        try {
            const formData = new FormData();
            formData.append("name", groupData.name);
            formData.append("category", "MARKETING");
            formData.append("language", "en");
            formData.append("components", JSON.stringify(groupData.components));
            const res = await apiService.post(
                API.ENDPOINTS.template,
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
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

// In your templateSlice.js file
export const addCustomTemplate = createAsyncThunk(
    "template/addCustom",
    async ({ token, templateData }, thunkAPI) => {
        try {
            console.log("Submitting template data:", templateData);
            const res = await apiService.post(
                API.ENDPOINTS.template_create,
                templateData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            return res.data;
        } catch (err) {
            console.error("API Error:", err);
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const changeStatus = createAsyncThunk(
    "template/status",
    async ({ token, templateId, groupData }, thunkAPI) => {
        try {
            const formData = new FormData();
            formData.append("status", groupData.status);
            const res = await apiService.put(
                `${API.ENDPOINTS.templates_status}/${templateId}`,
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
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const editTemplate = createAsyncThunk(
    "template/edit",
    async ({ token, templateId, groupData }, thunkAPI) => {
        try {
            const formData = new FormData();
            formData.append("name", groupData.name);
            formData.append("category", groupData.category);
            formData.append("language", groupData.language);
            formData.append("components", JSON.stringify(groupData.components));
            const res = await apiService.put(
                `${API.ENDPOINTS.template}/${templateId}`,
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
            return thunkAPI.rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const removeTemplate = createAsyncThunk(
    "template/remove",
    async ({ token, templateId }, thunkAPI) => {
        try {
            const res = await apiService.delete(
                `${API.ENDPOINTS.template}/${templateId}`,
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

// ---------------------- Slice ---------------------- //
const templateSlice = createSlice({
    name: "template",
    initialState: {
        items: [],
        filteredItems: [],
        currentTemplate: null,
        loading: false,
        error: null,
        activeTab: "all", // Track active tab
    },
    reducers: {
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSyncTemplate.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchSyncTemplate.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchSyncTemplate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchFilteredTemplates.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchFilteredTemplates.fulfilled, (state, action) => {
                state.loading = false;
                state.filteredItems = action.payload;
            })
            .addCase(fetchFilteredTemplates.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchUserTemplate.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUserTemplate.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchUserTemplate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(addTemplate.fulfilled, (state, action) => {
                state.items.push(action.payload);
                // Add to filtered items if it matches the current active tab
                if (action.payload.type === state.activeTab) {
                    state.filteredItems.push(action.payload);
                }
            })
            .addCase(addCustomTemplate.fulfilled, (state, action) => {
                state.items.push(action.payload);
                // Add to filtered items if it matches the current active tab
                if (action.payload.type === state.activeTab) {
                    state.filteredItems.push(action.payload);
                }
            })
            .addCase(editTemplate.fulfilled, (state, action) => {
                const index = state.items.findIndex((t) => t.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;

                // Update filtered items as well if it matches the current active tab
                const filteredIndex = state.filteredItems.findIndex((t) => t.id === action.payload.id);
                if (filteredIndex !== -1 && action.payload.type === state.activeTab) {
                    state.filteredItems[filteredIndex] = action.payload;
                }
            })
            .addCase(removeTemplate.fulfilled, (state, action) => {
                state.items = state.items.filter((t) => t.id !== action.payload.id);
                state.filteredItems = state.filteredItems.filter((t) => t.id !== action.payload.id);
            })
            .addCase(fetchTemplateById.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchTemplateById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentTemplate = action.payload;
            })
            .addCase(fetchTemplateById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

// Action creator for setting active tab
export const { setActiveTab } = templateSlice.actions;

export default templateSlice.reducer;
