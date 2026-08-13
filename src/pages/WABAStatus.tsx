import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  Clock,
  Send,
  MessageSquare,
  Activity,
  TrendingUp,
  Filter,
  RefreshCw,
  Download,
  Search
} from 'lucide-react';

// Mock data
const wabaStatus = {
  connected: true,
  phoneNumber: '+919696985647',
  businessName: 'Fablead WA-Broadcast',
  verificationStatus: 'verified',
  greenTick: true,
  apiVersion: 'v17.0',
  lastSync: '2 minutes ago'
};

const messageStats = {
  totalSent: 15420,
  delivered: 14890,
  read: 13245,
  failed: 530,
  pending: 125
};

const automationRules = [
  {
    id: 1,
    name: 'Welcome Message',
    trigger: 'New Contact',
    status: 'active',
    messagesSent: 1250,
    lastTriggered: '5 min ago'
  },
  {
    id: 2,
    name: 'Order Confirmation',
    trigger: 'Order Placed',
    status: 'active',
    messagesSent: 3420,
    lastTriggered: '2 min ago'
  },
  {
    id: 3,
    name: 'Follow-up Reminder',
    trigger: 'After 24h',
    status: 'paused',
    messagesSent: 890,
    lastTriggered: '1 hour ago'
  }
];

const recentMessages = [
  {
    id: 1,
    recipient: '+1 234 567 8901',
    message: 'Welcome to our service!',
    status: 'delivered',
    timestamp: '2 min ago',
    automation: 'Welcome Message'
  },
  {
    id: 2,
    recipient: '+1 234 567 8902',
    message: 'Your order #1234 has been confirmed',
    status: 'read',
    timestamp: '5 min ago',
    automation: 'Order Confirmation'
  },
  {
    id: 3,
    recipient: '+1 234 567 8903',
    message: 'Thank you for your purchase!',
    status: 'delivered',
    timestamp: '8 min ago',
    automation: 'Manual'
  },
  {
    id: 4,
    recipient: '+1 234 567 8904',
    message: 'Special offer just for you!',
    status: 'failed',
    timestamp: '10 min ago',
    automation: 'Marketing Campaign'
  },
  {
    id: 5,
    recipient: '+1 234 567 8905',
    message: 'Your appointment is confirmed',
    status: 'pending',
    timestamp: '12 min ago',
    automation: 'Appointment Reminder'
  }
];

export const WABAStatus = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-success/20 text-success"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
      case 'read':
        return <Badge className="bg-primary/20 text-primary"><CheckCircle className="w-3 h-3 mr-1" />Read</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/20 text-destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredMessages = recentMessages.filter(msg =>
    msg.recipient.includes(searchTerm) ||
    msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.automation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container max-w-7xl mx-auto px-0 sm:px-6 lg:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">WABA Status</h1>
          <p className="text-muted-foreground mt-2">Monitor your WhatsApp Business API connection </p>
        </div>
        {/* <Button variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button> */}
      </div>

      {/* WABA Connection Status */}
      <Card className="card-elegant mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                WhatsApp Business API Status
                {/* {wabaStatus.greenTick && (
                  <CheckCircle className="w-5 h-5 text-success fill-success" />
                )} */}
              </CardTitle>
              <CardDescription>Your WhatsApp Business account connection details</CardDescription>
            </div>
            <Badge className={wabaStatus.connected ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}>
              {wabaStatus.connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Business Name</p>
              <p className="font-medium flex items-center gap-2">
                {wabaStatus.businessName}
                {/* {wabaStatus.greenTick && (
                  <span title="Verified Business">
                    <CheckCircle className="w-4 h-4 text-success fill-success" />
                  </span>
                )} */}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
              <p className="font-medium">{wabaStatus.phoneNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Verification Status</p>
              <Badge className="bg-success/20 text-success capitalize">{wabaStatus.verificationStatus}</Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-success font-medium">Active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList> */}


      {/* <TabsContent value="overview" className="space-y-6 mt-6"> */}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold text-foreground">{messageStats.totalSent.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Send className="w-8 h-8 text-primary" />
              </div>

            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold text-success">{messageStats.delivered.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
              </div>
             
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Read</p>
                <p className="text-2xl font-bold text-primary">{messageStats.read.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-primary" />
              </div>
             
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-destructive">{messageStats.failed.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
              </div>
             
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">{messageStats.pending.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-8 h-8 text-warning" />              </div>
            
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Rate */}
      <div className="py-6">
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Message delivery and engagement statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Delivery Rate</span>
                  <span className="text-sm font-bold text-success">96.6%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-success h-2 rounded-full" style={{ width: '96.6%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Read Rate</span>
                  <span className="text-sm font-bold text-primary">85.9%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '85.9%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="text-sm font-bold text-primary">96.6%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '96.6%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* </TabsContent> */}

      {/* Automation Tab */}
      {/* <TabsContent value="automation" className="space-y-6 mt-6">
          <Card className="card-elegant">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Automation Rules</CardTitle>
                  <CardDescription>Manage your automated message workflows</CardDescription>
                </div>
                <Button className="bg-gradient-primary">
                  <Activity className="w-4 h-4 mr-2" />
                  New Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Messages Sent</TableHead>
                    <TableHead>Last Triggered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {automationRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.trigger}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={rule.status === 'active' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}>
                          {rule.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{rule.messagesSent.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">{rule.lastTriggered}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent> */}

      {/* Messages Tab */}
      {/* <TabsContent value="messages" className="space-y-6 mt-6">
          <Card className="card-elegant">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by recipient, message, or automation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>View and monitor all WhatsApp messages</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Automation</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell className="font-medium">{msg.recipient}</TableCell>
                      <TableCell className="max-w-xs truncate">{msg.message}</TableCell>
                      <TableCell>{getStatusBadge(msg.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{msg.automation}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{msg.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>  */}
      {/* </Tabs> */}
    </div>
  );
};
