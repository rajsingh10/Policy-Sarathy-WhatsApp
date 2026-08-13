import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Image,
  Trash2,
  Loader2,
  Copy,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UploadModal from "@/components/media/UploadModal";
import {
  addMedia,
  getMedia,
  updateMedia,
  deleteMedia,
} from "../services/mediaApi";
import { BaseLoading } from "../components/BaseLoading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Media = () => {
  const { toast } = useToast();
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // 🔹 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // 🔹 Filter
  const [filterType, setFilterType] = useState("all"); // all | image | video

  const token = localStorage.getItem("token");

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const data = await getMedia(token);
      const mediaFiles = data.filter(
        (file: any) =>
          file.mime_type?.startsWith("image/") ||
          file.mime_type?.startsWith("video/")
      );
      setMediaList(mediaFiles);
    } catch (err) {
      console.error("Failed to load media:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Filtered media (image/video)
  const filteredMedia = useMemo(() => {
    if (filterType === "image")
      return mediaList.filter((f) => f.mime_type.startsWith("image/"));
    if (filterType === "video")
      return mediaList.filter((f) => f.mime_type.startsWith("video/"));
    return mediaList;
  }, [filterType, mediaList]);

  // 🔹 Paginated media
  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
  const currentMedia = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMedia.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredMedia]);

  const copyUrl = async (full_url: string) => {
    try {
      await navigator.clipboard.writeText(full_url);
      toast({ title: "Copied", description: "Image URL copied to clipboard" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (item: any) => {
    window.open(item.full_url, "_blank");
  };

  const handleUploadComplete = async (file: File, editingItem?: any) => {
    if (!file && !editingItem) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast({
        title: "Invalid file",
        description: "Only image and video files are allowed",
        variant: "destructive",
      });
      return;
    }

    const MAX_SIZE_MB = 550;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    if (file && file.size > MAX_SIZE_BYTES) {
      toast({
        title: "File too large",
        description: `Max ${MAX_SIZE_MB} MB allowed.`,
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    if (file) formData.append("file", file);

    try {
      setUploading(true);
      if (editingItem) {
        await updateMedia(token, editingItem.id, formData);
        toast({ title: "Updated successfully" });
      } else {
        await addMedia(token, formData);
        toast({ title: "Uploaded", description: `${file?.name}` });
      }
      setShowUploadModal(false);
      loadMedia();
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err?.errors?.file?.[0] || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      await deleteMedia(token, deleteTarget.id);
      setMediaList((prev) => prev.filter((f: any) => f.id !== deleteTarget.id));
      toast({ title: "Deleted successfully" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  if (loading || uploading) return <BaseLoading message="Loading..." />;

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (
    <div className="container mx-auto px-0 sm:px-6 lg:px-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="text-muted-foreground text-sm">
            Manage and reuse uploaded media files
          </p>
        </div>

        <div className="flex gap-3 items-center">
          {/* 🔹 Filter Dropdown */}
          <Select
            value={filterType}
            onValueChange={(value) => {
              setFilterType(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
            </SelectContent>
          </Select>

          {/* 🔹 Upload Button */}
          <Button onClick={() => setShowUploadModal(true)} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" /> Upload
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Image Grid */}
      {currentMedia.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentMedia.map((file: any) => (
              <Card
                key={file.id}
                className="hover:shadow-lg transition-shadow rounded-xl overflow-hidden"
              >
                <div className="relative group">
                  {/* Image or Video */}
                  <div
                    className="aspect-square bg-muted overflow-hidden"
                    onClick={() => {
                      setPreviewImage(file.full_url);
                      setShowPreviewModal(true);
                    }}
                  >
                    <span
                      className={`absolute top-2 right-2 text-[11px] font-semibold px-2 py-1 rounded-full 
                        ${file.mime_type.startsWith("image/")
                          ? "bg-blue-500 text-white"
                          : "bg-purple-500 text-white"
                        } 
                        z-10 shadow-md`}
                    >
                      {file.mime_type.startsWith("image/") ? "Image" : "Video"}
                    </span>
                    {file.mime_type.startsWith("image/") ? (
                      <img
                        src={file.full_url}
                        alt={file.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={file.full_url}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        muted
                      />
                    )}
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                    <Button
                      size="sm"
                      className="bg-yellow-500 hover:bg-yellow-600 rounded-full w-9 h-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(file.full_url);
                        setShowPreviewModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4 text-white" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 rounded-full w-9 h-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyUrl(file.full_url);
                      }}
                    >
                      <Copy className="h-4 w-4 text-white" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 rounded-full w-9 h-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file);
                      }}
                    >
                      <Download className="h-4 w-4 text-white" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 rounded-full w-9 h-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(file);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <CardContent className="p-3 flex flex-col gap-1">
                  <h3 className="font-medium text-sm truncate" title={file.name}>
                    {file.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No media found</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Upload your first image or video to get started
            </p>
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="h-4 w-4 mr-2" /> Upload
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this file?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-5xl p-0 h-auto">
          {previewImage &&
            (previewImage.endsWith(".mp4") ||
              previewImage.includes("video") ? (
              <video
                src={previewImage}
                controls
                className="w-full h-auto max-h-[80vh] object-contain rounded-md"
              />
            ) : (
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-auto max-h-[80vh] object-contain rounded-md"
              />
            ))}
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <UploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onUploadComplete={handleUploadComplete}
        accept="image/*,video/*"
      />
    </div>
  );
};

export default Media;
