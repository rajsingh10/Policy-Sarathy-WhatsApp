import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import API, { apiService } from "../config/api";
import {
  addGroup,
  editGroup,
  removeSingleGroup,
  fetchGroups,
} from "../features/groups/groupSlice";

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
import { BaseLoading } from "../components/BaseLoading";
import { Badge } from "@/components/ui/badge";
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
import {
  Plus,
  Search,
  Users,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  UserMinus,
  Calendar,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SortableTable from "../components/ui/sortable-table";
import { useDispatch, useSelector } from "react-redux";
import { fetchContacts } from "../features/contacts/contactSlice";
import { assignContactsToGroup } from "../features/groups/groupSlice";

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  created_at: string;
  tags: string[];
}

export const Groups = () => {
  const dispatch = useDispatch();
  const {
    items: groups,
    loading,
    error,
    pagination,
  } = useSelector((state) => state.groups);
  const { list } = useSelector((state) => state.contacts);
  const [groupsPage, setGroupsPage] = useState(1);
  const [allContactsForDialog, setAllContactsForDialog] = useState<any[]>([]); // separate state for Assign dialog
  console.log("list", list);
  const [group, setGroups] = useState([]);
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    tags?: string;
  }>({});
  console.log(errors);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState();
  const token = localStorage.getItem("token");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [searchContact, setSearchContact] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  console.log("grop id", selectedGroup);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: "",
  });
  const navigate = useNavigate();
  const CONTACTS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const {
    items: contacts = [],
    loading: contactsLoading,
    error: contactsError,
  } = useSelector((state: any) => state.contacts || { items: [] });

  const [dialogPagination, setDialogPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 1,
    to: 15,
  });
  const [isDialogContactsLoading, setIsDialogContactsLoading] = useState(false);

  // Fetch contacts for Assign dialog dynamically
  useEffect(() => {
    if (!token || !isAssignDialogOpen) return;

    const fetchContactsForDialog = async () => {
      setIsDialogContactsLoading(true);
      try {
        const res = await apiService.get(API.ENDPOINTS.GET_CONTACT, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: currentPage, limit: 15, search: searchContact }
        });
        setAllContactsForDialog(res.data?.data || []);
        if (res.data?.pagination) {
          setDialogPagination(res.data.pagination);
        }
      } catch (e) {
        console.error("Failed to fetch contacts for dialog", e);
      } finally {
        setIsDialogContactsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchContactsForDialog();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [token, isAssignDialogOpen, currentPage, searchContact]);

  useEffect(() => {
    dispatch(fetchGroups({ token, page: groupsPage, limit: 15, search: searchTerm }));
  }, [dispatch, token, groupsPage]);

  useEffect(() => {
    if (groups && Array.isArray(groups)) {
      const mapped = groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description || "",
        memberCount: g.memberCount || 0, // default if backend doesn't send it
        created_at: g.created_at?.split("T")[0] || "",
        tags: g.tags || [], // default to []
      }));
      setGroups(mapped);
    }
  }, [groups]);
  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Group name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Group name must be at least 3 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const filteredGroups = group.filter(
    (group) =>
      group.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      group.description?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      group.tags.some((tag) =>
        tag.toLowerCase()?.includes(searchTerm?.toLowerCase())
      )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    // Create a FormData object
    const formDataObj = new FormData();
    formDataObj.append("name", formData.name);
    formDataObj.append("description", formData.description || "");
    formData.tags
      ?.split(",")
      .map((tag) => tag.trim())
      .forEach((tag) => formDataObj.append("tags[]", tag));

    try {
      if (editingGroup) {
        // 🔹 Update existing group
        await dispatch(
          editGroup({
            token,
            groupId: editingGroup.id,
            groupData: formDataObj,
          })
        ).unwrap();
        toast.success("Group updated successfully");
      } else {
        // 🔹 Add new group
        await dispatch(
          addGroup({
            token,
            groupData: formDataObj, // send FormData
          })
        ).unwrap();
        toast.success("Group created successfully");
      }

      resetForm();

      // Refresh the list from backend
      dispatch(fetchGroups(token));
    } catch (err: any) {
      toast.error(err.message || "Failed to save group");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", tags: "" });
    setIsCreateDialogOpen(false);
    setEditingGroup(null);
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      tags: group.tags.join(", "),
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(removeSingleGroup({ token, id: id })).unwrap();
      setGroups((prev) => prev.filter((g) => g.id !== id));
      dispatch(fetchGroups(token));
      toast.success("Group deleted successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete group");
    }
  };

  const handleViewGroup = (groupId: string, groupName: string) => {
    navigate(`/groups/${groupId}`, { state: { groupName } });
  };

  const totalContacts = group.reduce(
    (sum, group) => sum + group.memberCount,
    0
  );

  const normalizeGroupIds = (groupIds: any): string[] => {
    if (!groupIds) return [];
    return groupIds.flatMap((g: any) => (Array.isArray(g) ? g : [g]));
  };

  const filteredContacts = allContactsForDialog.filter((contact) => {
    const normalizedIds = normalizeGroupIds(contact.groupIds);
    return !selectedGroup || !normalizedIds.includes(String(selectedGroup));
  });
  const openAssignDialog = (groupId: string) => {
    console.log("groupId", groupId);
    setSelectedGroup(groupId);

    const preSelected = contacts
      .filter((contact) =>
        normalizeGroupIds(contact.groupIds).includes(String(groupId))
      )
      .map((contact) => String(contact.id));

    setSelectedContacts(preSelected);
    setCurrentPage(1);
    setSearchContact("");
    setIsAssignDialogOpen(true);
  };


  const toggleContact = (id: number | string) => {
    setSelectedContacts((prev) =>
      prev.includes(String(id))
        ? prev.filter((cid) => cid !== String(id))
        : [...prev, String(id)]
    );
  };

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id]
    );
  };

  const handleAssignContacts = async (e: React.FormEvent) => {
    if (!selectedGroup) {
      toast.error("Please select a group first.");
      return;
    }

    try {
      await dispatch(
        assignContactsToGroup({
          token,
          groupId: selectedGroup,
          contactIds: selectedContacts,
        })
      ).unwrap();

      toast.success(`Contacts assigned successfully.`);
      dispatch(fetchContacts());
      dispatch(fetchGroups(token));
      setIsAssignDialogOpen(false);
      setSelectedContacts([]);
      setSelectedGroup(null);
    } catch (err: any) {
      console.error("Assign error:", err);
      toast.error(err?.message || "Failed to assign contacts.");
    }
  };

  const columns = [
    {
      key: "name",
      label: "Group Name",
      sortable: true,
      minWidth: "150px",
      render: (value: string) =>
        value
          ? value
            .split(" ")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ")
          : "",
    },
    {
      key: "description",
      label: "Description",
      sortable: true,
      minWidth: "200px",
      render: (value: string) => (
        <span className="text-muted-foreground">
          {value
            ? value
              .split(" ")
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ")
            : "No description"}
        </span>
      ),
    },
    {
      key: "memberCount",
      label: "Members",
      sortable: true,
      minWidth: "100px",
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>{value?.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      minWidth: "120px",
      type: "date",
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{new Date(value)?.toLocaleDateString()}</span>
        </div>
      ),
    },
  ];

  const onRowAction = (item: Group) => (
    <div className="flex justify-end space-x-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-3 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900"
        onClick={() => openAssignDialog(item.id)}
      >
        Assign
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-3 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-900"
        onClick={() => handleViewGroup(item.id, item.name)}
      >
        View
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-3 bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-900"
        onClick={() => handleEdit(item)}
      >
        Edit
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 px-3 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800">
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{item.name}"? This will remove
              the group but not the contacts themselves.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(item?.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (loading) return <BaseLoading message="Loading..." />;
  console.log("filteredContacts", filteredContacts);
  return (
    <div className="container max-w-7xl mx-auto px-0 sm:px-6 lg:px-4">
      {/* Header */}
      <div className="flex flex-col justify-between sm:flex-row lg:justify-between sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact Groups</h1>
          <p className="text-muted-foreground mt-2">
            Organize and manage your contact group
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:shadow-glow">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingGroup ? "Edit Group" : "Create New Group"}
                </DialogTitle>
                <DialogDescription>
                  {editingGroup
                    ? "Update group information"
                    : "Create a new contact group"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter group name"
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (errors.description)
                        setErrors({ ...errors, description: undefined });
                    }}
                    placeholder="Describe the purpose of this group"
                    rows={3}
                    className={errors.description ? "border-destructive" : ""}
                  />
                  {errors.description && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-primary">
                    {editingGroup ? "Update" : "Create"} Group
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogContent className="max-w-full sm:max-w-[700px] w-[95%] sm:w-auto p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">Assign Contacts to Group</DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  Search and select contacts to add them into this group.
                </DialogDescription>
              </DialogHeader>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchContact}
                  onChange={(e) => {
                    setSearchContact(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              {/* Contacts List */}
              <div className="max-h-64 overflow-y-auto space-y-2 mt-2">
                {isDialogContactsLoading ? (
                  <p className="text-center text-muted-foreground">Loading contacts...</p>
                ) : filteredContacts.length > 0 ? (
                  filteredContacts.map((contact: any) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between border p-2 rounded-md bg-card"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm sm:text-base">{contact.name}</span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-sm sm:text-base text-muted-foreground">{contact.phone}</span>
                      </div>
                      <Checkbox
                        checked={selectedContacts.includes(String(contact.id))}
                        onCheckedChange={() => toggleContact(contact.id)}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No contacts found</p>
                )}
              </div>

              {/* Footer: Pagination & Actions */}
              <div className="flex flex-col gap-3 border-t pt-3 mt-1">
                {dialogPagination.last_page > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground hidden sm:block">
                      Showing {dialogPagination.from || 1}–{dialogPagination.to || dialogPagination.total} of {dialogPagination.total} contacts
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentPage((p) => Math.max(1, p - 1));
                        }}
                      >
                        Previous
                      </Button>
                      <div className="text-sm font-medium mx-2">
                        Page {currentPage} of {dialogPagination.last_page}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={currentPage === dialogPagination.last_page}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentPage((p) => Math.min(dialogPagination.last_page, p + 1));
                        }}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignContacts}
                    disabled={selectedContacts.length === 0}
                    className="bg-gradient-primary"
                  >
                    Assign Selected
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-3 sm:mb-6">
        <Card className="card-elegant">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Groups
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {group.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalContacts.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elegant col-span-2 md:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg. Group Size
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {group.length > 0
                    ? Math.round(totalContacts / group.length)
                    : 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups Table */}
      <Card className="card-elegant">
        <div className="flex flex-col justify-between sm:flex-row lg:justify-between sm:items-center gap-2 sm:gap-4 mb-2 sm:mb-6">
          <CardHeader className="p-3 pb-1 sm:p-5">
            <CardTitle>Groups List</CardTitle>
            <CardDescription>Manage your contact group</CardDescription>
          </CardHeader>
          <div className="relative mx-3 sm:mx-5 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search group by name, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <CardContent className="p-2 pt-0 sm:p-6 sm:pt-0">
          <SortableTable
            data={filteredGroups}
            columns={columns}
            itemsPerPage={15}
            onRowAction={onRowAction}
            showColumn1Mobile={false}
            hidePagination={true}
          />
          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-between p-4 border-t mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {pagination.from || 1}–{pagination.to || pagination.total} of {pagination.total} groups
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGroupsPage(p => Math.max(1, p - 1))}
                  disabled={groupsPage === 1}
                >
                  Previous
                </Button>
                <div className="text-sm font-medium mx-2">
                  Page {groupsPage} of {pagination.last_page}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGroupsPage(p => Math.min(pagination.last_page, p + 1))}
                  disabled={groupsPage === pagination.last_page}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
