import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  Share2,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Calendar,
  HardDrive,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
} from "lucide-react";

const MediaView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - replace with actual data fetching based on id
  const mediaFile = {
    id: parseInt(id || "1"),
    name: "campaign-banner.jpg",
    type: "image",
    size: "2.4 MB",
    uploadDate: "2024-01-15T10:30:00Z",
    dimensions: "1920x1080",
    url: "/placeholder.svg",
    description: "Main banner image for the Q1 marketing campaign",
    tags: ["campaign", "banner", "marketing", "q1"],
    metadata: {
      camera: "Canon EOS R5",
      iso: "100",
      aperture: "f/2.8",
      shutter: "1/125s",
      focal: "85mm",
    },
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-6 w-6" />;
      case "video":
        return <Video className="h-6 w-6" />;
      case "audio":
        return <Music className="h-6 w-6" />;
      default:
        return <FileText className="h-6 w-6" />;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case "image":
        return "bg-green-100 text-green-800";
      case "video":
        return "bg-blue-100 text-blue-800";
      case "audio":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="container mx-auto px-0 sm:p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate("/media")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Media
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {getFileIcon(mediaFile.type)}
            <h1 className="text-2xl font-bold">{mediaFile.name}</h1>
            <Badge className={getFileTypeColor(mediaFile.type)}>
              {mediaFile.type.toUpperCase()}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Preview */}
          <Card>
            <CardContent className="p-6">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {mediaFile.type === "image" ? (
                  <img
                    src={mediaFile.url}
                    alt={mediaFile.name}
                    className="w-full h-full object-contain"
                  />
                ) : mediaFile.type === "video" ? (
                  <video
                    src={mediaFile.url}
                    controls
                    className="w-full h-full"
                  />
                ) : mediaFile.type === "audio" ? (
                  <audio src={mediaFile.url} controls className="w-full" />
                ) : (
                  <div className="text-center">
                    {getFileIcon(mediaFile.type)}
                    <p className="mt-2 text-muted-foreground">
                      Preview not available
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description and Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">
                  {mediaFile.description || "No description provided."}
                </p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {mediaFile.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          {mediaFile.metadata && (
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(mediaFile.metadata).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium capitalize">{key}:</span>
                      <span className="ml-2 text-muted-foreground">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* File Information */}
          <Card>
            <CardHeader>
              <CardTitle>File Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Size</p>
                  <p className="text-sm text-muted-foreground">
                    {mediaFile.size}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Uploaded</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(mediaFile.uploadDate)}
                  </p>
                </div>
              </div>

              {mediaFile.dimensions && (
                <div className="flex items-center gap-3">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Dimensions</p>
                    <p className="text-sm text-muted-foreground">
                      {mediaFile.dimensions}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File URL */}
          <Card>
            <CardHeader>
              <CardTitle>File URL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                  {window.location.origin + mediaFile.url}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(window.location.origin + mediaFile.url)
                  }
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <Button size="sm" variant="outline" className="w-full">
                <ExternalLink className="h-3 w-3 mr-2" />
                Open in New Tab
              </Button>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Views</span>
                <span className="text-sm font-medium">127</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Downloads</span>
                <span className="text-sm font-medium">23</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Used in campaigns</span>
                <span className="text-sm font-medium">3</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MediaView;
