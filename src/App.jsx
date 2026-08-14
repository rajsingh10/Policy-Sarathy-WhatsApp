import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import PlanHistory from "./pages/PlanHistory";
// Auth Pages
import { Login } from "@/pages/Login";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { Profile } from "@/pages/Profile";

// Main Pages
import { Dashboard } from "@/pages/Dashboard";
import Users from "@/pages/Users";
import UserDetails from "@/pages/UserDetails";
import { Contacts } from "@/pages/Contacts";
import ContactDetails from "./pages/ContactDetails";
import { Credits } from "@/pages/Credits";
import Recharge from "./pages/Recharge";
import PurchageDetails from "./pages/PurchageDetails";
import { Groups } from "@/pages/Groups";
import { GroupDetails } from "@/pages/GroupDetails";
import { Templates } from "@/pages/Templates";
import { RequestedTemplateGuide } from "@/pages/RequestedTemplateGuide";
import { CreateTemplate } from "@/pages/CreateTemplate";
import { TemplateView } from "@/pages/TemplateView";
import { Campaigns } from "@/pages/Campaigns";
import { NewCampaignPage } from "./pages/NewCampaign";
import { CampaignDetailsPage } from "./components/campaigns/CampaignDetailsPage";
import { BulkMessageSender } from "@/components/campaigns/BulkMessageSender";
import { BulkMessageSenderedit } from "@/components/campaigns/BulkMessageSenderedit";
import { Notifications } from "@/pages/Notifications";
import { ConversationDetails } from "@/pages/ConversationDetails";
import { Settings } from "@/pages/Settings";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import { ErrorProvider, useError } from "./contexts/ErrorContext";
import ErrorPage from "./pages/ErrorPage";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "./components/ErrorFallback";
import MediaModule from "./pages/MediaModule";
import Media from "./pages/Media";
import MediaView from "./pages/MediaView";
const queryClient = new QueryClient();
import SubscriptionGuard from "./pages/SubscriptionGuard";
import { Automation } from "./pages/Automation";
import { WABAStatus } from "./pages/WABAStatus";
import MessageDetails from "./pages/MessageDetails";
import { MessageInbox } from "./pages/MessageInbox";

const AppRoutes = () => {
  // const { error } = useError();

  // if (error) {
  //   return <ErrorPage message={error.message} />;
  // }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* <Route path="/" element={<AppLayout />}> */}
          <Route
            path="/"
            element={
              <SubscriptionGuard>
                <AppLayout />
              </SubscriptionGuard>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            {/* <Route path="users" element={<Users />} /> */}
            <Route path="users/:id" element={<UserDetails />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="contactsDetails/:id" element={<ContactDetails />} />
            <Route path="reports" element={<Reports />} />
            <Route path="credits" element={<Credits />} />
            <Route path="recharge" element={<Recharge />} />
            <Route path="purchage" element={<PurchageDetails />} />
            {/* <Route path="media" element={<MediaModule />} /> */}
            <Route path="groups" element={<Groups />} />
            <Route path="groups/:id" element={<GroupDetails />} />
            <Route path="plan-history" element={<PlanHistory />} />
            <Route path="templates" element={<Templates />} />
            <Route path="templates/new" element={<CreateTemplate />} />
            <Route
              path="templates/requested-guide"
              element={<RequestedTemplateGuide />}
            />
            <Route path="templates/:id" element={<TemplateView />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="messageDetails" element={<MessageDetails />} />
            <Route path="campaigns/new" element={<NewCampaignPage />} />
            <Route path="waba-status" element={<WABAStatus />} />
            <Route path="automation" element={<Automation />} />
            <Route
              path="campaigns-details/:bulkId"
              element={<CampaignDetailsPage />}
            />
            <Route path="bulk-send" element={<BulkMessageSender />} />
            <Route
              path="bulk-send-edit/:id"
              element={<BulkMessageSenderedit />}
            />
            <Route path="notifications" element={<Notifications />} />
            <Route path="conversations/:id" element={<ConversationDetails />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="media" element={<Media />} />
            <Route path="media/:id" element={<MediaView />} />
            <Route path="message-inbox" element={<MessageInbox />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    const isFirstVisit = !sessionStorage.getItem("hasVisited");
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath === "/login" || currentPath === "/register";

    if (isFirstVisit && !isAuthPage) {
      sessionStorage.setItem("hasVisited", "true");
      return true;
    }
    return false;
  });

  return (
    // <ErrorProvider>

    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Provider store={store}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </Provider>
      </TooltipProvider>
    </QueryClientProvider>

    // </ErrorProvider>
  );
};

export default App;
