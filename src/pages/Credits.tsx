import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import SortableTable from "../components/ui/sortable-table";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Wallet,
  Calendar,
  TrendingUp,
  Plus,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { BaseLoading } from "../components/BaseLoading";

import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { getBalanceHistory, getReport } from "../features/credits/creditSlice";
import { Link } from "react-router-dom";

// Mock data
const usageData = [
  { date: "2024-01-01", credits: 450, campaigns: 3 },
  { date: "2024-01-02", credits: 320, campaigns: 2 },
  { date: "2024-01-03", credits: 680, campaigns: 4 },
  { date: "2024-01-04", credits: 290, campaigns: 1 },
  { date: "2024-01-05", credits: 520, campaigns: 3 },
  { date: "2024-01-06", credits: 380, campaigns: 2 },
  { date: "2024-01-07", credits: 420, campaigns: 2 },
];

const transactionHistory = [
  {
    id: "1",
    date: "2024-01-07",
    credits: 5000,
    amount: 2500,
    mode: "UPI",
    status: "Success",
  },
  {
    id: "2",
    date: "2024-01-05",
    credits: 2000,
    amount: 1000,
    mode: "Card",
    status: "Success",
  },
  {
    id: "3",
    date: "2024-01-03",
    credits: 1000,
    amount: 500,
    mode: "Wallet",
    status: "Failed",
  },
  {
    id: "4",
    date: "2024-01-01",
    credits: 3000,
    amount: 1500,
    mode: "UPI",
    status: "Success",
  },
];
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
export const Credits: React.FC = () => {
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const {
    report,
    reportLoading,
    balance,
    history,
    fetchLoading,
    addLoading,
    verifyLoading,
  } = useSelector((state) => state.credit);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [filter, setFilter] = useState("all");
  const currentCredits = report?.summary?.totalAdded || 0;
  const totalDeducted = report?.summary?.totalDeducted || 0;

  const dailyUsage = 387;
  const monthlyUsage = 8456;
  useEffect(() => {
    if (!token) return;

    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      // dispatch(fetchCreditBalance({ token, userId: user.id }));
      dispatch(getBalanceHistory({ token, userId: user.id }));
      dispatch(getReport({ token }));
    }
  }, [token, dispatch]);

  const filteredTransactions = history.filter((transaction) => {
    if (filter === "all") return true;
    if (filter === "7days") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(transaction.date) >= weekAgo;
    }
    if (filter === "30days") {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return new Date(transaction.date) >= monthAgo;
    }
    return true;
  });

  const exportTransactions = () => {
    const csv = [
      "Date,Credits,Amount,Payment Mode,Status",
      ...filteredTransactions.map(
        (t) => `${t.date},${t.credits},₹${t.amount},${t.mode},${t.status}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Transaction history exported");
  };

  const transactionColumns = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      minWidth: "120px",
      type: "date",
      render: (value: string) => (
        <span>{new Date(value).toLocaleDateString()}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      minWidth: "100px",
      render: (value: number) => <span>₹{value?.toLocaleString()}</span>,
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      minWidth: "100px",
      render: (value: string) => <span className="capitalize">{value}</span>,
    },

    {
      key: "description",
      label: "Description",
      sortable: true,
      minWidth: "180px",
    },

    // {
    //   key: "mode",
    //   label: "Payment Mode",
    //   sortable: true,
    //   minWidth: "120px",
    // },
    // {
    //   key: "status",
    //   label: "Status",
    //   sortable: true,
    //   minWidth: "120px",
    //   render: (value: string) => (
    //     <Badge
    //       variant={value === "Success" ? "default" : "destructive"}
    //       className={
    //         value === "Success"
    //           ? "bg-success/20 text-success hover:bg-success/30"
    //           : "bg-destructive/20 text-destructive hover:bg-destructive/30"
    //       }
    //     >
    //       {value === "Success" ? (
    //         <CheckCircle className="w-3 h-3 mr-1" />
    //       ) : (
    //         <XCircle className="w-3 h-3 mr-1" />
    //       )}
    //       {value}
    //     </Badge>
    //   ),
    // },
  ];

  if (verifyLoading || addLoading || fetchLoading)
    return <BaseLoading message="Loading..." />;

  return (
    <div className="container max-w-7xl mx-auto px-0 sm:px-6 lg:px-4">
      {/* Header */}
      <div className="flex flex-col justify-between sm:flex-row lg:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Credits & Balance
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your WhatsApp credits and wallet balance
          </p>
        </div>
        <Link to="/recharge">
          <Button className="bg-gradient-primary hover:shadow-glow">
            <Plus className="w-4 h-4 mr-2" />
            Add Credits
          </Button>
        </Link>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Current Credits
                </p>
                <p className="text-2xl font-bold text-foreground">
                  ₹{currentCredits?.toLocaleString() || 0}
                </p>
                {/* <p className="text-sm text-success mt-1">Active</p> */}
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Deducted
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {" "}
                  ₹{totalDeducted?.toLocaleString() || 0}
                </p>
                {/* <p className="text-sm text-warning mt-1">2024</p> */}
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Daily Usage
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {dailyUsage}
                </p>
                <p className="text-sm text-primary mt-1">Credits</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-info" />
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>

      {/* Low Balance Alert */}
      {currentCredits < 100 && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 mb-6">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Low balance warning! You have less than 100 credits remaining.
            Consider recharging to avoid interruption in your messaging
            campaigns.
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Analytics and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 card-elegant">
          <CardHeader>
            <CardTitle>Usage Analytics</CardTitle>
            <CardDescription>
              Daily credit consumption over the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString("en-US", {
                      weekday: "short",
                    })
                  }
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Bar
                  dataKey="credits"
                  fill="hsl(var(--primary))"
                  name="Credits Used"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle>Usage Summary</CardTitle>
            <CardDescription>Current month overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Monthly Usage
                </span>
                <p className="font-medium">₹{monthlyUsage.toLocaleString()}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Avg. Daily
                </span>
                <span className="font-medium">
                  {Math.round(monthlyUsage / 30)}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Est. Days Left
                </span>
                <span className="font-medium text-warning">
                  {Math.floor(currentCredits / dailyUsage)} days
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="card-elegant mt-6">
        <CardHeader>
          <div className="flex flex-col justify-between sm:flex-row lg:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>Transaction History</span>
              </CardTitle>
              <CardDescription>Your credit purchase history</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportTransactions}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SortableTable
            data={filteredTransactions}
            columns={transactionColumns}
            itemsPerPage={10}
          />
        </CardContent>
      </Card>
    </div>
  );
};
