import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Send,
  Users,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  timestamp: string;
  isRead: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    title: "Bulk Message Sent Successfully",
    message:
      'Your bulk message campaign "Holiday Sale" was sent to 150 contacts.',
    type: "success",
    timestamp: "2024-01-15T10:30:00Z",
    isRead: false,
  },
  {
    id: "2",
    title: "Template Approval Status",
    message:
      'Your template "Order Confirmation" has been approved by WhatsApp Business API.',
    type: "success",
    timestamp: "2024-01-15T09:15:00Z",
    isRead: false,
  },
  {
    id: "3",
    title: "Campaign Failed",
    message: "Bulk message to 25 contacts failed due to invalid phone numbers.",
    type: "error",
    timestamp: "2024-01-14T16:45:00Z",
    isRead: true,
  },
  {
    id: "4",
    title: "Low Credit Warning",
    message:
      "Your account credit is running low. Please top up to continue sending messages.",
    type: "warning",
    timestamp: "2024-01-14T14:20:00Z",
    isRead: false,
  },
  {
    id: "5",
    title: "New Contact Imported",
    message: "50 new contacts were successfully imported from your CSV file.",
    type: "info",
    timestamp: "2024-01-13T11:30:00Z",
    isRead: true,
  },
];

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = notifications.filter(
    (notification) => filter === "all" || !notification.isRead
  );

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    toast.success("Notification deleted");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "error":
        return <XCircle className="w-5 h-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "info":
        return <Bell className="w-5 h-5 text-info" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "success":
        return "text-success bg-success/20";
      case "error":
        return "text-destructive bg-destructive/20";
      case "warning":
        return "text-warning bg-warning/20";
      case "info":
        return "text-info bg-info/20";
      default:
        return "text-muted-foreground bg-muted/20";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container max-w-7xl mx-auto px-0 sm:px-6 lg:px-4">
      {/* Header */}

      <div className="flex flex-col justify-between  sm:flex-row lg:justify-between sm:items-center  gap-4 mb-8 ">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Notifications
          </h1>
          <p className="text-muted-foreground mt-2">
            Stay updated with your WhatsApp campaigns and activities
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => setFilter("unread")}
          >
            Unread ({notifications.filter((n) => !n.isRead).length})
          </Button>
          <Button variant="outline" onClick={markAllAsRead}>
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {notifications.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="w-8 h-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Unread
                </p>
                <p className="text-2xl font-bold text-warning">
                  {notifications.filter((n) => !n.isRead).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-8 h-8 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Success
                </p>
                <p className="text-2xl font-bold text-success">
                  {notifications.filter((n) => n.type === "success").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Errors
                </p>
                <p className="text-2xl font-bold text-destructive">
                  {notifications.filter((n) => n.type === "error").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card className="card-elegant">
            <CardContent className="p-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No notifications
              </h3>
              <p className="text-muted-foreground">
                {filter === "unread"
                  ? "All notifications have been read"
                  : "No notifications yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`card-elegant transition-all hover:shadow-md ${
                !notification.isRead
                  ? "border-l-4 border-l-primary bg-primary/5"
                  : ""
              }`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  {/* Left: Icon + Content */}
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <Badge className="text-xs bg-primary text-primary-foreground">
                            New
                          </Badge>
                        )}
                        <Badge
                          className={`text-xs capitalize ${getNotificationBadge(
                            notification.type
                          )}`}
                        >
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="text-destructive "
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
