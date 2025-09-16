import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pen, Upload, Trash2, FileSignature, AlertCircle, CheckCircle } from "lucide-react";
import { SignatureCanvasComponent } from "./SignatureCanvas";
import { SignatureUpload } from "./SignatureUpload";
import { signatureApi } from "../../services/api";

interface Signature {
  type: "canvas" | "upload";
  data?: string;
  url?: string;
  originalName?: string;
  createdAt: string;
}

export const SignatureManager: React.FC = () => {
  const [signature, setSignature] = useState<Signature | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMethod, setActiveMethod] = useState<"canvas" | "upload">("canvas");
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadSignature();
  }, []);

  // Auto-dismiss messages after some time
  useEffect(() => {
    if (message) {
      const timer = setTimeout(
        () => {
          setMessage(null);
        },
        message.type === "success" ? 3000 : 5000
      );
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadSignature = async () => {
    try {
      setIsLoading(true);
      const response = await signatureApi.getSignature();
      if (response.data.signature) {
        setSignature(response.data.signature);
      }
    } catch (error: any) {
      console.error("Error loading signature:", error);
      if (error.response?.status !== 404) {
        setMessage({
          type: "error",
          text: "Failed to load signature",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCanvasSave = async (signatureData: string) => {
    try {
      setIsLoading(true);
      await signatureApi.saveSignature({
        type: "canvas",
        data: signatureData,
      });

      setSignature({
        type: "canvas",
        data: signatureData,
        createdAt: new Date().toISOString(),
      });

      setIsEditing(false);
      setMessage({
        type: "success",
        text: "Signature saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving signature:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to save signature",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      const response = await signatureApi.uploadSignature(file);

      setSignature({
        type: "upload",
        url: response.data.signature.url,
        originalName: file.name,
        createdAt: response.data.signature.createdAt,
      });

      setIsEditing(false);
      setMessage({
        type: "success",
        text: "Signature uploaded successfully",
      });
    } catch (error: any) {
      console.error("Error uploading signature:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to upload signature",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!signature) return;

    try {
      setIsLoading(true);
      await signatureApi.deleteSignature();
      setSignature(null);
      setIsEditing(false);
      setMessage({
        type: "success",
        text: "Signature deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting signature:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete signature",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      {/* Message Alert */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`p-4 rounded-lg mb-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <div className="flex items-center">
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        </motion.div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-aces-green" />
          Digital Signature
        </h3>
        <p className="text-sm text-gray-600 mt-2">Add your signature to be included in generated documents</p>
      </div>

      {/* Current Signature Display */}
      {signature && !isEditing && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Signature saved
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600">
                <p>Type: {signature.type === "canvas" ? "Digital Drawing" : "Uploaded Image"}</p>
                <p>Created: {formatDate(signature.createdAt)}</p>
                {signature.originalName && <p>File: {signature.originalName}</p>}
              </div>
            </div>

            <div className="flex justify-start mb-4 p-4 bg-white rounded">
              {signature.type === "canvas" && signature.data ? (
                <img src={signature.data} alt="Your signature" className="max-h-24 max-w-full object-contain" />
              ) : signature.type === "upload" && signature.url ? (
                <img src={signature.url} alt="Your signature" className="max-h-24 max-w-full object-contain" />
              ) : null}
            </div>

            <div className="flex gap-2 justify-start">
              <button
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aces-green disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Edit Signature
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Signature or Editing State */}
      {(!signature || isEditing) && (
        <div className="space-y-4">
          {!signature && (
            <div className="flex items-center gap-2 text-sm text-amber-600 mb-4">
              <AlertCircle className="h-4 w-4" />
              No signature found. Add one to include it in your documents.
            </div>
          )}

          {/* Method Selection Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveMethod("canvas")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                activeMethod === "canvas" ? "bg-aces-green text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Pen className="h-4 w-4" />
              Draw Signature
            </button>
            <button
              onClick={() => setActiveMethod("upload")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                activeMethod === "upload" ? "bg-aces-green text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload Image
            </button>
          </div>

          {/* Method Content */}
          {activeMethod === "canvas" ? (
            <SignatureCanvasComponent
              onSave={handleCanvasSave}
              onCancel={signature ? () => setIsEditing(false) : undefined}
              isLoading={isLoading}
            />
          ) : (
            <SignatureUpload
              onUpload={handleFileUpload}
              onCancel={signature ? () => setIsEditing(false) : undefined}
              isLoading={isLoading}
            />
          )}
        </div>
      )}
    </motion.div>
  );
};
