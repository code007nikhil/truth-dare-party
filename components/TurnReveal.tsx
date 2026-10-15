"use client";

import { useEffect, useRef, useState } from "react";

/** Shuffles through player names for a moment, then lands on the chosen player. */
export default function TurnReveal({ names, finalName, turn }: { names: string[]; finalName: string; turn: number }) {
  const [shown, setShown] = useState(finalName);
  const [spinning, setSpinning] = useState(false);
  const namesRef = useRef(names);
  namesRef.current = names;
  const finalRef = useRef(finalName);
  finalRef.current = finalName;

  useEffect(() => {
    setSpinning(true);
    let i = 0;
    const iv = setInterval(() => {
      const n = namesRef.current;
      setShown(n[i++ % n.length]);
    }, 90);
    const to = setTimeout(() => {
      clearInterval(iv);
      setShown(finalRef.current);
      setSpinning(false);
    }, 1500);
    return () => {
      clearInterval(iv);
      clearTimeout(to);
    };
  }, [turn]);

  return (
    <div className="text-center">
      <p className="text-sm font-bold text-haze/70">{spinning ? "Picking the next player…" : "Now playing:"}</p>
      <p
        className={`mt-1 truncate text-4xl font-black tracking-tight sm:text-5xl ${
          spinning ? "text-haze/60" : "pop-in text-sun"
        }`}
      >
        {shown}
      </p>
    </div>
  );
}
