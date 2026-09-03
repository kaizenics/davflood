import { describeAge, newsDay } from "@davflood/hazard/news";
import { ExternalLink } from "lucide-react";

import { useNow } from "@/hooks/use-now";
import type { NewsPin } from "@/components/map/news-pin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  pin: NewsPin;
  onClose: () => void;
};

/**
 * What was reported about one barangay.
 *
 * The first line does the important work. A pin on a flood map invites the
 * reading "this barangay is flooded", and only one of these reports is even
 * about the present — so the panel says what it is before it says anything
 * else, and every item carries its age in words next to the date.
 */
export function NewsDialog({ pin, onClose }: Props) {
  /* Ticks every 30s, like every other relative timestamp in the app. The ages
     here were read once at render off a bare `new Date()`, so a dialog left
     open during a storm — which is when it is open — froze at whatever "2
     hours ago" was true when it was tapped. */
  const now = useNow();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-5">
        <DialogHeader>
          <DialogTitle>Brgy. {pin.barangay}</DialogTitle>
          <DialogDescription>
            {pin.items.length} flood report{pin.items.length === 1 ? "" : "s"}{" "}
            naming this barangay. Reported by others — not verified by
            DavFlood, and not a statement about conditions right now.
          </DialogDescription>
        </DialogHeader>

        <ul className="mt-4 space-y-3.5">
          {pin.items.map((item) => (
            <li key={item.title} className="border-hairline/60 border-b pb-3.5 last:border-0 last:pb-0">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-3"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="border-hairline/60 bg-raised size-20 shrink-0 rounded-lg border object-cover"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="text-ink group-hover:text-tide block text-[13px] leading-snug font-medium transition">
                    {item.title}
                    <ExternalLink
                      className="ml-1 inline size-3 align-[-1px] opacity-60"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-ink-dim mt-1 block text-[11px]">
                    {/* `newsDay`, not the raw field. RSS carries a full
                        timestamp — keeping the clock is what lets the age
                        below say "3 hours ago" — and printing it unformatted
                        put "2026-08-28T00:08:31.000Z" in front of the reader.
                        /news has always used the calendar part here. */}
                    {item.source} · {newsDay(item.date)}
                    {now && ` · ${describeAge(item.date, now)}`}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="text-ink-dim mt-4 text-[10.5px] leading-relaxed">
          Placed on the map because the headline named this barangay. The
          hazard zones underneath come from the UP NOAH model and are
          unaffected by any of this.
        </p>
      </DialogContent>
    </Dialog>
  );
}
