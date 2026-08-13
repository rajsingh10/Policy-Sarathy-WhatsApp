import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  ArrowLeft,
  Search,
  UserMinus,
  Phone,
  Mail,
  Users,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import SortableTable from "../components/ui/sortable-table";
import { useDispatch, useSelector } from "react-redux";
import { fetchGroupById } from "../features/groups/groupSlice";
import { BaseLoading } from "../components/BaseLoading";
import { removeContactFromGroup } from "../features/contacts/contactSlice";
interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  tags: string[];
  status: "Active" | "Inactive";
}

export const GroupDetails: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedGroup, loading } = useSelector((state: any) => state.groups);
  const groupName = selectedGroup?.name || "Group Details";

  const token = localStorage.getItem("token");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      dispatch(fetchGroupById({ token, id }));
    }
  }, [id, token, dispatch]);

  // ✅ Map backend members into table-ready shape
  const members: Contact[] =
    selectedGroup?.members?.map((m: any) => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      email: m.email || "",
      tags: m.tags || [],
      status:
        (m.status || "active").toLowerCase() === "active"
          ? "Active"
          : "Inactive",
    })) || [];

  // ✅ Filter logic
  const filteredContacts = !searchTerm
    ? members
    : members.filter((contact) => {
        const term = searchTerm.toLowerCase();
        return (
          contact.name?.toLowerCase().includes(term) ||
          contact.phone?.toLowerCase().includes(term) ||
          contact.email?.toLowerCase().includes(term)
        );
      });

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map((c) => c.id));
    }
  };

  const handleRemoveFromGroup = async () => {
    if (selectedContacts.length === 0) {
      toast.error("Please select contacts to remove");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const formData = new FormData();
      if (selectedContacts.length > 1) {
        formData.append("groupId", id!);
        selectedContacts.forEach((contactId) => {
          formData.append("contactIds[]", contactId);
        });
      } else {
        formData.append("groupId", id!);
        formData.append("contactIds[]", selectedContacts[0]);
      }

      const response = await dispatch(
        removeContactFromGroup({ token, formData })
      ).unwrap();

      console.log("API Response:", response);
      toast.success("Contact(s) removed from group successfully");

      // Optionally refresh group data after removal
      dispatch(fetchGroupById({ token, id }));
      setSelectedContacts([]);
    } catch (err: any) {
      console.error("API Error:", err);
      toast.error(err?.message || "Failed to remove contact(s) from group");
    }
  };

  const exportGroupContacts = () => {
    const csv = [
      "name,phone",
      ...members.map((c) => `${c.name},${c.phone}`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${groupName.toLowerCase().replace(/\s+/g, "-")}-contacts.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Group contacts exported successfully");
  };

  const columns = [
    {
      key: "select",
      label: (
        <Checkbox
          checked={
            selectedContacts.length === filteredContacts.length &&
            filteredContacts.length > 0
          }
          onCheckedChange={handleSelectAll}
        />
      ),
      sortable: false,
      minWidth: "50px",
      render: (value: any, item: Contact) => (
        <Checkbox
          checked={selectedContacts.includes(item.id)}
          onCheckedChange={() => handleSelectContact(item.id)}
        />
      ),
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      minWidth: "150px",
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: "phone",
      label: "Phone",
      sortable: true,
      minWidth: "120px",
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span>{value}</span>
        </div>
      ),
    },
    // {
    //   key: "email",
    //   label: "Email",
    //   sortable: true,
    //   minWidth: "150px",
    //   render: (value: string) => <span>{value || "-"}</span>,
    // },
    // {
    //   key: "tags",
    //   label: "Tags",
    //   sortable: false,
    //   minWidth: "150px",
    //   render: (value: string[]) => (
    //     <div className="flex flex-wrap gap-1">
    //       {value.map((tag, index) => (
    //         <Badge key={index} variant="secondary" className="text-xs">
    //           {tag}
    //         </Badge>
    //       ))}
    //     </div>
    //   ),
    // },
    {
      key: "status",
      label: "Status",
      sortable: true,
      minWidth: "100px",
      render: (value: string) => (
        <Badge
          variant={value === "Active" ? "default" : "secondary"}
          className={
            value === "Active"
              ? "bg-success/20 text-success"
              : "bg-muted text-muted-foreground"
          }
        >
          {value}
        </Badge>
      ),
    },
  ];

  if (loading) return <BaseLoading message="Loading..." />;

  return (
    <div className="container max-w-7xl mx-auto px-0 sm:px-6 lg:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/groups")}
            className="w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Groups
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {groupName
                ? groupName
                    .split(" ")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                    )
                    .join(" ")
                : ""}
            </h1>
            <p className="text-muted-foreground mt-1 sm:mt-2">
              {selectedGroup?.members?.length || 0} members in this group
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {selectedContacts.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-destructive w-full sm:w-auto"
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Remove ({selectedContacts.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove from Group</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove {selectedContacts.length}{" "}
                    contact(s) from "{groupName}"? This will not delete the
                    contacts from your system.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemoveFromGroup}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Remove from Group
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            variant="outline"
            onClick={exportGroupContacts}
            className="w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {members.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Members
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {members.filter((c) => c.status === "Active").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  With Email
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    members.filter((c) => c.status?.toLowerCase() === "active")
                      .length
                  }
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-info" />
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>

      {/* Members Table */}
      <Card className="card-elegant">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Group Members</CardTitle>
            <CardDescription>Contacts in this group</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search group members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </CardHeader>
        <CardContent>
          <SortableTable
            data={filteredContacts}
            columns={columns}
            itemsPerPage={10}
          />
        </CardContent>
      </Card>
    </div>
  );
};
