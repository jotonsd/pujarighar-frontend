"use client";

import { useGetSiteSettingsQuery } from "@/api/settings/settingsApi";
import {
  DisambiguationCandidate,
  PendingOrder,
  SupportChatProduct,
  SupportChatTurn,
  useSendSupportChatMutation,
} from "@/api/support/supportChatApi";
import { useSupportChatStore } from "@/store/supportChatStore";
import {
  DEFAULT_EMAIL,
  FACEBOOK_PAGE_ID,
  toWhatsAppNumber,
} from "@/utils/contact";
import { formatAmount, localName } from "@/utils/format";
import { CheckCircle2, Mail, Minus, Phone, Send, User, X } from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function BrahmanAvatar({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/assets/logo/brahman.png"
      alt="Brahman AI"
      width={size}
      height={size}
      className="rounded-full shrink-0"
    />
  );
}

interface Message extends SupportChatTurn {
  id: string;
  isError?: boolean;
  products?: SupportChatProduct[];
  pendingOrder?: PendingOrder | null;
  candidates?: DisambiguationCandidate[];
}

function ProductResultCard({
  product,
  isBn,
  locale,
}: {
  product: SupportChatProduct;
  isBn: boolean;
  locale: string;
}) {
  const card = (
    <div className="flex items-center gap-2.5 p-2 hover:bg-amber-50 transition-colors">
      {product.image_url ? (
        <Image
          src={product.image_url}
          alt=""
          width={40}
          height={40}
          className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 truncate">
          {localName(product.name_bn, product.name_en, isBn)}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs font-bold text-amber-700">
            {formatAmount(product.price, locale, 2)}
          </span>
          {product.original_price && (
            <span className="text-[10px] text-gray-400 line-through">
              {formatAmount(product.original_price, locale, 2)}
            </span>
          )}
          {!product.in_stock && (
            <span className="text-[10px] text-red-500">
              {isBn ? "স্টক নেই" : "Out of stock"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
  return product.url ? (
    <Link href={`/${locale}${product.url}`} target="_blank" className="block">
      {card}
    </Link>
  ) : (
    card
  );
}

function OrderPreviewCard({
  order,
  isBn,
  locale,
  onConfirm,
  confirming,
  interactive,
}: {
  order: PendingOrder;
  isBn: boolean;
  locale: string;
  onConfirm: () => void;
  confirming: boolean;
  interactive: boolean;
}) {
  const hasDeliveryInfo = order.customer_name || order.phone || order.address || order.district;

  return (
    <div className="border-t border-amber-100">
      {hasDeliveryInfo && (
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-700 space-y-0.5">
          <p className="font-semibold text-gray-800 mb-1">
            {isBn ? "ডেলিভারি তথ্য" : "Delivery details"}
          </p>
          {order.customer_name && <p>{order.customer_name}</p>}
          {order.phone && <p>{order.phone}</p>}
          {(order.address || order.district) && (
            <p>{[order.address, order.district].filter(Boolean).join(", ")}</p>
          )}
        </div>
      )}
      <div className="divide-y divide-gray-50">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 p-2">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt=""
                width={40}
                height={40}
                className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">
                {localName(item.name_bn, item.name_en, isBn)}
              </p>
              <p className="text-[11px] text-gray-400">
                {item.quantity} × {formatAmount(item.unit_price, locale, 2)}
                {!item.in_stock && (
                  <span className="text-red-500 ml-1">{isBn ? "স্টক নেই" : "out of stock"}</span>
                )}
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700 shrink-0">
              {formatAmount(item.line_total, locale, 2)}
            </span>
          </div>
        ))}
      </div>
      <div className="px-3 py-2 bg-amber-50 text-xs text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>{isBn ? "সাবটোটাল" : "Subtotal"}</span>
          <span>{formatAmount(order.subtotal, locale, 2)}</span>
        </div>
        <div className="flex justify-between">
          <span>{isBn ? "ডেলিভারি চার্জ" : "Delivery charge"}</span>
          <span>{formatAmount(order.delivery_charge, locale, 2)}</span>
        </div>
        <div className="flex justify-between font-bold text-amber-700 text-sm pt-1 border-t border-amber-100">
          <span>{isBn ? "সর্বমোট" : "Grand total"}</span>
          <span>{formatAmount(order.grand_total, locale, 2)}</span>
        </div>
        <p className="text-[11px] text-gray-400 pt-0.5">
          {isBn ? "পেমেন্ট: ক্যাশ অন ডেলিভারি" : "Payment: Cash on Delivery"}
        </p>
      </div>
      {interactive && (
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirming}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-60"
        >
          <CheckCircle2 className="w-4 h-4" />
          {confirming
            ? (isBn ? "পাঠানো হচ্ছে..." : "Sending...")
            : (isBn ? "অর্ডার কনফার্ম করুন" : "Confirm Order")}
        </button>
      )}
    </div>
  );
}

function CandidateSelector({
  candidates,
  isBn,
  locale,
  onSelect,
  selecting,
  interactive,
}: {
  candidates: DisambiguationCandidate[];
  isBn: boolean;
  locale: string;
  onSelect: (candidate: DisambiguationCandidate) => void;
  selecting: boolean;
  interactive: boolean;
}) {
  return (
    <div className="border-t border-amber-100 divide-y divide-gray-50">
      {candidates.map(c => (
        <button
          key={c.product_id}
          type="button"
          onClick={() => interactive && onSelect(c)}
          disabled={!interactive || selecting}
          className="w-full flex items-center gap-2.5 p-2 text-left hover:bg-amber-50 transition-colors disabled:hover:bg-transparent disabled:opacity-60"
        >
          {c.image_url ? (
            <Image
              src={c.image_url}
              alt=""
              width={40}
              height={40}
              className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">
              {localName(c.name_bn, c.name_en, isBn)}
            </p>
            <p className="text-[11px] text-amber-700 font-bold">
              {formatAmount(c.price, locale, 2)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

function QuickLink({
  href,
  label,
  bg,
  compact,
  children,
}: {
  href: string;
  label: string;
  bg: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className={`flex items-center justify-center ${compact ? "w-6 h-6" : "w-8 h-8"} rounded-full shrink-0 hover:scale-110 transition-transform ${bg}`}
    >
      {children}
    </a>
  );
}

// The model replies in light markdown (**bold**, [text](url) links, "- "/"* "
// bullet lists). No markdown library needed for just these — split into
// React nodes directly, never dangerouslySetInnerHTML, so there's no
// injection risk regardless of what URL the model puts in a link.
function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={i}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-700 underline hover:text-amber-800"
        >
          {link[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function FormattedMessage({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const bullet = line.match(/^\s*[*-]\s+(.*)/);
        if (bullet) {
          return (
            <div key={i} className="flex gap-1.5 pl-1">
              <span className="shrink-0">•</span>
              <span>{renderInline(bullet[1])}</span>
            </div>
          );
        }
        return line ? (
          <div key={i}>{renderInline(line)}</div>
        ) : (
          <div key={i} className="h-1" />
        );
      })}
    </div>
  );
}

const CHAT_STORAGE_KEY = "brahman-ai-chat-history";
const MAX_STORED_MESSAGES = 50;

function loadStoredMessages(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function SupportChatWidget() {
  const pathname = usePathname();
  const locale = useLocale();
  const isBn = locale === "bn";
  const isOpen = useSupportChatStore(s => s.isOpen);
  const close = useSupportChatStore(s => s.close);

  // Lazy initializer (not a mount effect) — runs synchronously on first
  // render, so `messages` is already correct before the save-effect below
  // ever runs. Loading via a separate useEffect instead caused a race: the
  // save-effect would fire on mount with the still-empty initial state
  // (before the load-effect's setMessages had re-rendered in), immediately
  // overwriting the stored history with [].
  const [messages, setMessages] = useState<Message[]>(loadStoredMessages);
  const [input, setInput] = useState("");
  const [sendChat, { isLoading }] = useSendSupportChatMutation();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { data: siteSettings } = useGetSiteSettingsQuery();

  const waNumber = siteSettings?.contact_phone
    ? toWhatsAppNumber(siteSettings.contact_phone)
    : null;
  const email = siteSettings?.contact_email || DEFAULT_EMAIL;

  const isAdmin = pathname?.split("/")[2] === "admin";

  const handleClose = () => {
    setMessages([]);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // private-browsing / storage unavailable — nothing to clean up
    }
    close();
  };

  // Per-browser persistence only (localStorage) — reloading the page keeps
  // the visible conversation instead of silently wiping it.
  useEffect(() => {
    try {
      localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)),
      );
    } catch {
      // private-browsing / storage-full — conversation still works for this session
    }
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isOpen]);

  // Auto-grow the textarea as the customer types multi-line text (Shift+Enter),
  // capped by the max-h-24 class on the element itself.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  if (isAdmin || !isOpen) return null;

  const sendMessage = async (text: string) => {
    if (!text || isLoading) return;
    const userMsg: Message = { id: `${Date.now()}-u`, role: "user", text };
    const history = messages.map(({ role, text }) => ({ role, text }));
    // Echo back the last order preview the customer actually saw — the
    // backend trusts this (real product IDs) over re-guessing which exact
    // product the model's own later, vaguer wording refers to.
    const lastModelMsg = [...messages].reverse().find(m => m.role === "model");
    const pendingOrder = lastModelMsg?.pendingOrder ?? null;
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    try {
      const res = await sendChat({ message: text, history, pending_order: pendingOrder }).unwrap();
      setMessages(prev => [
        ...prev,
        {
          id: `${Date.now()}-m`,
          role: "model",
          text: res.reply,
          products: res.products,
          pendingOrder: res.pending_order,
          candidates: res.candidates,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `${Date.now()}-m`,
          role: "model",
          isError: true,
          text: isBn
            ? "দুঃখিত, এই মুহূর্তে সাহায্য করতে পারছি না। পরে আবার চেষ্টা করুন।\n\nঅথবা যোগাযোগ করুন সরাসরি:"
            : "Sorry, I can't help right now — please try again shortly.\n\nOr contact us directly:",
        },
      ]);
    }
  };

  const handleSend = () => sendMessage(input.trim());
  const handleConfirmOrder = () =>
    sendMessage(isBn ? "হ্যাঁ, অর্ডারটি কনফার্ম করুন।" : "Yes, please confirm the order.");
  const handleSelectCandidate = (candidate: DisambiguationCandidate) =>
    sendMessage(localName(candidate.name_bn, candidate.name_en, isBn));

  const contactIcons = (compact?: boolean) => (
    <div
      className={`flex items-center gap-2 ${compact ? "mt-2" : "justify-center gap-2.5 px-3 py-2 bg-amber-50 border-b border-amber-100 shrink-0"}`}
    >
      {siteSettings?.contact_phone && (
        <QuickLink
          href={`tel:${siteSettings.contact_phone}`}
          label={isBn ? "কল করুন" : "Call"}
          bg="bg-amber-700"
          compact={compact}
        >
          <Phone
            className={compact ? "w-3 h-3 text-white" : "w-4 h-4 text-white"}
            strokeWidth={2}
          />
        </QuickLink>
      )}
      {waNumber && (
        <QuickLink
          href={`https://wa.me/${waNumber}`}
          label={isBn ? "হোয়াটসঅ্যাপ" : "WhatsApp"}
          bg="bg-[#25D366]"
          compact={compact}
        >
          <svg
            viewBox="0 0 24 24"
            className={compact ? "w-3 h-3 fill-white" : "w-4 h-4 fill-white"}
            aria-hidden="true"
          >
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.92 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.24-.64.81-.78.97-.15.17-.29.19-.53.06-.25-.12-1.05-.39-2-1.23a7.5 7.5 0 0 1-1.38-1.72c-.15-.24-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.24-.87.86-.87 2.09 0 1.23.9 2.42 1.02 2.59.12.17 1.76 2.68 4.26 3.76.6.26 1.06.41 1.43.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.23-.16-.48-.28Z" />
          </svg>
        </QuickLink>
      )}
      <QuickLink
        href={`https://m.me/${FACEBOOK_PAGE_ID}`}
        label={isBn ? "মেসেঞ্জার" : "Messenger"}
        bg="bg-[#0084FF]"
        compact={compact}
      >
        <svg
          viewBox="0 0 24 24"
          className={compact ? "w-3 h-3 fill-white" : "w-4 h-4 fill-white"}
          aria-hidden="true"
        >
          <path d="M12 2C6.48 2 2 6.13 2 11.7c0 3.02 1.34 5.7 3.5 7.53V22l3.2-1.76c.85.24 1.76.36 2.7.36 5.52 0 10-4.13 10-9.7C21.4 6.13 17.52 2 12 2Zm1.03 12.6-2.56-2.73-4.99 2.73 5.49-5.83 2.62 2.73 4.93-2.73-5.49 5.83Z" />
        </svg>
      </QuickLink>
      <QuickLink
        href={`https://www.facebook.com/${FACEBOOK_PAGE_ID}`}
        label={isBn ? "ফেসবুক পেজ" : "Facebook Page"}
        bg="bg-[#1877F2]"
        compact={compact}
      >
        <svg
          viewBox="0 0 24 24"
          className={compact ? "w-3 h-3 fill-white" : "w-4 h-4 fill-white"}
          aria-hidden="true"
        >
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
        </svg>
      </QuickLink>
      <QuickLink
        href={`mailto:${email}`}
        label={isBn ? "ইমেইল" : "Email"}
        bg="bg-slate-600"
        compact={compact}
      >
        <Mail
          className={compact ? "w-3 h-3 text-white" : "w-4 h-4 text-white"}
          strokeWidth={2}
        />
      </QuickLink>
    </div>
  );

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 w-[calc(100vw-2rem)] max-w-sm h-[70vh] max-h-[560px] flex flex-col bg-amber-50 rounded-2xl shadow-2xl border border-amber-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-amber-600 text-white shrink-0">
        <div className="flex items-center gap-2">
          <BrahmanAvatar size={24} />
          <span className="font-semibold text-sm">
            {isBn ? "ব্রাহ্মণ AI" : "Brahman AI"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={close}
            title={isBn ? "মিনিমাইজ করুন" : "Minimize"}
            aria-label={isBn ? "মিনিমাইজ করুন" : "Minimize"}
            className="hover:opacity-80"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            onClick={handleClose}
            title={isBn ? "বন্ধ করুন (চ্যাট মুছে যাবে)" : "Close (clears chat)"}
            aria-label={isBn ? "বন্ধ করুন" : "Close"}
            className="hover:opacity-80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {contactIcons()}

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-gray-50"
      >
        {messages.length === 0 && (
          <div className="text-center text-sm text-gray-400 mt-6 px-4">
            {isBn
              ? "পণ্য, দাম, ছাড়, ডেলিভারি চার্জ, রেফারেল, ক্যাশব্যাক, যোগাযোগের তথ্য অথবা সরাসরি অর্ডার করতে যেকোনো প্রশ্ন করুন।"
              : "Ask anything about products, prices, discounts, delivery charges, referrals, cashback, how to reach us — or place an order directly."}
          </div>
        )}
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex items-start gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {m.role === "user" ? (
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-amber-600">
                <User className="w-4 h-4 text-white" />
              </div>
            ) : (
              <BrahmanAvatar size={28} />
            )}
            <div
              className={`max-w-[75%] rounded-2xl text-sm overflow-hidden ${m.role === "user" ? "bg-amber-600 text-white whitespace-pre-wrap px-3 py-2" : "bg-white text-gray-800 border border-gray-100"}`}
            >
              {m.role === "user" ? (
                m.text
              ) : (
                <>
                  <div className="px-3 py-2">
                    <FormattedMessage text={m.text} />
                    {m.isError && contactIcons(true)}
                  </div>
                  {!!m.products?.length && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {m.products.map((p, i) => (
                        <ProductResultCard
                          key={i}
                          product={p}
                          isBn={isBn}
                          locale={locale}
                        />
                      ))}
                    </div>
                  )}
                  {m.pendingOrder && (
                    <OrderPreviewCard
                      order={m.pendingOrder}
                      isBn={isBn}
                      locale={locale}
                      onConfirm={handleConfirmOrder}
                      confirming={isLoading}
                      interactive={m.id === messages[messages.length - 1]?.id}
                    />
                  )}
                  {!!m.candidates?.length && (
                    <CandidateSelector
                      candidates={m.candidates}
                      isBn={isBn}
                      locale={locale}
                      onSelect={handleSelectCandidate}
                      selecting={isLoading}
                      interactive={m.id === messages[messages.length - 1]?.id}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-2">
            <BrahmanAvatar size={28} />
            <div className="bg-white border border-gray-100 rounded-2xl px-3 py-2.5 flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 p-3 border-t border-gray-100 shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
            // Shift+Enter: no preventDefault — browser inserts the newline itself.
          }}
          placeholder={isBn ? "টাইপ করুন..." : "Type here..."}
          rows={1}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 resize-none max-h-24 overflow-y-auto"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          aria-label={isBn ? "পাঠান" : "Send"}
          className="w-9 h-9 shrink-0 rounded-full bg-amber-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-amber-700 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
