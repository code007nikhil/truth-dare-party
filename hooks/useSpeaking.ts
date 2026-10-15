"use client";

import { useEffect, useRef, useState } from "react";

interface Tap {
  src: MediaStreamAudioSourceNode;
  an: AnalyserNode;
  stream: MediaStream;
}

const THRESHOLD = 0.025; // loudness (RMS) that counts as talking
const HOLD_MS = 1200; // keep "speaking" briefly after the last loud sound, so tiles don't flicker

/** Returns the ids of players who are talking right now (including you, if your mic is on). */
export function useSpeaking(localStream: MediaStream | null, localId: string, streams: Record<string, MediaStream>) {
  const [speaking, setSpeaking] = useState<Set<string>>(new Set());
  const ctxRef = useRef<AudioContext | null>(null);
  const taps = useRef(new Map<string, Tap>());
  const lastLoud = useRef(new Map<string, number>());

  // Attach an analyser to every stream we have
  useEffect(() => {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    if (!ctxRef.current) ctxRef.current = new AC();
    const ctx = ctxRef.current!;
    ctx.resume?.().catch(() => {});

    const wanted = new Map<string, MediaStream>();
    if (localStream && localId) wanted.set(localId, localStream);
    Object.entries(streams).forEach(([id, s]) => wanted.set(id, s));

    taps.current.forEach((t, id) => {
      if (wanted.get(id) !== t.stream) {
        t.src.disconnect();
        taps.current.delete(id);
        lastLoud.current.delete(id);
      }
    });
    wanted.forEach((stream, id) => {
      if (taps.current.has(id) || stream.getAudioTracks().length === 0) return;
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      src.connect(an); // analysis only; never connected to speakers
      taps.current.set(id, { src, an, stream });
    });
  }, [localStream, localId, streams]);

  // Measure loudness a few times a second
  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      const active = new Set<string>();
      taps.current.forEach((t, id) => {
        const buf = new Uint8Array(t.an.fftSize);
        t.an.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        if (Math.sqrt(sum / buf.length) > THRESHOLD) lastLoud.current.set(id, now);
        const t0 = lastLoud.current.get(id);
        if (t0 && now - t0 < HOLD_MS) active.add(id);
      });
      setSpeaking((prev) => (prev.size === active.size && [...active].every((id) => prev.has(id)) ? prev : active));
    }, 150);

    return () => {
      clearInterval(iv);
      taps.current.forEach((t) => t.src.disconnect());
      taps.current.clear();
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    };
  }, []);

  return speaking;
}
