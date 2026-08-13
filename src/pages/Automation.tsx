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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import {
    CheckCircle,
    XCircle,
    Clock,
    Play,
    Pause,
    Plus,
    Edit,
    Trash2,
    Activity,
    Zap,
    MessageSquare,
    Send,
    TrendingUp,
    Users,
    Filter,
    Download,
} from "lucide-react";
import { toast } from "sonner";
import { EditAutomationModal } from '../components/EditAutomationModal';
// Mock Data
const initialAutomationRules = [
    {
        id: 1,
        name: "Welcome New Customers",
        description: "Send welcome message to new contacts",
        trigger: "Contact Added",
        status: "active",
        template: "Welcome Message",
        messagesSent: 2458,
        successRate: 98.5,
        lastTriggered: "5 minutes ago",
        createdAt: "2024-01-15",
    },
    {
        id: 2,
        name: "Order Confirmation",
        description: "Automatic order confirmation messages",
        trigger: "Order Placed",
        status: "active",
        template: "Order Confirmation",
        messagesSent: 5234,
        successRate: 99.2,
        lastTriggered: "2 minutes ago",
        createdAt: "2024-01-10",
    },
    {
        id: 3,
        name: "Follow-up Reminder",
        description: "Send follow-up after 24 hours",
        trigger: "Time-based",
        status: "paused",
        template: "Follow-up Message",
        messagesSent: 1567,
        successRate: 95.8,
        lastTriggered: "1 hour ago",
        createdAt: "2024-01-05",
    },
    {
        id: 4,
        name: "Birthday Wishes",
        description: "Send birthday greetings automatically",
        trigger: "Date-based",
        status: "active",
        template: "Birthday Template",
        messagesSent: 892,
        successRate: 97.3,
        lastTriggered: "30 minutes ago",
        createdAt: "2024-01-01",
    },
    {
        id: 5,
        name: "Abandoned Cart Recovery",
        description: "Recover abandoned shopping carts",
        trigger: "Cart Abandoned",
        status: "active",
        template: "Cart Recovery",
        messagesSent: 1234,
        successRate: 89.5,
        lastTriggered: "10 minutes ago",
        createdAt: "2023-12-28",
    },
];

const messageDetails = [
    {
        id: 1,
        automationRule: "Welcome New Customers",
        recipient: "+1 234 567 8901",
        recipientName: "John Doe",
        message: "Welcome to our service! We are excited to have you.",
        status: "delivered",
        greenTick: true,
        sentAt: "2024-01-20 10:30:45",
    },
    {
        id: 2,
        automationRule: "Order Confirmation",
        recipient: "+1 234 567 8902",
        recipientName: "Jane Smith",
        message: "Your order #12345 has been confirmed and is being processed.",
        status: "read",
        greenTick: true,
        sentAt: "2024-01-20 10:28:30",
    },
    {
        id: 3,
        automationRule: "Birthday Wishes",
        recipient: "+1 234 567 8903",
        recipientName: "Mike Johnson",
        message: "Happy Birthday! Wishing you a wonderful day filled with joy.",
        status: "delivered",
        greenTick: true,
        sentAt: "2024-01-20 10:25:15",
    },
    {
        id: 4,
        automationRule: "Abandoned Cart Recovery",
        recipient: "+1 234 567 8904",
        recipientName: "Sarah Williams",
        message: "You left items in your cart! Complete your purchase now with 10% off.",
        status: "failed",
        greenTick: false,
        sentAt: "2024-01-20 10:20:00",
    },
    {
        id: 5,
        automationRule: "Order Confirmation",
        recipient: "+1 234 567 8905",
        recipientName: "David Brown",
        message: "Your order #12346 has been confirmed. Expected delivery: Jan 25.",
        status: "pending",
        greenTick: true,
        sentAt: "2024-01-20 10:35:00",
    },
];

