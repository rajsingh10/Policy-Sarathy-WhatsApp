import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Tag,
  MessageSquare,
  Edit,
  Save,
  X,
  Send,
  User,
  Clock,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

// Mock data
const mockContact = {
  id: "1",
  name: "John Doe",
  phone: "+1234567890",
  email: "john@example.com",
  tags: ["VIP", "Customer", "Premium"],
  createdAt: "2024-01-10",
  lastMessageSent: "2024-01-14",
  totalMessagesSent: 12,
  status: "active",
  notes: "Premium customer, prefers WhatsApp communication for order updates.",
};

const mockMessageHistory = [
  {
    id: "1",
    template: "Holiday Promotion",
    sentAt: "2024-01-14T10:30:00Z",
    status: "read",
  },
  {
    id: "2",
    template: "Order Confirmation",
    sentAt: "2024-01-12T14:20:00Z",
    status: "delivered",
  },
  {
    id: "3",
    template: "Welcome Message",
    sentAt: "2024-01-10T16:15:00Z",
    status: "read",
  },
];

const ContactDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(mockContact);
  const [messageHistory] = useState(mockMessageHistory);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    tags: contact.tags.join(", "),
    notes: contact.notes || "",
  });

  const handleSave = () => {
    const updatedContact = {
      ...contact,
      name: editForm.name,
      phone: editForm.phone,
      email: editForm.email,
      tags: editForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      notes: editForm.notes,
    };

    setContact(updatedContact);
    setIsEditing(false);
    toast.success("Contact updated successfully");
  };

  const handleCancel = () => {
    setEditForm({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      tags: contact.tags.join(", "),
      notes: contact.notes || "",
    });
    setIsEditing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-success bg-success/20";
      case "inactive":
        return "text-warning bg-warning/20";
      case "blocked":
        return "text-destructive bg-destructive/20";
      default:
        return "text-muted-foreground bg-muted/20";
    }
  };

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case "read":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-info" />;
      case "sent":
        return <Clock className="w-4 h-4 text-warning" />;
      case "failed":
        return <X className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container max-w-6xl mx-auto px-0 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate("/contacts")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contacts
          </Button>
        </div>
        <div className="flex items-center space-x-3">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Contact
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          )}
          <Button className="bg-gradient-primary">
            <Send className="w-4 h-4 mr-2" />
            Send Message
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={editForm.tags}
                      onChange={(e) =>
                        setEditForm({ ...editForm, tags: e.target.value })
                      }
                      placeholder="VIP, Customer, Premium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={editForm.notes}
                      onChange={(e) =>
                        setEditForm({ ...editForm, notes: e.target.value })
                      }
                      rows={3}
                      placeholder="Add notes about this contact..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">
                      {contact.name}
                    </h2>
                    <Badge
                      className={`${getStatusColor(contact.status)} capitalize`}
                    >
                      {contact.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{contact.phone}</span>
                    </div>

                    {contact.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{contact.email}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Joined {formatDate(contact.createdAt)}</span>
                    </div>

                    {contact.tags.length > 0 && (
                      <div className="flex items-start space-x-3">
                        <Tag className="w-4 h-4 text-muted-foreground mt-1" />
                        <div className="flex flex-wrap gap-2">
                          {contact.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {contact.notes && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-foreground mb-2">
                        Notes
                      </h4>
                      <p className="text-muted-foreground">{contact.notes}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Message History */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Message History</span>
              </CardTitle>
              <CardDescription>
                Recent messages sent to this contact
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messageHistory.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No messages sent
                  </h3>
                  <p className="text-muted-foreground">
                    Start a conversation by sending a message
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messageHistory.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getMessageStatusIcon(message.status)}
                        <div>
                          <p className="font-medium text-foreground">
                            {message.template}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(message.sentAt)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`capitalize ${getStatusColor(
                          message.status
                        )}`}
                      >
                        {message.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {contact.totalMessagesSent}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total Messages Sent
                </p>
              </div>

              {contact.lastMessageSent && (
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-sm font-medium text-foreground">
                    Last Message
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(contact.lastMessageSent)}
                  </p>
                </div>
              )}

              <div className="text-center p-4 border rounded-lg">
                <div className="text-sm font-medium text-success">Active</div>
                <p className="text-xs text-muted-foreground">Contact Status</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                <Send className="w-4 h-4 mr-2" />
                Send Template
              </Button>
              <Button className="w-full" variant="outline">
                <Tag className="w-4 h-4 mr-2" />
                Manage Tags
              </Button>
              <Button className="w-full" variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                View All Messages
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactDetails;
