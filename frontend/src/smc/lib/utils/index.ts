import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

export function formatPercent(value: number | null | undefined, digits = 1) {
  return `${Number(value ?? 0).toFixed(digits)}%`;
}

export function formatDate(
  value: string | Date | null | undefined,
  pattern = "dd MMM yyyy",
) {
  if (!value) {
    return "Not available";
  }

  return format(new Date(value), pattern);
}

export function toTitleCase(value: string | null | undefined) {
  if (!value) {
    return "Not specified";
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getRiskTone(value: string | null | undefined) {
  const normalized = value?.toLowerCase();

  if (normalized?.includes("critical") || normalized?.includes("high")) {
    return "text-red-700 bg-red-50 border-red-200 dark:text-red-200 dark:bg-red-950/40 dark:border-red-900";
  }

  if (normalized?.includes("moderate") || normalized?.includes("medium")) {
    return "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-200 dark:bg-orange-950/40 dark:border-orange-900";
  }

  return "text-green-700 bg-green-50 border-green-200 dark:text-green-200 dark:bg-green-950/40 dark:border-green-900";
}

export function getStatusTone(value: string | boolean | null | undefined) {
  if (typeof value === "boolean") {
    return value
      ? "text-green-700 bg-green-50 border-green-200 dark:text-green-200 dark:bg-green-950/40 dark:border-green-900"
      : "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-200 dark:bg-orange-950/40 dark:border-orange-900";
  }

  const normalized = value?.toLowerCase();

  if (!normalized) {
    return "text-slate-700 bg-slate-50 border-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:border-slate-700";
  }

  if (
    normalized.includes("resolved") ||
    normalized.includes("verified") ||
    normalized.includes("active") ||
    normalized.includes("healthy") ||
    normalized.includes("complete")
  ) {
    return "text-green-700 bg-green-50 border-green-200 dark:text-green-200 dark:bg-green-950/40 dark:border-green-900";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("warning") ||
    normalized.includes("moderate") ||
    normalized.includes("due")
  ) {
    return "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-200 dark:bg-orange-950/40 dark:border-orange-900";
  }

  if (
    normalized.includes("critical") ||
    normalized.includes("error") ||
    normalized.includes("rejected") ||
    normalized.includes("overload")
  ) {
    return "text-red-700 bg-red-50 border-red-200 dark:text-red-200 dark:bg-red-950/40 dark:border-red-900";
  }

  return "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-200 dark:bg-blue-950/40 dark:border-blue-900";
}

export function buildSearchParams(
  current: Record<string, string | string[] | undefined>,
  updates: Record<string, string | number | undefined>,
) {
  const params = new URLSearchParams();

  Object.entries(current).forEach(([key, value]) => {
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  });

  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

