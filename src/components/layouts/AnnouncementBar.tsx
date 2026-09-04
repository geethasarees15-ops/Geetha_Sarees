"use client";

import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStorefrontAnnouncements } from "@/providers/AnnouncementsProvider";
import type { StorefrontAnnouncement } from "@/lib/announcements/types";

type Announcement = StorefrontAnnouncement;

function isExternalHref(href: string) {
  return (
    href.startsWith("http") ||
    href.startsWith("tel:") ||
    href.startsWith("mailto:")
  );
}

function MarqueeItem({ item }: { item: Announcement }) {
  const className =
    "inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-xs text-foreground/90 transition-opacity hover:text-foreground sm:text-sm";

  const content = (
    <>
      <span>{item.text}</span>
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-primary sm:text-[11px]">
        {item.cta}
        <ChevronRight className="h-3 w-3" strokeWidth={2.5} aria-hidden />
      </span>
    </>
  );

  if (isExternalHref(item.href)) {
    return (
      <a href={item.href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  );
}

function MarqueeStrip({
  items,
  duplicate = false,
}: {
  items: Announcement[];
  duplicate?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-10 pr-10 sm:gap-14 sm:pr-14",
        duplicate && "pointer-events-none",
      )}
      aria-hidden={duplicate}
    >
      {items.map((item, index) => (
        <span
          key={`${item.text}-${index}`}
          className="inline-flex items-center gap-10 sm:gap-14"
        >
          {index > 0 ? (
            <span className="text-brand-gold-border/70 select-none" aria-hidden>
              ◆
            </span>
          ) : null}
          <MarqueeItem item={item} />
        </span>
      ))}
    </div>
  );
}

export function AnnouncementBar() {
  const { enabled, items } = useStorefrontAnnouncements();
  if (!enabled || !items.length) return null;

  if (items.length === 1) {
    const item = items[0];
    return (
      <div className="store-announcement-bar relative overflow-hidden">
        <div className="relative z-10 flex h-[var(--announcement-bar-height)] items-center justify-center gap-2 px-3 sm:px-4">
          <Sparkles
            className="hidden h-3.5 w-3.5 shrink-0 text-primary sm:block"
            aria-hidden
          />
          <MarqueeItem item={item} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="store-announcement-bar group/announcement relative overflow-hidden"
      aria-label="Store announcements"
    >
      <div className="relative z-10 flex h-[var(--announcement-bar-height)] items-center">
        <div className="relative z-20 flex shrink-0 items-center pl-2 pr-1 sm:pl-3 sm:pr-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
        </div>

        <div className="announcement-marquee-mask relative min-w-0 flex-1 overflow-hidden">
          <div
            className={cn(
              "announcement-marquee-track flex w-max items-center",
              "animate-announcement-scroll",
              "group-hover/announcement:[animation-play-state:paused]",
            )}
          >
            <MarqueeStrip items={items} />
            <MarqueeStrip items={items} duplicate />
          </div>
        </div>
      </div>
    </div>
  );
}
