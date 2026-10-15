"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Peer from "peerjs";
import type { MediaConnection } from "peerjs";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import type { ClientMsg, GameState, Suggestion } from "@/lib/types";
import type { ChatMsg } from "@/components/Chat";

type Status = "connecting" | "ready" | "error" | "ended";

interface Opts {
  code: string; // room code, or "NEW" when the host is creating a room
  name: string;
  host: boolean;
  video: boolean;
  avatar: number; // 0-19, see lib/avatars.ts
}

interface PlayerRow {
  user_id: string;
  name: string;
  mic: boolean;
  cam: boolean;
  done_count: number;
  fail_count: number;
  avatar: number;
  hand: boolean;
  hand_at: string | null;
}

async function getMedia(video: boolean) {
  const audio = { echoCancellation: true, noiseSuppression: true };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio,
      video: video ? { width: 480, height: 360, facingMode: "user" } : false,
    });
    return { stream, hasMic: true, hasCam: stream.getVideoTracks().length > 0 };
  } catch {
    /* fall through */
  }
  if (video) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio });
      return { stream, hasMic: true, hasCam: false };
    } catch {
      /* fall through */
    }
  }
  // No mic permission: join as a listener with a silent stream so calls still connect.
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  const dest = new Ctx().createMediaStreamDestination();
  return { stream: dest.stream, hasMic: false, hasCam: false };
}

