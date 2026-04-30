"use client";

import { useRef, useState } from "react";
import { clsx } from "clsx";
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
    <div className="space-y-1">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>

      {value ? (
        <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{value.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {(value.fileSize / 1024).toFixed(0)} KB
            </p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="ml-2 shrink-0 text-xs text-destructive hover:underline"
              aria-label={`Remove ${label}`}
            >
              Remove
            </button>
          )}
        </div>
      ) : (
        <div
          className={clsx(
            "cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50",
            disabled && "pointer-events-none opacity-50",
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
          aria-label={`Upload ${label}`}
        >
          <p className="text-sm text-muted-foreground">
            {isUploading ? "Uploading…" : "Drop file here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">PDF, JPEG, PNG — max 10 MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="sr-only"
        onChange={onInputChange}
        disabled={disabled}
        aria-hidden="true"
      />

      {displayError && (
        <p role="alert" className="text-xs text-destructive">
          {displayError}
        </p>
      )}
    </div>
  );
}
