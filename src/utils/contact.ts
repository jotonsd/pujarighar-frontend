// Shared with the backend's support_chat_service.get_contact_info — keep both
// in sync if either ever changes (no backend field for the Facebook page id yet).
export const FACEBOOK_PAGE_ID = "pujarighar";
export const DEFAULT_EMAIL = "pujarigharbd@gmail.com";

export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `880${digits.slice(1)}`;
  return digits;
}
