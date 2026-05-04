"use client";

import { useRef, useState } from "react";
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from "@/lib/constants";

interface UploadedFile {
  storageKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface Props {
  label: string;
  documentType: string;
  value?: UploadedFile;
  onChange: (file: UploadedFile | null) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export function DocumentUploadCard({
  label,
  documentType,
  value,
  onChange,
  required,
  error,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const displayError = error ?? localError;

  async function handleFile(file: File) {
    setLocalError(null);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalError("File exceeds 10 MB limit.");
      return;
    }

    const allowedTypes = ALLOWED_MIME_TYPES as readonly string[];
    if (!allowedTypes.includes(file.type)) {
      setLocalError("Only PDF, JPEG, and PNG files are accepted.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const res = await fetch("/api/vault/upload", {
        method: "POST",
        body: formData,
      });

      const json = (await res.json()) as { storageKey?: string; error?: string };

      if (!res.ok || !json.storageKey) {
        setLocalError(json.error ?? "Upload failed. Please try again.");
        return;
      }

      onChange({
        storageKey: json.storageKey,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
    } catch {
      setLocalError("Network error during upload.");
    } finally {
      setIsUploading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  return (
    <div style={{ borderRadius: "10px", border: "2px solid #1B3A6B", overflow: "hidden", backgroundColor: "#fff" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#1B3A6B", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>
          {label}
          {required && <span style={{ marginLeft: "6px", color: "#fca5a5" }}>*</span>}
        </span>
        {value && (
          <svg style={{ width: "20px", height: "20px", color: "#4ade80" }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "16px" }}>
        {value ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: "6px", padding: "12px" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value.fileName}</p>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>
                {(value.fileSize / 1024).toFixed(0)} KB
              </p>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(null)}
                style={{
                  marginLeft: "12px",
                  padding: "4px 10px",
                  backgroundColor: "#fee2e2",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  color: "#dc2626",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
                aria-label={`Remove ${label}`}
              >
                Remove
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              cursor: disabled ? "not-allowed" : "pointer",
              borderRadius: "6px",
              border: isDragging ? "2px solid #1B3A6B" : "2px dashed #cbd5e1",
              padding: "24px",
              textAlign: "center",
              backgroundColor: isDragging ? "#f8fafc" : "#fff",
              transition: "all 0.2s",
              opacity: disabled ? 0.5 : 1,
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => !disabled && inputRef.current?.click()}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
            aria-label={`Upload ${label}`}
          >
            <svg style={{ width: "32px", height: "32px", color: "#64748b", margin: "0 auto 8px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p style={{ fontSize: "14px", color: "#0f172a", margin: 0, fontWeight: 500 }}>
              {isUploading ? "Uploading…" : "Drop file here or click to browse"}
            </p>
            <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", margin: "4px 0 0 0" }}>PDF, JPEG, PNG — max 10 MB</p>
          </div>
        )}

        {displayError && (
          <p role="alert" style={{ fontSize: "12px", color: "#dc2626", marginTop: "8px", margin: "8px 0 0 0" }}>
            {displayError}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={onInputChange}
        disabled={disabled}
        aria-hidden="true"
      />
    </div>
  );
}
