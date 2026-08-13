import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  X,
  ArrowLeft,
  Info,
  Check,
  Upload,
  Image,
  Video,
  FileText,
  Play,
  RotateCcw,
  XCircle,
  Phone,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { addCustomTemplate } from "../features/templates/templatesSlice";

interface Button {
  id: string;
  text: string;
  type: "QUICK_REPLY" | "PHONE_NUMBER" | "URL";
  value?: string;
}

interface Variable {
  id: string;
  type: "text" | "number" | "date";
  placeholder: string;
}

export const CreateTemplate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state: any) => state.auth?.token);
  const [bodyVariableCount, setBodyVariableCount] = useState(1);
  const [templateData, setTemplateData] = useState({
    name: "",
    language: "en_US",
    category: "UTILITY",
    headerType: "NONE",
    headerText: "",
    body: "Hello",
    footer: "",
    hasCustomValidity: false,
    mediaSample: "IMAGE",
    uploadedMedia: null as File | null,
  });
  const [variables, setVariables] = useState<Variable[]>([]);
  const [buttons, setButtons] = useState<Button[]>([]);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const [variableSamples, setVariableSamples] = useState<
    Record<string, string>
  >({});
  const [errors, setErrors] = useState<{ name?: string; body?: string }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Human-friendly time used in preview footer to mimic WhatsApp card
  const previewTime = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const removeVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id));
  };

  const updateVariable = (id: string, field: keyof Variable, value: string) => {
    setVariables(
      variables.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const addButton = () => {
    if (buttons.length >= 10) {
      toast.error("Maximum 10 buttons allowed");
      return;
    }
    const newButton: Button = {
      id: Date.now().toString(),
      text: "",
      type: "QUICK_REPLY",
    };
    setButtons([...buttons, newButton]);
  };

  const removeButton = (id: string) => {
    setButtons(buttons.filter((b) => b.id !== id));
  };

  const updateButton = (id: string, field: keyof Button, value: string) => {
    setButtons(
      buttons.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTemplateData((prev) => ({ ...prev, uploadedMedia: file }));
      const url = URL.createObjectURL(file);
      setMediaPreviewUrl(url);
      toast.success("Media uploaded successfully!");
    }
  };

  const handleMediaSampleChange = (value: string) => {
    setTemplateData((prev) => ({ ...prev, mediaSample: value }));
    if (value === "None") {
      setTemplateData((prev) => ({ ...prev, uploadedMedia: null }));
      setMediaPreviewUrl(null);
    }
  };

  const formatTemplateData = () => {
    // Extract variables from header and body
    const headerVariables =
      templateData.headerText.match(/\{\{(\d+)\}\}/g) || [];
    const bodyVariables = templateData.body.match(/\{\{(\d+)\}\}/g) || [];

    // Format components array exactly as required by the API
    const components = [];

    // Add header if exists
    if (templateData.headerText) {
      const headerExample = {};
      if (headerVariables.length > 0) {
        headerExample["header_text"] = headerVariables.map(
          (variable) => variableSamples[variable] || "Sample"
        );
      }

      components.push({
        type: "HEADER",
        format: "TEXT",
        text: templateData.headerText,
        ...(headerVariables.length > 0 && { example: headerExample }),
      });
    }

    // Add body with variables and examples
    const bodyExample = {};
    if (bodyVariables.length > 0) {
      bodyExample["body_text"] = [
        bodyVariables.map((variable) => variableSamples[variable] || "Sample"),
      ];
    }

    components.push({
      type: "BODY",
      text: templateData.body,
      ...(bodyVariables.length > 0 && { example: bodyExample }),
    });

    // Add footer if exists
    if (templateData.footer) {
      components.push({
        type: "FOOTER",
        text: templateData.footer,
      });
    }

    return {
      name: templateData.name,
      language: templateData.language,
      category: templateData.category,
      components: components,
    };
  };

  const handleSubmit = async () => {
    const newErrors: { name?: string; body?: string } = {};
    let valid = true;

    if (!templateData.name.trim()) {
      newErrors.name = "Template name is required";
      valid = false;
    }

    if (!templateData.body.trim()) {
      newErrors.body = "Template body is required";
      valid = false;
    }

    setErrors(newErrors);

    if (!valid) return;

    try {
      const formattedData = formatTemplateData();
      console.log("Submitting template data:", formattedData);

      const resultAction = await dispatch(
        addCustomTemplate({
          token,
          templateData: formattedData,
        })
      );

      if (addCustomTemplate.fulfilled.match(resultAction)) {
        toast.success("Template created successfully!");
        navigate("/templates");
      } else {
        toast.error(resultAction.payload || "Failed to create template");
        console.error("Template creation error:", resultAction.payload);
      }
    } catch (err) {
      toast.error("An error occurred while creating the template");
      console.error("Template creation error:", err);
    }
  };

  const addVariableToBody = () => {
    setTemplateData((prev) => ({
      ...prev,
      body: prev.body + ` {{${bodyVariableCount}}} `,
    }));
    setBodyVariableCount((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto space-y-6 px-0 sm:px-6 lg:px-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/templates")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Requested Template</h1>
            <p className="text-muted-foreground">
              Set up a new WhatsApp message template
            </p>
          </div>
        </div>
        <div>
          <Button
            variant="outline"
            onClick={() => navigate("/templates/requested-guide")}
          >
            How to Request (Guide)
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:h-[calc(100vh-6rem)] overflow-hidden">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2 hide-scrollbar">
          {/* Template Name and Language */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <CardTitle className="text-lg">
                  Template name and language
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="templateName">Name your template</Label>
                  <Input
                    id="templateName"
                    value={templateData.name}
                    onChange={(e) => {
                      let value = e.target.value
                        .toLowerCase() // Convert to lowercase
                        .replace(/\s+/g, "_") // Replace spaces with underscore
                        .replace(/[^a-z0-9_]/g, ""); // Remove invalid characters
                      setTemplateData((prev) => ({
                        ...prev,
                        name: value,
                      }));
                    }}
                    placeholder="Enter a template name"
                    maxLength={512}
                  />

                  <div className="flex justify-between text-xs">
                    <div className="text-red-500">
                      {errors.name}
                      <div className="text-xs text-red-600 mt-1">
                        You need to enter a name for your template.
                      </div>
                    </div>
                    <div className="text-muted-foreground">
                      {templateData.name.length}/512
                    </div>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="language">Select language</Label>
                  <Select
                    value={templateData.language}
                    onValueChange={(value) =>
                      setTemplateData((prev) => ({ ...prev, language: value }))
                    }
                    defaultValue="en_US"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_US">English (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content</CardTitle>
              <CardDescription>
                Add a header, body and footer for your template. Cloud API
                hosted by Meta will review the template variables and content to
                protect the security and integrity of our services.{" "}
                <a href="#" className="text-primary underline">
                  Learn more
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Media Sample */}
              <div className="space-y-3">
                <Label>Media sample • Optional</Label>
                <Select
                  value={templateData.mediaSample}
                  onValueChange={handleMediaSampleChange}
                  defaultValue="IMAGE"
                >
                  <SelectTrigger className="w-80">
                    <SelectValue placeholder="Select media type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMAGE">Image</SelectItem>
                  </SelectContent>
                </Select>

                {/* Upload Option */}
                {templateData.mediaSample !== "None" && (
                  <div className="space-y-2">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleMediaUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      {templateData.uploadedMedia ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                            <Check className="w-6 h-6 text-green-600" />
                          </div>
                          <p className="text-sm font-medium">
                            {templateData.uploadedMedia.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(
                              templateData.uploadedMedia.size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Change Image
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-muted rounded-full">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium">Upload Image</p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG, GIF up to 5MB
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Header */}
              <div className="space-y-2">
                <Label htmlFor="header">Header • Optional</Label>
                <Input
                  id="header"
                  value={templateData.headerText}
                  onChange={(e) =>
                    setTemplateData((prev) => ({
                      ...prev,
                      headerText: e.target.value,
                    }))
                  }
                  placeholder="Add a short line of text to the header of your message"
                  maxLength={60}
                  disabled={templateData.mediaSample !== "None"}
                />
                <div className="text-xs text-muted-foreground">
                  {templateData.headerText.length}/60
                </div>
              </div>

              {/* Variables */}
              {variables.length > 0 && (
                <div className="space-y-2">
                  <Label>Variables</Label>
                  {variables.map((variable) => (
                    <div key={variable.id} className="flex gap-2">
                      <Select
                        value={variable.type}
                        onValueChange={(value) =>
                          updateVariable(variable.id, "type", value)
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={variable.placeholder}
                        onChange={(e) =>
                          updateVariable(
                            variable.id,
                            "placeholder",
                            e.target.value
                          )
                        }
                        placeholder="Variable placeholder"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariable(variable.id)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Body */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Body</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  id="templateBody"
                  value={templateData.body}
                  onChange={(e) => {
                    setTemplateData((prev) => ({
                      ...prev,
                      body: e.target.value,
                    }));
                  }}
                  onKeyDown={(e) => {
                    const textarea = e.currentTarget;
                    const cursorPos = textarea.selectionStart;
                    if (
                      e.key === "{" &&
                      templateData.body[cursorPos - 1] === "{"
                    ) {
                      e.preventDefault();
                      const before = templateData.body.slice(0, cursorPos - 1);
                      const after = templateData.body.slice(cursorPos);
                      const variableText = `{{${bodyVariableCount}}}`;
                      const newBody = before + variableText + after;
                      setTemplateData((prev) => ({ ...prev, body: newBody }));
                      setBodyVariableCount((prev) => prev + 1);
                      setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd =
                          before.length + variableText.length;
                      }, 0);
                    }
                  }}
                  rows={4}
                  className="w-full border p-2 rounded"
                  placeholder="Type your template body here..."
                />
                <div className="flex justify-between text-xs mt-1">
                  <div className="text-red-500">{errors.body}</div>
                  <div className="text-muted-foreground">
                    {templateData.body.length}/1024
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addVariableToBody}
                  className="text-primary ml-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add variable
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Variable samples */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Variable samples</CardTitle>
              <CardDescription>
                Include samples of all variables in your message to help Meta
                review your template. Remember not to include any customer
                information to protect privacy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {templateData.body.match(/\{\{\d+\}\}/g)?.length ? (
                templateData.body
                  .match(/\{\{\d+\}\}/g)!
                  .map((variable, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <div className="w-16 p-2 bg-gray-100 rounded text-center text-sm font-medium">
                        {variable}
                      </div>
                      <input
                        type="text"
                        value={variableSamples[variable] || ""}
                        onChange={(e) => {
                          setVariableSamples({
                            ...variableSamples,
                            [variable]: e.target.value,
                          });
                        }}
                        placeholder={`Enter sample for ${variable}`}
                        className="flex-1 border border-gray-400 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 text-sm">No variables yet</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Add sample text for each variable.
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Footer • Optional</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={templateData.footer}
                onChange={(e) =>
                  setTemplateData((prev) => ({
                    ...prev,
                    footer: e.target.value,
                  }))
                }
                placeholder="Enter text"
                maxLength={60}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {templateData.footer.length}/60
              </div>
            </CardContent>
          </Card>

          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Buttons • Optional</CardTitle>
              <CardDescription>
                Create buttons that let customers respond to your message or
                take action. You can add up to ten buttons. If you add more than
                three buttons, they will appear in a list.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {buttons.map((button) => (
                <div key={button.id} className="flex gap-2">
                  <Select
                    value={button.type}
                    onValueChange={(value) =>
                      updateButton(button.id, "type", value as Button["type"])
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QUICK_REPLY">Quick Reply</SelectItem>
                      <SelectItem value="PHONE_NUMBER">Phone Number</SelectItem>
                      <SelectItem value="URL">URL</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={button.text}
                    onChange={(e) =>
                      updateButton(button.id, "text", e.target.value)
                    }
                    placeholder="Button text"
                    className="flex-1"
                  />
                  {(button.type === "PHONE_NUMBER" ||
                    button.type === "URL") && (
                    <Input
                      value={button.value || ""}
                      onChange={(e) =>
                        updateButton(button.id, "value", e.target.value)
                      }
                      placeholder={
                        button.type === "PHONE_NUMBER" ? "Phone number" : "URL"
                      }
                      className="flex-1"
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeButton(button.id)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addButton}
                disabled={buttons.length >= 10}
                className="end ml-auto "
              >
                <Plus className="h-4 w-4 mr-2" />
                Add button
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleSubmit} className="flex-1">
              Create Template
            </Button>
            <Button variant="outline" onClick={() => navigate("/templates")}>
              Cancel
            </Button>
          </div>
        </div>

        {/* Template Preview */}
        <div className="lg:col-span-1 overflow-y-auto">
          <Card className="h-auto lg:sticky">
            <CardHeader>
              <CardTitle className="text-lg">Template preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="bg-white rounded-2xl p-3 shadow-sm border max-w-xs ml-auto">
                  {/* Media Preview */}
                  {templateData.mediaSample !== "None" && (
                    <div className="mb-3">
                      {mediaPreviewUrl ? (
                        <div className="rounded-xl overflow-hidden">
                          {templateData.mediaSample === "IMAGE" && (
                            <img
                              src={mediaPreviewUrl}
                              alt="Media preview"
                              className="w-full h-40 object-cover"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-40 bg-muted/50 rounded-xl">
                          <Image className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  )}
                  {templateData.headerText && (
                    <div className="font-semibold text-sm mb-2">
                      {templateData.headerText}
                    </div>
                  )}
                  {/* Template Body Preview with Read More / Read Less */}
                  <div className="text-sm leading-relaxed">
                    {(() => {
                      const fullText = templateData.body
                        .split(/\{\{\d+\}\}/g)
                        .map((part, index, arr) => {
                          const variableMatch =
                            templateData.body.match(/\{\{\d+\}\}/g)?.[index];
                          return (
                            part +
                            (variableMatch
                              ? variableSamples[variableMatch] || variableMatch
                              : "")
                          );
                        })
                        .join("");

                      const applyWhatsAppFormatting = (text: string) => {
                        return (
                          text
                            // bold
                            .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
                            // italic
                            .replace(/_(.*?)_/g, "<em>$1</em>")
                            // strikethrough
                            .replace(/~(.*?)~/g, "<s>$1</s>")
                            // monospace/code
                            .replace(/```(.*?)```/g, "<code>$1</code>")
                            .replace(/`(.*?)`/g, "<code>$1</code>")
                            // links
                            .replace(
                              /(https?:\/\/[^\s]+)/g,
                              '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-green-600 underline">$1</a>'
                            )
                            // newlines
                            .replace(/\n/g, "<br/>")
                        );
                      };

                      const formattedFullText =
                        applyWhatsAppFormatting(fullText);
                      const maxLength = 120;
                      const isLong = fullText.length > maxLength;
                      const displayText =
                        !isExpanded && isLong
                          ? applyWhatsAppFormatting(
                              fullText.slice(0, maxLength) + "..."
                            )
                          : formattedFullText;

                      return (
                        <>
                          <div
                            className="whitespace-pre-wrap break-words"
                            dangerouslySetInnerHTML={{ __html: displayText }}
                          />
                          {isLong && (
                            <button
                              onClick={() => setIsExpanded(!isExpanded)}
                              className="text-green-600 text-xs font-medium mt-1 hover:underline"
                            >
                              {isExpanded ? "Read less" : "Read more"}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {templateData.footer && (
                    <div className="text-[11px] text-muted-foreground mt-2 pt-2 border-t flex items-center justify-between">
                      <span>{templateData.footer}</span>
                    </div>
                  )}
                  {buttons.length > 0 && (
                    <div className="mt-3 pt-2 border-t space-y-2">
                      {buttons.slice(0, 3).map((button) => {
                        const Icon =
                          button.type === "PHONE_NUMBER"
                            ? Phone
                            : button.type === "URL"
                            ? Link2
                            : RotateCcw;
                        return (
                          <Button
                            key={button.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-center text-green-600 hover:text-green-700 hover:bg-green-50 text-[13px] h-8"
                          >
                            <Icon className="h-4 w-4 mr-1.5" />
                            {button.text || "Button"}
                          </Button>
                        );
                      })}
                      {buttons.length > 3 && (
                        <div className="text-xs text-center text-muted-foreground">
                          +{buttons.length - 3} more buttons
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
