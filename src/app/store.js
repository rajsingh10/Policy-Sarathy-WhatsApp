import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import contactReducer from "../features/contacts/contactSlice";
import groupReducer from "../features/groups/groupSlice";
import creditReducer from "../features/credits/creditSlice";
import dashboardReducer from "../features/dashboard/dashboardSlice";
import templateReducer from "../features/templates/templatesSlice";
import bulkSendReducer from "../features/bulkSend/bulkSendSlice"; // Default import
import usersReducer from "../features/users/userSlice";
import reportsReducer from "../features/reports/reportsSlice";
import settingsReducer from "../features/settings/settingsSlice";
import packagesReducer from "../features/package/packagesSlice"; // path to your slice
import conversationReducer from "../features/conversations/conversationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    contacts: contactReducer,
    groups: groupReducer,
    credit: creditReducer,
    template: templateReducer,
    bulkSend: bulkSendReducer,
    dashboard: dashboardReducer,
    users: usersReducer,
    reports: reportsReducer,
    settings: settingsReducer,
    packages: packagesReducer,
    conversations: conversationReducer,
  },
});
