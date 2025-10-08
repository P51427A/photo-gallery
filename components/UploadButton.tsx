"use client";
import { useState } from "react";

export default function UploadButton({ onUploaded }: { onUploaded?: () => void }) {
  const [busy, setBusy] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      onUploaded?.(); // let parent refresh the list
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
      e.target.value = ""; // reset input
    }
  }

  return (
    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border shadow-sm cursor-pointer bg-white hover:bg-neutral-50">
      <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {busy ? "Uploading…" : "Upload Photo"}
    </label>
  );
}
