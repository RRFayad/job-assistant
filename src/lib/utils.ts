import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

// Identity helper that marks application class strings for Prettier sorting.
export const tw = (classes: string): string => classes;

export const capitalize = (value: string, allWords = false): string => {
  if (!value) {
    return value;
  }

  if (!allWords) {
    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
  }

  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

type GetEnvVar = {
  (name: string): string;
  (name: string, throwErr: true): string;
  (name: string, throwErr: false): string | undefined;
};

export const getEnvVar = ((
  name: string,
  throwErr = true,
): string | undefined => {
  const value = process.env[name];

  if (!value) {
    if (throwErr) {
      throw new Error(`${name} environment variable is not set`);
    }

    return undefined;
  }

  return value;
}) as GetEnvVar;

export const parseContentDispositionFilename = (
  header: string | null | undefined,
): string | null => {
  if (!header) return null;

  // Prefer the RFC 6266 filename*=UTF-8''<percent-encoded> parameter, which
  // carries the real name — the plain filename="..." alongside it is only
  // an ASCII-safe fallback for clients that don't support the former (see
  // backend's _content_disposition), so parsing only the fallback silently
  // degrades any non-ASCII name (e.g. "José Á" becomes "Jos-A" downloaded).
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      // Malformed percent-encoding — fall through to the plain parameter.
    }
  }

  return header.match(/filename="?([^"]+)"?/)?.[1] ?? null;
};

export const getErrorMessageAndThrow = (
  logMessage: string,
  error: unknown,
): never => {
  let errorMessage;

  if (error instanceof Error) errorMessage = error.message;
  if (error && typeof error === "object" && "message" in error) {
    errorMessage = String(error.message);
  }
  if (typeof error === "string") errorMessage = error;
  if (!errorMessage) errorMessage = "Unknown error";

  console.error(logMessage, errorMessage);

  throw error;
};
