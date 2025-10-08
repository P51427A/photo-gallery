"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// ======= Demo data (replace with your API) =======
const DEMO_PHOTOS = Array.from({ length: 36 }).map((_, i) => {
  const id = i + 1;
  return {
    id: String(id),
    src: `https://picsum.photos/800/600?random=${id}`,
    width: 800,
    height: 600,
    title: `Sample Photo ${id}`,
    tags: [],
    takenAt: new Date(2024, (i * 2) % 12, (i % 28) + 1).toISOString(),
  };
});

const unique = (arr) => Array.from(new Set(arr));
function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function GalleryApp() {
  const [photos, setPhotos] = useState(DEMO_PHOTOS);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");

  const [category, setCategory] = useState("all"); // all | favourites
  const [favs, setFavs] = useState(() => {
    try {
      const raw = localStorage.getItem("favourites");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  const isFav = (id) => favs.has(id);
  const toggleFav = (id) =>
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  useEffect(() => {
    localStorage.setItem("favourites", JSON.stringify([...favs]));
  }, [favs]);

  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [visibleCount, setVisibleCount] = useState(18);
  const sentinelRef = useRef(null);

  const filtered = useMemo(() => {
    let list = photos;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    if (category === "favourites") {
      list = list.filter((p) => favs.has(p.id));
    }
    if (sort === "newest") {
      list = [...list].sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt));
    } else if (sort === "oldest") {
      list = [...list].sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt));
    } else if (sort === "title") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [photos, query, category, sort, favs]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setVisibleCount((n) => Math.min(n + 12, filtered.length));
        }
      });
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  useEffect(() => {
    function onKey(e) {
      if (lightboxIdx == null) return;
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight") setLightboxIdx((i) => (i + 1) % filtered.length);
      if (e.key === "ArrowLeft") setLightboxIdx((i) => (i - 1 + filtered.length) % filtered.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, filtered.length]);

  useEffect(() => setVisibleCount(18), [query, sort, category]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">MUTUU❤️</h1>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <SearchBox value={query} onChange={setQuery} />
            <SortSelect value={sort} onChange={setSort} />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-3">
          <CategoryTabs value={category} onChange={setCategory} favCount={[...favs].length} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <MasonryGrid
          items={visible}
          isFav={isFav}
          onToggleFav={toggleFav}
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
          isFav={isFav}
          onToggleFav={() => toggleFav(filtered[lightboxIdx].id)}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx((i) => (i - 1 + filtered.length) % filtered.length)}
          onNext={() => setLightboxIdx((i) => (i + 1) % filtered.length)}
        />
      )}
    </div>
  );
}

function SearchBox({ value, onChange }) {
  return (
    <label className="relative block">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full md:w-80 rounded-2xl border border-neutral-300 bg-white px-4 py-2 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-800"
        placeholder="Search photos…"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">⌘K</span>
    </label>
  );
}

function SortSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-800"
      title="Sort"
    >
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
      <option value="title">Title (A–Z)</option>
    </select>
  );
}

function CategoryTabs({ value, onChange, favCount }) {
  return (
    <div className="flex items-center gap-2 py-2">
      {[
        { key: "all", label: "All" },
        { key: "favourites", label: `Favourites (${favCount})` },
      ].map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={classNames(
            "px-3 py-1.5 rounded-full text-sm border",
            value === t.key
              ? "bg-neutral-900 text-white border-neutral-900"
              : "bg-white text-neutral-800 border-neutral-300 hover:border-neutral-500"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function MasonryGrid({ items, onClick, isFav, onToggleFav }) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
      {items.map((p) => (
        <figure
          key={p.id}
          className="mb-4 break-inside-avoid rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-shadow relative"
        >
          <button
            onClick={() => onClick(p.id)}
            className="block w-full text-left"
            aria-label={`Open ${p.title}`}
          >
            <img src={p.src} alt={p.title} loading="lazy" className="w-full h-auto block" />
          </button>
          <button
            onClick={() => onToggleFav(p.id)}
            className={classNames(
              "absolute top-2 right-2 rounded-full px-2.5 py-1 text-sm border backdrop-blur bg-white/80 hover:bg-white",
              isFav(p.id)
                ? "text-red-600 border-red-600"
                : "text-neutral-700 border-neutral-300"
            )}
            title={isFav(p.id) ? "Remove from favourites" : "Add to favourites"}
          >
            {isFav(p.id) ? "♥" : "♡"}
          </button>
          <figcaption className="p-3 text-sm text-neutral-700 flex items-center justify-between">
            <span className="truncate" title={p.title}>{p.title}</span>
            <span className="text-xs text-neutral-500 ml-2">{new Date(p.takenAt).toLocaleDateString()}</span>
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

function Lightbox({ photo, onClose, onPrev, onNext, isFav, onToggleFav }) {
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
          <div className="flex gap-2 items-center">
            <button
              onClick={onToggleFav}
              className={classNames(
                "rounded-full px-4 py-2 bg-white/10 hover:bg-white/20",
                isFav(photo.id) && "bg-red-600/30 hover:bg-red-600/40"
              )}
              aria-label="Toggle favourite"
              title={isFav(photo.id) ? "Remove from favourites" : "Add to favourites"}
            >
              {isFav(photo.id) ? "♥ Favourited" : "♡ Favourite"}
            </button>
            <button onClick={onPrev} className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20">←</button>
            <button onClick={onNext} className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20">→</button>
            <button onClick={onClose} className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20">✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}
