"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "@/app/_trpc/client";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

// ledtyp is now a free string that stores the sysledcd value from mstsyslednfo
type LedStatus = "ACTIVE" | "INACTIVE" | "LOCKED";
type PayType = "CASH" | "CHEQUE" | "A/C TRANSFER" | "RTGS" | "DD";

// sysledcds for which contact/address/payment/tax sections are hidden
// (same behaviour as the old "OTHERS" type — update this list as needed)
const OTHERS_SYSLEDCDS = [
  "1",
  "2",
  "3",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "27",
  "28",
];

interface SysLedger {
  sysledcd: string;
  syslednm: string;
}

interface LedgerCategory {
  ledctcd: string;
  ledctnm: string;
  ledgrpnm?: string;
  ledgrptyp?: string;
  itmcomnm?: string;
}

interface FormState {
  lednm: string;
  ledrptnm: string;
  ledchqnm: string;
  buntcd: string;
  ledcrtdt: string;
  ledtyp: string; // stores sysledcd
  roundoff: "Yes" | "No";
  exmpt: "Yes" | "No";
  ledsts: LedStatus;
  categories: LedgerCategory[];
  applicableUnits: string[];
  pcatcd: string;
  per1prfx: string;
  ctper1: string;
  cntno1: string;
  per2prfx: string;
  ctper2: string;
  cntno2: string;
  ledadr1: string;
  areacd: string;
  ctycd: string;
  bilstcd: string;
  pincd: string;
  empcd: string;
  ledadr2: string;
  ctycd2: string;
  shpstcd: string;
  pincd2: string;
  paytyp: PayType;
  bnkledcd: string;
  accno: string;
  rtgsno: string;
  paystncd: string;
  aadharno: string;
  aadharphoto: string;
  panno: string;
  pancardphoto: string;
  pandt: string;
  tanno: string;
  tandt: string;
  stxno: string;
  gstcertphoto: string;
  stxdt: string;
  lmtamt: string;
  consdays: string;
}

const defaultForm: FormState = {
  lednm: "",
  ledrptnm: "",
  ledchqnm: "",
  buntcd: "",
  ledcrtdt: new Date().toISOString().slice(0, 10),
  ledtyp: "", // empty until user picks from combobox
  roundoff: "No",
  exmpt: "No",
  ledsts: "ACTIVE",
  categories: [],
  applicableUnits: [],
  pcatcd: "",
  per1prfx: "",
  ctper1: "",
  cntno1: "",
  per2prfx: "",
  ctper2: "",
  cntno2: "",
  ledadr1: "",
  areacd: "",
  ctycd: "",
  bilstcd: "",
  pincd: "",
  empcd: "",
  ledadr2: "",
  ctycd2: "",
  shpstcd: "",
  pincd2: "",
  paytyp: "CASH",
  bnkledcd: "",
  accno: "",
  rtgsno: "",
  paystncd: "",
  aadharno: "",
  aadharphoto: "",
  panno: "",
  pancardphoto: "",
  pandt: "",
  tanno: "",
  tandt: "",
  stxno: "",
  gstcertphoto: "",
  stxdt: "",
  lmtamt: "",
  consdays: "",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toDateStr(val: unknown): string {
  if (!val) return "";
  try {
    return new Date(val as string).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function buildDocFilename(
  ledcd: string,
  docLabel: "AADHAR" | "PANCARD" | "GST",
): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const safeLedcd = (ledcd || "NEW").replace(/[^a-zA-Z0-9]/g, "");
  return `${safeLedcd}-${docLabel}-${dd}${mm}${yyyy}`;
}

// ─── Custom Combobox ──────────────────────────────────────────────────────────

interface CustomComboboxProps<T> {
  items: T[];
  value: T | null;
  onValueChange: (val: T | null) => void;
  getLabel: (item: T) => string;
  getKey: (item: T) => string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
}

function CustomCombobox<T>({
  items,
  value,
  onValueChange,
  getLabel,
  getKey,
  placeholder = "Select…",
  disabled = false,
  hasError = false,
}: CustomComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        setOpen(false);
        setQuery("");
        setHighlightedIndex(0);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? items.filter((item) =>
        getLabel(item).toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-index="${highlightedIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const displayValue = value ? getLabel(value) : "";

  const handleSelect = (item: T) => {
    onValueChange(item);
    setOpen(false);
    setQuery("");
    setHighlightedIndex(0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!open) setOpen(true);
    if (e.target.value === "") onValueChange(null);
  };

  const handleFocus = () => {
    setOpen(true);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightedIndex])
          handleSelect(filtered[highlightedIndex]);
        break;
      case "Escape":
        setOpen(false);
        setQuery("");
        setHighlightedIndex(0);
        break;
    }
  };

  const dropdown = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={listRef}
          style={dropdownStyle}
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.12 }}
          className="bg-white border border-[#E8E6E1] rounded-xl shadow-lg overflow-hidden"
        >
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-[12px] text-[#ccc] text-center">
                No results found
              </div>
            ) : (
              filtered.map((item, idx) => {
                const isSelected = value
                  ? getKey(value) === getKey(item)
                  : false;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={getKey(item)}
                    data-index={idx}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-[12px] transition-colors duration-75 flex items-center gap-2",
                      isSelected
                        ? "bg-[#1a1a1a] text-white"
                        : isHighlighted
                          ? "bg-[#F5F4F0] text-[#1a1a1a]"
                          : "text-[#1a1a1a]",
                    )}
                  >
                    <span className="w-3 shrink-0">
                      {isSelected && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 14 14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M2 7l3.5 3.5L12 3" />
                        </svg>
                      )}
                    </span>
                    {getLabel(item)}
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          value={open ? query : displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full h-9 px-3 pr-8 text-[13px] rounded-lg border bg-white text-[#1a1a1a] placeholder:text-[#ccc]",
            "transition-all duration-150 outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            hasError
              ? "border-red-300 bg-red-50/40"
              : "border-[#E8E6E1] hover:border-[#ccc]",
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setOpen((o) => !o);
            if (!open) inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#ccc] hover:text-[#999] transition-colors disabled:pointer-events-none"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className={cn(
              "transition-transform duration-150",
              open && "rotate-180",
            )}
          >
            <path d="M2 5l5 5 5-5" />
          </svg>
        </button>
      </div>
      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}

// ─── Upload hook ───────────────────────────────────────────────────────────────

function useDocUpload(
  ledcd: string | null,
  docLabel: "AADHAR" | "PANCARD" | "GST",
  fieldKey: string,
  onSuccess: (url: string) => void,
) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef: any = useRef<HTMLInputElement>(null);

  const trigger = () => inputRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const stem = buildDocFilename(ledcd ?? "NEW", docLabel);
      const renamedFile = new File([file], `${stem}.${ext}`, {
        type: file.type,
      });
      const fd = new FormData();
      fd.append("file", renamedFile);
      fd.append("fieldKey", fieldKey);
      fd.append("ledcd", ledcd ?? "NEW");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onSuccess(data.url as string);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return { inputRef, trigger, uploading, uploadError, handleChange };
}

// ─── Doc upload button ─────────────────────────────────────────────────────────