export const Automation = () => {
    const [automationRules, setAutomationRules] = useState(initialAutomationRules);
    const [messages, setMessages] = useState(messageDetails);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedAutomation, setSelectedAutomation] = useState();
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        trigger: "",
        template: "",
        conditions: "",
        delay: "",
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "delivered":
                return (
                    <Badge className="bg-green-100 text-green-800 gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Delivered
                    </Badge>
                );
            case "read":
                return (
                    <Badge className="bg-blue-100 text-blue-800 gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <CheckCircle className="w-3 h-3 -ml-2" />
                        Read
                    </Badge>
                );
            case "failed":
                return (
                    <Badge className="bg-red-100 text-red-800 gap-1">
                        <XCircle className="w-3 h-3" />
                        Failed
                    </Badge>
                );
            case "pending":
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 gap-1">
                        <Clock className="w-3 h-3" />
                        Pending
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const toggleRuleStatus = (id: number) => {
        setAutomationRules((rules) =>
            rules.map((rule) =>
                rule.id === id
                    ? { ...rule, status: rule.status === "active" ? "paused" : "active" }
                    : rule
            )
        );
        toast.success("Automation rule status updated");
    };
    const handleEditAutomation = (automation) => {
        setSelectedAutomation(automation);
        setEditModalOpen(true);
    };

    const handleSaveAutomation = (updatedAutomation) => {
        setAutomationRules(prev =>
            prev.map(auto =>
                auto.id === updatedAutomation.id ? updatedAutomation : auto
            )
        );
    };

    const deleteRule = (id: number) => {
        setAutomationRules((rules) => rules.filter((rule) => rule.id !== id));
        toast.success("Automation rule deleted");
    };

    const handleCreateRule = (e: React.FormEvent) => {
        e.preventDefault();
        const newRule = {
            id: automationRules.length + 1,
            name: formData.name,
            description: formData.description,
            trigger: formData.trigger,
            template: formData.template,
            conditions: formData.conditions,
            delay: formData.delay,
            status: "active",
            messagesSent: 0,
            successRate: 0,
            lastTriggered: "Never",
            createdAt: new Date().toISOString().split("T")[0],
        };
        setAutomationRules([...automationRules, newRule]);
        setIsCreateDialogOpen(false);
        setFormData({
            name: "",
            description: "",
            trigger: "",
            template: "",
            conditions: "",
            delay: "",
        });
        toast.success("Automation rule created successfully");
    };

    const filteredMessages = messages.filter((msg) => {
        const matchesSearch =
            msg.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.recipient.includes(searchTerm) ||
            msg.automationRule.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.message.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === "all" || msg.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="container max-w-7xl mx-auto px-0 sm:px-6 lg:px-4 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        WhatsApp Automation
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Automate your WhatsApp messaging with smart rules and triggers
                    </p>
                </div>
                <div className="flex gap-2">

                    {/* <Button
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white gap-2"
            to="/dashboard"
            as="a"
        >
            Message Delivery Status
        </Button> */}
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white gap-2">
                                <Plus className="w-4 h-4" />
                                Create Rule
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            {/* Dialog content remains the same */}
                            <DialogHeader>
                                <DialogTitle>Create Automation Rule</DialogTitle>
                                <DialogDescription>
                                    Set up a new automation rule to send WhatsApp messages automatically
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateRule} className="space-y-4">
                                {/* Form fields remain the same */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Rule Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        placeholder="e.g., Welcome New Customers"
                                        required
                                    />
                                </div>
                                {/* Rest of the form fields */}
                                <div className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                                    >
                                        Create Rule
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>


            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Active Rules</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {automationRules.filter((r) => r.status === "active").length}
                                </p>
                            </div>
                            <Activity className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Messages</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {automationRules
                                        .reduce((sum, rule) => sum + rule.messagesSent, 0)
                                        .toLocaleString()}
                                </p>
                            </div>
                            <Send className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                                <p className="text-2xl font-bold text-green-600">96.8%</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border border-gray-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Green Tick Status</p>
                                <p className="text-2xl font-bold text-green-600 flex items-center gap-2">
                                    <CheckCircle className="w-6 h-6 fill-green-500" />
                                    Verified
                                </p>
                            </div>
                            <Zap className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Automation Rules Table */}
            <Card className="shadow-sm border border-gray-100 mb-6">
                <CardHeader>
                    <CardTitle>Automation Rules</CardTitle>
                    <CardDescription>
                        Manage your automated WhatsApp messaging workflows
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rule Name</TableHead>
                                <TableHead>Trigger</TableHead>
                                <TableHead>Template</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Messages Sent</TableHead>
                                <TableHead>Success Rate</TableHead>
                                {/* <TableHead>Last Triggered</TableHead> */}
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {automationRules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{rule.name}</div>
                                            <div className="text-sm text-gray-500">{rule.description}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{rule.trigger}</Badge>
                                    </TableCell>
                                    <TableCell>{rule.template}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={rule.status === "active"}
                                                onCheckedChange={() => toggleRuleStatus(rule.id)}
                                            />
                                            {/* <Badge
                                                className={
                                                    rule.status === "active"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                }
                                            >
                                                {rule.status === "active" ? (
                                                    <Play className="w-3 h-3 mr-1" />
                                                ) : (
                                                    <Pause className="w-3 h-3 mr-1" />
                                                )}
                                                {rule.status}
                                            </Badge> */}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {rule.messagesSent.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-green-600 font-medium">
                                            {rule.successRate}%
                                        </span>
                                    </TableCell>
                                    {/* <TableCell className="text-gray-500">
                                        {rule.lastTriggered}
                                    </TableCell> */}
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm"
                                                onClick={() => handleEditAutomation(rule)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => deleteRule(rule.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Message Delivery Table */}

            <EditAutomationModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                automation={selectedAutomation}
                onSave={handleSaveAutomation}
            />

        </div>
    );
};



{/* Message Details Section */ }
