import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  FileText,
  Send,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Package,
  Calendar,
  MessageCircle,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { fetchDashboardData } from "../features/dashboard/dashboardSlice";
import { useDispatch, useSelector } from "react-redux";
import { BaseLoading } from "../components/BaseLoading";
import { getBalanceHistory, getReport } from "../features/credits/creditSlice";
import { RenewalPopup } from "../components/RenewalPopup";

export const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { stats, latestTemplate, messageAnalytics, activeCampaigns, loading } =
    useSelector((state) => state.dashboard);
  const {
    report,
    reportLoading,
    balance,
    history,
    fetchLoading,
    addLoading,
    verifyLoading,
  } = useSelector((state) => state.credit);
  const token = localStorage.getItem("token");
  console.log("latestTemplate", latestTemplate);
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      dispatch(getBalanceHistory({ token, userId: user.id }));
    }
    if (token) dispatch(fetchDashboardData(token));
  }, [dispatch, token]);
  const { profile } = useSelector((state) => state.auth);
  const UserProfile = profile || {};

  const [isRenewalPopupOpen, setIsRenewalPopupOpen] = useState(false);

  useEffect(() => {
    const daysUntilRenewal = 0 //UserProfile?.activePackage?.daysUntilRenewal;
    if (daysUntilRenewal !== undefined && daysUntilRenewal !== null && daysUntilRenewal !== "") {
      const days = Number(daysUntilRenewal);
      if (!isNaN(days) /* && days <= 30 */) { // TEMP FOR TESTING: Removed days <= 30 check
        // check local storage to only show once per day
        const todayStr = new Date().toDateString();
        const lastShownDate = localStorage.getItem("renewalPopupLastShown");

        // TEMP FOR TESTING: Commented out the date check so it opens on every reload
        // if (lastShownDate !== todayStr) {
        setIsRenewalPopupOpen(true);
        localStorage.setItem("renewalPopupLastShown", todayStr);
        // }
      }
    }
  }, [UserProfile?.activePackage?.daysUntilRenewal]);
  // Fallback stats
  const StatsData = [
    {
      title: "Total Contacts",
      value: (stats?.totalContacts ?? 0).toLocaleString(),
      change: "+0%",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Templates",
      value: (stats?.activeTemplates ?? 0).toLocaleString(),
      change: "+0%",
      icon: FileText,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Messages Sent",
      value: (stats?.messagesSent ?? 0).toLocaleString(),
      change: "+0%",
      icon: Send,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Delivery Rate",
      value: stats?.deliveryRate ?? "0%",
      change: "+0%",
      icon: CheckCircle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  if (loading) return <BaseLoading message="Loading..." />;

  return (
    <div className="container max-w-7xl mx-auto px-4">
      <RenewalPopup plan={UserProfile?.activePackage} isOpen={isRenewalPopupOpen} onOpenChange={setIsRenewalPopupOpen} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-3 sm:gap-0">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2">
            Welcome back! Here's your WhatsApp campaign overview.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6 mb-8">
        {StatsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="card-elegant hover:shadow-glow transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
                  >
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Message Analytics and Campaigns */}
      <div className="grid grid-cols-12 gap-6">
        {/* Message Analytics (8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col">
          <Card className="card-elegant h-full flex-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Message Analytics</span>
              </CardTitle>
              <CardDescription>
                Daily message performance over the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={450}>
                <LineChart data={messageAnalytics?.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sent"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    name="Sent"
                  />
                  {messageAnalytics?.data?.[0]?.delivered !== undefined && (
                    <Line
                      type="monotone"
                      dataKey="delivered"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      name="Delivered"
                    />
                  )}
                  {messageAnalytics?.data?.[0]?.read !== undefined && (
                    <Line
                      type="monotone"
                      dataKey="read"
                      stroke="hsl(var(--info))"
                      strokeWidth={2}
                      name="Read"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Status (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col">
          {UserProfile?.activePackage ? (
            <Card className="card-elegant p-0 shadow-lg rounded-2xl bg-white flex-1 h-full">
              <CardHeader className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-indigo-500" />
                  <CardTitle className="text-lg font-semibold">
                    Active Package
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`px-3 py-1 rounded-full font-medium ${new Date(UserProfile.activePackage.endDate) > new Date()
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                      }`}
                  >
                    {new Date(UserProfile.activePackage.endDate) > new Date()
                      ? "Active"
                      : "Expired"}
                  </Badge>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-primary text-primary hover:bg-primary/10" onClick={() => setIsRenewalPopupOpen(true)}>
                    Renew
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-4">
                {/* Package Info */}
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <h3 className="text-lg font-semibold">
                    {UserProfile.activePackage.packageName || "-"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {UserProfile.activePackage.packageDesc || "-"}
                  </p>
                </div>

                {/* Dates Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Start Date
                      </span>
                    </div>
                    <p className="text-sm mt-1">
                      {UserProfile.activePackage.startDate
                        ? new Date(
                          UserProfile.activePackage.startDate
                        ).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-medium text-muted-foreground">
                        End Date
                      </span>
                    </div>
                    <p className="text-sm mt-1">
                      {UserProfile.activePackage.endDate
                        ? new Date(
                          UserProfile.activePackage.endDate
                        ).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Next Renewal
                      </span>
                    </div>
                    <p className="text-sm mt-1">
                      {UserProfile.activePackage.nextRenewalDate
                        ? new Date(
                          UserProfile.activePackage.nextRenewalDate
                        ).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Messages
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {UserProfile.activePackage.usage?.totalUsedMessages || 0}{" "}
                      / {UserProfile.activePackage.msgCount || 0}
                    </p>
                  </div>
                </div>

                {/* Usage Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Templates
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {UserProfile.activePackage.usage?.monthlyUsedTemplates ||
                        0}{" "}
                      / {UserProfile.activePackage.templateCount || 0}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Contacts
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {UserProfile.activePackage.usage?.monthlyUsedContacts ||
                        0}{" "}
                      / {UserProfile.activePackage.contactCount || 0}
                    </p>
                  </div>
                </div>

                {/* Days Info */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-indigo-50 p-3 rounded-lg flex items-center justify-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-sm font-semibold">
                      Total Days - {UserProfile.activePackage.day || 0} days
                    </h3>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg flex items-center justify-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-sm font-semibold">
                      Days Until Renewal -{" "}
                      {UserProfile.activePackage.daysUntilRenewal || 0} days
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>No Active Package</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                User has no active package at the moment.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="card-elegant mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => navigate("/contacts")}
            >
              <Users className="w-6 h-6" />
              <span>Add Contacts</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => navigate("/templates")}
            >
              <FileText className="w-6 h-6" />
              <span>Create Template</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => navigate("/settings")}
            >
              <AlertTriangle className="w-6 h-6" />
              <span>Configure API</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
