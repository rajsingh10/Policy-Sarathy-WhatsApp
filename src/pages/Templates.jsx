import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SortableTable from "../components/ui/sortable-table";
import { Filter } from "bad-words";
import {
  addTemplate,
  changeStatus,
  editTemplate,
  fetchFilteredTemplates,
  fetchSyncTemplate,
  fetchUserTemplate,
  removeTemplate,
} from "../features/templates/templatesSlice";
import { useDispatch, useSelector } from "react-redux";
import { BaseLoading } from "../components/BaseLoading";
import { getProfile } from "../features/auth/authSlice";

export const Templates = () => {
  const dispatch = useDispatch();
  const { token, profile } = useSelector((state) => state.auth);
  const {
    items: templates = [],
    filteredItems = [],
    loading,
    error,
    activeTab = "all",
  } = useSelector((state) => state.template);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    language: "",
    body: "",
  });
  const [errors, setErrors] = useState({ name: "", body: "" });
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Initialize the bad-words filter
  const filter = new Filter();

  const isAdmin = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.role === "admin";
  };

  // Fetch templates when component mounts or tab changes
  useEffect(() => {
    const fetchTemplates = async () => {
      if (token) {
        try {
          // Fetch all templates first
          await dispatch(getProfile(token));
          await dispatch(fetchSyncTemplate(token));
          await dispatch(fetchUserTemplate(token));

          // Then fetch filtered templates based on active tab
          if (activeTab !== "all") {
            await dispatch(fetchFilteredTemplates({ token, type: activeTab }));
          }
        } catch (err) {
          console.error("Failed to fetch templates:", err);
          toast.error("Failed to load templates");
        }
      }
    };
    fetchTemplates();
  }, [dispatch, token, activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let valid = true;
    const newErrors = { name: "", body: "" };

    if (!formData.name) {
      newErrors.name = "Template name is required";
      valid = false;
    } else if (filter.isProfane(formData.name)) {
      newErrors.name = "Template name contains inappropriate words";
      valid = false;
    }

    if (!formData.body) {
      newErrors.body = "Template message is required";
      valid = false;
    } else if (filter.isProfane(formData.body)) {
      newErrors.body = "Template message contains inappropriate words";
      valid = false;
    }

    setErrors(newErrors);

    if (!valid) return;

    try {
      const resultAction = await dispatch(
        editingTemplate
          ? editTemplate({
            token,
            templateId: editingTemplate.id,
            groupData: {
              name: formData.name,
              category: formData.category,
              language: formData.language,
              components: formData.body,
            },
          })
          : addTemplate({
            token,
            groupData: {
              name: formData.name,
              category: formData.category,
              language: formData.language,
              components: formData.body,
            },
          })
      );

      if (
        addTemplate.fulfilled.match(resultAction) ||
        editTemplate.fulfilled.match(resultAction)
      ) {
        toast.success(
          editingTemplate
            ? "Template updated successfully"
            : "Template created successfully"
        );
        resetForm();

        // Refresh templates
        await dispatch(fetchUserTemplate(token));
        if (activeTab !== "all") {
          await dispatch(fetchFilteredTemplates({ token, type: activeTab }));
        }
      } else {
        toast.error(
          resultAction.payload?.message ||
          resultAction.payload ||
          "Failed to save template"
        );
      }
    } catch (err) {
      toast.error("An error occurred while saving the template");
    }
  };

  const handleStatusChange = async () => {
    if (!selectedTemplate) return;
    try {
      const resultAction = await dispatch(
        changeStatus({
          token,
          templateId: selectedTemplate.id,
          groupData: {
            status: selectedTemplate.status,
          },
        })
      );
      if (changeStatus.fulfilled.match(resultAction)) {
        toast.success("Status updated successfully");
        setIsStatusModalOpen(false);

        // Refresh templates
        await dispatch(fetchUserTemplate(token));
        if (activeTab !== "all") {
          await dispatch(fetchFilteredTemplates({ token, type: activeTab }));
        }
      } else {
        toast.error(resultAction.payload || "Failed to update status");
      }
    } catch (err) {
      toast.error("An error occurred while updating the status");
    }
  };

  const handleDelete = async (id) => {
    try {
      const resultAction = await dispatch(
        removeTemplate({ token, templateId: id })
      );
      if (removeTemplate.fulfilled.match(resultAction)) {
        toast.success("Template deleted successfully");

        // Refresh templates
        await dispatch(fetchUserTemplate(token));
        if (activeTab !== "all") {
          await dispatch(fetchFilteredTemplates({ token, type: activeTab }));
        }
      } else {
        toast.error(resultAction.payload || "Failed to delete template");
      }
    } catch (err) {
      toast.error("An error occurred while deleting the template");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", category: "", language: "", body: "" });
    setIsAddDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      language: template.language,
      body: template.components?.find((c) => c.type === "BODY")?.text || "",
    });
    setIsAddDialogOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="w-4 h-4" />;
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "text-white bg-blue-400 hover:bg-blue-300";
      case "PENDING":
        return "text-black bg-warning/20 hover:bg-warning/30";
      case "REJECTED":
        return "text-black bg-destructive/20 hover:bg-destructive/30";
      default:
        return "text-black bg-warning/20 hover:bg-warning/30";
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (value, row) => (
        <div className="text-sm font-medium capitalize">{row.name}</div>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (value) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "language",
      label: "Language",
      sortable: true,
      render: (value) => <div className="capitalize">{value}</div>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value, row) => (
        <Badge
          className={`${getStatusColor(value)} capitalize`}
          onClick={() => {
            if (isAdmin() && row.isCustom) {
              setSelectedTemplate(row);
              setIsStatusModalOpen(true);
            }
          }}
          style={{ cursor: isAdmin() && row.isCustom ? "pointer" : "default" }}
        >
          {getStatusIcon(value)}
          <span className="ml-1">{value}</span>
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      type: "date",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  // Determine which templates to display based on active tab
  const displayedTemplates = activeTab === "all" ? templates : filteredItems;

  const filteredTemplates = displayedTemplates.filter((template) => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = template.name?.toLowerCase().includes(searchLower);
    const categoryMatch = template.category
      ?.toLowerCase()
      .includes(searchLower);
    const languageMatch = template.language
      ?.toLowerCase()
      .includes(searchLower);
    return nameMatch || categoryMatch || languageMatch;
  });

  const onRowAction = (template) => (
    <div className="flex justify-end gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-10 px-4 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-900"
        onClick={() => navigate(`/templates/${template.id}`)}
        title="View template"
      >
        View
      </Button>
      {template.isCustom && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-4 bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-900"
            onClick={() => handleEdit(template)}
            title="Edit template"
          >
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-4 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800"
              >
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Template</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{template.name}"? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(template.id)}
                  className="bg-destructive text-destructive-foreground"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );

  if (loading) return <BaseLoading message="Loading..." />;

  return (
    <div className="container max-w-7xl mx-auto px-0 sm:px-6 lg:px-4">
      {/* Status Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Select a new status for the template.
            </DialogDescription>
          </DialogHeader>
          <Select
            value={selectedTemplate?.status}
            onValueChange={(value) => {
              setSelectedTemplate({ ...selectedTemplate, status: value });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex justify-end space-x-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-primary"
              onClick={handleStatusChange}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-2">
        {/* Header */}
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Templates
          </h1>
          <p className="text-muted-foreground mt-0 sm:mt-2">
            Create and manage WhatsApp message templates
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="flex flex-row gap-2 w-full sm:w-auto sm:contents">
            <Button
              className="bg-gradient-primary flex-1 sm:flex-none justify-center px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
              onClick={() => navigate("/bulk-send")}
            >
              <Users className="w-4 h-4 mr-1 sm:mr-2" />
              Bulk Send
            </Button>
            {/* {profile?.activePackage?.packageName !== "Small Business" && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:shadow-glow flex-1 sm:flex-none justify-center px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                    <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                    New Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTemplate
                        ? "Edit Template"
                        : "Create New Template"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingTemplate
                        ? "Update your template information"
                        : "Create a new WhatsApp message template"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Template Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Enter template name"
                      />
                      {errors.name && (
                        <p className="text-xs text-red-500">{errors.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="body">Template Message</Label>
                      <textarea
                        id="body"
                        value={formData.body}
                        onChange={(e) =>
                          setFormData({ ...formData, body: e.target.value })
                        }
                        placeholder="Enter your template message. Use placeholders like {{1}} for dynamic content."
                        className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      {errors.body && (
                        <p className="text-xs text-red-500">{errors.body}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Use placeholders like {`{{1}}`} for dynamic content
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-gradient-primary">
                        {editingTemplate ? "Update" : "Create"} Template
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )} */}
          </div>
          {/* {profile?.activePackage?.packageName !== "Small Business" && (
            <Button
              className="bg-gradient-primary w-full sm:w-auto flex justify-center"
              onClick={() => navigate("/templates/new")}
            >
              <Users className="w-4 h-4 mr-2" />
              Requested Template
            </Button>
          )} */}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          dispatch({ type: "template/setActiveTab", payload: value })
        }
        className="mb-0"
      >
        <TabsList
          className={`grid w-full ${profile?.activePackage?.packageName !== "Small Business"
            ? "grid-cols-4"
            : "grid-cols-2"
            }`}
        >
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="system">Default</TabsTrigger>
          {/* <TabsTrigger value="custom">Custom</TabsTrigger>
          <TabsTrigger value="request">Requested</TabsTrigger> */}
          {profile?.activePackage?.packageName !== "Small Business" && (
            <>
              <TabsTrigger value="custom">Custom</TabsTrigger>
              <TabsTrigger value="request">Requested</TabsTrigger>
            </>
          )}
        </TabsList>
        <TabsContent value={activeTab} className="mt-2">
          <Card className="card-elegant">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 sm:px-6 sm:py-4">
              <div>
                <CardTitle>
                  {activeTab === "all"
                    ? "All Templates"
                    : activeTab.charAt(0).toUpperCase() +
                    activeTab.slice(1) +
                    " Templates"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "all"
                    ? "All your WhatsApp message templates"
                    : `Manage your ${activeTab} WhatsApp message templates`}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates by name, category, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="px-0 sm:px-6 ">
              <SortableTable
                data={filteredTemplates}
                columns={columns}
                itemsPerPage={10}
                onRowAction={onRowAction}
                showColumn1Mobile={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
