// import React, { useState, useRef } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { useToast } from "@/hooks/use-toast";

// interface UploadModalProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onUploadComplete?: (file: File) => void;
// }

// const UploadModal: React.FC<UploadModalProps> = ({
//   open,
//   onOpenChange,
//   onUploadComplete,
// }) => {
//   const [file, setFile] = useState<File | null>(null);
//   const [preview, setPreview] = useState<string | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const { toast } = useToast();

//   const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

//   const validateFile = (file: File): string | null => {
//     if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
//       return "Only image and video files are allowed";
//     }
//     return null;
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selectedFile = e.target.files?.[0];
//     if (!selectedFile) return;

//     const error = validateFile(selectedFile);
//     if (error) {
//       toast({
//         title: "Invalid file",
//         description: error,
//         variant: "destructive",
//       });
//       setFile(null);
//       setPreview(null);
//       return;
//     }

//     setFile(selectedFile);
//     setPreview(URL.createObjectURL(selectedFile));
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (file) {
//       onUploadComplete?.(file);
//     }
//   };

//   const handleClose = () => {
//     setFile(null);
//     setPreview(null);
//     onOpenChange(false);
//   };

//   return (
//     <Dialog open={open} onOpenChange={handleClose}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Upload Image</DialogTitle>
//         </DialogHeader>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <Input
//             ref={fileInputRef}
//             type="file"
//             accept="image/*,video/*"
//             onChange={handleFileChange}
//           />

//           {/* ✅ Image Preview */}
//           {preview && (
//             <div className="mt-2">
//               {file?.type.startsWith("image/") ? (
//                 <img
//                   src={preview}
//                   alt="Preview"
//                   className="h-32 w-32 object-cover rounded border"
//                 />
//               ) : (
//                 <video
//                   src={preview}
//                   controls
//                   className="h-32 w-32 object-cover rounded border"
//                 />
//               )}
//               <p className="text-sm text-muted-foreground mt-1">
//                 {file?.name} ({(file!.size / 1024).toFixed(1)} KB)
//               </p>
//             </div>
//           )}

//           <div className="flex justify-end gap-2">
//             <Button type="button" variant="outline" onClick={handleClose}>
//               Cancel
//             </Button>
//             <Button type="submit" disabled={!file}>
//               Upload
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default UploadModal;

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: (file: File) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({
  open,
  onOpenChange,
  onUploadComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Limits
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
  const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20 MB
  const MAX_VIDEO_DURATION = 30; // 30 seconds

  // Validation logic
  const validateFile = async (file: File): Promise<string | null> => {
    const type = file.type;

    if (!type.startsWith("image/") && !type.startsWith("video/")) {
      return "Only image and video files are allowed.";
    }

    if (type.startsWith("image/") && file.size > MAX_IMAGE_SIZE) {
      return "Image size must be under 5 MB.";
    }

    if (type.startsWith("video/") && file.size > MAX_VIDEO_SIZE) {
      return "Video size must be under 20 MB.";
    }

    if (type.startsWith("video/")) {
      const durationError = await checkVideoDuration(file);
      if (durationError) return durationError;
    }

    return null;
  };

  // Check video duration
  const checkVideoDuration = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        if (video.duration > MAX_VIDEO_DURATION) {
          resolve(`Video must be shorter than ${MAX_VIDEO_DURATION} seconds.`);
        } else {
          resolve(null);
        }
      };
      video.onerror = () => {
        resolve("Unable to read video metadata.");
      };
      video.src = url;
    });
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setLoading(true);
    setErrorMessage(null);

    const error = await validateFile(selectedFile);
    setLoading(false);

    if (error) {
      setErrorMessage(error);
     
      setFile(null);
      setPreview(null);
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onUploadComplete?.(file);
    }
  };

  // Close modal
  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setErrorMessage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Image or Video</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              disabled={loading}
              className={errorMessage ? "border-red-500" : ""}
            />

            {/* 🟡 File Requirements Info */}
            <p className="text-xs text-muted-foreground mt-2">
              Supported: Images (max 5MB) • Videos (max 20MB, up to 30s)
            </p>

            {/* 🔴 Inline validation message */}
            {errorMessage && (
              <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
            )}
          </div>

          {/* ✅ File Preview */}
          {preview && (
            <div className="mt-2">
              {file?.type.startsWith("image/") ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded border"
                />
              ) : (
                <video
                  src={preview}
                  controls
                  className="h-32 w-32 object-cover rounded border"
                />
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {file?.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file || loading}>
              {loading ? "Checking..." : "Upload"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
