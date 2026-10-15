"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";

export interface ChatMsg {
  id: string;
  uid: string;
  name: string;
  text: string;
  avatar: number;
  kind: "chat";
  at: number;
}

interface Props {
  messages: ChatMsg[];
  myId: string;
  onSend: (text: string) => Promise<void>;
  className?: string;
}

const EMOJIS = [
  "😀", "😂", "🤣", "😊", "😍", "🥰", "😎", "🤩",
  "😜", "🤪", "😏", "😅", "😭", "😱", "🤯", "🥳",
  "🤔", "🙄", "😴", "🤭", "😇", "😈", "🥺", "😳",
  "👍", "👎", "👏", "🙌", "🙏", "💪", "🤝", "✌️",
  "🤞", "👀", "🔥", "💯", "✨", "🎉", "🎊", "💥",
  "❤️", "💔", "💜", "💙", "😘", "🤗", "🤡", "👻",
  "🍕", "🍔", "🍟", "🍺", "🥂", "🎂", "🍫", "☕",
  "🐶", "🐱", "🦄", "🐸", "🙈", "💀", "🤖", "👽",
];

// Messages made only of emoji are shown bigger
const EMOJI_ONLY = new RegExp("^(?:\\p{Extended_Pictographic}|\\s|\\u200d|\\ufe0f){1,8}$", "u");

export default function Chat({ messages, myId, onSend, className = "" }: Props) {
  const [text, setText] = useState("");
  const [picker, setPicker] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Close the emoji picker on outside click or Escape
  useEffect(() => {
    if (!picker) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setPicker(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPicker(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [picker]);

  const addEmoji = (emoji: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = (text.slice(0, start) + emoji + text.slice(end)).slice(0, 300);
    setText(next);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = Math.min(start + emoji.length, next.length);
      el?.setSelectionRange(pos, pos);
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText("");
    setPicker(false);
    await onSend(t);
  };

  return (
    <div className={`flex min-h-[16rem] flex-col overflow-hidden rounded-2xl border-2 border-haze/20 bg-plum ${className}`}>
      <div ref={listRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && (
          <p className="text-haze/60">No messages yet. Chat with the room here. Questions and dares can also be said out loud.</p>
        )}
        {messages.map((m) => {
          const mine = m.uid === myId;
          const big = EMOJI_ONLY.test(m.text);
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && <Avatar index={m.avatar ?? 0} className="h-8 w-8 border-2 border-black" />}
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${mine ? "bg-sun text-ink" : "bg-ink/70"}`}>
                {!mine && <p className="text-xs font-extrabold text-sun">{m.name}</p>}
                <p className={`break-words font-semibold leading-snug ${big ? "text-3xl" : "text-base"}`}>{m.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div ref={boxRef} className="relative border-t-2 border-haze/20 p-3">
        {picker && (
          <div
            role="dialog"
            aria-label="Emoji picker"
            className="absolute bottom-full left-3 right-3 z-10 mb-2 max-h-56 overflow-y-auto rounded-2xl border-2 border-black bg-plum p-2 shadow-pop"
          >
            <div className="grid grid-cols-8 gap-1">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => addEmoji(e)}
                  className="rounded-lg py-1 text-2xl hover:bg-haze/15"
                  aria-label={`Insert ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}
        <form onSubmit={submit} className="flex gap-2">
          <button
            type="button"
            onClick={() => setPicker((v) => !v)}
            aria-expanded={picker}
            aria-label="Add emoji"
            className="rounded-xl border-2 border-haze/30 px-3 text-2xl"
          >
            😊
          </button>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
            placeholder="Type a message…"
            aria-label="Message"
            className="min-w-0 flex-1 rounded-xl border-2 border-haze/30 bg-ink px-4 py-3 text-base font-semibold placeholder:text-haze/40"
          />
          <button type="submit" disabled={!text.trim()} className="btn bg-haze !py-2">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
