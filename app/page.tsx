"use client"
export const runtime = 'edge';
export const dynamic = "force-dynamic";


import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin, ChevronRight, Loader2, Trophy, Swords } from "lucide-react";

function EventStatusBadge({ status }: { status: string }) {
  if (status === "live") {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 text-xs font-bold uppercase tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        LIVE
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="px-2 py-0.5 rounded-full bg-[#333] text-[#9A9A9A] text-xs font-semibold uppercase tracking-wide">
        FINAL
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full bg-[#1A1A1A] border border-[#333] text-[#9A9A9A] text-xs font-semibold uppercase tracking-wide">
      UPCOMING
    </span>
  );
}

export default function HomePage() {
  const { data: events, isLoading } = trpc.events.list.useQuery();
  const { data: user } = trpc.auth.me.useQuery();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1A1A1A] border border-[#333] p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D20A0A]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#D20A0A] flex items-center justify-center font-black text-white text-sm">FC</div>
            <span className="text-[#D20A0A] text-sm font-bold uppercase tracking-widest">FightCred</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 leading-tight">
            UFC Predictions.<br />
            <span className="text-[#D20A0A]">Earn Credibility.</span>
          </h1>
          <p className="text-[#9A9A9A] text-base max-w-lg">
            Pick fight winners, predict finishes, and build your credibility score. Underdog picks earn more — prove you know UFC.
          </p>
          {!user && (
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="px-5 py-2.5 bg-[#D20A0A] hover:bg-[#b00808] text-white font-bold rounded-xl transition-colors text-sm"
              >
                Start Predicting
              </Link>
              <Link
                href="/leaderboard"
                className="px-5 py-2.5 bg-[#252525] border border-[#333] hover:border-[#D20A0A]/50 text-white font-bold rounded-xl transition-colors text-sm flex items-center gap-2"
              >
                <Trophy size={14} />
                Leaderboard
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Upcoming", value: events?.filter((e: { status: string }) => e.status === "upcoming").length ?? "—" },
          { label: "Live Now", value: events?.filter((e: { status: string }) => e.status === "live").length ?? "—" },
          { label: "Total Events", value: events?.length ?? "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-white">{value}</div>
            <div className="text-xs text-[#9A9A9A] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Events list */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Swords size={18} className="text-[#D20A0A]" />
          Fight Events
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-[#9A9A9A]">
            <Loader2 size={24} className="animate-spin mr-2" />
            Loading events...
          </div>
        ) : !events || events.length === 0 ? (
          <div className="text-center py-16 text-[#9A9A9A]">
            <Swords size={40} className="mx-auto mb-3 opacity-30" />
            <p>No events scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(events as Array<{ id: number; name: string; eventDate: string | Date; status: string; venue?: string | null; location?: string | null }>).map((event) => (
              <Link
                key={event.id}
                href={`/event/${event.id}`}
                className="group block bg-[#1A1A1A] border border-[#333] hover:border-[#D20A0A]/50 rounded-xl p-5 transition-all hover:bg-[#1f1f1f]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <EventStatusBadge status={event.status} />
                      <span className="text-xs text-[#9A9A9A]">
                        {format(new Date(event.eventDate), "EEE, MMM d, yyyy")}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-lg leading-snug group-hover:text-[#D20A0A] transition-colors truncate">
                      {event.name}
                    </h3>
                    {event.venue && (
                      <div className="flex items-center gap-1 mt-1.5 text-[#9A9A9A] text-sm">
                        <MapPin size={12} />
                        <span className="truncate">
                          {event.venue}{event.location ? `, ${event.location}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-[#333] group-hover:text-[#D20A0A] transition-colors flex-shrink-0 mt-1"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
