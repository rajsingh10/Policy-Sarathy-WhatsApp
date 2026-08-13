import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Save, X } from 'lucide-react';

export const ImageEditor = ({ file, isOpen, onClose, onSave }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#ff0000');
    const [lineWidth, setLineWidth] = useState(4);
    const [imageObj, setImageObj] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!file || !isOpen) return;
        setIsLoading(true);

        let url = typeof file === 'string' ? file : URL.createObjectURL(file);

        // Rewrite URL to use the Vite proxy to bypass CORS during development only
        if (import.meta.env.DEV && typeof url === 'string' && url.startsWith('https://policysarthi-whatsapp.fableadtech.in/services')) {
            url = url.replace('https://policysarthi-whatsapp.fableadtech.in/services', '/cors-proxy');
        }

        // Function to actually draw the image onto canvas
        const applyImage = (imgSrc, crossOrigin = null) => {
            const img = new Image();
            if (crossOrigin) img.crossOrigin = crossOrigin;

            img.onload = () => {
                setImageObj(img);
                setTimeout(() => {
                    drawInitialImage(img);
                    setIsLoading(false);
                }, 100);
            };

            img.onerror = () => {
                // If it failed with CORS, try without CORS so it's at least visible!
                if (crossOrigin === "anonymous") {
                    console.warn("CORS image load failed. Falling back to non-CORS load...");
                    applyImage(imgSrc, null);
                } else {
                    console.error("Failed to load image entirely.");
                    setIsLoading(false);
                }
            };

            img.src = imgSrc;
        };

        if (typeof file === 'string') {
            // Helper to try fetching via a proxy with timeout
            const tryFetch = async (urlToFetch, timeoutMs = 3000) => {
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), timeoutMs);
                try {
                    const res = await fetch(urlToFetch, { signal: controller.signal });
                    if (!res.ok) throw new Error("Fetch failed");
                    const blob = await res.blob();
                    return URL.createObjectURL(blob);
                } finally {
                    clearTimeout(id);
                }
            };

            // Attempt 1: Direct fetch
            tryFetch(url, 2000)
                .then(blobUrl => applyImage(blobUrl, null))
                .catch(() => {
                    console.warn("Direct fetch failed, trying proxy 1...");
                    // Attempt 2: corsproxy.io
                    tryFetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, 3000)
                        .then(blobUrl => applyImage(blobUrl, null))
                        .catch(() => {
                            console.warn("Proxy 1 failed, trying proxy 2...");
                            // Attempt 3: allorigins
                            tryFetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, 3000)
                                .then(blobUrl => applyImage(blobUrl, null))
                                .catch(() => {
                                    console.warn("All proxies failed, falling back to direct image (saving will fail)");
                                    applyImage(url, "anonymous");
                                });
                        });
                });
        } else {
            applyImage(url, null);
        }

        return () => {
            if (typeof file !== 'string') {
                URL.revokeObjectURL(url);
            }
        };
    }, [file, isOpen]);

    const drawInitialImage = (img) => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !img) return;

        const ctx = canvas.getContext('2d');

        // Calculate aspect ratio to fit inside the container
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const imgRatio = img.width / img.height;
        const containerRatio = containerWidth / containerHeight;

        let drawWidth, drawHeight;
        if (imgRatio > containerRatio) {
            drawWidth = containerWidth;
            drawHeight = containerWidth / imgRatio;
        } else {
            drawHeight = containerHeight;
            drawWidth = containerHeight * imgRatio;
        }

        canvas.width = drawWidth;
        canvas.height = drawHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, drawWidth, drawHeight);

        // Setup initial drawing styles
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        // Get client coordinates whether it's a mouse or touch event
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault(); // Prevent scrolling on touch devices while drawing

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.closePath();
        setIsDrawing(false);
    };

    const handleClear = () => {
        if (imageObj) {
            drawInitialImage(imageObj);
        }
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            canvas.toBlob((blob) => {
                if (blob) {
                    // Create a new File object
                    const originalName = typeof file === 'string' ? 'edited_image.jpg' : file.name;
                    const newFile = new File([blob], originalName, { type: 'image/jpeg' });
                    onSave(newFile);
                }
            }, 'image/jpeg', 0.95);
        } catch (error) {
            console.error("Error saving image, likely due to CORS:", error);
            // Fallback to original file
            onSave(file);
            alert("Could not save edits due to cross-origin restrictions. The original image will be used.");
        }
    };

    // Update stroke style when color or line width changes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
        }
    }, [color, lineWidth]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] flex flex-col p-4 bg-white z-[100]">
                <DialogHeader className="flex flex-row justify-between items-center shrink-0">
                    <DialogTitle>Edit Image</DialogTitle>
                </DialogHeader>

                {/* Tools */}
                <div className="flex items-center gap-4 py-2 shrink-0 border-b">
                    <div className="flex gap-2">
                        {['#ff0000', '#000000', '#ffffff', '#0000ff', '#00ff00', '#ffff00'].map(c => (
                            <button
                                key={c}
                                className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-gray-500 scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                                onClick={() => setColor(c)}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <span className="text-sm font-medium">Thickness</span>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={lineWidth}
                            onChange={(e) => setLineWidth(parseInt(e.target.value))}
                            className="w-24"
                        />
                    </div>
                    <div className="ml-auto flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleClear}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                        </Button>
                    </div>
                </div>

                {/* Canvas Container */}
                <div
                    ref={containerRef}
                    className="flex-1 relative flex items-center justify-center bg-gray-100 overflow-hidden mt-4 rounded-md"
                >
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 z-10">
                            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-2" />
                            <p className="text-sm text-gray-500 font-medium">Loading image...</p>
                        </div>
                    )}
                    <canvas
                        ref={canvasRef}
                        className="cursor-crosshair shadow-sm border bg-transparent touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseOut={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
