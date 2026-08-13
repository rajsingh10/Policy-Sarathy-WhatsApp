import React, { useState, useEffect } from "react";
import FacebookLogin from "@greatsumini/react-facebook-login";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Key,
  TestTube,
  Shield,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import {
  getSettings,
  saveSettings,
  testSettings,
  sendTestMessage,
} from "../features/settings/settingsSlice";

interface ApiConfig {
  fb_app_id: string;
  fb_app_secret: string;
  access_token: string;
  phoneNumberId: string;
  businessId: string;
  webhookUrl: string;
}

export const Settings: React.FC = () => {
  const dispatch = useDispatch();
  const { settings, loading, error } = useSelector(
    (state: any) => state.settings
  );

  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    fb_app_id: "",
    fb_app_secret: "",
    access_token: "",
    phoneNumberId: "",
    businessId: "",
    webhookUrl: "",
  });

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "error"
  >("connected");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // dispatch(refreshToken(token));
      dispatch(getSettings(token));
    }
  }, [dispatch]);

  const testConnection = () => {
    if (!token) {
      toast.error("No token found. Please log in.");
      return;
    }

    setIsTestingConnection(true);
    dispatch(testSettings(token))
      .unwrap()
      .then((res: any) => {
        toast.success(res.message || "Connection successful!");
        setConnectionStatus("connected");
      })
      .catch((err: any) => {
        const errorMsg =
          err?.error || err?.details || err?.message || "Connection failed";
        toast.error(errorMsg);
        setConnectionStatus("error");
      })
      .finally(() => setIsTestingConnection(false));
  };

  // ✅ Populate form from Redux settings when available
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setApiConfig({
        fb_app_id: settings.fb_app_id || "",
        fb_app_secret: settings.fb_app_secret || "",
        access_token: settings.access_token || "",
        phoneNumberId: settings.phoneNumberId || "",
        businessId: settings.waba_id || "",
        webhookUrl: settings.webhook_url || "",
      });
    }
  }, [settings]);

  const token = localStorage.getItem("token");

  const handleApiConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    dispatch(
      saveSettings({
        token,
        data: {
          fb_app_id: apiConfig.fb_app_id,
          fb_app_secret: apiConfig.fb_app_secret,
          access_token: apiConfig.access_token,
          phoneNumberId: apiConfig.phoneNumberId,
          waba_id: apiConfig.businessId,
          webhook_url: apiConfig.webhookUrl,
        },
      })
    )
      .unwrap()
      .then(() => {
        toast.success("Configuration saved successfully!");
      })
      .catch((err: any) => {
        // 👇 Proper error handling
        const errorMsg =
          err?.error ||
          err?.details ||
          err?.message ||
          "Failed to save configuration";
        toast.error(errorMsg);
      })
      .finally(() => setIsSaving(false));
  };
  const handleSendTestMessage = () => {
    if (!token) {
      toast.error("No token found. Please log in.");
      return;
    }

    dispatch(sendTestMessage({ token }))
      .unwrap()
      .then((res: any) => {
        toast.success(res.message || "✅ Test message sent!");
      })
      .catch((err: any) => {
        toast.error(
          err?.error?.message ||
            err?.message ||
            "❌ Failed to send test message"
        );
      });
  };

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <Badge className="text-success bg-success/20 hover:bg-success/30">
            <CheckCircle className="w-3 h-3 mr-1" /> Connected
          </Badge>
        );
      case "error":
        return (
          <Badge className="text-destructive bg-destructive/20 hover:bg-destructive/30">
            <AlertTriangle className="w-3 h-3 mr-1" /> Error
          </Badge>
        );
      default:
        return <Badge variant="outline">Connected</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-0 sm:px-6 lg:px-4 py-0 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your Facebook Meta WhatsApp API settings
        </p>
      </div>

      {/* Facebook Meta Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            <span>Facebook App Configuration</span>
            {getConnectionStatusBadge()}
          </CardTitle>
          <CardDescription>
            Enter your Facebook App details and WhatsApp Business credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleApiConfigSubmit} className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Credentials are stored locally. Use backend storage for
                production.
              </AlertDescription>
            </Alert>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fb_app_id">Facebook App ID *</Label>
                <Input
                  id="fb_app_id"
                  type="password"
                  value={apiConfig.fb_app_id}
                  onChange={(e) =>
                    setApiConfig((p) => ({ ...p, fb_app_id: e.target.value }))
                  }
                  placeholder="Enter your Facebook App ID"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fb_app_secret">Facebook App Secret *</Label>
                <Input
                  id="fb_app_secret"
                  type="password"
                  value={apiConfig.fb_app_secret}
                  onChange={(e) =>
                    setApiConfig((p) => ({
                      ...p,
                      fb_app_secret: e.target.value,
                    }))
                  }
                  placeholder="Enter your Facebook App Secret"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phoneNumberId">Phone Number ID *</Label>
                <Input
                  id="phoneNumberId"
                  value={apiConfig.phoneNumberId}
                  onChange={(e) =>
                    setApiConfig((p) => ({
                      ...p,
                      phoneNumberId: e.target.value,
                    }))
                  }
                  placeholder="e.g., 1234567890"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessId">
                  WhatsApp Business Account ID *
                </Label>
                <Input
                  id="businessId"
                  value={apiConfig.businessId}
                  onChange={(e) =>
                    setApiConfig((p) => ({ ...p, businessId: e.target.value }))
                  }
                  placeholder="e.g., 123456789012345"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="access_token">Access Token *</Label>
                <Input
                  id="access_token"
                  value={apiConfig.access_token}
                  onChange={(e) =>
                    setApiConfig((p) => ({
                      ...p,
                      access_token: e.target.value,
                    }))
                  }
                  placeholder="Access token from Facebook Login"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  value={apiConfig.webhookUrl}
                  onChange={(e) =>
                    setApiConfig((p) => ({ ...p, webhookUrl: e.target.value }))
                  }
                  placeholder="https://your-domain.com/webhook"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="bg-gradient-primary hover:shadow-glow"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
