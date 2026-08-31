"use client";

import { useEffect, useMemo, useRef } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StagedAttachments({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Object URLs for image previews, revoked when the file list changes.
  const previews = useMemo(() => {
    const map = new Map<File, string>();
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        map.set(file, URL.createObjectURL(file));
      }
    }
    return map;
  }, [files]);

  useEffect(() => {
    return () => {
      for (const url of previews.values()) URL.revokeObjectURL(url);
    };
  }, [previews]);

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    onChange([...files, ...Array.from(list)]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file, i) => {
            const preview = previews.get(file);
            return (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt=""
                    className="size-8 shrink-0 rounded object-cover"
                  />
                ) : (
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-accent"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="size-4" />
        Add photos or files
      </Button>
      <p className="text-xs text-muted-foreground">
        Uploaded when you save the item.
      </p>
    </div>
  );
}
