import React, { useRef, useState, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import { RotateCcw, Check, X } from "lucide-react";

interface SignatureCanvasComponentProps {
  onSave: (signature: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const SignatureCanvasComponent: React.FC<SignatureCanvasComponentProps> = ({
  onSave,
  onCancel,
  isLoading = false,
  className,
}) => {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = useCallback(() => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setIsEmpty(true);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (signatureRef.current && !isEmpty) {
      const signatureData = signatureRef.current.toDataURL("image/png");
      onSave(signatureData);
    }
  }, [isEmpty, onSave]);

  const handleSignatureEnd = useCallback(() => {
    if (signatureRef.current) {
      setIsEmpty(signatureRef.current.isEmpty());
    }
  }, []);

  return (
    <div className={`w-full ${className || ""}`}>
      <div className="mb-4">
        <p className="text-sm text-gray-600">Use your mouse or touch to draw your signature in the area below</p>
      </div>

      {/* Canvas Container */}
      <div className="relative mb-4 flex justify-start">
        <SignatureCanvas
          ref={signatureRef}
          canvasProps={{
            width: 300,
            height: 150,
            className: "signature-canvas border border-gray-200 rounded",
            style: { width: "430px", height: "150px", backgroundColor: "#fff" },
          }}
          onEnd={handleSignatureEnd}
          penColor="blue"
          backgroundColor="white"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between mb-4">
        <button
          onClick={handleClear}
          disabled={isEmpty || isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aces-green disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Clear
        </button>

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
            onClick={handleSave}
            disabled={isEmpty || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-aces-green border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aces-green disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            {isLoading ? "Saving..." : "Save Signature"}
          </button>
        </div>
      </div>
    </div>
  );
};