function DocUploadButton({
  url,
  uploading,
  uploadError,
  onTrigger,
  onClear,
  inputRef,
  onInputChange,
  accept = "image/jpeg,image/png,image/webp,application/pdf",
}: {
  url: string;
  uploading: boolean;
  uploadError: string | null;
  onTrigger: () => void;
  onClear: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
}) {
  const hasDoc = !!url;
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onInputChange}
      />
      {hasDoc && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E8E6E1] bg-white text-[#aaa] hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50 transition-all duration-150"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M7 2C4 2 1.5 7 1.5 7S4 12 7 12s5.5-5 5.5-5S10 2 7 2z" />
            <circle cx="7" cy="7" r="1.5" />
          </svg>
        </a>
      )}
      <button
        type="button"
        onClick={onTrigger}
        disabled={uploading}
        className={cn(
          "w-9 h-9 flex items-center justify-center rounded-lg border transition-all duration-150",
          uploading
            ? "border-[#E8E6E1] bg-[#FAFAF9] text-[#ccc] cursor-wait"
            : hasDoc
              ? "border-amber-200 bg-amber-50 text-amber-500 hover:bg-amber-100"
              : "border-[#E8E6E1] bg-white text-[#aaa] hover:border-[#1a1a1a]/20 hover:text-[#555] hover:bg-[#F5F4F0]",
        )}
      >
        {uploading ? (
          <svg
            className="animate-spin"
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M7 1a6 6 0 1 0 6 6" />
          </svg>
        ) : hasDoc ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M1 7a6 6 0 1 0 6-6" />
            <path d="M4 1l3 3-3 3" />
          </svg>
        ) : (
          <svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M7 9V2M4 5l3-3 3 3" />
            <path d="M1.5 11.5h11" />
          </svg>
        )}
      </button>
      {hasDoc && !uploading && (
        <button
          type="button"
          onClick={onClear}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E8E6E1] bg-white text-[#ccc] hover:border-red-200 hover:text-red-400 hover:bg-red-50 transition-all duration-150"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      )}
      {uploadError && (
        <span className="text-[10px] text-red-400 max-w-[120px] leading-tight">
          {uploadError}
        </span>
      )}
    </div>
  );
}

// ─── Doc pill ──────────────────────────────────────────────────────────────────

function DocPill({
  url,
  label,
}: {
  url: string | null | undefined;
  label: string;
}) {
  if (!url)
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-[#ccc] border border-dashed border-[#E8E6E1]">
        {label}
      </span>
    );
  const isPdf = url.endsWith(".pdf");
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-all duration-100",
        isPdf
          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100",
      )}
    >
      {label}
    </a>
  );
}

// ─── Shared UI ─────────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  icon,
}: {
  title: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center gap-2">
      {icon && (
        <div className="w-4 h-4 text-[#aaa] flex items-center justify-center">
          {icon}
        </div>
      )}
      <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#888]">
        {title}
      </span>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = (hasError?: boolean) =>
  cn(
    "w-full h-9 px-3 text-[13px] bg-white border rounded-lg text-[#1a1a1a] placeholder:text-[#ccc]",
    "focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150",
    hasError
      ? "border-red-300 bg-red-50/30"
      : "border-[#E8E6E1] hover:border-[#ccc]",
  );

const selectCls = cn(
  "w-full h-9 px-3 text-[13px] bg-white border border-[#E8E6E1] rounded-lg text-[#1a1a1a]",
  "hover:border-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]",
  "transition-all duration-150 cursor-pointer",
);

// ─── Tree components ───────────────────────────────────────────────────────────

function TreeCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e) => e.key === " " && onChange()}
      className={cn(
        "w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-all duration-100 outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a1a]/20",
        checked || indeterminate
          ? "bg-[#1a1a1a] border-[#1a1a1a]"
          : "bg-white border-[#D8D6D1] hover:border-[#aaa]",
      )}
    >
      {checked && (
        <svg
          width="8"
          height="8"
          viewBox="0 0 10 10"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M1.5 5l2.5 2.5L8.5 2" />
        </svg>
      )}
      {!checked && indeterminate && (
        <svg
          width="8"
          height="2"
          viewBox="0 0 8 2"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M1 1h6" />
        </svg>
      )}
    </div>
  );
}

function StateNode({
  label,
  checked,
  indeterminate,
  onToggle,
  children,
}: {
  label: string;
  checked: boolean;
  indeterminate: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-1.5 py-1">
        <button
          onClick={() => setOpen((p) => !p)}
          className="w-4 h-4 flex items-center justify-center text-[#bbb] hover:text-[#888] transition-colors shrink-0"
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={cn(
              "transition-transform duration-150",
              open ? "rotate-90" : "rotate-0",
            )}
          >
            <path d="M2 1l4 3-4 3" />
          </svg>
        </button>
        <TreeCheckbox
          checked={checked}
          indeterminate={indeterminate}
          onChange={onToggle}
        />
        <svg
          width="13"
          height="13"
          viewBox="0 0 14 14"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M1 3.5A1.5 1.5 0 012.5 2h2.586a1 1 0 01.707.293L6.5 3.5H11.5A1.5 1.5 0 0113 5v6a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 011 11V3.5z"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="0.5"
          />
        </svg>
        <span className="text-[12px] font-semibold text-[#333] tracking-[0.03em] uppercase select-none">
          {label}
        </span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="overflow-hidden pl-5 border-l border-[#F0EDE8] ml-[7px]"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CityNode({
  label,
  checked,
  indeterminate,
  onToggle,
  children,
}: {
  label: string;
  checked: boolean;
  indeterminate: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-0.5">
      <div className="flex items-center gap-1.5 py-0.5">
        <button
          onClick={() => setOpen((p) => !p)}
          className="w-4 h-4 flex items-center justify-center text-[#ccc] hover:text-[#999] transition-colors shrink-0"
        >
          <svg
            width="7"
            height="7"
            viewBox="0 0 8 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={cn(
              "transition-transform duration-150",
              open ? "rotate-90" : "rotate-0",
            )}
          >
            <path d="M2 1l4 3-4 3" />
          </svg>
        </button>
        <TreeCheckbox
          checked={checked}
          indeterminate={indeterminate}
          onChange={onToggle}
        />
        <svg
          width="11"
          height="11"
          viewBox="0 0 14 14"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M1 3.5A1.5 1.5 0 012.5 2h2.586a1 1 0 01.707.293L6.5 3.5H11.5A1.5 1.5 0 0113 5v6a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 011 11V3.5z"
            fill="#A5F3FC"
            stroke="#0891B2"
            strokeWidth="0.5"
          />
        </svg>
        <span className="text-[12px] font-medium text-[#555] select-none">
          {label}
        </span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.12, ease: "easeInOut" }}
            className="overflow-hidden pl-5 border-l border-[#F5F4F0] ml-[7px]"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UnitLeaf({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center gap-2 py-0.5 mt-0.5 cursor-pointer group">
      <svg
        width="10"
        height="10"
        viewBox="0 0 14 14"
        fill="none"
        className="shrink-0 text-[#ccc]"
      >
        <rect
          x="2"
          y="1"
          width="10"
          height="12"
          rx="1"
          fill="white"
          stroke="#D1D5DB"
          strokeWidth="1"
        />
        <path
          d="M4 4h6M4 7h6M4 10h4"
          stroke="#D1D5DB"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </svg>
      <TreeCheckbox checked={checked} onChange={onToggle} />
      <span className="text-[12px] text-[#666] group-hover:text-[#1a1a1a] transition-colors duration-100 select-none">
        {label}
      </span>
    </label>
  );
}

