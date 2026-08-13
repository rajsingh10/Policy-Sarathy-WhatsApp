import React, { useState, useMemo, useEffect } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Download,
  CalendarIcon,
  Filter,
  FileText,
  Users,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { fetchReports } from "../features/reports/reportsSlice";
import { useDispatch, useSelector } from "react-redux";
import { BaseLoading } from "../components/BaseLoading";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Reports = () => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [templateFilter, setTemplateFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state: any) => state.reports);
  const summaryData = data?.summary || {};

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) dispatch(fetchReports(token));
  }, [dispatch]);
  const flattenedData =
    data?.messages
      ?.flatMap((row: any) =>
        (row.contactDetails ?? []).map((contact: any) => ({
          contactName: contact?.name || "-",
          phone: contact?.phone || "-",
          templateName: row.templateDetails?.name || "-",
          sendingDate: row.sendingDate,
          status: contact?.delivery_status?.status || row.status || "pending",
        }))
      )
      ?.map((row: any, index: number) => ({
        ...row,
        sr: index + 1,
      })) || [];
  // Filtered data
  const filteredData = useMemo(() => {
    if (!data?.messages) return [];

    return flattenedData.filter((report) => {
      const sendingDate = report.sendingDate
        ? new Date(report.sendingDate)
        : null;

      // Date filter
      if (dateFrom && sendingDate && sendingDate < dateFrom) return false;
      if (dateTo && sendingDate && sendingDate > dateTo) return false;

      // Status filter
      if (statusFilter !== "all" && report.status !== statusFilter)
        return false;

      // Template filter
      const templateName = report.templateName || "";
      if (
        templateFilter &&
        !templateName?.toLowerCase()?.includes(templateFilter?.toLowerCase())
      )
        return false;

      // Search term
      const contactName = report.contactName || "";
      const contactPhone = report.phone || "";
      const tempName = report.templateName || "";

      if (
        searchTerm &&
        !contactName?.toLowerCase()?.includes(searchTerm?.toLowerCase()) &&
        !contactPhone?.includes(searchTerm) &&
        !tempName?.toLowerCase()?.includes(searchTerm?.toLowerCase())
      )
        return false;

      return true;
    });
  }, [data, dateFrom, dateTo, statusFilter, templateFilter, searchTerm]);

  // Stats
  const stats = {
    total: summaryData?.totalMessages || 0,
    complate: summaryData?.completed || 0,
    // delivered: summaryData?.delivered || 0,
    failed: summaryData?.failed || 0,
    pending: summaryData?.pending || 0,
    scheduled: summaryData?.scheduled || 0,
  };

  // Table columns
  const columns = [
    // {
    //   key: "sr",
    //   label: "Sr.",
    //   className: "w-16",
    //   render: (_: any, row: any) => row.sr,
    // },
    {
      key: "templateName",
      label: "Template Name",
      className: "min-w-[150px]",
      render: (_: any, row: any) => row.templateName || "-",
    },
    {
      key: "contactName",
      label: "Contact Name",
      className: "min-w-[150px]",
      render: (_: any, row: any) => row.contactName || "-",
    },
    {
      key: "phone",
      label: "Mobile Number",
      className: "min-w-[130px]",
      render: (_: any, row: any) => row.phone || "-",
    },

    {
      key: "sendingDate",
      label: "Sending Date",
      className: "min-w-[120px]",
      render: (_: any, row: any) =>
        row.sendingDate ? format(new Date(row.sendingDate), "dd/MM/yyyy") : "-",
    },
    {
      key: "status",
      label: "Status",
      className: "min-w-[100px]",
      render: (_: any, row: any) => {
        const statusConfig: any = {
          completed: {
            color: "bg-success text-success-foreground",
            icon: CheckCircle,
          },
          read: {
            color: "bg-blue-600 text-white",
            icon: CheckCircle, // or Eye
          },
          delivered: {
            color: "bg-green-600 text-white",
            icon: CheckCircle,
          },
          sent: {
            color: "bg-gray-500 text-white",
            icon: CheckCircle,
          },
          failed: {
            color: "bg-destructive text-destructive-foreground",
            icon: XCircle,
          },
          pending: { color: "bg-warning text-warning-foreground", icon: Clock },
          scheduled: {
            color: "bg-primary text-primary-foreground",
            icon: Clock,
          },
          active: {
            color: "bg-primary text-primary-foreground",
            icon: CheckCircle,
          },
        };
        const config = statusConfig[row.status] || statusConfig["pending"];
        const Icon = config.icon;
        const label =
          row.status === "completed"
            ? "Delivered"
            : row.status.charAt(0).toUpperCase() + row.status.slice(1);

        return (
          <Badge
            className={cn(
              config.color,
              "flex items-center gap-1 capitalize justify-center"
            )}
          >
            <Icon className="w-3 h-3" />
            {label}
          </Badge>
        );
      },
    },
  ];

  // Export CSV
  const exportToCSV = () => {
    const headers = [
      "Sr.",
      "Contact Name",
      "Mobile Number",
      "Template Name",
      "Sending Date",
      "Status",
    ];

    const csvData = filteredData.map((row) => [
      row.sr,
      row.contactName || "-", // Contact name
      row.phone || "-", // Mobile number
      row.templateName || "-", // Template name
      row.sendingDate ? format(new Date(row.sendingDate), "dd/MM/yyyy") : "-", // Sending date
      row.status,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const worksheetData = filteredData.map((row) => ({
      Sr: row.sr,
      "Contact Name": row.contactName || "-",
      "Mobile Number": row.phone || "-",
      "Template Name": row.templateName || "-",
      "Sending Date": row.sendingDate
        ? format(new Date(row.sendingDate), "dd/MM/yyyy")
        : "-",
      Status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
    }));

    // Create a new workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Save file
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `reports_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setStatusFilter("all");
    setTemplateFilter("");
    setSearchTerm("");
  };
  if (loading) return <BaseLoading message="Loading..." />;

  return (
    <div className="container mx-auto px-0 sm:px-6 lg:px-4 space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between sm:flex-row lg:justify-between sm:items-center gap-2 sm:gap-4 mb-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">
            View and analyze message sending reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            onClick={exportToExcel}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        <Card className="card-elegant">
          <CardContent className="p-4 py-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                All Messages
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.total}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-4 py-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Delivered
              </p>
              <p className="text-2xl font-bold text-success">
                {stats.complate}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
          </CardContent>
        </Card>
        {/* <Card className="card-elegant">
          <CardContent className="p-4 py-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Delivered</p>
              <p className="text-2xl font-bold text-success">{stats.delivered}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
          </CardContent>
        </Card> */}

        <Card className="card-elegant">
          <CardContent className="p-4 py-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Failed
              </p>
              <p className="text-2xl font-bold text-destructive">
                {stats.failed}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-4 py-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending
              </p>
              <p className="text-2xl font-bold text-warning">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant col-span-2 md:col-span-1">
          <CardContent className="p-4 py-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Scheduled
              </p>
              <p className="text-2xl font-bold text-primary ">
                {stats.scheduled}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* <div className="py-0">
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Message delivery and engagement statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Delivery Rate</span>
                  <span className="text-sm font-bold text-success">100%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-success h-2 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Read Rate</span>
                  <span className="text-sm font-bold text-primary">20%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="text-sm font-bold text-primary">50%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}
      {/* Filters */}
      <Card className="card-elegant">
        <CardHeader className="p-3 pb-0 sm:px-6 sm:pt-6">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Contact name or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Date From */}
            <div className="space-y-1 sm:space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-1 sm:space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Status Filter */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="completed">Delivered</option>
                <option value="failed">Failed</option>
                <option value="processing">Pending</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card className="card-elegant">
        <CardHeader className="p-3 pb-0 sm:p-6">
          <CardTitle>Message Reports</CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing {filteredData.length} of {data?.messages?.length || 0}{" "}
            reports
          </p>
        </CardHeader>
        <CardContent className="p-2 pt-2 sm:p-6 sm:pt-0">
          <SortableTable
            data={filteredData}
            columns={columns}
            itemsPerPage={10}
            showColumn1Mobile={false}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
