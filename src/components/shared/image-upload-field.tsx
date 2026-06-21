"use client";

import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_SIZE_BYTES = 500 * 1024; // 500KB

interface ImageUploadFieldProps {
  label: string;
  value: string | null | undefined;
  onChange: (dataUrl: string | null) => void;
  shape?: "circle" | "square";
}

export function ImageUploadField({ label, value, onChange, shape = "circle" }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      alert("Image is too large. Please choose an image under 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="flex items-center gap-4">
        <div
          className={`flex h-16 w-16 items-center justify-center overflow-hidden border border-gray-200 bg-gray-50 ${
            shape === "circle" ? "rounded-full" : "rounded-md"
          }`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <Upload className="h-5 w-5 text-gray-300" />
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Upload
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <X className="mr-1 h-3 w-3" /> Remove
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
}
