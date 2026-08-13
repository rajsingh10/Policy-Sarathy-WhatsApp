import React, { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Download, CheckCircle } from "lucide-react";

// helper function for status badges
const getStatusBadge = (status) => {
  const colors = {
    delivered: "bg-green-100 text-green-700",
    read: "bg-blue-100 text-blue-700",
    failed: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span
      className={`px-2 py-1 rounded-md text-xs font-medium ${
        colors[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
};

const MessageDetails = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // sample messages
  const messages = [
    {
      id: 1,
      recipientName: "Rohit Sharma",
      recipient: "+91 98765 43210",
      automationRule: "Welcome Message",
      message: "Hello Rohit, welcome to our service!",
      status: "delivered",
      greenTick: true,
      sentAt: "1",
      startDate: "2025-10-06 10:00 AM",
      endDate: "2025-10-06 10:30 AM",
      DelveredAt: "9",
    },
    {
      id: 2,
      recipientName: "Amit Verma",
      recipient: "+91 98765 12345",
      automationRule: "Follow Up",
      message: "Did you check our latest offers?",
      status: "read",
      greenTick: false,
      sentAt: "5",
      startDate: "2025-10-06 10:45 AM",
      endDate: "2025-10-06 11:00 AM",
      DelveredAt: "15",
    },
    {
      id: 3,
      recipientName: "Neha Gupta",
      recipient: "+91 99999 88888",
      automationRule: "Reminder",
      message: "Don’t forget your subscription renewal!",
      status: "failed",
      greenTick: false,
      sentAt: "9",
      startDate: "2025-10-06 11:00 AM",
      endDate: "2025-10-06 11:15 AM",
      DelveredAt: "8",
    },
    {
      id: 4,
      recipientName: "Priya Singh",
      recipient: "+91 88888 77777",
      automationRule: "Promotion",
      message: "Exclusive discount just for you!",
      status: "delivered",
      greenTick: true,
      sentAt: "20",
      startDate: "2025-10-06 11:30 AM",
      endDate: "2025-10-06 12:00 PM",
      DelveredAt: "5",
    },
  ];

  // filter logic
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const matchesSearch =
        msg.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.message.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ? true : msg.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, filterStatus, messages]);

  return (
    <div className="container max-w-7xl mx-auto px-0 sm:px-6 lg:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            WhatsApp Message Details & Status
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor your WhatsApp Business API connection
          </p>
        </div>
      </div>
      <Card className="shadow-sm border border-gray-100">
        <CardHeader className="px-2 sm:px-6">
          <CardTitle>Message Delivery Status</CardTitle>
          <CardDescription>
            Track the status of automated WhatsApp messages
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {/* Top Filters */}
          {/* <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div> */}

          {/* Messages Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Delivered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell>{msg.startDate}</TableCell>
                  <TableCell>{msg.endDate}</TableCell>
                  <TableCell>{msg.sentAt}</TableCell>
                  <TableCell>{msg.DelveredAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageDetails;
