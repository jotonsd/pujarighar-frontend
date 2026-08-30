"use client";

import { useGetSiteSettingsQuery } from "@/api/settings/settingsApi";
import { SupportChatTurn, useSendSupportChatMutation } from "@/api/support/supportChatApi";
import { useSupportChatStore } from "@/store/supportChatStore";
import { DEFAULT_EMAIL, FACEBOOK_PAGE_ID, toWhatsAppNumber } from "@/utils/contact";
import { Mail, Phone, Send, User, X } from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";
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
}

function QuickLink({ href, label, bg, compact, children }: { href: string; label: string; bg: string; compact?: boolean; children: React.ReactNode }) {
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

// The model replies in light markdown (**bold**, "- "/"* " bullet lists).
// No markdown library needed for just these two — split into React nodes
// directly, never dangerouslySetInnerHTML, so there's no injection risk.
function renderInlineBold(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
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
              <span>{renderInlineBold(bullet[1])}</span>
            </div>
          );
        }
        return line ? <div key={i}>{renderInlineBold(line)}</div> : <div key={i} className="h-1" />;
      })}
    </div>
  );
}

export default function SupportChatWidget() {
  const pathname = usePathname();
  const locale = useLocale();
  const isBn = locale === "bn";
  const isOpen = useSupportChatStore(s => s.isOpen);
  const close = useSupportChatStore(s => s.close);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sendChat, { isLoading }] = useSendSupportChatMutation();
  const listRef = useRef<HTMLDivElement>(null);
  const { data: siteSettings } = useGetSiteSettingsQuery();

  const waNumber = siteSettings?.contact_phone ? toWhatsAppNumber(siteSettings.contact_phone) : null;
  const email = siteSettings?.contact_email || DEFAULT_EMAIL;

  const isAdmin = pathname?.split("/")[2] === "admin";

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  if (isAdmin || !isOpen) return null;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    const userMsg: Message = { id: `${Date.now()}-u`, role: "user", text };
    const history = messages.map(({ role, text }) => ({ role, text }));
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    try {
      const res = await sendChat({ message: text, history }).unwrap();
      setMessages(prev => [...prev, { id: `${Date.now()}-m`, role: "model", text: res.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `${Date.now()}-m`,
        role: "model",
        isError: true,
        text: isBn
          ? "দুঃখিত, এই মুহূর্তে সাহায্য করতে পারছি না। পরে আবার চেষ্টা করুন।\n\nঅথবা যোগাযোগ করুন সরাসরি:"
          : "Sorry, I can't help right now — please try again shortly.\n\nOr contact us directly:",
      }]);
    }
  };

  const contactIcons = (compact?: boolean) => (
    <div className={`flex items-center gap-2 ${compact ? "mt-2" : "justify-center gap-2.5 px-3 py-2 bg-amber-50 border-b border-amber-100 shrink-0"}`}>
      {siteSettings?.contact_phone && (
        <QuickLink href={`tel:${siteSettings.contact_phone}`} label={isBn ? "কল করুন" : "Call"} bg="bg-amber-700" compact={compact}>
          <Phone className={compact ? "w-3 h-3 text-white" : "w-4 h-4 text-white"} strokeWidth={2} />
        </QuickLink>
      )}
      {waNumber && (
        <QuickLink href={`https://wa.me/${waNumber}`} label={isBn ? "হোয়াটসঅ্যাপ" : "WhatsApp"} bg="bg-[#25D366]" compact={compact}>
          <svg viewBox="0 0 24 24" className={compact ? "w-3 h-3 fill-white" : "w-4 h-4 fill-white"} aria-hidden="true">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.92 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.24-.64.81-.78.97-.15.17-.29.19-.53.06-.25-.12-1.05-.39-2-1.23a7.5 7.5 0 0 1-1.38-1.72c-.15-.24-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.24-.87.86-.87 2.09 0 1.23.9 2.42 1.02 2.59.12.17 1.76 2.68 4.26 3.76.6.26 1.06.41 1.43.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.23-.16-.48-.28Z" />
          </svg>
        </QuickLink>
      )}
      <QuickLink href={`https://m.me/${FACEBOOK_PAGE_ID}`} label={isBn ? "মেসেঞ্জার" : "Messenger"} bg="bg-[#0084FF]" compact={compact}>
        <svg viewBox="0 0 24 24" className={compact ? "w-3 h-3 fill-white" : "w-4 h-4 fill-white"} aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.13 2 11.7c0 3.02 1.34 5.7 3.5 7.53V22l3.2-1.76c.85.24 1.76.36 2.7.36 5.52 0 10-4.13 10-9.7C21.4 6.13 17.52 2 12 2Zm1.03 12.6-2.56-2.73-4.99 2.73 5.49-5.83 2.62 2.73 4.93-2.73-5.49 5.83Z" />
        </svg>
      </QuickLink>
      <QuickLink href={`https://www.facebook.com/${FACEBOOK_PAGE_ID}`} label={isBn ? "ফেসবুক পেজ" : "Facebook Page"} bg="bg-[#1877F2]" compact={compact}>
        <svg viewBox="0 0 24 24" className={compact ? "w-3 h-3 fill-white" : "w-4 h-4 fill-white"} aria-hidden="true">
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
        </svg>
      </QuickLink>
      <QuickLink href={`mailto:${email}`} label={isBn ? "ইমেইল" : "Email"} bg="bg-slate-600" compact={compact}>
        <Mail className={compact ? "w-3 h-3 text-white" : "w-4 h-4 text-white"} strokeWidth={2} />
      </QuickLink>
    </div>
  );

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 w-[calc(100vw-2rem)] max-w-sm h-[70vh] max-h-[560px] flex flex-col bg-amber-50 rounded-2xl shadow-2xl border border-amber-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-amber-600 text-white shrink-0">
        <div className="flex items-center gap-2">
          <BrahmanAvatar size={24} />
          <span className="font-semibold text-sm">{isBn ? "ব্রাহ্মণ এআই" : "Brahman AI"}</span>
        </div>
        <button onClick={close} aria-label={isBn ? "বন্ধ করুন" : "Close"} className="hover:opacity-80">
          <X className="w-5 h-5" />
        </button>
      </div>

      {contactIcons()}

      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-sm text-gray-400 mt-6 px-4">
            {isBn
              ? "পণ্য, দাম, ছাড়, ডেলিভারি চার্জ, রেফারেল, ক্যাশব্যাক অথবা যোগাযোগের তথ্য নিয়ে যেকোনো প্রশ্ন করুন।"
              : "Ask anything about products, prices, discounts, delivery charges, referrals, cashback, or how to reach us."}
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex items-start gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            {m.role === "user" ? (
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-amber-600">
                <User className="w-4 h-4 text-white" />
              </div>
            ) : (
              <BrahmanAvatar size={28} />
            )}
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-amber-600 text-white whitespace-pre-wrap" : "bg-white text-gray-800 border border-gray-100"}`}>
              {m.role === "user" ? m.text : <FormattedMessage text={m.text} />}
              {m.isError && contactIcons(true)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-2">
            <BrahmanAvatar size={28} />
            <div className="bg-white border border-gray-100 rounded-2xl px-3 py-2 text-sm text-gray-400">
              {isBn ? "লিখছে..." : "Typing..."}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 p-3 border-t border-gray-100 shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={isBn ? "একটি বার্তা লিখুন..." : "Type a message..."}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
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
