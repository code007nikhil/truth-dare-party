"use client";

import Avatar from "./Avatar";
import { AVATAR_COUNT, AVATAR_NAMES } from "@/lib/avatars";

export default function AvatarPicker({ value, onChange }: { value: number; onChange: (i: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Choose your avatar" className="grid grid-cols-5 gap-2">
      {Array.from({ length: AVATAR_COUNT }, (_, i) => {
        const selected = i === value;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={selected}
            title={AVATAR_NAMES[i]}
            onClick={() => onChange(i)}
            className={`aspect-square rounded-full p-0.5 transition ${
              selected ? "scale-105 bg-sun" : "bg-transparent opacity-80 hover:opacity-100"
            }`}
          >
            <Avatar index={i} className="h-full w-full border-2 border-black" />
          </button>
        );
      })}
    </div>
  );
}
