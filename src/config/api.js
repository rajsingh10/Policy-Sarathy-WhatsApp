import axios from "axios";
import { errorHandler } from "../services/errorHandler";
import { logout } from "../features/auth/authSlice";
import { store } from "../app/store";

// Base URLs from environment variables
export const BASE_URL = import.meta.env.VITE_BASE_URL;

// API endpoints
const API = {
  BASE_URL,

  ENDPOINTS: {
    login: "auth/login",
    PROFILE: "auth/profile",
    UPDATE: "auth/edit-profile",
    CHANGE_PASSWORD: "auth/change-password",
    UPDATE_SETTINGS: "settings/save-config",
    GET_SETTINGS: "settings",
    TEST_SETTINGS: "/settings/test-facebook",
    SEND_TEST_MESSAGE: "/settings/send-test-message",
    // dashboard
    DASHBOARD: "dashboard",
    // contacts
    GET_CONTACT: "contacts",
    ADD_CONTACT: "contacts",
    IMPORT_CONTACT: "contacts/import",
    UPDATE_CONTACT: "contacts",
    SINGLE_CONTACT: "contacts",
    DELETE_CONTACT: "contacts",
    DELETE_MULTIPLE_CONTACT: "/contacts/delete",
    CSV_FILE_CONTACT: "contacts/import",

    // media
    ADD_MEDIA: "media",
    GET_MEDIA: "media",
    GET_MEDIA_BY_ID: "media",
    UPDATE_MEDIA: "media",
    DELETE_MEDIA: "media",

    // groups
    GROUPS: "groups",
    ADD_GROUP: "/groups",
    UPDATE_GROUP: "/groups",
    SINGLE_GROUP: "/groups",
    ADD_EXISTING_MULTIPLE_CONTACT: "/groups",
    REMOVE_MULTIPLE_CONTACT: "/groups/remove",
    REMOVE_SINGLE_CONTACT: "/groups",
    ADD_CONTACT_TO_GROUPS: "/groups/assign",
    // payment/credit 
    GET_CREDITS: "credits/balance",
    CREATE_CREDITS: "credits/create-order",
    VERIFY_CREDITS: "credits/verify",
    HISTORY_CREDITS: "credits/history",
    REPORT_CREDITS: "credits/report",
    // templates
    sync_templates: "templates/sync-templates",
    user_templates: "templates/user",
    template: "templates/custom",
    templates_status: "/templates/status",
    templates_user: "templates/user",
    template_create: "template/create",
    //bulk send
    bulk_send: "bulkmessage",

    // send message
    SEND_MESSAGE: "send-whatsapp",
    GET_SEND_MESSAGE: "bulkmessage",

    // scheduler
    SCHEDULE: "schedule",
    //admin users
    ALL_USERS: "users",
    ADD_USERS: "users/add",
    DELETE_USERS: "users/delete",
    UPDATE_STATUS: "users/status",
    UPDATE_USERS: "users/edit",
    SINGLE_USER: "users",

    // campaigns
    campaigns: "campaigns",
    edit_scheduled: "bulk-messages",
    delete_scheduled: "bulkmessage",

    //reports
    REPORTS: "reports",
    SEND_REPORT: "bulk-messages/resend",
    //settings
    REFRESH_TOKEN: "settings/refresh-token",
    GET_SETTINGS: "settings",
    // packages
    PACKAGES: "package/get",
    PLAN_HISTORY: "plan/history",

    // conversations
    CONVERSATIONS: "conversations",
    CONVERSATIONS_MESSAGES: "/messages/send",
    CONVERSATION_BY_ID: "conversations",
    LATEST_CONTACTS: "conversations/latest/contacts",
    UNREAD_CONVERSATIONS: "conversations/unread",
    UPDATE_CONVERSATION_STATUS: "conversations",
    CONVERSATION_STATS: "conversations/stats",
  },
};

// export const apiService = axios.create({
//   baseURL: "/api",
// });

// Axios instance → always uses proxy (/api → backend)
export const apiService = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});
apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response Interceptor → handle errors globally
apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error is an unauthorized error (401)
    if (error.response && error.response.status === 401) {
      // Dispatch logout action to clear auth state
      store.dispatch(logout());

      // Redirect to login page
      window.location.href = "/login";
    }

    errorHandler(error); // send to ErrorContext
    return Promise.reject(error);
  }
);
export default API;
