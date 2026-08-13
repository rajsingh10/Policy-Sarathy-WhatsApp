import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users as UsersIcon,
  UserCheck,
  UserX,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  addUser,
  deleteUser,
  toggleUserStatus,
  updateUser,
} from "../features/users/userSlice";
import SortableTable from "../components/ui/sortable-table";
import { BaseLoading } from "../components/BaseLoading";
import { useNavigate } from "react-router-dom";

const Users = () => {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const { data: users, loading, error } = useSelector((state) => state.users);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) dispatch(fetchUsers(token));
  }, [dispatch, token]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    number: "",
    bio: "",
    role: "user",
  });

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase()?.includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      number: "",
      bio: "",
      password: "",
      role: "User",
    });
    setEditingUser(null);
  };
  const validateForm = () => {
    const errors={};
  
    if (!formData.name?.trim()) errors.name = "Full Name is required";
  
    if (!formData.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
  
    // Only validate password if it exists (for edit, password can be optional)
   
      if (!formData.password?.trim()) {
        errors.password = "Password is required";
      } 
    
  
    if (!formData.number?.trim()) {
      errors.number = "Phone number is required";
    } else if (!/^\+?\d{10,15}$/.test(formData.number)) {
      errors.number = "Phone number is invalid";
    }
  
    // Optional bio validation
    // if (!formData.bio?.trim()) errors.bio = "Bio is required";
  
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  

  const handleAddUser = async () => {
    if (!validateForm()) return;
    try {
      const formDataObject = new FormData();
      formDataObject.append("name", formData.name);
      formDataObject.append("email", formData.email);
      formDataObject.append("number", formData.number);
      formDataObject.append("password", formData.password);
      formDataObject.append("bio", formData.bio);
      formDataObject.append("role", "user");
  
      await dispatch(addUser({ token, userData: formDataObject })).unwrap();
  
      toast({
        title: "User Added",
        description: "New user has been successfully added.",
      });
  
      setIsAddDialogOpen(false);
      resetForm();
      dispatch(fetchUsers(token));
    } catch (err) {
      if (err.errors) {
        const messages = Object.values(err.errors).flat().join(", ");
        setFormErrors(err.errors);
        // toast({
        //   title: "Validation Error",
        //   description: messages,
        //   variant: "destructive",
        // });
      } else {
        toast({
          title: "Error",
          description: err.message || "Failed to add user.",
          variant: "destructive",
        });
      }
    }
  };
  

  const handleEditUser = async () => {
    if (!validateForm() || !editingUser) return;
    try {
      const formDataObject = new FormData();
      formDataObject.append("name", formData.name);
      formDataObject.append("email", formData.email);
      formDataObject.append("number", formData.number);
      formDataObject.append("role", formData.role);
      formDataObject.append("password", formData?.password);
      formDataObject.append("bio", formData.bio);
      

      await dispatch(
        updateUser({
          token,
          userId: editingUser.id,
          userData: formDataObject,
        })
      ).unwrap();

      toast({
        title: "User Updated",
        description: "User information has been successfully updated.",
      });

      setIsEditDialogOpen(false);
      resetForm();
      dispatch(fetchUsers(token));
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to update user.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await dispatch(deleteUser({ token, userId })).unwrap();
      toast({
        title: "User Deleted",
        description: "User has been successfully deleted.",
        variant: "destructive",
      });
      dispatch(fetchUsers(token));
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const handleChangeStatus = async (userId, newStatus) => {
    try {
      const formData = new FormData();
      formData.append("status", newStatus);

      await dispatch(
        toggleUserStatus({ token, userId, status: formData })
      ).unwrap();

      toast({
        title: "Status Updated",
        description: `User status changed to ${newStatus}.`,
      });

      dispatch(fetchUsers(token));
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      number: user.number,
      bio: user.bio,
      password: user.password || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDetailsDialog = (user) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };

  const columns = [
    {
      key: "avatar",
      label: "Image",
      render: (_, user) => (
        <img
          src={user?.profileImage || "/default-avatar.png"}
          alt={user?.name || "User"}
          className="w-16 h-16 rounded-full object-cover"
        />
      ),
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (value) =>
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
    { key: "email", label: "Email", sortable: true },
    {
      key: "number",
      label: "Phone",
      sortable: true,
      type: "badge",
      className: "uppercase",
      getBadgeColor: () => "bg-gray-200 text-gray-800", // simple gray badge
      render: (value) => value || "N/A", // show full number or fallback
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (_, user) => (
        <select
          value={user.status}
          onChange={(e) => handleChangeStatus(user.id, e.target.value)}
          className={`px-2 py-1 rounded-md text-sm capitalize ${
            user.status === "active"
              ? "bg-green-100 text-green-800"
              : user.status === "inactive"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {["active", "inactive", "pending"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
    { key: "created_at", label: "Created", type: "date", sortable: true },
  ];

  const onRowAction = (user) => (
    <div className="flex items-center justify-end space-x-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-3 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-900"
        onClick={() => navigate(`/users/${user.id}`)}
      >
        View
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-9 px-3 bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-900"
        onClick={() => openEditDialog(user)}
      >
        Edit
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 px-3 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800"
          >
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    pending: users.filter((u) => u.status === "pending").length,
  };

  if (loading) return <BaseLoading message="Loading..." />;

  return (
    <div className="space-y-6 px-4">
      {/* Header */}
      <div className="flex flex-col justify-between sm:flex-row lg:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* 👆 makes dialog scrollable */}
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with the specified details.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Full Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter full name"
                />
                {formErrors.name && (
                  <p className="text-red-600 text-sm">{formErrors.name}</p>
                )}
              </div>

              {/* Email + Phone in same row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email address"
                  />
                  {formErrors.email && (
                    <p className="text-red-600 text-sm">{formErrors.email}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="number">Phone</Label>
                  <Input
                    id="number"
                    type="tel"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({ ...formData, number: e.target.value })
                    }
                    placeholder="Enter phone number"
                  />
                  {formErrors.number && (
                    <p className="text-red-600 text-sm">{formErrors.number}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-red-600 text-sm">{formErrors.password}</p>
                )}
              </div>
              {/* Bio */}
              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  rows="3"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Write a short bio"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                {formErrors.bio && (
                  <p className="text-red-600 text-sm">{formErrors.bio}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddUser}>Add User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-elegant">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Users
              </p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <UsersIcon className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Users
              </p>
              <p className="text-2xl font-bold text-green-600">
                {stats.active}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Inactive Users
              </p>
              <p className="text-2xl font-bold text-red-600">
                {stats.inactive}
              </p>
            </div>
            <UserX className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending Users
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="card-elegant">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle>Users</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SortableTable
            data={filteredUsers}
            columns={columns}
            itemsPerPage={10}
            onRowAction={onRowAction}
          />
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Full Name */}
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter full name"
              />
              {formErrors?.name && (
                <p className="text-red-600 text-sm">{formErrors.name}</p>
              )}
            </div>

            {/* Email & Phone in one row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email address"
                />
                {formErrors?.email && (
                  <p className="text-red-600 text-sm">{formErrors.email}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-number">Phone</Label>
                <Input
                  id="edit-number"
                  type="tel"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  placeholder="Enter phone number"
                />
                {formErrors?.number && (
                  <p className="text-red-600 text-sm">{formErrors.number}</p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">Password</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {formErrors?.password && (
                <p className="text-red-600 text-sm">{formErrors.password}</p>
              )}
            </div>
            {/* Bio */}
            <div className="grid gap-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <textarea
                id="edit-bio"
                rows="3"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Write a short bio"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              {formErrors?.bio && (
                <p className="text-red-600 text-sm">{formErrors.bio}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditUser}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View complete information of the user.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="flex justify-center">
                <img
                  src={selectedUser.profileImage || "/default-avatar.png"}
                  alt={selectedUser.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              </div>
              <div className="grid gap-2">
                <p>
                  <strong>Name:</strong> {selectedUser.name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedUser.email}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedUser.number}
                </p>
                <p>
                  <strong>Bio:</strong> {selectedUser.bio || "N/A"}
                </p>
                <p>
                  <strong>Role:</strong> {selectedUser.role}
                </p>
                <p>
                  <strong>Status:</strong> {selectedUser.status}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(selectedUser.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
