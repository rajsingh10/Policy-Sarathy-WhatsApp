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
  Eye,
  Folder,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { fetchDashboardData } from "../features/dashboard/dashboardSlice";
import { fetchRcapenight } from "../features/reports/reportsSlice";
import SortableTableDaynemic from "../components/ui/sortable-table-daynemic";
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

  const { data: reportsData } = useSelector((state) => state.reports || {});
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    if (token) {
      dispatch(fetchRcapenight({ token, filters: { status: "all", page: 1 } }));
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (reportsData && reportsData.messages) {
      const formatted = reportsData.messages.map((msg) => ({
        id: msg.bulk_id,
        name: msg.campaignName,
        template: msg.templateDetails?.name || "N/A",
        status: msg.status,
        audienceSize: msg.audienceSize || 0,
        createdAt: new Date(msg.sendingDate).toLocaleDateString(),
        delivery_summary: msg.delivery_summary || {},
      }));
      setCampaigns(formatted.slice(0, 5));
    }
  }, [reportsData]);

  const campaignColumns = [
    {
      key: "name",
      label: "Campaign Name",
      render: (value, item) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground hidden sm:block">
            Created: {item.createdAt}
          </div>
        </div>
      ),
    },
    {
      key: "template",
      label: "Template",
      render: (value) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "audienceSize",
      label: "Audience Size",
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value, item) => (
        <div className="flex flex-col gap-2 items-start">
          {item.delivery_summary ? (
            <div className="flex flex-nowrap whitespace-nowrap gap-1.5 text-[11px] font-medium mt-1">
              <span className="text-blue-700 bg-blue-50/80 border border-blue-200 px-1.5 py-0.5 rounded">
                Read: {item.delivery_summary.read || 0}
              </span>
              <span className="text-gray-700 bg-gray-50/80 border border-gray-200 px-1.5 py-0.5 rounded">
                Delivered: {item.delivery_summary.delivered || 0}
              </span>
              <span className="text-red-700 bg-red-50/80 border border-red-200 px-1.5 py-0.5 rounded">
                Failed: {item.delivery_summary.failed || 0}
              </span>
              {(item.delivery_summary.pending > 0 || item.delivery_summary.processing > 0) && (
                <span className="text-yellow-700 bg-yellow-50/80 border border-yellow-200 px-1.5 py-0.5 rounded">
                  Pending: {(item.delivery_summary.pending || 0) + (item.delivery_summary.processing || 0)}
                </span>
              )}
            </div>
          ) : (
            <span className={`capitalize text-xs font-medium px-2 py-1 rounded ${value === "completed"
              ? "bg-green-100 text-green-700"
              : value === "failed"
                ? "bg-red-100 text-red-700"
                : value === "scheduled"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
              }`}>
              {value}
            </span>
          )}
        </div>
      ),
    },
  ];

  const [isRenewalPopupOpen, setIsRenewalPopupOpen] = useState(false);

  const calculateDaysLeft = (endDateStr) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr);
    const now = new Date();
    if (isNaN(end.getTime())) return 0;
    const diffTime = Math.max(end.getTime() - now.getTime(), 0);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  const calculatedDaysLeft = calculateDaysLeft(UserProfile?.activePackage?.endDate);

  useEffect(() => {
    const endDateStr = UserProfile?.activePackage?.endDate;
    if (endDateStr) {
      const days = calculateDaysLeft(endDateStr);
      if (days > 0 && days <= 30) {
        // check local storage to only show once per day
        const todayStr = new Date().toDateString();
        const lastShownDate = localStorage.getItem("renewalPopupLastShown");

        if (lastShownDate !== todayStr) {
          setIsRenewalPopupOpen(true);
          localStorage.setItem("renewalPopupLastShown", todayStr);
        }
      }
    }
  }, [UserProfile?.activePackage?.endDate]);
  // Fallback stats
  const StatsData = [
    {
      title: "Total Contacts",
      value: (stats?.totalContacts ?? 0).toLocaleString(),
      change: "+0%",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/contacts",
    },
    {
      title: "Active Templates",
      value: (stats?.activeTemplates ?? 0).toLocaleString(),
      change: "+0%",
      icon: FileText,
      color: "text-info",
      bgColor: "bg-info/10",
      link: "/templates",
    },
    {
      title: "Messages Sent",
      value: (stats?.usage?.yearlyUsedMessages ?? stats?.yearlyUsedMessages ?? 0).toLocaleString(),
      change: "+0%",
      icon: Send,
      color: "text-success",
      bgColor: "bg-success/10",
      link: "/reports",
    },
    {
      title: "Total Campaigns",
      value: (reportsData?.summary?.totalCampaigns || 0).toLocaleString(),
      change: "+0%",
      icon: MessageSquare,
      color: "text-warning",
      bgColor: "bg-warning/10",
      link: "/campaigns",
    },
  ];

  if (loading) return <BaseLoading message="Loading..." />;

  return (
    <div className="container max-w-7xl mx-auto px-0 sm:px-6 lg:px-4">
      <RenewalPopup plan={UserProfile?.activePackage} isOpen={isRenewalPopupOpen} onOpenChange={setIsRenewalPopupOpen} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-2  sm:gap-0">
        <div className=" sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-0 sm:mt-1">
            Welcome back! Here's your WhatsApp campaign overview.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-6 mb-4">
        {StatsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              onClick={() => navigate(stat.link)}
              className="card-elegant cursor-pointer group hover:shadow-glow transition-all duration-300"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1 group-hover:text-primary transition-colors">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
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
        {/* Recent Campaigns (9 cols) */}
        <div className="col-span-12 lg:col-span-9 flex flex-col">
          <Card className="card-elegant h-full flex-1">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center space-x-2">
                  <Send className="w-5 h-5" />
                  <span>Recent Campaigns</span>
                </CardTitle>
                <CardDescription>
                  Overview of your latest campaign activities
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/campaigns")} className="flex items-center gap-1.5">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {campaigns?.length > 0 ? (
                <SortableTableDaynemic
                  data={campaigns}
                  columns={campaignColumns}
                  onRowClick={(item) => navigate(`/campaigns-details/${item.id}`, { state: { campaign: item } })}
                  rowClassName="cursor-pointer border-b border-border/40 last:border-0 hover:bg-muted/50 transition-colors"
                  showColumn1Mobile={false}
                  minWidthClass="min-w-full"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-sm border border-primary/20">
                    <Send className="w-10 h-10 text-primary opacity-80" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No campaigns yet</h3>
                  <p className="text-sm text-muted-foreground max-w-[300px] mx-auto mb-6">
                    You haven't sent any bulk messages or campaigns yet. Get started by creating your first campaign.
                  </p>
                  <Button onClick={() => navigate("/bulk-send")} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all duration-200 hover:scale-105">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions (3 cols) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col">
          <Card className="card-elegant h-full flex-1">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-6">
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with common tasks</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="flex flex-col gap-3">

                <Button
                  variant="outline"
                  className="h-16 justify-start gap-3 px-4 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                  onClick={() => navigate("/contacts")}
                >
                  <Users className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-medium text-sm">Add Contacts</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 justify-start gap-3 px-4 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                  onClick={() => navigate("/groups")}
                >
                  <Users className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-medium text-sm">Create Groups</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 justify-start gap-3 px-4 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                  onClick={() => navigate("/bulk-send")}
                >
                  <MessageSquare className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-medium text-sm">Bulk Send</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 justify-start gap-3 px-4 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                  onClick={() => navigate("/media")}
                >
                  <Folder className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-medium text-sm">Media Library</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 justify-start gap-3 px-4 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                  onClick={() => navigate("/reports")}
                >
                  <BarChart3 className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-medium text-sm">Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
