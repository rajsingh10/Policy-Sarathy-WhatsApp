import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Copy,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  MessageSquare,
  Eye,
  RotateCcw,
  Phone,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { fetchTemplateById } from "../features/templates/templatesSlice";

interface Template {
  id: string;
  name: string;
  category: string;
  language: string;
  body: string;
  status: "approved" | "pending" | "rejected";
  createdAt: string;
  lastUsed?: string;
  timesUsed: number;
  variables: string[];
  previewVariables: Record<string, string>;
  components: Array<{
    type: string;
    text?: string;
    buttons?: Array<{ type: string; url: string }>;
  }>;
}
import { BaseLoading } from "../components/BaseLoading";

export const TemplateView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state: any) => state.auth);
  const { currentTemplate, loading, error } = useSelector(
    (state: any) => state.template
  );
  const dispatch = useDispatch();

  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(false); // add near other useStates at top
  const [showSendDialog, setShowSendDialog] = useState(false);

  const mapApiTemplateToTemplate = (apiTemplate: any): Template => {
    const bodyComponent = apiTemplate.components.find(
      (c: any) => c.type === "BODY"
    );
    const bodyText = bodyComponent?.text || "";
    const variables = bodyText.match(/\{\{(\d+)\}\}/g) || [];
    const previewVariables: Record<string, string> = {};

    if (bodyComponent?.example?.body_text?.[0]) {
      bodyComponent.example.body_text[0].forEach((val: string, i: number) => {
        previewVariables[`{{${i + 1}}}`] = val;
      });
    }

    return {
      id: apiTemplate.id,
      name: apiTemplate.name,
      category: apiTemplate.category,
      language: apiTemplate.language,
      body: bodyText,
      status: apiTemplate.status.toLowerCase(),
      createdAt: apiTemplate.created_at,
      lastUsed: apiTemplate.updated_at,
      timesUsed: 0,
      variables,
      previewVariables,
      components: apiTemplate.components,
    };
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchTemplateById({ token, id }));
    }
  }, [id, dispatch, token]);

  useEffect(() => {
    if (currentTemplate) {
      const mappedTemplate = mapApiTemplateToTemplate(currentTemplate);
      setPreviewVars(mappedTemplate.previewVariables);
    }
  }, [currentTemplate]);

  if (loading) return <BaseLoading message="Loading..." />;
  if (error)
    return (
      <div className="container max-w-6xl mx-auto px-0 sm:p-6">Error: {error}</div>
    );
  if (!currentTemplate)
    return (
      <div className="container max-w-6xl mx-auto p-6">No template found</div>
    );

  const template = mapApiTemplateToTemplate(currentTemplate);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-success bg-success/20";
      case "pending":
        return "text-warning bg-warning/20";
      case "rejected":
        return "text-destructive bg-destructive/20";
      default:
        return "";
    }
  };

  const generatePreview = () => {
    let preview = template.body;
    Object.entries(previewVars).forEach(([key, value]) => {
      preview = preview.replace(
        new RegExp(key.replace(/[{}]/g, "\\$&"), "g"),
        value
      );
    });
    return preview;
  };

  const replaceVars = (text?: string) => {
    if (!text) return "";
    let replaced = text;
    Object.entries(previewVars).forEach(([key, value]) => {
      replaced = replaced.replace(
        new RegExp(key.replace(/[{}]/g, "\\$&"), "g"),
        value
      );
    });
    return replaced;
  };

  const headerText = replaceVars(
    template.components.find((c) => c.type === "HEADER")?.text
  );
  const footerText = replaceVars(
    template.components.find((c) => c.type === "FOOTER")?.text
  );
  const headerComponent: any = template.components.find(
    (c) => c.type === "HEADER"
  );
  const headerFormat: string | undefined = headerComponent?.format;
  const headerMediaUrl: string | undefined =
    headerComponent?.example?.header_handle?.[0];
  const previewTime = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(template.body);
    toast.success("Template copied to clipboard");
  };

  const handleSendBulk = () => {
    navigate(`/campaigns?template=${template.id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="container max-w-6xl mx-auto px-0 sm:px-6 lg:px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate("/templates")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleCopyTemplate}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <CardTitle className="text-sm md:text-base">
                    {template.name}
                  </CardTitle>
                </div>
                <Badge
                  className={`${getStatusColor(
                    template.status
                  )} capitalize flex items-center space-x-1 mt-2 md:mt-0`}
                >
                  {getStatusIcon(template.status)}
                  <span className="text-xs md:text-sm">{template.status}</span>
                </Badge>
              </div>
              <CardDescription className="text-xs md:text-sm">
                {template.category} • {template.language} • Created{" "}
                {formatDate(template.createdAt)}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Template Body */}
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  Template Body
                </Label>
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-foreground">
                    {template.body}
                  </pre>
                </div>
              </div>

              {/* Buttons */}
              {template.components.some((c) => c.type === "BUTTONS") && (
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    Buttons
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {template.components
                      .find((c) => c.type === "BUTTONS")
                      ?.buttons?.map((button, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="font-mono max-w-[700px] overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                          <a
                            href={button.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {button.type}: {button.url}
                          </a>
                        </Button>
                      ))}
                  </div>
                </div>
              )}

              {/* Variables */}
              {template.variables.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    Variables ({template.variables.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {template.variables.map((variable, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="font-mono"
                      >
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          {template.variables.length > 0 && (
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Preview</span>
                </CardTitle>
                <CardDescription>
                  See how your message will look with sample data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Preview Values</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {template.variables.map((variable) => (
                      <div key={variable} className="space-y-1">
                        <Label className="text-xs text-muted-foreground font-mono">
                          {variable}
                        </Label>
                        <Input
                          value={previewVars[variable] || ""}
                          onChange={(e) =>
                            setPreviewVars({
                              ...previewVars,
                              [variable]: e.target.value,
                            })
                          }
                          placeholder={`Value for ${variable}`}
                          className="font-mono text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>Message Preview</CardTitle>
              <CardDescription>
                How the message looks to recipients
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg flex items-center justify-center">
                <div className="bg-white rounded-2xl p-3 shadow-sm border max-w-sm  relative">
                  {/* Header Media (Image / Video / Document) */}
                  {headerFormat &&
                    headerFormat !== "TEXT" &&
                    headerMediaUrl && (
                      <div className="mb-3">
                        {headerFormat === "IMAGE" && (
                          <img
                            src={headerMediaUrl}
                            alt="Header"
                            className="w-full h-40 object-cover rounded-xl"
                          />
                        )}
                        {headerFormat === "VIDEO" && (
                          <video
                            src={headerMediaUrl}
                            className="w-full h-40 object-cover rounded-xl"
                            controls
                          />
                        )}
                        {headerFormat === "DOCUMENT" && (
                          <div className="h-24 bg-muted/50 rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                            Document preview unavailable
                          </div>
                        )}
                      </div>
                    )}

                  {/* Header Text */}
                  {headerText && (
                    <div className="font-semibold text-sm mb-2">
                      {headerText}
                    </div>
                  )}

                  {/* Body Preview */}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    <div
                      className={`transition-all duration-300 ${
                        isExpanded ? "max-h-full" : "max-h-24 overflow-hidden"
                      }`}
                    >
                      {generatePreview()
                        .split(" ")
                        .map((word, idx) =>
                          word.startsWith("http") ? (
                            <a
                              key={idx}
                              href={word}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-all"
                            >
                              {word.length > 40
                                ? word.slice(0, 40) + "..."
                                : word}
                            </a>
                          ) : (
                            word + " "
                          )
                        )}
                    </div>

                    {/* Read More / Less Button */}
                    {generatePreview().length > 180 && (
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs mt-1 text-green-600 hover:text-green-700 font-medium"
                      >
                        {isExpanded ? "Read less" : "Read more"}
                      </button>
                    )}
                  </div>

                  {/* Footer — Only show if footerText exists */}
                  {footerText?.trim() && (
                    <div className="text-[11px] text-muted-foreground mt-2 pt-2 border-t flex items-center justify-between">
                      <span>{footerText}</span>
                      {/* <span>{previewTime}</span> */}
                    </div>
                  )}

                  {/* Buttons Preview */}
                  {template.components.some((c) => c.type === "BUTTONS") && (
                    <div className="mt-3 pt-2 border-t space-y-2">
                      {(
                        template.components.find((c) => c.type === "BUTTONS")
                          ?.buttons || []
                      )
                        .slice(0, 3)
                        .map((button, idx) => {
                          const Icon =
                            button.type === "PHONE_NUMBER"
                              ? Phone
                              : button.type === "URL"
                              ? Link2
                              : RotateCcw;
                          const textLabel =
                            button.text || button.title || "Button";
                          return (
                            <button
                              key={idx}
                              className="w-full justify-center text-green-600 hover:text-green-700 hover:bg-green-50 text-[13px] h-8 flex items-center rounded-md border border-transparent transition-all"
                            >
                              <Icon className="h-4 w-4 mr-1.5" />
                              {textLabel}
                            </button>
                          );
                        })}

                      {/* “More buttons” indicator */}
                      {(
                        template.components.find((c) => c.type === "BUTTONS")
                          ?.buttons || []
                      ).length > 3 && (
                        <div className="text-xs text-center text-muted-foreground">
                          +
                          {(
                            template.components.find(
                              (c) => c.type === "BUTTONS"
                            )?.buttons || []
                          ).length - 3}{" "}
                          more buttons
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>Template Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="outline">{template.category}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Language</span>
                <span className="text-foreground">{template.language}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Variables</span>
                <span className="text-foreground">
                  {template.variables.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground">
                  {formatDate(template.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
