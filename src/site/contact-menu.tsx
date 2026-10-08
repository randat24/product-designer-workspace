"use client";

import { Check, ChevronDown, Copy, Mail, Send } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { track } from "./analytics/track";
import type { AnalyticsLocation } from "./analytics/events";
import { LinkedInIcon, TelegramIcon } from "./social-icons";
import { button, sg } from "./signal/ui";

type Contacts = { email: string; telegram: string; linkedin: string };

/**
 * «Написати мені»: a button that opens a short list of channels (mail, Telegram, LinkedIn), so the visitor
 * picks the one they use instead of being thrown into a mail client. Disclosure pattern: Esc and a click
 * outside close it; the address can be copied in one tap.
 */
export function ContactMenu({ label, heading, copyLabel, copiedLabel, contacts, location, variant = "primary" }: {
  label: string;
  heading: string;
  copyLabel: string;
  copiedLabel: string;
  contacts: Contacts;
  /** Analytics: where on the site the menu sits. */
  location: AnalyticsLocation;
  variant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    root.current?.querySelector<HTMLElement>("[data-first]")?.focus();
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const items = [
    { key: "email", href: `mailto:${contacts.email}`, label: contacts.email, Icon: Mail, event: "contact_email_click" as const },
    { key: "telegram", href: contacts.telegram, label: "Telegram", Icon: TelegramIcon, event: "telegram_click" as const },
    { key: "linkedin", href: contacts.linkedin, label: "LinkedIn", Icon: LinkedInIcon, event: "linkedin_click" as const },
  ];

  return (
    <div ref={root} className="relative">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => { if (!open) track("contact_menu_open", { location }); setOpen(!open); }}
        className={button({ variant })}>
        {label}
        <span className="flex items-center gap-1.5">
          <Send aria-hidden className="size-4" />
          <ChevronDown aria-hidden className={cn("-mr-1 size-4 transition-transform duration-[120ms]", open && "rotate-180")} />
        </span>
      </button>
      <div id={id} hidden={!open}
        className={cn(sg.menu, "absolute top-full left-0 mt-2 w-[min(300px,calc(100vw-32px))]")}>
        <p className="sg-eyebrow px-2.5 pt-1 pb-2 text-fg-secondary">{heading}</p>
        <ul className="flex flex-col">
          {items.map(({ key, href, label: text, Icon, event }, i) => (
            <li key={key} className="flex items-center gap-1">
              <a href={href} data-first={i === 0 ? "" : undefined}
                {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer me" } : {})}
                onClick={() => { track(event, { location }); setOpen(false); }}
                className={cn(sg.menuItem, "min-w-0 flex-1")}>
                <Icon aria-hidden className="size-5 shrink-0 text-fg-secondary" />
                <span className="truncate">{text}</span>
              </a>
              {key === "email" && (
                <button type="button" aria-label={copied ? copiedLabel : copyLabel} title={copied ? copiedLabel : copyLabel}
                  onClick={async () => {
                    await navigator.clipboard?.writeText(contacts.email).catch(() => {});
                    setCopied(true); track("contact_email_click", { location, cta: "copy_email" });
                    setTimeout(() => setCopied(false), 1600);
                  }}
                  className={button({ variant: "ghost", size: "sm", icon: true }, "text-fg-secondary hover:text-fg")}>
                  {copied ? <Check aria-hidden className="size-4 text-success" /> : <Copy aria-hidden className="size-4" />}
                </button>
              )}
            </li>
          ))}
        </ul>
        <p role="status" aria-live="polite" className="sr-only">{copied ? copiedLabel : ""}</p>
      </div>
    </div>
  );
}
