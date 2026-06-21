"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AsyncComboboxProps<T> {
  value: string;
  onValueChange: (value: string) => void;
  onSearch: (query: string) => Promise<T[]>;
  onSelect: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
  getItemKey: (item: T) => string;
  placeholder?: string;
  id?: string;
}

// Deliberately NOT built on Radix Popover/Trigger. Wrapping a live text
// Input inside a Radix Trigger caused keystrokes to get swallowed in some
// browsers (the original Module 3 bug). This is a plain, manually
// positioned dropdown — a native <input> with zero wrapper magic, so
// typing can never be intercepted.
export function AsyncCombobox<T>({
  value,
  onValueChange,
  onSearch,
  onSelect,
  renderItem,
  getItemKey,
  placeholder,
  id,
}: AsyncComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const items = await onSearch(value);
      setResults(items);
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, open]);

  // Close the dropdown when clicking anywhere outside this component.
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onValueChange(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full min-w-[16rem] rounded-md border border-gray-200 bg-white shadow-md"
          )}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching...
            </div>
          ) : results.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-gray-500">
              No matches — you can type a new value.
            </p>
          ) : (
            <div className="max-h-56 overflow-y-auto p-1">
              {results.map((item) => (
                <button
                  key={getItemKey(item)}
                  type="button"
                  // onMouseDown (not onClick) fires before the input's onBlur,
                  // so the selection registers before the dropdown closes.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(item);
                    setOpen(false);
                  }}
                  className="flex w-full flex-col items-start rounded-sm px-2 py-2 text-left text-sm hover:bg-blue-50"
                >
                  {renderItem(item)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
