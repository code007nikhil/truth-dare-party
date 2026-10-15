export type Kind = "truth" | "dare";
export type Phase = "lobby" | "choose" | "suggest" | "challenge";

export interface Player {
  id: string;
  name: string;
  mic: boolean;
  cam: boolean;
  avatar: number;
  hand: boolean; // raised hand
  handAt: number; // when it was raised (ms), for ordering
  done: number;
  failed: number;
}

export interface Suggestion {
  id: string;
  userId: string;
  name: string;
  text: string;
}

export interface GameState {
  code: string;
  hostId: string;
  players: Player[];
  phase: Phase;
  currentId: string | null;
  kind: Kind | null;
  prompt: string | null; // the suggestion the host picked (null = said out loud)
  promptBy: string | null;
  suggestions: Suggestion[]; // host sees all, others only their own
  turn: number;
}

/** Game actions the UI can send. Each one maps to a server function. */
export type ClientMsg =
  | { t: "start" }
  | { t: "choose"; kind: Kind }
  | { t: "suggest"; text: string }
  | { t: "select"; id: string }
  | { t: "voice" }
  | { t: "reopen" }
  | { t: "result"; done: boolean }
  | { t: "skip" }
  | { t: "transfer"; userId: string }
  | { t: "kick"; userId: string }
  | { t: "hand"; userId: string; up: boolean }
  | { t: "end" };
