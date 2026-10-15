"use client";

import { useState } from "react";

interface Props {
  label: string;
  mine?: string;
  onSend: (text: string) => Promise<void>;
}

export default function SuggestBox({ label, mine, onSend }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    await onSend(t);
    setText("");
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="block text-sm font-bold">{label}</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={300}
        rows={2}
        className="w-full resize-none rounded-xl border-2 border-haze/30 bg-ink px-3 py-2 font-semibold placeholder:text-haze/40"
        placeholder="Type it here…"
      />
      <button type="submit" disabled={!text.trim() || busy} className="btn w-full bg-sun !py-2">
        {mine ? "Replace my suggestion" : "Send to the host"}
      </button>
      {mine && (
        <p className="break-words rounded-lg bg-ink/60 px-3 py-2 text-sm">
          <span className="font-bold text-sun">Sent:</span> {mine}
        </p>
      )}
    </form>
  );
}