// ─── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({
  ledgerName,
  onConfirm,
  onCancel,
  isPending,
}: {
  ledgerName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 4 }}
        transition={{ duration: 0.15 }}
        className="relative bg-white rounded-xl border border-[#E8E6E1] shadow-xl p-6 w-85 flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M7 2v5M7 10v.5" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#1a1a1a]">
              Delete ledger?
            </p>
            <p className="text-[12px] text-[#999] mt-1 leading-relaxed">
              <span className="font-medium text-[#555]">{ledgerName}</span> will
              be permanently removed along with all its categories and unit
              links.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-8 px-4 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="h-8 px-4 text-[12px] font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-150"
          >
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function LedgerPanelContent() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [editingLedcd, setEditingLedcd] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    ledcd: string;
    lednm: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLedCtcd, setSelectedLedCtcd] = useState("");
  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [dupWarningDismissed, setDupWarningDismissed] = useState(false);
  const [debouncedLednm, setDebouncedLednm] = useState("");

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (form.lednm.trim().length < 2) {
      setDebouncedLednm("");
      return;
    }
    const t = setTimeout(() => setDebouncedLednm(form.lednm.trim()), 450);
    return () => clearTimeout(t);
  }, [form.lednm]);

  useEffect(() => {
    setDupWarningDismissed(false);
  }, [debouncedLednm]);

  const { data: dupData, isFetching: isDupFetching } =
    trpc.ledger.checkDuplicates.useQuery(
      { name: debouncedLednm, excludeLedcd: editingLedcd ?? undefined },
      { enabled: debouncedLednm.length >= 2, staleTime: 10_000 },
    );
  const dupMatches = dupData?.matches ?? [];
  const showDupWarning = !dupWarningDismissed && dupMatches.length > 0;
  const isSearching =
    (form.lednm.trim().length >= 2 && form.lednm.trim() !== debouncedLednm) ||
    isDupFetching;
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const { data: supportData } = trpc.ledgerSupport.getSupportData.useQuery();
  const units = supportData?.units ?? [];
  const cities = supportData?.cities ?? [];
  const states = supportData?.states ?? [];
  const ledgerAccountTypes = supportData?.ledgerAccountTypes ?? [];
  const partyCategories = supportData?.partyCategories ?? [];
  const areas = supportData?.areas ?? [];
  const employees = supportData?.employees ?? [];
  const stations = supportData?.stations ?? [];
  // ── sysLedgers drives the Ledger Type combobox ────────────────────────────
  const sysLedgers = (supportData?.sysLedgers ?? []) as SysLedger[];

  const { data: ledgerData, refetch } = trpc.ledger.getAll.useQuery({
    limit: PAGE_SIZE,
    offset: (currentPage - 1) * PAGE_SIZE,
    search: searchQuery || undefined,
  });
  const items = ledgerData?.items ?? [];
  const totalCount = ledgerData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const { data: editingLedger, isLoading: isLoadingEdit } =
    trpc.ledger.getById.useQuery(
      { ledcd: editingLedcd! },
      { enabled: !!editingLedcd, staleTime: 0 },
    );

  useEffect(() => {
    if (!editingLedger || !editingLedcd) return;
    const l = editingLedger;
    const categories: LedgerCategory[] = (l.categories ?? []).map(
      (cat: { ledctcd: string }) => {
        const type = ledgerAccountTypes.find((t) => t.ledctcd === cat.ledctcd);
        return {
          ledctcd: cat.ledctcd,
          ledctnm: type?.ledctnm ?? cat.ledctcd,
          ledgrpnm: type?.ledgrpcd ?? undefined,
          ledgrptyp: undefined,
          itmcomnm: type?.itmcomcd ?? undefined,
        };
      },
    );
    setForm({
      lednm: l.lednm ?? "",
      ledrptnm: l.ledrptnm ?? "",
      ledchqnm: l.ledchqnm ?? "",
      buntcd: l.buntcd ?? "",
      ledcrtdt: toDateStr(l.ledcrtdt),
      // ledtyp is now the raw sysledcd stored in the DB
      ledtyp: l.ledtyp ?? "",
      roundoff: l.rof === 1 ? "Yes" : "No",
      exmpt: (l.exmpt as "Yes" | "No") ?? "No",
      ledsts: (l.ledsts as LedStatus) ?? "ACTIVE",
      categories,
      applicableUnits: l.applicableUnits ?? [],
      pcatcd: l.pcatcd ?? "",
      per1prfx: l.per1prfx ?? "",
      ctper1: l.ctper1 ?? "",
      cntno1: l.cntno1 ?? "",
      per2prfx: l.per2prfx ?? "",
      ctper2: l.ctper2 ?? "",
      cntno2: l.cntno2 ?? "",
      ledadr1: l.ledadr1 ?? "",
      areacd: l.areacd ?? "",
      ctycd: l.ctycd ?? "",
      bilstcd: l.loccd ?? "",
      pincd: l.pincd ?? "",
      empcd: l.empcd ?? "",
      ledadr2: l.ledadr2 ?? "",
      ctycd2: l.ctycd2 ?? "",
      shpstcd: "",
      pincd2: l.pincd2 ?? "",
      paytyp: (l.paytyp as PayType) ?? "CASH",
      bnkledcd: l.bnkledcd ?? "",
      accno: l.accno ?? "",
      rtgsno: l.rtgsno ?? "",
      paystncd: l.paystncd ?? "",
      aadharno: (l as any).aadharno ?? "",
      aadharphoto: (l as any).aadharphoto ?? "",
      panno: l.panno ?? "",
      pancardphoto: (l as any).pancardphoto ?? "",
      pandt: toDateStr(l.pandt),
      tanno: l.tanno ?? "",
      tandt: toDateStr(l.tandt),
      stxno: l.stxno ?? "",
      gstcertphoto: (l as any).gstcertphoto ?? "",
      stxdt: toDateStr(l.stxdt),
      lmtamt: l.lmtamt != null ? String(l.lmtamt) : "",
      consdays: l.consdays != null ? String(l.consdays) : "",
    });
    setErrors({});
    setSelectedLedCtcd("");
  }, [editingLedger, ledgerAccountTypes, editingLedcd]);

  const aadharUpload = useDocUpload(
    editingLedcd,
    "AADHAR",
    "aadharphoto",
    (url) => set("aadharphoto", url),
  );
  const panUpload = useDocUpload(
    editingLedcd,
    "PANCARD",
    "pancardphoto",
    (url) => set("pancardphoto", url),
  );
  const gstUpload = useDocUpload(editingLedcd, "GST", "gstcertphoto", (url) =>
    set("gstcertphoto", url),
  );

  const createMutation = trpc.ledger.create.useMutation({
    onSuccess: () => {
      showToast("success", "Ledger created successfully");
      resetForm();
      refetch();
    },
    onError: (err) => showToast("error", err.message),
  });
  const updateMutation = trpc.ledger.update.useMutation({
    onSuccess: () => {
      showToast("success", "Ledger updated successfully");
      resetForm();
      refetch();
    },
    onError: (err) => showToast("error", err.message),
  });
  const deleteMutation = trpc.ledger.delete.useMutation({
    onSuccess: () => {
      showToast("success", "Ledger deleted");
      setDeleteTarget(null);
      refetch();
    },
    onError: (err) => showToast("error", err.message),
  });

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setErrors({});
    setEditingLedcd(null);
    setSelectedLedCtcd("");
    setDupWarningDismissed(false); // ← add this
    setDebouncedLednm("");
  };

  const handleAreaSelect = (
    area: {
      areacd: string;
      areanm: string;
      areactycd: string;
      zipcd: string;
    } | null,
    target: "billing" | "shipping",
  ) => {
    if (!area) return;
    const city = cities.find((c) => c.ctycd === area.areactycd);
    const state = city
      ? states.find((s) => s.stcd === city.ctystcd)
      : undefined;
    if (target === "billing") {
      setForm((prev) => ({
        ...prev,
        areacd: area.areacd,
        ctycd: area.areactycd,
        bilstcd: state?.stcd ?? "",
        pincd: area.zipcd,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        ctycd2: area.areactycd,
        shpstcd: state?.stcd ?? "",
        pincd2: area.zipcd,
      }));
    }
    if (errors.areacd) setErrors((prev) => ({ ...prev, areacd: undefined }));
  };

  const copBillingToShipping = () => {
    setForm((prev) => ({
      ...prev,
      ledadr2: prev.ledadr1,
      ctycd2: prev.ctycd,
      shpstcd: prev.bilstcd,
      pincd2: prev.pincd,
    }));
  };

  // ── Category filter: match mstledctnfo.sysledcd directly against form.ledtyp ──
  const availableCategories = useMemo(() => {
    return ledgerAccountTypes.filter((t) => {
      const already = form.categories.some((c) => c.ledctcd === t.ledctcd);
      if (already) return false;
      // Show only categories whose sysledcd matches the selected ledger type
      return t.sysledcd === form.ledtyp;
    });
  }, [ledgerAccountTypes, form.categories, form.ledtyp]);

  const addCategory = () => {
    if (!selectedLedCtcd) return;
    if (form.categories.find((c) => c.ledctcd === selectedLedCtcd)) return;
    const type = ledgerAccountTypes.find((t) => t.ledctcd === selectedLedCtcd);
    if (!type) return;
    setForm((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        {
          ledctcd: type.ledctcd,
          ledctnm: type.ledctnm,
          ledgrpnm: undefined,
          ledgrptyp: undefined,
          itmcomnm: type.itmcomcd,
        },
      ],
    }));
    setSelectedLedCtcd("");
  };

  const removeCategory = (ledctcd: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.ledctcd !== ledctcd),
    }));
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.lednm) e.lednm = "Required";
    if (!form.buntcd) e.buntcd = "Required";
    if (!form.ledcrtdt) e.ledcrtdt = "Required";
    if (!form.ledtyp) e.ledtyp = "Required";
    if (!isOthers && !form.ledadr1) e.ledadr1 = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload = {
      ...form,
      lmtamt: form.lmtamt ? parseInt(form.lmtamt) : undefined,
      consdays: form.consdays ? parseInt(form.consdays) : undefined,
    };
    if (editingLedcd)
      updateMutation.mutate({ ledcd: editingLedcd, ...payload });
    else createMutation.mutate(payload);
  };

  const isEdit = !!editingLedcd;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  // ── "Others" behaviour: hide contact/address/payment/tax sections ─────────
  const isOthers = OTHERS_SYSLEDCDS.includes(form.ledtyp);
  const showBankFields = form.paytyp !== "CASH";
  const showRtgsField = form.paytyp === "RTGS";
  const showAccField = ["CHEQUE", "A/C TRANSFER", "DD"].includes(form.paytyp);

  // ── Derived lookup objects for combobox values ─────────────────────────────
  const selectedBaseUnit = useMemo(
    () => units.find((u) => u.untcd === form.buntcd) ?? null,
    [units, form.buntcd],
  );
  const selectedBillingCity = useMemo(
    () => cities.find((c) => c.ctycd === form.ctycd) ?? null,
    [cities, form.ctycd],
  );
  const selectedShippingCity = useMemo(
    () => cities.find((c) => c.ctycd === form.ctycd2) ?? null,
    [cities, form.ctycd2],
  );
  const selectedArea = useMemo(
    () => areas.find((a) => a.areacd === form.areacd) ?? null,
    [areas, form.areacd],
  );
  const selectedEmployee = useMemo(
    () => employees.find((e) => e.empcd === form.empcd) ?? null,
    [employees, form.empcd],
  );
  const billingStateName = useMemo(
    () => states.find((s) => s.stcd === form.bilstcd)?.stnm ?? form.bilstcd,
    [states, form.bilstcd],
  );
  const shippingStateName = useMemo(
    () => states.find((s) => s.stcd === form.shpstcd)?.stnm ?? form.shpstcd,
    [states, form.shpstcd],
  );

  // ── Selected objects for comboboxes ───────────────────────────────────────
  const selectedSysLed = useMemo(
    () => sysLedgers.find((s) => s.sysledcd === form.ledtyp) ?? null,
    [sysLedgers, form.ledtyp],
  );
  const selectedCategoryItem = useMemo(
    () =>
      availableCategories.find((t) => t.ledctcd === selectedLedCtcd) ?? null,
    [availableCategories, selectedLedCtcd],
  );

  // ── Units Tree ─────────────────────────────────────────────────────────────
  const unitTree = useMemo(() => {
    const tree: Record<
      string,
      {
        stnm: string;
        cities: Record<string, { ctynm: string; units: typeof units }>;
      }
    > = {};
    units.forEach((u) => {
      const stcd = (u as any).stcd ?? "__NONE__";
      const stnm = (u as any).stnm ?? "Other";
      const ctycd = (u as any).ctycd ?? "__NONE__";
      const ctynm = (u as any).ctynm ?? "Other";
      if (!tree[stcd]) tree[stcd] = { stnm, cities: {} };
      if (!tree[stcd].cities[ctycd])
        tree[stcd].cities[ctycd] = { ctynm, units: [] };
      tree[stcd].cities[ctycd].units.push(u);
    });
    return tree;
  }, [units]);

  const getStateUntcds = (stcd: string) =>
    Object.values(unitTree[stcd]?.cities ?? {}).flatMap((c) =>
      c.units.map((u) => u.untcd),
    );
  const getCityUntcds = (stcd: string, ctycd: string) =>
    unitTree[stcd]?.cities[ctycd]?.units.map((u) => u.untcd) ?? [];

  const toggleUnit = (untcd: string) => {
    setForm((prev) => ({
      ...prev,
      applicableUnits: prev.applicableUnits.includes(untcd)
        ? prev.applicableUnits.filter((u) => u !== untcd)
        : [...prev.applicableUnits, untcd],
    }));
  };
  const toggleState = (stcd: string) => {
    const all = getStateUntcds(stcd);
    const allChecked = all.every((cd) => form.applicableUnits.includes(cd));
    setForm((prev) => ({
      ...prev,
      applicableUnits: allChecked
        ? prev.applicableUnits.filter((cd) => !all.includes(cd))
        : [...new Set([...prev.applicableUnits, ...all])],
    }));
  };
  const toggleCity = (stcd: string, ctycd: string) => {
    const all = getCityUntcds(stcd, ctycd);
    const allChecked = all.every((cd) => form.applicableUnits.includes(cd));
    setForm((prev) => ({
      ...prev,
      applicableUnits: allChecked
        ? prev.applicableUnits.filter((cd) => !all.includes(cd))
        : [...new Set([...prev.applicableUnits, ...all])],
    }));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "fixed top-15 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium shadow-sm border",
              toast.type === "success"
                ? "bg-white border-green-200 text-green-700"
                : "bg-white border-red-200 text-red-600",
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                toast.type === "success" ? "bg-green-500" : "bg-red-500",
              )}
            />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            ledgerName={deleteTarget.lednm}
            onConfirm={() =>
              deleteMutation.mutate({ ledcd: deleteTarget.ledcd })
            }
            onCancel={() => setDeleteTarget(null)}
            isPending={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-medium text-[#1a1a1a]">
            Account Ledger
          </h2>
          <p className="text-[12px] text-[#999] mt-0.5">
            Manage ledger accounts and their configurations
          </p>
        </div>
        <button
          onClick={() => {
            if (isEdit) resetForm();
            else setShowForm((p) => !p);
          }}
          className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-[#555] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] hover:text-[#1a1a1a] transition-all duration-150"
        >
          {isEdit ? "Cancel Edit" : showForm ? "Hide Form" : "New Ledger"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {isEdit && isLoadingEdit ? (
              <div className="bg-white border border-[#E8E6E1] rounded-xl p-12 flex items-center justify-center gap-3">
                <svg
                  className="animate-spin"
                  width="16"
                  height="16"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="#aaa"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M7 1a6 6 0 1 0 6 6" />
                </svg>
                <span className="text-[13px] text-[#aaa]">
                  Loading ledger data…
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* ── SECTION 1: Account Ledger Information ──────────────── */}
                <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
                  <SectionHeader title="Account Ledger Information" />
                  <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
                    <FormField label="Ledger Code">
                      <input
                        type="text"
                        className={inputCls()}
                        placeholder="AUTO GENERATED"
                        value={editingLedcd ?? "New"}
                        disabled
                      />
                    </FormField>
                    <FormField label="Ledger Name" required>
                      <div className="relative">
                        <input
                          type="text"
                          className={inputCls(!!errors.lednm)}
                          placeholder="e.g. Rajesh Traders"
                          value={form.lednm}
                          onChange={(e) => set("lednm", e.target.value)}
                        />
                        <AnimatePresence>
                          {isSearching && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none"
                            >
                              <svg
                                className="animate-spin text-[#bbb]"
                                width="11"
                                height="11"
                                viewBox="0 0 14 14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              >
                                <path d="M7 1a6 6 0 1 0 6 6" />
                              </svg>
                              <span className="text-[10px] text-[#bbb] tracking-wide">
                                checking…
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {errors.lednm && (
                        <p className="text-[11px] text-red-400 mt-0.5">
                          {errors.lednm}
                        </p>
                      )}
                      <AnimatePresence>
                        {showDupWarning && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -4, height: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 flex items-start gap-2">
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 14 14"
                                fill="none"
                                stroke="#d97706"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                className="shrink-0 mt-0.5"
                              >
                                <path d="M7 2L1.5 12h11L7 2z" />
                                <path d="M7 6v3M7 10.5v.5" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-amber-800 leading-tight">
                                  Similar ledger
                                  {dupMatches.length > 1 ? "s" : ""} already
                                  exist
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {dupMatches.map((m) => (
                                    <span
                                      key={m.ledcd}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200"
                                    >
                                      <span className="font-mono text-[9px] text-amber-600">
                                        {m.ledcd}
                                      </span>
                                      {m.lednm}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setDupWarningDismissed(true)}
                                className="shrink-0 text-amber-400 hover:text-amber-600 transition-colors duration-100 mt-0.5"
                              >
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 14 14"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                >
                                  <path d="M1 1l12 12M13 1L1 13" />
                                </svg>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </FormField>
                    <FormField label="Ledger Name (Reports)">
                      <input
                        type="text"
                        className={inputCls()}
                        placeholder="For reports display"
                        value={form.ledrptnm}
                        onChange={(e) => set("ledrptnm", e.target.value)}
                      />
                    </FormField>
                    <FormField label="Ledger Name (Cheques)">
                      <input
                        type="text"
                        className={inputCls()}
                        placeholder="For cheque printing"
                        value={form.ledchqnm}
                        onChange={(e) => set("ledchqnm", e.target.value)}
                      />
                    </FormField>
                    <FormField label="Base Location" required>
                      <CustomCombobox
                        items={units}
                        value={selectedBaseUnit}
                        onValueChange={(u) => set("buntcd", u?.untcd ?? "")}
                        getLabel={(u) => u.untnm}
                        getKey={(u) => u.untcd}
                        placeholder="Select base location…"
                        hasError={!!errors.buntcd}
                      />
                      {errors.buntcd && (
                        <p className="text-[11px] text-red-400 mt-0.5">
                          {errors.buntcd}
                        </p>
                      )}
                    </FormField>
                    <FormField label="Creation Date" required>
                      <input
                        type="date"
                        className={inputCls(!!errors.ledcrtdt)}
                        value={form.ledcrtdt}
                        onChange={(e) => set("ledcrtdt", e.target.value)}
                      />
                    </FormField>

                    {/* ── Ledger Type — now driven by mstsyslednfo ────────── */}
                    <FormField label="Ledger Type" required>
                      <CustomCombobox
                        items={sysLedgers}
                        value={selectedSysLed}
                        onValueChange={(s) => {
                          set("ledtyp", s?.sysledcd ?? "");
                          // Clear category selection when type changes
                          setSelectedLedCtcd("");
                          // Clear already-selected categories so stale ones don't remain
                          setForm((prev) => ({
                            ...prev,
                            ledtyp: s?.sysledcd ?? "",
                            categories: [],
                          }));
                        }}
                        getLabel={(s) => s.syslednm}
                        getKey={(s) => s.sysledcd}
                        placeholder="Select ledger type…"
                        hasError={!!errors.ledtyp}
                      />
                      {errors.ledtyp && (
                        <p className="text-[11px] text-red-400 mt-0.5">
                          {errors.ledtyp}
                        </p>
                      )}
                    </FormField>

                    <FormField label="Round Off">
                      <select
                        className={selectCls}
                        value={form.roundoff}
                        onChange={(e) =>
                          set("roundoff", e.target.value as "Yes" | "No")
                        }
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </FormField>
                    <FormField label="Exempted">
                      <select
                        className={selectCls}
                        value={form.exmpt}
                        onChange={(e) =>
                          set("exmpt", e.target.value as "Yes" | "No")
                        }
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </FormField>
                    <FormField label="Ledger Status">
                      <select
                        className={selectCls}
                        value={form.ledsts}
                        onChange={(e) =>
                          set("ledsts", e.target.value as LedStatus)
                        }
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="LOCKED">Locked</option>
                      </select>
                    </FormField>
                  </div>
                </div>

                {/* ── SECTION 2: Categories + Units Tree ─────────────────── */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
                    <SectionHeader title="Ledger Categories" />
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <CustomCombobox
                            items={availableCategories}
                            value={selectedCategoryItem}
                            onValueChange={(t) =>
                              setSelectedLedCtcd(t?.ledctcd ?? "")
                            }
                            getLabel={(t) => t.ledctnm}
                            getKey={(t) => t.ledctcd}
                            placeholder={
                              form.ledtyp
                                ? "Select category…"
                                : "Select a ledger type first…"
                            }
                            disabled={!form.ledtyp}
                          />
                        </div>
                        <button
                          onClick={addCategory}
                          disabled={!selectedLedCtcd}
                          className="w-8 h-9 flex items-center justify-center rounded-lg border border-[#E8E6E1] bg-white text-[#aaa] hover:bg-[#F5F4F0] hover:text-[#555] disabled:opacity-40 transition-all duration-150"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 14 14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          >
                            <path d="M7 1v12M1 7h12" />
                          </svg>
                        </button>
                      </div>

                      <div className="border border-[#E8E6E1] rounded-lg overflow-hidden">
                        <table className="w-full text-[12px]">
                          <thead>
                            <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
                              {[
                                "Category",
                                "Group Name",
                                "Group Type",
                                "Commodity",
                                "",
                              ].map((h) => (
                                <th
                                  key={h}
                                  className="text-left px-3 py-2 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] whitespace-nowrap"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {form.categories.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-3 py-6 text-center text-[11px] text-[#ccc]"
                                >
                                  {form.ledtyp
                                    ? "No categories added yet"
                                    : "Select a ledger type to add categories"}
                                </td>
                              </tr>
                            ) : (
                              form.categories.map((cat) => {
                                const type = ledgerAccountTypes.find(
                                  (t) => t.ledctcd === cat.ledctcd,
                                );
                                return (
                                  <tr
                                    key={cat.ledctcd}
                                    className="border-b border-[#F5F4F0] last:border-0 hover:bg-[#FAFAF9]"
                                  >
                                    <td className="px-3 py-2 text-[#1a1a1a] font-medium">
                                      {cat.ledctnm}
                                    </td>
                                    <td className="px-3 py-2 text-[#888]">
                                      {type?.ledgrpcd ?? "—"}
                                    </td>
                                    <td className="px-3 py-2 text-[#888]">—</td>
                                    <td className="px-3 py-2 text-[#888]">
                                      {type?.itmcomcd ?? "—"}
                                    </td>
                                    <td className="px-3 py-2">
                                      <button
                                        onClick={() =>
                                          removeCategory(cat.ledctcd)
                                        }
                                        className="w-6 h-6 flex items-center justify-center rounded-md border border-[#E8E6E1] text-[#ccc] hover:border-red-200 hover:text-red-400 hover:bg-red-50 transition-all duration-150"
                                      >
                                        <svg
                                          width="10"
                                          height="10"
                                          viewBox="0 0 14 14"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                        >
                                          <path d="M1 1l12 12M13 1L1 13" />
                                        </svg>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
                    <SectionHeader title="Applicable On Units" />
                    <div className="p-4 overflow-y-auto max-h-72 flex flex-col gap-1">
                      {Object.entries(unitTree).map(([stcd, stateNode]) => {
                        const stateUntcds = getStateUntcds(stcd);
                        const allStateChecked =
                          stateUntcds.length > 0 &&
                          stateUntcds.every((cd) =>
                            form.applicableUnits.includes(cd),
                          );
                        const someStateChecked =
                          !allStateChecked &&
                          stateUntcds.some((cd) =>
                            form.applicableUnits.includes(cd),
                          );
                        return (
                          <StateNode
                            key={stcd}
                            label={stateNode.stnm}
                            checked={allStateChecked}
                            indeterminate={someStateChecked}
                            onToggle={() => toggleState(stcd)}
                          >
                            {Object.entries(stateNode.cities).map(
                              ([ctycd, cityNode]) => {
                                const cityUntcds = getCityUntcds(stcd, ctycd);
                                const allCityChecked =
                                  cityUntcds.length > 0 &&
                                  cityUntcds.every((cd) =>
                                    form.applicableUnits.includes(cd),
                                  );
                                const someCityChecked =
                                  !allCityChecked &&
                                  cityUntcds.some((cd) =>
                                    form.applicableUnits.includes(cd),
                                  );
                                return (
                                  <CityNode
                                    key={ctycd}
                                    label={cityNode.ctynm}
                                    checked={allCityChecked}
                                    indeterminate={someCityChecked}
                                    onToggle={() => toggleCity(stcd, ctycd)}
                                  >
                                    {cityNode.units.map((u) => (
                                      <UnitLeaf
                                        key={u.untcd}
                                        label={u.untnm}
                                        checked={form.applicableUnits.includes(
                                          u.untcd,
                                        )}
                                        onToggle={() => toggleUnit(u.untcd)}
                                      />
                                    ))}
                                  </CityNode>
                                );
                              },
                            )}
                          </StateNode>
                        );
                      })}
                      {units.length === 0 && (
                        <p className="text-[12px] text-[#ccc] text-center py-8">
                          No units available
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {!isOthers && (
                  <>
                    {/* ── SECTION 3: Contact Information ─────────────────── */}
                    <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
                      <SectionHeader title="Contact Information" />
                      <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
                        <FormField label="Party Category" required>
                          <select
                            className={selectCls}
                            value={form.pcatcd}
                            onChange={(e) => set("pcatcd", e.target.value)}
                          >
                            <option value="">Select category…</option>
                            {partyCategories.map((p) => (
                              <option key={p.pcatcd} value={p.pcatcd}>
                                {p.pcatnm}
                              </option>
                            ))}
                          </select>
                        </FormField>
                        <div />
                        <FormField label="Contact Person 1">
                          <input
                            type="text"
                            className={inputCls()}
                            placeholder="Name"
                            value={form.per1prfx}
                            onChange={(e) => set("per1prfx", e.target.value)}
                          />
                        </FormField>
                        <FormField label="Contact Person 2">
                          <input
                            type="text"
                            className={inputCls()}
                            placeholder="Name"
                            value={form.per2prfx}
                            onChange={(e) => set("per2prfx", e.target.value)}
                          />
                        </FormField>
                        <FormField label="Contact Mobile 1">
                          <input
                            type="text"
                            className={inputCls()}
                            placeholder="+91 XXXXX XXXXX"
                            value={form.ctper1}
                            onChange={(e) => set("ctper1", e.target.value)}
                          />
                        </FormField>
                        <FormField label="Contact Mobile 2">
                          <input
                            type="text"
                            className={inputCls()}
                            placeholder="+91 XXXXX XXXXX"
                            value={form.ctper2}
                            onChange={(e) => set("ctper2", e.target.value)}
                          />
                        </FormField>
                        <FormField label="Contact Email 1">
                          <input
                            type="email"
                            className={inputCls()}
                            placeholder="email@example.com"
                            value={form.cntno1}
                            onChange={(e) => set("cntno1", e.target.value)}
                          />
                        </FormField>
                        <FormField label="Contact Email 2">
                          <input
                            type="email"
                            className={inputCls()}
                            placeholder="email@example.com"
                            value={form.cntno2}
                            onChange={(e) => set("cntno2", e.target.value)}
                          />
                        </FormField>
                      </div>
                    </div>

                    {/* ── SECTION 4: Billing Address ──────────────────────── */}
                    <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
                      <SectionHeader title="Billing Address" />
                      <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
                        <FormField label="Address" required>
                          <textarea
                            className={cn(
                              inputCls(!!errors.ledadr1),
                              "h-16 py-2 resize-none",
                            )}
                            placeholder="Street address, building, floor…"
                            value={form.ledadr1}
                            onChange={(e) => set("ledadr1", e.target.value)}
                          />
                          {errors.ledadr1 && (
                            <p className="text-[11px] text-red-400 mt-0.5">
                              {errors.ledadr1}
                            </p>
                          )}
                        </FormField>
                        <FormField label="Area">
                          <CustomCombobox
                            items={areas}
                            value={selectedArea}
                            onValueChange={(a) =>
                              handleAreaSelect(a, "billing")
                            }
                            getLabel={(a) => a.areanm}
                            getKey={(a) => a.areacd}
                            placeholder="Select area…"
                          />
                        </FormField>
                        <FormField label="City Name">
                          <CustomCombobox
                            items={cities}
                            value={selectedBillingCity}
                            onValueChange={(city) => {
                              if (city) {
                                set("ctycd", city.ctycd);
                                const state = states.find(
                                  (s) => s.stcd === city.ctystcd,
                                );
                                if (state) set("bilstcd", state.stcd);
                              } else {
                                set("ctycd", "");
                              }
                            }}
                            getLabel={(c) => c.ctynm}
                            getKey={(c) => c.ctycd}
                            placeholder="City…"
                          />
                        </FormField>
                        <FormField label="Pin Code">
                          <input
                            type="text"
                            className={inputCls()}
                            placeholder="6-digit pin"
                            maxLength={6}
                            value={form.pincd}
                            onChange={(e) => set("pincd", e.target.value)}
                          />
                        </FormField>
                        <FormField label="State Name">
                          <input
                            type="text"
                            className={inputCls()}
                            placeholder="State (auto-filled)"
                            value={billingStateName}
                            onChange={(e) => {
                              const state = states.find(
                                (s) => s.stnm === e.target.value,
                              );
                              set("bilstcd", state?.stcd ?? e.target.value);
                            }}
                          />
                        </FormField>
                        <FormField label="Employee Name">
                          <CustomCombobox
                            items={employees}
                            value={selectedEmployee}
                            onValueChange={(emp) =>
                              set("empcd", emp?.empcd ?? "")
                            }
                            getLabel={(e) => e.empnm}
                            getKey={(e) => e.empcd}
                            placeholder="Select employee…"
                          />
                        </FormField>
                      </div>
                    </div>

                    {/* ── SECTION 5: Shipping Address ──────────────────────── */}
                    <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
                        <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#888]">
                          Shipping Address
                        </span>
                        <button
                          onClick={copBillingToShipping}
                          className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium text-[#555] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150"
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 14 14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          >
                            <rect x="3" y="1" width="9" height="11" rx="1" />
                            <path d="M1 3v10h9" />
                          </svg>
                          Same as Billing
                        </button>
                      </div>
                      <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
                        <FormField label="Address">
                          <textarea
                            className={cn(inputCls(), "h-16 py-2 resize-none")}
                            placeholder="Street address, building, floor…"
                            value={form.ledadr2}
                            onChange={(e) => set("ledadr2", e.target.value)}
                          />
                        </FormField>
                        <FormField label="City Name">
                          <CustomCombobox
                            items={cities}
                            value={selectedShippingCity}
                            onValueChange={(city) => {
                              if (city) {
                                set("ctycd2", city.ctycd);
                                const state = states.find(
                                  (s) => s.stcd === city.ctystcd,
                                );
                                if (state) set("shpstcd", state.stcd);
                              } else {
                                set("ctycd2", "");
                              }
                            }}
                            getLabel={(c) => c.ctynm}
                            getKey={(c) => c.ctycd}
                            placeholder="City…"
                          />
                        </FormField>
                        <FormField label="State Name">
                          <input
                            type="text"
                            className={inputCls()}
                            placeholder="State (auto-filled)"
                            value={shippingStateName}
                            onChange={(e) => {
                              const state = states.find(
                                (s) => s.stnm === e.target.value,
                              );
                              set("shpstcd", state?.stcd ?? e.target.value);
                            }}
                          />
                        </FormField>
                        <FormField label="Pin Code">
                          <input
                            type="text"
                            className={inputCls()}
                            placeholder="6-digit pin"
                            maxLength={6}
                            value={form.pincd2}
                            onChange={(e) => set("pincd2", e.target.value)}
                          />
                        </FormField>
                      </div>
                    </div>

                    {/* ── SECTION 6: Payment ──────────────────────────────── */}
                    <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
                      <SectionHeader title="Payment Details" />
                      <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
                        <FormField label="Pay Type">
                          <select
                            className={selectCls}
                            value={form.paytyp}
                            onChange={(e) =>
                              set("paytyp", e.target.value as PayType)
                            }
                          >
                            <option value="CASH">Cash</option>
                            <option value="CHEQUE">Cheque</option>
                            <option value="A/C TRANSFER">A/C Transfer</option>
                            <option value="RTGS">RTGS</option>
                            <option value="DD">DD</option>
                          </select>
                        </FormField>
                        <FormField label="Pay Station">
                          <select
                            className={selectCls}
                            value={form.paystncd}
                            onChange={(e) => set("paystncd", e.target.value)}
                          >
                            <option value="">Select station…</option>
                            {stations.map((s) => (
                              <option key={s.stncd} value={s.stncd}>
                                {s.stnnm}
                              </option>
                            ))}
                          </select>
                        </FormField>
                        <AnimatePresence>
                          {showBankFields && (
                            <>
                              <FormField label="Bank Name">
                                <input
                                  type="text"
                                  className={inputCls()}
                                  placeholder="e.g. HDFC Bank"
                                  value={form.bnkledcd}
                                  onChange={(e) =>
                                    set("bnkledcd", e.target.value)
                                  }
                                />
                              </FormField>
                              {showAccField && (
                                <FormField label="Account No">
                                  <input
                                    type="text"
                                    className={inputCls()}
                                    placeholder="Bank account number"
                                    value={form.accno}
                                    onChange={(e) =>
                                      set("accno", e.target.value)
                                    }
                                  />
                                </FormField>
                              )}
                              {showRtgsField && (
                                <FormField label="RTGS No">
                                  <input
                                    type="text"
                                    className={inputCls()}
                                    placeholder="IFSC / RTGS code"
                                    value={form.rtgsno}
                                    onChange={(e) =>
                                      set("rtgsno", e.target.value)
                                    }
                                  />
                                </FormField>
                              )}
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* ── SECTION 7: Tax & Statutory ──────────────────────── */}
                    <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
                      <SectionHeader title="Tax & Statutory" />
                      <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
                        <FormField label="Aadhaar No">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              className={inputCls()}
                              placeholder="12-digit Aadhaar"
                              maxLength={12}
                              value={form.aadharno}
                              onChange={(e) => set("aadharno", e.target.value)}
                            />
                            <DocUploadButton
                              url={form.aadharphoto}
                              uploading={aadharUpload.uploading}
                              uploadError={aadharUpload.uploadError}
                              onTrigger={aadharUpload.trigger}
                              onClear={() => set("aadharphoto", "")}
                              inputRef={aadharUpload.inputRef}
                              onInputChange={aadharUpload.handleChange}
                            />
                          </div>
                        </FormField>
                        <div />
                        <FormField label="PAN No">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              className={inputCls()}
                              placeholder="PAN number"
                              value={form.panno}
                              onChange={(e) => set("panno", e.target.value)}
                            />
                            <DocUploadButton
                              url={form.pancardphoto}
                              uploading={panUpload.uploading}
                              uploadError={panUpload.uploadError}
                              onTrigger={panUpload.trigger}
                              onClear={() => set("pancardphoto", "")}
                              inputRef={panUpload.inputRef}
                              onInputChange={panUpload.handleChange}
                            />
                          </div>
                        </FormField>
                        <FormField label="PAN Date">
                          <input
                            type="date"
                            className={inputCls()}
                            value={form.pandt}
                            onChange={(e) => set("pandt", e.target.value)}
                          />
                        </FormField>
                        <FormField label="TAN No">
                          <input
                            type="text"
                            className={inputCls()}
                            placeholder="TAN number"
                            value={form.tanno}
                            onChange={(e) => set("tanno", e.target.value)}
                          />
                        </FormField>
                        <FormField label="TAN Date">
                          <input
                            type="date"
                            className={inputCls()}
                            value={form.tandt}
                            onChange={(e) => set("tandt", e.target.value)}
                          />
                        </FormField>
                        <FormField label="GST / Service Tax No">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              className={inputCls()}
                              placeholder="GST / Service tax number"
                              value={form.stxno}
                              onChange={(e) => set("stxno", e.target.value)}
                            />
                            <DocUploadButton
                              url={form.gstcertphoto}
                              uploading={gstUpload.uploading}
                              uploadError={gstUpload.uploadError}
                              onTrigger={gstUpload.trigger}
                              onClear={() => set("gstcertphoto", "")}
                              inputRef={gstUpload.inputRef}
                              onInputChange={gstUpload.handleChange}
                            />
                          </div>
                        </FormField>
                        <FormField label="GST / Service Tax Date">
                          <input
                            type="date"
                            className={inputCls()}
                            value={form.stxdt}
                            onChange={(e) => set("stxdt", e.target.value)}
                          />
                        </FormField>
                        <FormField label="Credit Limit (₹)">
                          <input
                            type="number"
                            className={inputCls()}
                            placeholder="0"
                            value={form.lmtamt}
                            onChange={(e) => set("lmtamt", e.target.value)}
                          />
                        </FormField>
                        <FormField label="Consignment Days">
                          <input
                            type="number"
                            className={inputCls()}
                            placeholder="0"
                            value={form.consdays}
                            onChange={(e) => set("consdays", e.target.value)}
                          />
                        </FormField>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Form Footer ─────────────────────────────────────────── */}
                <div className="bg-white border border-[#E8E6E1] rounded-xl px-5 py-3.5 flex items-center justify-end gap-2">
                  <button
                    onClick={resetForm}
                    className="h-8 px-4 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150"
                  >
                    {isEdit ? "Cancel" : "Clear"}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={cn(
                      "h-8 px-4 text-[12px] font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-1.5",
                      isEdit
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-[#1a1a1a] hover:bg-[#333]",
                    )}
                  >
                    {isSaving ? (
                      <>
                        <svg
                          className="animate-spin"
                          width="11"
                          height="11"
                          viewBox="0 0 14 14"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M7 1a6 6 0 1 0 6 6" />
                        </svg>
                        {isEdit ? "Updating…" : "Saving…"}
                      </>
                    ) : (
                      <>
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 14 14"
                          fill="none"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        >
                          <path d="M2 7l3.5 3.5L12 3" />
                        </svg>
                        {isEdit ? "Update Ledger" : "Save Ledger"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LEDGER TABLE ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#1a1a1a]">
            All Ledgers{" "}
            <span className="ml-2 text-[11px] font-normal text-[#aaa]">
              {totalCount} total
            </span>
          </span>
          <input
            type="text"
            placeholder="Search ledgers…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 px-3 text-[12px] border border-[#E8E6E1] rounded-lg bg-[#FAFAF9] text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-[#ccc] w-45 transition-all duration-150"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
                {[
                  "Code",
                  "Ledger Name",
                  "Type",
                  "Base Location",
                  "Pay Type",
                  "Status",
                  "Docs",
                  "Created",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-[#ccc] text-[12px]"
                  >
                    {searchQuery
                      ? "No ledgers match your search"
                      : "No ledgers yet — create one above"}
                  </td>
                </tr>
              ) : (
                items.map((l, i) => {
                  const isRowEditing = editingLedcd === l.ledcd;
                  const statusColor =
                    l.ledsts === "ACTIVE"
                      ? "bg-green-50 text-green-700"
                      : l.ledsts === "LOCKED"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-[#F5F4F0] text-[#aaa]";
                  const aadharphoto = (l as any).aadharphoto as
                    | string
                    | null
                    | undefined;
                  const pancardphoto = (l as any).pancardphoto as
                    | string
                    | null
                    | undefined;
                  const gstcertphoto = (l as any).gstcertphoto as
                    | string
                    | null
                    | undefined;
                  const hasAnyDoc = !!(
                    aadharphoto ||
                    pancardphoto ||
                    gstcertphoto
                  );
                  // Resolve the syslednm label for the Type column
                  const ledTypLabel =
                    sysLedgers.find((s) => s.sysledcd === (l as any).ledtyp)
                      ?.syslednm ??
                    (l as any).ledtyp ??
                    "—";
                  return (
                    <motion.tr
                      key={l.ledcd}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={cn(
                        "border-b border-[#F5F4F0] last:border-0 transition-colors duration-100",
                        isRowEditing ? "bg-blue-50/60" : "hover:bg-[#FAFAF9]",
                      )}
                    >
                      <td className="px-4 py-3 text-[#aaa] font-mono">
                        {l.ledcd}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#1a1a1a]">
                        {l.lednm}
                      </td>
                      {/* Show the human-readable syslednm instead of the raw sysledcd */}
                      <td className="px-4 py-3 text-[#666]">{ledTypLabel}</td>
                      <td className="px-4 py-3 text-[#666]">
                        {l.buntcd ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[#666]">
                        {l.paytyp ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                            statusColor,
                          )}
                        >
                          <span
                            className={cn(
                              "w-1 h-1 rounded-full",
                              l.ledsts === "ACTIVE"
                                ? "bg-green-500"
                                : l.ledsts === "LOCKED"
                                  ? "bg-amber-500"
                                  : "bg-[#ccc]",
                            )}
                          />
                          {l.ledsts ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {hasAnyDoc ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            <DocPill url={aadharphoto} label="Aadhaar" />
                            <DocPill url={pancardphoto} label="PAN" />
                            <DocPill url={gstcertphoto} label="GST" />
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#ddd]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#aaa]">
                        {l.ledcrtdt
                          ? new Date(l.ledcrtdt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingLedcd(l.ledcd);
                              setShowForm(true);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className={cn(
                              "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150 border",
                              isRowEditing
                                ? "bg-blue-100 border-blue-200 text-blue-600"
                                : "bg-white border-[#E8E6E1] text-[#aaa] hover:border-[#C8C5BE] hover:text-[#555] hover:bg-[#F5F4F0]",
                            )}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 14 14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            >
                              <path d="M2 10.5L4.5 11 11 4.5a1.77 1.77 0 0 0-2.5-2.5L2 8.5v2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                ledcd: l.ledcd,
                                lednm: l.lednm ?? l.ledcd,
                              })
                            }
                            className="w-7 h-7 rounded-md flex items-center justify-center border bg-white border-[#E8E6E1] text-[#aaa] hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 14 14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            >
                              <path d="M1.5 3.5h11M5 3.5V2h4v1.5M3 3.5l.7 8h6.6l.7-8" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-[#E8E6E1] flex items-center justify-between">
            <span className="text-[11px] text-[#aaa]">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E8E6E1] bg-white text-[#aaa] hover:bg-[#F5F4F0] hover:text-[#555] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M6.5 1.5L3 5l3.5 3.5" />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1,
                )
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                    acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "…" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="w-7 h-7 flex items-center justify-center text-[11px] text-[#ccc]"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-lg text-[12px] font-medium transition-all duration-150",
                        currentPage === p
                          ? "bg-[#1a1a1a] text-white"
                          : "border border-[#E8E6E1] bg-white text-[#555] hover:bg-[#F5F4F0]",
                      )}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E8E6E1] bg-white text-[#aaa] hover:bg-[#F5F4F0] hover:text-[#555] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M3.5 1.5L7 5l-3.5 3.5" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
