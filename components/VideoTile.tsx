"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";

interface Props {
  name: string;
  stream: MediaStream | null | undefined;
  local: boolean;
  mic: boolean;
  cam: boolean;
  active: boolean;
  isHost: boolean;
  online: boolean;
  avatar: number;
  done: number;
  failed: number;
  speaking: boolean;
  hand: boolean;
  onMakeHost?: () => void;
  onKick?: () => void;
}

export default function VideoTile({
  name, stream, local, mic, cam, active, isHost, online, avatar, done, failed, speaking, hand, onMakeHost, onKick,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.srcObject !== (stream ?? null)) el.srcObject = stream ?? null;
    el.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
  }, [stream]);

  const ring = active
    ? "border-sun shadow-[0_0_0_3px_#FFD60A]"
    : speaking
      ? "border-[#4ADE80] shadow-[0_0_0_3px_#4ADE80]"
      : "border-haze/20";

  return (
    <div
      className={`relative aspect-[4/3] overflow-hidden rounded-2xl border-2 bg-plum ${ring} ${
        online ? "" : "opacity-50 grayscale"
      }`}
    >
      {/* Always mounted so remote audio keeps playing even when the camera is off. */}
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={local}
        className={`h-full w-full object-cover ${cam ? "" : "pointer-events-none absolute opacity-0"} ${
          local ? "-scale-x-100" : ""
        }`}
      />
      {!cam && (
        <div className="absolute inset-0 grid place-items-center">
          <Avatar index={avatar} className="h-20 w-20 border-2 border-black" />
        </div>
      )}

      {hand && (
        <span
          className="absolute left-2 top-2 grid h-9 w-9 place-items-center rounded-full border-2 border-black bg-sun text-xl"
          title={`${name} raised a hand`}
          aria-label="Hand raised"
        >
          ✋
        </span>
      )}

      {(onMakeHost || onKick) && (
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {onMakeHost && (
            <button
              onClick={onMakeHost}
              className="rounded-lg border-2 border-black bg-haze px-2 py-0.5 text-xs font-extrabold text-ink"
            >
              Make host
            </button>
          )}
          {onKick && (
            <button
              onClick={onKick}
              className="rounded-lg border-2 border-black bg-dare px-2 py-0.5 text-xs font-extrabold text-ink"
            >
              Remove
            </button>
          )}
        </div>
      )}

      {blocked && (
        <button
          onClick={() => ref.current?.play().then(() => setBlocked(false))}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-lg border-2 border-black bg-sun px-3 py-1 text-xs font-extrabold text-ink"
        >
          Tap to hear
        </button>
      )}
      {!local && online && !stream && (
        <span className="absolute bottom-10 left-2 rounded bg-black/60 px-2 py-0.5 text-xs font-bold">connecting audio…</span>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-sm font-bold">
        <span className="truncate">
          {name}
          {local ? " (you)" : ""}
        </span>
        {isHost && <span className="rounded bg-sun px-1.5 text-xs font-extrabold text-ink">host</span>}
        {(done > 0 || failed > 0) && (
          <span className="text-xs font-extrabold" title="Completed / not completed">
            ✓{done} ✗{failed}
          </span>
        )}
        {speaking && (
          <span className="flex h-3.5 items-end gap-0.5" aria-label="speaking" title="Speaking">
            <i className="eq-bar block w-1 rounded-sm bg-[#4ADE80]" style={{ animationDelay: "0s" }} />
            <i className="eq-bar block w-1 rounded-sm bg-[#4ADE80]" style={{ animationDelay: "0.2s" }} />
            <i className="eq-bar block w-1 rounded-sm bg-[#4ADE80]" style={{ animationDelay: "0.4s" }} />
          </span>
        )}
        {!online ? (
          <span className="ml-auto text-xs text-sun">reconnecting…</span>
        ) : (
          !mic && <span className="ml-auto text-xs text-dare">muted</span>
        )}
      </div>
    </div>
  );
}
