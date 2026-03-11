import { useState, useCallback, useId } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon, Edit, AlertTriangle } from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";
import { useToast } from "@/hooks/use-toast";
import ImageCropDialog from "@/components/ImageCropDialog";

interface ImageMetadata {
  url: string;
  width: number;
  height: number;
  size: number;
}

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  maxImages?: number;
  disabled?: boolean;
}

export default function ImageUpload({ 
  value = [], 
  onChange, 
  multiple = false, 
  maxImages = 10,
  disabled = false
}: ImageUploadProps) {
  const uniqueId = useId();
  const fileInputId = `file-upload-${uniqueId}`;
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageMetadata, setImageMetadata] = useState<Map<string, ImageMetadata>>(new Map());
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");
  const [cropImageIndex, setCropImageIndex] = useState<number>(-1);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes

  // Get image dimensions from file
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Upload function - uploads to server and returns persistent path
  const uploadImage = async (file: File): Promise<ImageMetadata> => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File "${file.name}" exceeds 20MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Get image dimensions
    const dimensions = await getImageDimensions(file);
    
    // Upload file to server
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    
    return {
      url: data.path, // Use server path instead of blob URL
      width: dimensions.width,
      height: dimensions.height,
      size: file.size,
    };
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const uploadResults = await Promise.all(
        fileArray.map(async (file) => {
          try {
            return await uploadImage(file);
          } catch (error) {
            toast({
              title: "Upload failed",
              description: error instanceof Error ? error.message : "Failed to upload image",
              variant: "destructive",
            });
            return null;
          }
        })
      );

      const successfulUploads = uploadResults.filter((result): result is ImageMetadata => result !== null);
      
      if (successfulUploads.length > 0) {
        const newMetadata = new Map(imageMetadata);
        successfulUploads.forEach(metadata => {
          newMetadata.set(metadata.url, metadata);
        });
        setImageMetadata(newMetadata);

        const newUrls = successfulUploads.map(m => m.url);
        
        if (multiple) {
          const currentUrls = Array.isArray(value) ? value : [];
          const combinedUrls = [...currentUrls, ...newUrls].slice(0, maxImages);
          onChange(combinedUrls);
        } else {
          onChange([newUrls[0]]);
        }
        
        toast({
          title: "Upload successful",
          description: `${successfulUploads.length} image(s) uploaded`,
        });
      }
    } catch (error) {
      console.error("Failed to upload images:", error);
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [value, onChange, multiple, maxImages, imageMetadata, toast]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const handleEditImage = (url: string, index: number) => {
    setImageToCrop(url);
    setCropImageIndex(index);
    setIsCropDialogOpen(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsCropDialogOpen(false);
    setUploading(true);
    
    try {
      const file = new File([croppedBlob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const metadata = await uploadImage(file);
      
      const newMetadata = new Map(imageMetadata);
      newMetadata.set(metadata.url, metadata);
      setImageMetadata(newMetadata);

      const newUrls = [...value];
      newUrls[cropImageIndex] = metadata.url;
      onChange(newUrls);
      
      toast({ title: "Image cropped and uploaded successfully" });
    } catch (error) {
      toast({
        title: "Crop failed",
        description: error instanceof Error ? error.message : "Failed to crop image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const currentImages = Array.isArray(value) ? value : [];
  const canUploadMore = multiple ? currentImages.length < maxImages : currentImages.length === 0;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canUploadMore && !disabled && (
        <Card
          className={`border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          data-testid="image-upload-area"
        >
          <CardContent className="flex flex-col items-center justify-center py-12 px-6">
            <h3 className="text-lg font-light mb-2">
              {uploading ? "Uploading..." : "Upload Images"}
            </h3>
            
            <p className="text-sm text-muted-foreground text-center mb-4">
              Drag and drop your images here, or click to browse
            </p>
            
            <input
              type="file"
              id={fileInputId}
              className="hidden"
              accept="image/*"
              multiple={multiple}
              onChange={handleFileInputChange}
              disabled={uploading || disabled}
            />
            
            <Button
              variant="outline"
              type="button"
              disabled={uploading || disabled}
              data-testid="button-browse-images"
              onClick={() => document.getElementById(fileInputId)?.click()}
            >
              {uploading ? "Uploading..." : "Browse Images"}
            </Button>

            {multiple && (
              <p className="text-xs text-muted-foreground mt-2">
                {currentImages.length} of {maxImages} images uploaded
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Images */}
      {currentImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-light">Uploaded Images</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {currentImages.map((url, index) => {
              const metadata = imageMetadata.get(url);
              const isBroken = brokenImages.has(url);
              return (
                <div key={index} className="space-y-1">
                  <div
                    className={`relative group rounded-lg overflow-hidden bg-muted aspect-square ${isBroken ? 'border-2 border-red-500/50' : ''}`}
                    data-testid={`image-preview-${index}`}
                  >
                    {isBroken ? (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-red-400 p-2">
                        <AlertTriangle className="w-8 h-8 mb-2" />
                        <div className="text-xs text-center">Broken Image</div>
                        <div className="text-xs text-center text-gray-500 mt-1">Click X to remove</div>
                      </div>
                    ) : (
                      <OptimizedImage
                        src={url}
                        alt={`Upload ${index + 1}`}
                        width={200}
                        height={200}
                        wrapperClassName="w-full h-full"
                        className="w-full h-full"
                        sizes="200px"
                        onError={() => {
                          setBrokenImages(prev => new Set(prev).add(url));
                        }}
                      />
                    )}
                    
                    {!disabled && (
                      <div className={`absolute top-2 right-2 flex gap-2 transition-opacity ${isBroken ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {!isBroken && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleEditImage(url, index)}
                            className="h-8 w-8 p-0 bg-black/80 backdrop-blur-sm text-white border border-white/20 hover:bg-black/90 hover:border-[#D4AF37]/50 shadow-xl transition-all"
                            data-testid={`button-edit-image-${index}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className={`h-8 w-8 p-0 backdrop-blur-sm text-white border shadow-xl transition-all ${isBroken ? 'bg-red-600 border-red-500 hover:bg-red-700' : 'bg-black/80 border-white/20 hover:bg-black/90 hover:border-red-500/50'}`}
                          data-testid={`button-remove-image-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {metadata && !isBroken && (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div className="font-medium">
                        {metadata.width} × {metadata.height} px
                      </div>
                      <div>
                        {(metadata.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Supported formats: JPG, PNG, GIF, WebP</p>
        <p>• Maximum file size: 20MB per image</p>
        <p>• Recommended dimensions: 1200x800px or higher</p>
        {multiple && <p>• You can upload up to {maxImages} images</p>}
      </div>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={isCropDialogOpen}
        onClose={() => setIsCropDialogOpen(false)}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
      />
    </div>
  );
}
