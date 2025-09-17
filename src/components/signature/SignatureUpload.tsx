import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import type { FileRejection } from "react-dropzone";
import { Upload, Image, Check, X, AlertCircle } from "lucide-react";

interface SignatureUploadProps {
  onUpload: (file: File) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const SignatureUpload: React.FC<SignatureUploadProps> = ({
  onUpload,
  onCancel,
  isLoading = false,
  className,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setError(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors.some((e) => e.code === "file-too-large")) {
        setError("File is too large. Maximum size is 5MB.");
      } else if (rejection.errors.some((e) => e.code === "file-invalid-type")) {
        setError("Invalid file type. Please select an image file.");
      } else {
        setError("File upload failed. Please try again.");
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  const handleUpload = useCallback(() => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  }, [selectedFile, onUpload]);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
  }, [previewUrl]);

  return (
    <div className={`w-full ${className || ""}`}>
      <div className="text-center mb-4">
        <h4 className="text-md font-medium text-gray-900 flex items-center justify-center gap-2 mb-2">
          <Upload className="h-4 w-4" />
          Upload Signature Image
        </h4>
        <p className="text-sm text-gray-600">Upload a photo or scan of your handwritten signature</p>
      </div>

      {/* Upload Area */}
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4 ${
            isDragActive && !isDragReject ? "border-aces-green bg-green-50" : ""
          } ${isDragReject ? "border-red-500 bg-red-50" : ""} ${
            !isDragActive ? "border-gray-300 hover:border-gray-400 hover:bg-gray-50" : ""
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Image className="h-12 w-12 text-gray-400" />
            {isDragActive ? (
              isDragReject ? (
                <p className="text-red-600">Invalid file type</p>
              ) : (
                <p className="text-aces-green">Drop your signature image here</p>
              )
            ) : (
              <>
                <p className="text-lg font-medium text-gray-900">Drag & drop your signature image</p>
                <p className="text-sm text-gray-600">or click to browse files</p>
              </>
            )}
          </div>
        </div>
      ) : (
        // Preview Area
        <div className="space-y-4 mb-4">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Selected file:</span>
              <button
                onClick={handleClear}
                disabled={isLoading}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </p>

            {previewUrl && (
              <div className="flex justify-center">
                <img
                  src={previewUrl}
                  alt="Signature preview"
                  className="max-h-32 max-w-full object-contain border border-gray-200 rounded bg-white p-2"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg mb-4">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between mb-4">
        <div className="text-xs text-gray-600">
          <p>Supported: PNG, JPG, JPEG, GIF, BMP, WebP</p>
          <p>Maximum size: 5MB</p>
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aces-green disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-aces-green border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aces-green disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            {isLoading ? "Uploading..." : "Upload Signature"}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-600 text-center space-y-1">
        <p>• For best results, use a white background</p>
        <p>• Ensure your signature is clearly visible and not blurry</p>
        <p>• Crop the image to show only your signature</p>
      </div>
    </div>
  );
};
