import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImportContactsModal } from "@/components/contacts/ImportContactsModal";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Upload,
  Download,
  Edit,
  Trash2,
  Users,
  Phone,
  Mail,
  Tag,
  UserPlus,
  UserMinus,
  Folder,
  CheckCircle,
  Trash2Icon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import SortableTable from "../components/ui/sortable-table";
import { useDispatch, useSelector } from "react-redux";
import {
  addGroup,
  fetchGroups,
  addContactToGroup,
} from "../features/groups/groupSlice";
import {
  fetchContacts,
  createContact,
  removeContact,
  editContact,
  deleteMultipleContacts,
} from "../features/contacts/contactSlice";
import { BaseLoading } from "../components/BaseLoading";

export const Contacts = () => {
  const dropdownRef = useRef(null);
  const token = localStorage.getItem("token");
  const { list, loading, error, pagination } = useSelector((state) => state.contacts);
  const { items: groups } = useSelector((state) => state.groups);
  const dispatch = useDispatch();
  const [contacts, setContacts] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [filterGroup, setFilterGroup] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    tags: [],
    status: "Active",
    group: "",
  });
  console.log("availableGroups", availableGroups);
  const [formErrors, setFormErrors] = useState({});
  const [groupFormErrors, setGroupFormErrors] = useState({});
  console.log("object", formErrors);
  const [newTag, setNewTag] = useState("");
  const [groupSelectError, setGroupSelectError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);

  const [groupFormData, setGroupFormData] = useState({
    name: "",
    description: "",
    tags: "",
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setContacts(list);
    setAvailableGroups(groups);
  }, [list, groups]);

  useEffect(() => {
    if (token) {
      const delayDebounceFn = setTimeout(() => {
        dispatch(fetchContacts({ token, page: currentPage, limit, search: searchTerm }));
        // Only fetch groups once if needed, but keeping it here for consistency
        dispatch(fetchGroups(token));
      }, 400);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [token, dispatch, currentPage, limit, searchTerm]);

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tagToRemove),
    });
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.includes(searchTerm) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || contact.status === filterStatus;

    const matchesTag =
      filterTag === "all" || contact.tags.some((tag) => tag === filterTag);

    const matchesGroup =
      filterGroup === "all" ||
      (Array.isArray(contact.groups) &&
        contact.groups.some((g) => g.id === filterGroup));

    return matchesSearch && matchesStatus && matchesTag && matchesGroup;
  });

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\+?91\d{10}$/.test(formData.phone)) {
      errors.phone =
        "Please add country code (e.g., +919999988765 or 919999988765)";
    }
    //   if (!formData.phone.trim()) {
    //     errors.email = "Email is required";
    //   }

    //  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    //     errors.email = "Enter a valid email address";
    //   }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    console.log("selectedGroups", selectedGroups);
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    const formDataObject = new FormData();
    formDataObject.append("name", formData.name);
    formDataObject.append("phone", formData.phone);
    if (selectedGroups.length > 0) {
      selectedGroups.forEach((groupName) => {
        formDataObject.append("groupIds[]", groupName);
      });
    }

    // formDataObject.append("groupIds[]", groupName || "demo");

    try {
      let result;
      if (editingContact) {
        formDataObject.append("contactId", editingContact.id);
        result = await dispatch(
          editContact({
            token,
            contactId: editingContact.id,
            contactData: formDataObject,
          })
        ).unwrap();
        toast.success("Contact updated successfully");
      } else {
        result = await dispatch(
          createContact({ token, contactData: formDataObject })
        ).unwrap();
        setContacts([...contacts, result]);
        toast.success("Contact added successfully");
      }
      dispatch(fetchContacts({ token, page: currentPage, limit, search: searchTerm }));
      resetForm();
    } catch (err) {
      toast.error(err.message || "Failed to save contact");
    }
  };

  const handleBulkDeleteContacts = async () => {
    if (!selectedContacts.length) return toast.info("No contacts selected.");

    try {
      const formData = new FormData();
      selectedContacts.forEach((id) => formData.append("contact_ids[]", id));

      const resultAction = await dispatch(
        deleteMultipleContacts({ token, formData })
      );

      if (deleteMultipleContacts.fulfilled.match(resultAction)) {
        toast.success("Selected contacts deleted successfully.");
        setSelectedContacts([]);
        setIsDeleteDialogOpen(false);

        // Refresh contacts after deletion
        setSearchTerm("");
        dispatch(fetchContacts({ token, page: currentPage, limit, search: "" }));
      } else {
        throw new Error(resultAction.payload || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting contacts:", error);
      toast.error("Failed to delete selected contacts.");
    }
  };

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    // Validate Group Name
    if (!groupFormData.name.trim()) {
      errors.name = "Group name is required";
    } else if (groupFormData.name.trim().length > 30) {
      errors.name = "Group name must be under 30 characters";
    }

    // Validate Tags (optional, but if provided, check format)
    if (groupFormData.tags) {
      const tags = groupFormData.tags.split(",").map((tag) => tag.trim());
      if (tags.some((tag) => tag.length > 20)) {
        errors.tags = "Each tag must be under 20 characters";
      }
    }

    // If there are errors, set them and return
    if (Object.keys(errors).length > 0) {
      console.log("Validation Errors:", errors); // Debug log
      setGroupFormErrors(errors);
      return;
    }

    // Clear any previous errors
    setGroupFormErrors({});

    const formData = new FormData();
    formData.append("name", groupFormData.name);
    formData.append("description", groupFormData.description || "");
    if (groupFormData.tags) {
      groupFormData.tags.split(",").forEach((tag) => {
        formData.append("tags[]", tag.trim());
      });
    }
    try {
      await dispatch(
        addGroup({
          token,
          groupData: formData,
        })
      ).unwrap();
      dispatch(fetchGroups(token));
      toast.success(`Group "${groupFormData.name}" created successfully`);
      setIsCreateDialogOpen(false);
      setGroupFormData({ name: "", description: "", tags: "" });
    } catch (err) {
      toast.error(err.message || "Failed to create group");
    }
  };

  const resetForm = () => {
    setFormErrors({});
    setFormData({
      name: "",
      phone: "",
      email: "",
      tags: [],
      status: "Active",
      group: "",
    });
    setDropdownOpen(false);
    setSelectedGroups([]);
    setIsAddDialogOpen(false);
    setEditingContact(null);
  };

  const handleEdit = (contact) => {
    setFormErrors({});
    setEditingContact(contact);
    const groupIds = contact.groups?.map((group) => group.id) || [];
    setFormData({
      name: contact.name,
      phone: contact.phone,
      status: contact.status,
      group: contact.group || "",
    });
    setSelectedGroups(groupIds);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(removeContact({ token, id })).unwrap();
      setSearchTerm("");
      dispatch(fetchContacts({ token, page: currentPage, limit, search: "" }));
      toast.success("Contact deleted successfully");
    } catch (err) {
      toast.error(err.message || "Failed to delete contact");
    }
  };

  const handleSelectContact = (id, checked) => {
    setSelectedContacts((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = filteredContacts.map((contact) => contact.id);
      setSelectedContacts(allIds);
    } else {
      setSelectedContacts([]);
    }
  };

  const handleBulkAddToGroup = () => {
    if (!selectedGroup || selectedContacts.length === 0) {
      setGroupSelectError("Please select a group");
      return;
    }

    setGroupSelectError(""); // clear error if valid

    const formData = new FormData();
    formData.append("groupId", selectedGroup);
    selectedContacts.forEach((id) => {
      formData.append("contactIds[]", id);
    });
    dispatch(addContactToGroup({ token, contactsGroup: formData }))
      .unwrap()
      .then(() => {
        toast.success("Contacts added to group successfully");
        dispatch(fetchContacts({ token, page: currentPage, limit, search: searchTerm }));
        setSelectedContacts([]);
        setSelectedGroup("");
        setIsGroupDialogOpen(false);
      })
      .catch((err) => {
        toast.error(err.message || "Failed to add contacts to group");
      });
  };

  const exportContacts = () => {
    if (!contacts || contacts.length === 0) {
      toast.error("No contacts available to export");
      return;
    }

    const csv = [
      "name,phone,groups",
      ...contacts.map((c) => {
        const groups = Array.isArray(c.groups)
          ? c.groups.map((g) => g.name).join(",") // <-- comma separated
          : "";

        return `"${c.name || ""}","${c.phone || ""}","${groups}"`;
      }),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts.csv";
    a.click();

    window.URL.revokeObjectURL(url);

    toast.success("Contacts exported successfully");
  };

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags)));

  const columns = [
    {
      key: "select",
      label: (
        <Checkbox
          checked={filteredContacts.length > 0 && selectedContacts.length === filteredContacts.length}
          onCheckedChange={handleSelectAll}
        />
      ),
      sortable: false,
      minWidth: "50px",
      render: (value, item) => (
        <Checkbox
          checked={selectedContacts.includes(item.id)}
          onCheckedChange={(checked) => handleSelectContact(item.id, !!checked)}
        />
      ),
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      minWidth: "150px",
      render: (value, row) =>
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
      key: "phone",
      label: "Phone",
      sortable: true,
      minWidth: "150px",
      render: (value, item) => (
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: "group",
      label: "Group",
      sortable: false,
      minWidth: "150px",
      render: (_value, item) => {
        const groups = item.groups || [];
        const visibleGroups = groups.slice(0, 3); // sirf pehle 3
        const remaining = groups.length - visibleGroups.length;

        return groups.length > 0 ? (
          <div className="flex items-center space-x-2 flex-wrap">
            {visibleGroups.map((group) => (
              <div key={group.id} className="flex items-center space-x-1 mr-2">
                <Folder className="w-4 h-4 text-muted-foreground" />
                <span>{group.name}</span>
              </div>
            ))}

            {remaining > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-xs text-blue-600 hover:underline">
                    +{remaining} more
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-3 w-56">
                  <div className="space-y-2">
                    {groups.slice(3).map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center space-x-2"
                      >
                        <Folder className="w-4 h-4 text-muted-foreground" />
                        <span>{group.name}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">No Group</span>
        );
      },
    },

    // {
    //   key: "email",
    //   label: "Email",
    //   sortable: true,
    //   minWidth: "200px",
    //   render: (value) => value || "---",
    // },

    // {
    //   key: "tags",
    //   label: "Tags",
    //   sortable: false,
    //   minWidth: "150px",
    //   render: (value) =>
    //     value && value.length > 0 ? (
    //       <div className="flex flex-wrap gap-1">
    //         {value
    //           ?.filter((tag) => tag != null && tag !== "")
    //           .map((tag, index) => (
    //             <Badge
    //               key={index}
    //               variant="secondary"
    //               className="text-xs capitalize"
    //             >
    //               {tag}
    //             </Badge>
    //           ))}
    //       </div>
    //     ) : (
    //       <span className="text-muted-foreground text-xs">No tags</span>
    //     ),
    // },
  ];

  const onRowAction = (item) => (
    <div className="flex justify-end gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-10 px-4 bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-900"
        onClick={() => handleEdit(item)}
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
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {item.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(item.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (loading && (!list || list.length === 0)) return <BaseLoading message="Loading..." />;

  return (
    <div className="container max-w-7xl mx-auto px-0 sm:px-6 lg:px-4">
      {/* Header */}
      <div className="flex flex-col justify-between sm:flex-row lg:justify-between sm:items-center gap-2 sm:gap-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Contacts
          </h1>
          <p className="text-muted-foreground mt-0 sm:mt-2">
            Manage your WhatsApp contact list
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-row gap-2 sm:contents">
            <Button variant="outline" className="flex-1" onClick={exportContacts}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" /> Import
            </Button>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            else setIsAddDialogOpen(true);
          }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto no-scrollbar">
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? "Edit Contact" : "Add New Contact"}
                </DialogTitle>
                <DialogDescription>
                  {editingContact
                    ? "Update contact information"
                    : "Add a new contact to your WhatsApp list"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter contact name"
                  />
                  {formErrors.name && (
                    <p className="text-red-600 text-sm">{formErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
                  />
                  <p className="text-gray-500 text-sm">
                    Accept formats:{" "}
                    <code className="font-bold text-red">+919999988765</code> or{" "}
                    <code className="font-bold text-red">919999988765</code>
                  </p>
                  {formErrors.phone && (
                    <p className="text-red-600 text-sm">{formErrors.phone}</p>
                  )}
                </div>
                <div className="space-y-2 relative" ref={dropdownRef}>
                  <label className="text-sm font-medium">
                    Select Groups (optional)
                  </label>

                  {/* Dropdown trigger */}
                  {dropdownOpen && (
                    <div
                      className="absolute w-full -top-56 max-h-60 overflow-y-auto border border-input bg-white rounded-md mt-1 shadow-lg"
                      style={{ zIndex: 9999 }}
                    >
                      {availableGroups.length > 0 ? (
                        availableGroups.map((group) => (
                          <div
                            key={group.id}
                            className={`px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-gray-100 ${selectedGroups.includes(group.id)
                              ? "text-blue-500 font-medium"
                              : ""
                              }`}
                            onClick={() => {
                              if (selectedGroups.includes(group.id)) {
                                setSelectedGroups(
                                  selectedGroups.filter((id) => id !== group.id)
                                );
                                setDropdownOpen(false);
                              } else {
                                setSelectedGroups([...selectedGroups, group.id]);
                                setDropdownOpen(false);
                              }
                            }}
                          >
                            <span className="text-sm">{group.name}</span>
                            {selectedGroups.includes(group.id) && (
                              <CheckCircle className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-2">
                          <span>No groups found.</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => {
                              setDropdownOpen(false);
                              setIsCreateDialogOpen(true);
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add Group
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    className="border border-input bg-white rounded-md p-2 w-full cursor-pointer min-h-[2.5rem] flex items-center flex-wrap gap-1"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    {selectedGroups.length > 0 ? (
                      selectedGroups.map((groupId) => {
                        const group = availableGroups.find(
                          (g) => g.id === groupId
                        );
                        return (
                          <div
                            key={groupId}
                            className="flex items-center gap-1 bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm"
                          >
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                            <span>{group?.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGroups(
                                  selectedGroups.filter((id) => id !== groupId)
                                );
                              }}
                              className="text-red-500 hover:text-red-700 font-sm ml-1"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        -- Select Groups --
                      </span>
                    )}
                  </div>

                  {/* Dropdown list */}
                </div>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-primary">
                    {editingContact ? "Update" : "Add"} Contact
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <ImportContactsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={(result) => {
          // result is likely the API response object
          const importedContacts = result.data?.contacts || []; // make sure it's an array
          if (Array.isArray(importedContacts) && importedContacts.length > 0) {
            setContacts((prev) => [...prev, ...importedContacts]);
          } else {
            console.log("No new contacts imported", result.data?.errors);
          }
        }}
        availableGroups={availableGroups}
      />

      {/* Stats */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"> */}
      {/* <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Contacts
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {contacts.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card> */}
      {/* <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  With Email
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {contacts.filter((c) => c.email).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tagged
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    contacts.filter(
                      (c) =>
                        Array.isArray(c.tags) &&
                        c.tags.some((tag) => tag && tag.trim() !== "")
                    ).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Tag className="w-8 h-8 text-success" />
              </div>
            </div>
          </CardContent>
        </Card> */}
      {/* </div> */}

      {/* Search & Filter */}
      {/* <Card className="card-elegant mb-6"> */}
      {/* <CardContent className="p-4 md:p-6"> */}
      {/* <div className="flex-1 flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0"> */}
      {/* <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts by name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div> */}
      {/* <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select> */}
      {/* <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags
                  .filter((tag) => tag?.trim())
                  .map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select> */}
      {/* </div> */}
      {/* </CardContent> */}
      {/* </Card> */}

      {/* Contacts Table */}
      <Card className="card-elegant">
        <CardHeader className="flex flex-col gap-3 p-3 pb-2">
          <div className="flex flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <CardTitle>Contact List</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage your WhatsApp contacts</CardDescription>
            </div>
            <Button className="bg-gradient-primary hover:shadow-glow h-9 px-3 sm:px-4 flex-shrink-0" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-sm">Add Contact</span>
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts by name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 w-full sm:w-auto">
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {availableGroups
                    .filter((g) => g?.name?.trim())
                    .map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                {selectedContacts.length === 0 && (
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto bg-gradient-primary hover:shadow-glow px-2 sm:px-4">
                      <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="truncate">Create Group</span>
                    </Button>
                  </DialogTrigger>
                )}
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                    <DialogDescription>
                      Create a new contact group
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleGroupSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupName">Group Name *</Label>
                      <Input
                        id="groupName"
                        value={groupFormData.name}
                        onChange={(e) =>
                          setGroupFormData({
                            ...groupFormData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Enter group name"
                      />
                      {groupFormErrors.name && (
                        <p className="text-red-600 text-sm">
                          {groupFormErrors.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groupDescription">Description</Label>
                      <Textarea
                        id="groupDescription"
                        value={groupFormData.description}
                        onChange={(e) => {
                          setGroupFormData({
                            ...groupFormData,
                            description: e.target.value,
                          });

                          // Optional: live validation
                          if (e.target.value.length > 150) {
                            setGroupFormErrors((prev) => ({
                              ...prev,
                              description:
                                "Description must be under 150 characters",
                            }));
                          } else {
                            setGroupFormErrors((prev) => {
                              const { description, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        placeholder="Describe the purpose of this group"
                        rows={3}
                      />

                      {groupFormErrors.description && (
                        <p className="text-red-600 text-sm">
                          {groupFormErrors.description}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-gradient-primary">
                        Create Group
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Add to Group Dialog moved inside the grid */}
              <Dialog
                open={isGroupDialogOpen}
                onOpenChange={setIsGroupDialogOpen}
              >
                {selectedContacts.length > 0 && (
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto bg-primary/5 border-primary/20 hover:bg-primary/10 px-2 sm:px-4">
                      <UserPlus className="w-4 h-4 mr-1 sm:mr-2 text-primary" />
                      <span className="truncate">Add to Group ({selectedContacts.length})</span>
                    </Button>
                  </DialogTrigger>
                )}
                <DialogContent className="">
                  <DialogHeader>
                    <DialogTitle>Add to Group</DialogTitle>
                    <DialogDescription>
                      Add {selectedContacts.length} selected contacts to a
                      group
                    </DialogDescription>
                  </DialogHeader>
                  {availableGroups.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select Group</Label>
                        <Select
                          value={selectedGroup}
                          onValueChange={setSelectedGroup}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a group" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border border-border shadow-md rounded-md z-[200]">
                            {availableGroups
                              .filter((g) => g?.name?.trim())
                              .map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {groupSelectError && (
                          <p className="text-red-600 text-sm mt-1">
                            {groupSelectError}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          className="text-sm text-primary bg-primary/10 hover:bg-primary/20 flex items-center border-primary gap-1 px-3 py-2.5 rounded-md transition-colors"
                          onClick={() => {
                            setIsGroupDialogOpen(false);
                            setIsCreateDialogOpen(true);
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Create New Group
                        </button>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            className="text-sm text-gray-700 bg-gray-200 hover:bg-gray-300 flex items-center gap-1 px-3 py-2.5 rounded-md transition-colors border border-gray-300"
                            onClick={() => setIsGroupDialogOpen(false)}
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="text-sm text-white bg-primary hover:bg-primary/90 flex items-center gap-1 px-3 py-2.5 rounded-md transition-colors"
                            onClick={handleBulkAddToGroup}
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Add to Group
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">No groups available. Create one first.</p>
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => setIsGroupDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="bg-gradient-primary"
                          onClick={() => {
                            setIsGroupDialogOpen(false);
                            setIsCreateDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Group
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {/* Delete button remains outside the grid */}
            {selectedContacts.length > 0 && (
              <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={selectedContacts.length === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ({selectedContacts.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Contacts</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete {selectedContacts.length}{" "}
                      selected contact(s)?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDeleteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleBulkDeleteContacts}
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-2 pt-0 relative">
          {loading && list && list.length > 0 && (
            <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-b-xl">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <SortableTable
            data={filteredContacts}
            columns={columns}
            itemsPerPage={limit}
            onRowAction={onRowAction}
            hidePagination={true}
          />

          {pagination && pagination.last_page > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Rows per page:</span>
                  <select
                    className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setCurrentPage(1); // Reset to first page when limit changes
                    }}
                  >
                    {[15, 30, 50, 100, 200].map(pageSize => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                  </select>
                </div>
                <span>
                  Showing {pagination.from || 1}–{pagination.to || pagination.total} of {pagination.total} contacts
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="text-sm font-medium mx-2">
                  Page {currentPage} of {pagination.last_page}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
                  disabled={currentPage === pagination.last_page}
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
