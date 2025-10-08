"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Photo = {
  id: string;
  src: string;
  width: number;
  height: number;
  title: string;
  tags: string[];
  takenAt: string; // ISO
};

const DEMO_PHOTOS: Photo[] = Array.from({ length: 36 }).map((_, i) => {
  const w = 800 + ((i * 73) % 600);
  const h = 600 + ((i * 97) % 600);
  const id = i + 1;
  return {
    id: String(id),
    src: `https://images.unsplash.com/photo-15${(1000 + i)
      .toString()
      .slice(0, 4)}-${(i % 12) + 1}-0${(i % 9) + 1}?fit=crop&w=${w}&h=${h}`,
    width: w,
    height: h,
    title: `Sample Photo ${id}`,
    tags: ["travel", "people", "city", "nature", "abstract"].filter(
      (_, idx) => (i + idx) % 3 === 0
    ),
    takenAt: new Date(2024, (i * 3) % 12, (i * 2) % 28 + 1).toISOString(),
  };
});

const unique = (arr: string[]) => Array.from(new Set(arr));
const cn = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ");

export default function GalleryApp() {
  const [photos, setPhotos] = useState<Photo[]>(DEMO_PHOTOS);
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sort, setSort] = useState<"newest" | "oldest" | "title">("newest");

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(18);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const allTags = useMemo(
    () => unique(photos.flatMap((p) => p.tags)).sort(),
    [photos]
  );

  const filtered = useMemo(() => {
    let list = photos;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (activeTags.length) {
      list = list.filter((p) => activeTags.every((t) => p.tags.includes(t)));
    }
    if (sort === "newest") {
      list = [...list].sort(
        (a, b) => +new Date(b.takenAt) - +new Date(a.takenAt)
      );
    } else if (sort === "oldest") {
      list = [...list].sort(
        (a, b) => +new Date(a.takenAt) - +new Date(b.takenAt)
      );
    } else {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [photos, query, activeTags, sort]);

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisibleCount((n) => Math.min(n + 12, filtered.length));
          }
        });
      },
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightboxIdx == null) return;
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight")
        setLightboxIdx((i) => ((i ?? 0) + 1) % filtered.length);
      if (e.key === "ArrowLeft")
        setLightboxIdx((i) => ((i ?? 0) - 1 + filtered.length) % filtered.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, filtered.length]);

  useEffect(() => setVisibleCount(18), [query, activeTags, sort]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Photo Collection</h1>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <SearchBox value={query} onChange={setQuery} />
            <SortSelect value={sort} onChange={setSort} />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-3">
          <TagBar
            tags={allTags}
            active={activeTags}
            onToggle={(t) =>
              setActiveTags((xs) =>
                xs.includes(t) ? xs.filter((x) => x !== t) : [...xs, t]
              )
            }
            onClear={() => setActiveTags([])}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <MasonryGrid
          items={visible}
          onClick={(id) => {
            const idx = filtered.findIndex((p) => p.id === id);
            if (idx !== -1) setLightboxIdx(idx);
          }}
        />
        <div ref={sentinelRef} className="h-24" />
        {filtered.length === 0 && <EmptyState />}
      </main>

      {lightboxIdx != null && (
        <Lightbox
          photo={filtered[lightboxIdx]}
          onClose={() => setLightboxIdx(null)}
          onPrev={() =>
            setLightboxIdx((i) => ((i ?? 0) - 1 + filtered.length) % filtered.length)
          }
          onNext={() => setLightboxIdx((i) => ((i ?? 0) + 1) % filtered.length)}
        />
      )}
    </div>
  );
}

function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="relative block">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full md:w-80 rounded-2xl border border-neutral-300 bg-white px-4 py-2 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-800"
        placeholder="Search photos or tags…"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
        ⌘K
      </span>
    </label>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: "newest" | "oldest" | "title";
  onChange: (v: "newest" | "oldest" | "title") => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as any)}
      className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-800"
      title="Sort"
    >
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
      <option value="title">Title (A–Z)</option>
    </select>
  );
}

function TagBar({
  tags,
  active,
  onToggle,
  onClear,
}: {
  tags: string[];
  active: string[];
  onToggle: (t: string) => void;
  onClear: () => void;
}) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-2 items-center py-1">
      {tags.map((t) => (
        <button
          key={t}
          onClick={() => onToggle(t)}
          className={cn(
            "px-3 py-1 rounded-full text-sm border",
            active.includes(t)
              ? "bg-neutral-900 text-white border-neutral-900"
              : "bg-white text-neutral-800 border-neutral-300 hover:border-neutral-500"
          )}
        >
          {t}
        </button>
      ))}
      {active.length > 0 && (
        <button
          onClick={onClear}
          className="ml-2 text-sm underline underline-offset-4 text-neutral-600 hover:text-neutral-900"
        >
          Clear
        </button>
      )}
    </div>
  );
}

function MasonryGrid({
  items,
  onClick,
}: {
  items: Photo[];
  onClick: (id: string) => void;
}) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
      {items.map((p) => (
        <figure
          key={p.id}
          className="mb-4 break-inside-avoid rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <button
            onClick={() => onClick(p.id)}
            className="block w-full text-left"
            aria-label={`Open ${p.title}`}
          >
            <img src={p.src} alt={p.title} loading="lazy" className="w-full h-auto block" />
          </button>
          <figcaption className="p-3 text-sm text-neutral-700 flex items-center justify-between">
            <span className="truncate" title={p.title}>
              {p.title}
            </span>
            <span className="text-xs text-neutral-500 ml-2">
              {new Date(p.takenAt).toLocaleDateString()}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-medium">No photos found</p>
      <p className="text-neutral-600">Try removing filters or changing your search.</p>
    </div>
  );
}

function Lightbox({
  photo,
  onClose,
  onPrev,
  onNext,
}: {
  photo: Photo;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-6xl max-h-[85vh] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={photo.src} alt={photo.title} className="mx-auto max-h-[75vh] object-contain w-full" />
        <div className="mt-3 flex items-center justify-between text-white/90">
          <div>
            <h2 className="text-lg font-semibold">{photo.title}</h2>
            <p className="text-sm text-white/70">{new Date(photo.takenAt).toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onPrev} className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20" aria-label="Previous">
              ←
            </button>
            <button onClick={onNext} className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20" aria-label="Next">
              →
            </button>
            <button onClick={onClose} className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20" aria-label="Close">
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
