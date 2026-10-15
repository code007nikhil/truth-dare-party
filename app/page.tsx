"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CREATOR = "Nikhil Thakur";
const UPI_ID = "thakurniks23943-2@okhdfcbank";
const UPI_LINK = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(CREATOR)}&cu=INR`;
// Put your QR image in /public/images/ as Qrcode.png or Qrcode.jpg (the first one found is used)
const QR_SOURCES = ["/images/Qrcode.jpeg"];

function SupportCard() {
  const [qrIndex, setQrIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const qr = QR_SOURCES[qrIndex]; // undefined once every source has failed to load

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this UPI ID:", UPI_ID);
    }
  };

  return (
    <section
      aria-labelledby="support-title"
      className="flex flex-col items-center gap-5 rounded-3xl border-2 border-black bg-plum p-5 text-center shadow-pop sm:flex-row sm:text-left"
    >
      {qr && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qr}
          alt={`UPI QR code to support ${CREATOR}`}
          onError={() => setQrIndex((i) => i + 1)}
          className="h-40 w-40 shrink-0 rounded-2xl border-2 border-black bg-white object-contain p-2"
        />
      )}
      <div className="min-w-0 space-y-3">
        <div>
          <h2 id="support-title" className="text-2xl font-black">
            Buy me a coffee ☕
          </h2>
          <p className="mt-1 text-sm text-haze/80">
            Enjoying the game? Support the project by scanning the QR code with any UPI app{qr ? "" : " or using the UPI ID below"}.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <code className="break-all rounded-xl bg-ink px-3 py-2 font-mono text-sm font-bold text-sun">{UPI_ID}</code>
          <button onClick={copy} className="btn bg-haze !px-4 !py-2 text-sm">
            {copied ? "Copied!" : "Copy UPI ID"}
          </button>
        </div>
        <a
          href={UPI_LINK}
          className="inline-block text-sm font-bold text-haze/80 underline underline-offset-4 hover:text-haze"
        >
          On a phone? Open in your UPI app
        </a>
      </div>
    </section>
  );
}

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const create = () => router.push("/room/new?host=1");
  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length >= 4) router.push(`/room/${c}`);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-5 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="-rotate-3 rounded-2xl border-2 border-black bg-truth px-5 py-2 text-6xl font-black tracking-tight text-ink shadow-pop sm:text-8xl">
          Truth
        </span>
        <span className="text-3xl font-black text-haze/70 sm:text-5xl">or</span>
        <span className="rotate-2 rounded-2xl border-2 border-black bg-dare px-5 py-2 text-6xl font-black tracking-tight text-ink shadow-pop sm:text-8xl">
          Dare
        </span>
      </div>

      <p className="max-w-md text-lg text-haze/85">
        Make a room, send the code to your friends, and talk face to face while the game picks who goes next.
      </p>

      <div className="space-y-5 rounded-3xl border-2 border-black bg-plum p-5 shadow-pop">
        <button onClick={create} className="btn w-full bg-sun text-xl">
          Create a room
        </button>

        <div className="flex items-center gap-3 text-sm font-bold text-haze/60">
          <span className="h-px flex-1 bg-haze/20" />
          or join friends
          <span className="h-px flex-1 bg-haze/20" />
        </div>

        <form onSubmit={join} className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Room code"
            maxLength={8}
            aria-label="Room code"
            className="min-w-0 flex-1 rounded-xl border-2 border-haze/30 bg-ink px-4 py-3 text-center font-mono text-xl font-black tracking-[0.3em] placeholder:tracking-normal placeholder:font-sans placeholder:text-base placeholder:font-bold placeholder:text-haze/40"
          />
          <button type="submit" disabled={code.trim().length < 4} className="btn bg-truth">
            Join
          </button>
        </form>
      </div>

      <footer className="space-y-5">
        <SupportCard />
        <p className="text-center text-sm font-bold text-haze/70">
          Designed and developed by <span className="text-sun">{CREATOR}</span>
        </p>
      </footer>
    </main>
  );
}