export function useRoom({ code, name, host, video, avatar }: Opts) {
  const [state, setState] = useState<GameState | null>(null);
  const [myId, setMyId] = useState("");
  const [status, setStatus] = useState<Status>("connecting");
  const [error, setError] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [actionError, setActionError] = useState("");
  const [streams, setStreams] = useState<Record<string, MediaStream>>({});
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(false);
  const [media, setMedia] = useState({ hasMic: false, hasCam: false });

  const localRef = useRef<MediaStream | null>(null);
  const roomIdRef = useRef("");
  const uidRef = useRef("");
  const leavingRef = useRef(false);
  const chatChRef = useRef<RealtimeChannel | null>(null);
  const nameRef = useRef(name);
  nameRef.current = name;
  const avatarRef = useRef(avatar);
  avatarRef.current = avatar;
  const refetchRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    let cancelled = false;
    let peer: Peer | null = null;
    let presenceCh: RealtimeChannel | null = null;
    let dbCh: RealtimeChannel | null = null;
    let chatCh: RealtimeChannel | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let onVisible: (() => void) | null = null;
    let seq = 0;
    let rejoinTries = 0;
    let myMedia = { mic: false, cam: false };

    const saveMyMedia = async () => {
      const sb = getSupabase();
      await sb
        .from("room_players")
        .update({ mic: myMedia.mic, cam: myMedia.cam })
        .eq("room_id", roomIdRef.current)
        .eq("user_id", uidRef.current);
    };
    const calls = new Map<string, { call: MediaConnection; peerId: string }>(); // keyed by user id

    // Stop everything (used on unmount, when removed by the host, or when the room closes)
    const shutdown = () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      timer = null;
      if (onVisible) document.removeEventListener("visibilitychange", onVisible);
      onVisible = null;
      let sb: ReturnType<typeof getSupabase> | null = null;
      try {
        sb = getSupabase();
      } catch {
        /* not configured */
      }
      if (sb && dbCh) sb.removeChannel(dbCh);
      if (sb && presenceCh) sb.removeChannel(presenceCh);
      if (sb && chatCh) sb.removeChannel(chatCh);
      dbCh = presenceCh = chatCh = null;
      chatChRef.current = null;
      calls.forEach((c) => c.call.close());
      calls.clear();
      peer?.destroy();
      peer = null;
      localRef.current?.getTracks().forEach((t) => t.stop());
      refetchRef.current = null;
    };

    const fail = (msg: string) => {
      if (cancelled) return;
      setError(msg);
      setStatus("error");
      shutdown();
    };

    /* ---------------- voice/video (PeerJS) ---------------- */

    const removeStream = (uid: string) =>
      setStreams((p) => {
        const n = { ...p };
        delete n[uid];
        return n;
      });

    const dropCall = (uid: string) => {
      calls.get(uid)?.call.close();
      calls.delete(uid);
      removeStream(uid);
    };

    const wire = (call: MediaConnection, uid: string) => {
      const existing = calls.get(uid);
      if (existing && existing.call !== call) existing.call.close();
      calls.set(uid, { call, peerId: call.peer });
      call.on("stream", (s) => setStreams((p) => ({ ...p, [uid]: s })));
      call.on("close", () => {
        if (calls.get(uid)?.call === call) {
          calls.delete(uid);
          removeStream(uid);
        }
      });
    };

    // Presence tells us each player's PeerJS id. For every pair, the larger user id places the call.
    const syncPresence = () => {
      if (!presenceCh || !peer) return;
      const st = presenceCh.presenceState() as Record<string, { peerId?: string }[]>;
      const keys = Object.keys(st);
      setOnline(new Set(keys));
      const me = uidRef.current;
      keys.forEach((k) => {
        if (k === me) return;
        const peerId = st[k]?.[0]?.peerId;
        if (!peerId || !(me > k)) return;
        const existing = calls.get(k);
        if (existing && existing.peerId === peerId) return;
        wire(peer!.call(peerId, localRef.current!, { metadata: { uid: me } }), k);
      });
      [...calls.keys()].forEach((k) => {
        if (!keys.includes(k)) dropCall(k);
      });
    };

    /* ---------------- game state (Supabase) ---------------- */

    const refetch = async (): Promise<void> => {
      const roomId = roomIdRef.current;
      if (!roomId || cancelled || leavingRef.current) return;
      const sb = getSupabase();
      const my = ++seq;

      const { data: room } = await sb.from("rooms").select("*").eq("id", roomId).maybeSingle();
      if (cancelled || leavingRef.current || my !== seq) return;
      if (!room) {
        setError("The host closed the room. Ask your friend for a new code.");
        setStatus("ended");
        shutdown();
        return;
      }

      const { data: rows } = await sb.from("room_players").select("*").eq("room_id", roomId).order("joined_at");
      if (cancelled || leavingRef.current || my !== seq) return;
      const players = (rows ?? []) as PlayerRow[];

      // We were removed (e.g. the tab slept too long): rejoin automatically.
      if (!players.some((p) => p.user_id === uidRef.current)) {
        if (rejoinTries++ >= 3) return fail("You were disconnected from the room.");
        const { error: e } = await sb.rpc("join_room", { p_code: room.code, p_name: name, p_avatar: avatar });
        if (e) return fail(e.message);
        await saveMyMedia();
        return refetch();
      }
      rejoinTries = 0;

      // Suggestions (RLS: the host sees everyone's, other players only their own)
      let suggestions: Suggestion[] = [];
      if (room.phase === "suggest") {
        const { data: sug } = await sb
          .from("suggestions")
          .select("*")
          .eq("room_id", roomId)
          .eq("turn", room.turn)
          .order("created_at");
        if (cancelled || leavingRef.current || my !== seq) return;
        suggestions = (sug ?? []).map((x: any) => ({ id: x.id, userId: x.user_id, name: x.name, text: x.text }));
      }

      setState({
        code: room.code,
        hostId: room.host_id,
        players: players.map((p) => ({
          id: p.user_id,
          name: p.name,
          mic: p.mic,
          cam: p.cam,
          avatar: p.avatar ?? 0,
          hand: p.hand ?? false,
          handAt: p.hand_at ? Date.parse(p.hand_at) : 0,
          done: p.done_count,
          failed: p.fail_count,
        })),
        phase: room.phase,
        currentId: room.current_user_id,
        kind: room.kind,
        prompt: room.prompt,
        promptBy: room.prompt_by,
        suggestions,
        turn: room.turn,
      });
      setStatus("ready");
    };
    refetchRef.current = refetch;

    /* ---------------- startup ---------------- */

    const init = async () => {
      try {
        const sb = getSupabase();

        const m = await getMedia(video);
        if (cancelled) {
          m.stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localRef.current = m.stream;
        setLocalStream(m.stream);
        setMedia({ hasMic: m.hasMic, hasCam: m.hasCam });
        setMic(m.hasMic);
        setCam(m.hasCam);
        myMedia = { mic: m.hasMic, cam: m.hasCam };

        // Anonymous sign-in (one player per tab)
        let { data: { session } } = await sb.auth.getSession();
        if (!session) {
          const { data, error: e } = await sb.auth.signInAnonymously();
          if (e || !data.session) throw new Error("Sign-in failed. Enable Anonymous sign-ins in Supabase (Authentication -> Providers). " + (e?.message ?? ""));
          session = data.session;
        }
        const uid = session.user.id;
        uidRef.current = uid;
        setMyId(uid);

        // Create or join the room
        let roomId: string;
        if (host) {
          const { data: newCode, error: e } = await sb.rpc("create_room", { p_name: name, p_avatar: avatar });
          if (e) throw new Error(e.message);
          const { data: room } = await sb.from("rooms").select("id").eq("code", newCode).single();
          roomId = room!.id;
        } else {
          const { data, error: e } = await sb.rpc("join_room", { p_code: code, p_name: name, p_avatar: avatar });
          if (e) throw new Error(e.message);
          roomId = data as string;
        }
        if (cancelled) return;
        roomIdRef.current = roomId;
        await saveMyMedia(); // so other players see our camera/mic state right away
        await refetch();

        // Live updates
        dbCh = sb
          .channel(`db:${roomId}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, () => refetch())
          .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` }, () => refetch())
          .on("postgres_changes", { event: "*", schema: "public", table: "suggestions", filter: `room_id=eq.${roomId}` }, () => refetch())
          .subscribe();

        // Chat: lightweight broadcast channel (not stored; resets when the page reloads)
        chatCh = sb
          .channel(`chat:${roomId}`, { config: { broadcast: { self: true } } })
          .on("broadcast", { event: "msg" }, ({ payload }) =>
            setMessages((prev) => [...prev.slice(-99), payload as ChatMsg])
          )
          .subscribe();
        chatChRef.current = chatCh;

        // Heartbeat: lets the server drop players whose tab died. Also a safety-net refetch.
        const beat = async () => {
          await sb.rpc("heartbeat", { p_room: roomId });
          refetch();
        };
        timer = setInterval(beat, 10_000);
        onVisible = () => document.visibilityState === "visible" && beat();
        document.addEventListener("visibilitychange", onVisible);

        // Voice/video peer, then announce its id via presence
        const { default: PeerCtor } = await import("peerjs");
        if (cancelled) return;
        const p: Peer = new PeerCtor(`tnd-${uid}-${Math.random().toString(36).slice(2, 7)}`);
        peer = p;
        p.on("error", (err: any) => {
          if (err?.type === "peer-unavailable") return; // friend already left; ignore
          setVoiceError("Voice connection problem. The game still works; try refreshing if you can't hear anyone.");
        });
        p.on("call", (call) => {
          call.answer(localRef.current!);
          const from = call.metadata?.uid as string | undefined;
          if (from) wire(call, from);
        });
        p.on("open", (peerId) => {
          presenceCh = sb
            .channel(`presence:${roomId}`, { config: { presence: { key: uid } } })
            .on("presence", { event: "sync" }, syncPresence)
            .on("presence", { event: "leave" }, () => setTimeout(refetch, 800))
            .subscribe(async (s) => {
              if (s === "SUBSCRIBED") await presenceCh!.track({ peerId });
            });
        });
      } catch (e: any) {
        fail(e?.message || "Could not connect to the room.");
      }
    };

    init();

    return () => {
      shutdown();
    };
  }, [code, name, host, video]);

  /* ---------------- actions ---------------- */

  const send = useCallback(async (msg: ClientMsg) => {
    const room = roomIdRef.current;
    if (!room) return;
    const sb = getSupabase();
    let res;
    switch (msg.t) {
      case "start":
        res = await sb.rpc("start_game", { p_room: room });
        break;
      case "choose":
        res = await sb.rpc("choose_kind", { p_room: room, p_kind: msg.kind });
        break;
      case "suggest":
        res = await sb.rpc("submit_suggestion", { p_room: room, p_text: msg.text });
        break;
      case "select":
        res = await sb.rpc("select_challenge", { p_room: room, p_suggestion: msg.id });
        break;
      case "voice":
        res = await sb.rpc("use_voice", { p_room: room });
        break;
      case "kick":
        res = await sb.rpc("kick_player", { p_room: room, p_user: msg.userId });
        break;
      case "hand":
        res = await sb.rpc("set_hand", { p_room: room, p_user: msg.userId, p_up: msg.up });
        break;
      case "reopen":
        res = await sb.rpc("reopen_suggestions", { p_room: room });
        break;
      case "result":
        res = await sb.rpc("mark_result", { p_room: room, p_done: msg.done });
        break;
      case "skip":
        res = await sb.rpc("skip_turn", { p_room: room });
        break;
      case "transfer":
        res = await sb.rpc("transfer_host", { p_room: room, p_user: msg.userId });
        break;
      case "end":
        res = await sb.rpc("end_game", { p_room: room });
        break;
    }
    setActionError(res.error ? res.error.message : "");
    refetchRef.current?.();
  }, []);

  /** Send a chat message to everyone in the room (not stored). */
  const sendChat = useCallback(async (text: string) => {
    const t = text.trim().slice(0, 300);
    if (!t) return;
    const msg: ChatMsg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      uid: uidRef.current,
      name: nameRef.current,
      avatar: avatarRef.current,
      text: t,
      kind: "chat",
      at: Date.now(),
    };
    chatChRef.current?.send({ type: "broadcast", event: "msg", payload: msg });
  }, []);

  const pushMedia = (nextMic: boolean, nextCam: boolean) => {
    if (!roomIdRef.current) return;
    getSupabase()
      .from("room_players")
      .update({ mic: nextMic, cam: nextCam })
      .eq("room_id", roomIdRef.current)
      .eq("user_id", uidRef.current)
      .then(() => refetchRef.current?.());
  };

  const toggleMic = () => {
    const track = localRef.current?.getAudioTracks()[0];
    if (!track || !media.hasMic) return;
    track.enabled = !mic;
    setMic(!mic);
    pushMedia(!mic, cam);
  };

  const toggleCam = () => {
    const track = localRef.current?.getVideoTracks()[0];
    if (!track || !media.hasCam) return;
    track.enabled = !cam;
    setCam(!cam);
    pushMedia(mic, !cam);
  };

  const leave = useCallback(async () => {
    leavingRef.current = true;
    const room = roomIdRef.current;
    if (room) await getSupabase().rpc("leave_room", { p_room: room });
  }, []);

  return {
    state, myId, status, error, voiceError, actionError,
    streams, online, localStream, mic, cam, media,
    messages, send, sendChat, toggleMic, toggleCam, leave,
  };
}
