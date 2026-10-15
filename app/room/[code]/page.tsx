"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoomView from "@/components/RoomView";
import AvatarPicker from "@/components/AvatarPicker";
import { AVATAR_COUNT } from "@/lib/avatars";

export default function RoomPage({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code).toUpperCase();
  const router = useRouter();
  const [name, setName] = useState("");
  const [video, setVideo] = useState(false);
  const [avatar, setAvatar] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [session, setSession] = useState<{ name: string; host: boolean; video: boolean; avatar: number } | null>(null);

  useEffect(() => {
    setName(localStorage.getItem("tnd-name") ?? "");
    const saved = parseInt(localStorage.getItem("tnd-avatar") ?? "", 10);
    setAvatar(saved >= 0 && saved < AVATAR_COUNT ? saved : Math.floor(Math.random() * AVATAR_COUNT));
    setIsHost(new URLSearchParams(window.location.search).get("host") === "1");
  }, []);

  if (session) return <RoomView code={code} {...session} />;

  const enter = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    localStorage.setItem("tnd-name", n);
    localStorage.setItem("tnd-avatar", String(avatar));
    setSession({ name: n, host: isHost, video, avatar });
  };

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <form onSubmit={enter} className="w-full max-w-md space-y-5 rounded-3xl border-2 border-black bg-plum p-6 shadow-pop">
        <div>
          <h1 className="text-3xl font-black">{isHost ? "Your room is ready" : "Joining a room"}</h1>
          {code !== "NEW" && (
            <p className="mt-1 text-haze/80">
              Room code <span className="font-mono font-black tracking-widest text-sun">{code}</span>
            </p>
          )}
        </div>

        <div>
          <span className="text-sm font-bold">Pick your avatar</span>
          <div className="mt-2">
            <AvatarPicker value={avatar} onChange={setAvatar} />
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-bold">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
            placeholder="What should friends call you?"
            className="mt-1 w-full rounded-xl border-2 border-haze/30 bg-ink px-4 py-3 font-bold placeholder:text-haze/40"
          />
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={video}
            onChange={(e) => setVideo(e.target.checked)}
            className="mt-1 h-5 w-5 accent-[#FFD60A]"
          />
          <span>
            <span className="font-bold">Share my camera</span>
            <span className="block text-sm text-haze/70">Leave off for voice only. You'll still be asked for microphone access.</span>
          </span>
        </label>

        <button type="submit" disabled={!name.trim()} className="btn w-full bg-sun text-lg">
          {isHost ? "Open the room" : "Join the room"}
        </button>
        <button type="button" onClick={() => router.push("/")} className="w-full text-sm font-bold text-haze/60 underline underline-offset-4">
          Back to home
        </button>
      </form>
    </main>
  );
}
