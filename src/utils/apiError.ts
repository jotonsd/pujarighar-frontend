function humanizeField(field: string): string {
  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

interface ApiErrorShape {
  data?: {
    message?: string;
    errors?: Record<string, unknown> | string | null;
  };
}

/**
 * Extracts a human-readable message from an RTK Query error.
 * Handles both response shapes returned by the backend's ApiResponse:
 *  - bilingual service-layer errors: { message_bn, message_en }
 *  - raw DRF serializer errors:      { field_name: ["message", ...], ... }
 */
export function getErrorMessage(err: unknown, locale: string): string {
  const isBn = locale === "bn";
  const fallback = isBn ? "ব্যর্থ হয়েছে" : "Failed";
  const e = err as ApiErrorShape;
  const errors = e.data?.errors;

  if (errors && typeof errors === "object") {
    const bag = errors as Record<string, unknown>;

    if ("message_bn" in bag || "message_en" in bag) {
      const msg = isBn ? bag.message_bn : bag.message_en;
      if (msg) return String(msg);
    }

    const fieldMessages = Object.entries(bag)
      .map(([field, msgs]) => {
        const msg = Array.isArray(msgs) ? msgs[0] : msgs;
        if (!msg) return null;
        return `${humanizeField(field)}: ${msg}`;
      })
      .filter((m): m is string => !!m);

    if (fieldMessages.length > 0) return fieldMessages.join(" ");
  } else if (typeof errors === "string" && errors) {
    return errors;
  }

  if (e.data?.message) return e.data.message;
  return fallback;
}

/**
 * Extracts per-field messages from a raw DRF serializer error response
 * ({ field_name: ["message", ...], ... }) so they can be shown inline under
 * the matching input (via its `error` prop) instead of only as one combined
 * toast. Bilingual service-layer errors ({ message_bn, message_en }) have no
 * single field to attach to, so they're left out — getErrorMessage's toast
 * still covers those.
 */
export function getFieldErrors(err: unknown): Record<string, string> {
  const e = err as ApiErrorShape;
  const errors = e.data?.errors;
  if (!errors || typeof errors !== "object") return {};

  const bag = errors as Record<string, unknown>;
  if ("message_bn" in bag || "message_en" in bag) return {};

  const fields: Record<string, string> = {};
  for (const [field, msgs] of Object.entries(bag)) {
    const msg = Array.isArray(msgs) ? msgs[0] : msgs;
    if (msg) fields[field] = String(msg);
  }
  return fields;
}
