"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import VideoTile from "./VideoTile";
import TurnReveal from "./TurnReveal";
import Chat from "./Chat";
import SuggestBox from "./SuggestBox";
import Avatar from "./Avatar";
import { useSpeaking } from "@/hooks/useSpeaking";

interface Props {
  code: string;
  name: string;
  host: boolean;
  video: boolean;
  avatar: number;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center px-5 text-center">{children}</main>;
}

export default function RoomView({ code, name, host, video, avatar }: Props) {
  const router = useRouter();
  const r = useRoom({ code, name, host, video, avatar });
  const { state, myId, status } = r;
  const roomCode = state?.code ?? code;
  const speaking = useSpeaking(r.localStream, myId, r.streams);
  const [copied, setCopied] = useState("");

  // The host starts on /room/new; once the server gives us a code, show it in the address bar.
  useEffect(() => {
    if (code === "NEW" && state?.code) window.history.replaceState(null, "", `/room/${state.code}`);
  }, [code, state?.code]);

  const leave = async () => {
    await r.leave();
    router.push("/");
  };

  const copy = async (what: "code" | "link") => {
    const text = what === "code" ? roomCode : `${window.location.origin}/room/${roomCode}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      window.prompt("Copy this:", text);
    }
  };

  if (status === "error" || status === "ended") {
    return (
      <Centered>
        <div className="max-w-sm">
          <h1 className="text-3xl font-black">{status === "ended" ? "The room was closed" : r.error.includes("removed") ? "You were removed" : "Couldn't join"}</h1>
          <p className="mt-2 text-haze/80">
            {status === "ended" ? "Ask your friend to create a new room and share the new code." : r.error}
          </p>
          <button onClick={leave} className="btn mt-6 bg-sun">
            Back to home
          </button>
        </div>
      </Centered>
    );
  }

  if (status === "connecting" || !state) {
    return (
      <Centered>
        <p className="text-xl font-bold">{code === "NEW" ? "Creating your room…" : `Connecting to room ${code}…`}</p>
      </Centered>
    );
  }

  const isHost = state.hostId === myId;
  const myTurn = state.currentId === myId;
  const current = state.players.find((p) => p.id === state.currentId);
  const names = state.players.map((p) => p.name);
  const kindWord = state.kind === "truth" ? "question" : "dare";
  const kindBg = state.kind === "truth" ? "bg-truth" : "bg-dare";
  const mySuggestion = state.suggestions.find((s) => s.userId === myId)?.text;
  const me = state.players.find((p) => p.id === myId);
  const raised = state.players.filter((p) => p.hand).sort((a, b) => a.handAt - b.handAt);
  // People who are talking come first, then raised hands (oldest first), then everyone else
  const ordered = [...state.players].sort((a, b) => {
    const sa = speaking.has(a.id) ? 1 : 0;
    const sb = speaking.has(b.id) ? 1 : 0;
    if (sa !== sb) return sb - sa;
    if (a.hand !== b.hand) return a.hand ? -1 : 1;
    return a.hand ? a.handAt - b.handAt : 0;
  });

  const kick = (id: string, pname: string) => {
    if (window.confirm(`Remove ${pname} from the room? They won't be able to rejoin.`)) r.send({ t: "kick", userId: id });
  };

  const makeHost = (id: string, pname: string) => {
    if (window.confirm(`Make ${pname} the host? You will lose the host controls.`)) r.send({ t: "transfer", userId: id });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[1800px] flex-col gap-4 p-4 lg:h-screen lg:flex-row lg:gap-5 lg:overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => copy("code")}
          className="rounded-xl border-2 border-haze/30 px-3 py-2 text-left leading-tight"
          title="Copy room code"
        >
          <span className="block text-xs font-bold text-haze/70">{copied === "code" ? "Copied!" : "Room code"}</span>
          <span className="font-mono text-xl font-black tracking-[0.2em]">{roomCode}</span>
        </button>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={r.toggleMic}
            disabled={!r.media.hasMic}
            className={`btn !px-4 !py-2 ${r.mic ? "bg-haze" : "bg-dare"}`}
            title={r.media.hasMic ? "" : "Microphone permission was denied"}
          >
            {r.mic ? "Mic on" : "Mic off"}
          </button>
          <button
            onClick={r.toggleCam}
            disabled={!r.media.hasCam}
            className={`btn !px-4 !py-2 ${r.cam ? "bg-haze" : "bg-plum !text-haze"}`}
            title={r.media.hasCam ? "" : "Join with camera enabled to use video"}
          >
            {r.cam ? "Camera on" : "Camera off"}
          </button>
          <button
            onClick={() => r.send({ t: "hand", userId: myId, up: !me?.hand })}
            className={`btn !px-4 !py-2 ${me?.hand ? "bg-sun" : "bg-plum !text-haze"}`}
            aria-pressed={!!me?.hand}
          >
            {me?.hand ? "Lower hand" : "Raise hand"}
          </button>
          <button onClick={leave} className="btn !px-4 !py-2 bg-dare">
            Leave
          </button>
        </div>
      </header>

      {(r.voiceError || r.actionError) && (
        <p role="alert" className="rounded-xl border-2 border-dare bg-dare/15 px-4 py-2 text-sm font-bold">
          {r.actionError || r.voiceError}
        </p>
      )}

      {isHost && raised.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-sun bg-sun/10 px-3 py-2">
          <span className="font-extrabold">✋ Raised hands</span>
          {raised.map((p) => (
            <span key={p.id} className="flex items-center gap-2 rounded-full bg-ink/60 py-1 pl-1 pr-1.5 text-sm font-bold">
              <Avatar index={p.avatar} className="h-6 w-6 border-2 border-black" />
              {p.name}
              <button
                onClick={() => r.send({ t: "hand", userId: p.id, up: false })}
                className="rounded-full bg-haze px-2 py-0.5 text-xs font-extrabold text-ink"
              >
                Lower
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Game panel (first on mobile) */}
        <section>
          <div className="rounded-3xl border-2 border-black bg-plum p-5 shadow-pop lg:max-w-3xl">
            {/* ---- Lobby ---- */}
            {state.phase === "lobby" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-black">Invite your friends</h2>
                  <p className="mt-1 text-sm text-haze/80">
                    Share the code <span className="font-mono font-bold text-sun">{roomCode}</span> or send the link.
                    They can join or leave any time.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => copy("code")} className="btn flex-1 bg-haze !py-2">
                      {copied === "code" ? "Copied!" : "Copy code"}
                    </button>
                    <button onClick={() => copy("link")} className="btn flex-1 bg-haze !py-2">
                      {copied === "link" ? "Copied!" : "Copy invite link"}
                    </button>
                  </div>
                </div>
                <p className="rounded-xl bg-ink/60 p-3 text-sm text-haze/85">
                  How it works: a random player picks Truth or Dare. Everyone else writes a question or dare for them
                  (or says it on the call). The host picks one and marks if it was completed.
                </p>
                <div>
                  <p className="text-sm font-bold text-haze/80">{state.players.length} in the room</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {state.players.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 rounded-full bg-ink/60 py-1 pl-1 pr-3 text-sm font-bold">
                        <Avatar index={p.avatar} className="h-7 w-7 border-2 border-black" />
                        {p.name}
                      </li>
                    ))}
                  </ul>
                </div>
                {isHost ? (
                  <div>
                    <button
                      onClick={() => r.send({ t: "start" })}
                      disabled={state.players.length < 2}
                      className="btn w-full bg-sun text-xl"
                    >
                      Start the game
                    </button>
                    {state.players.length < 2 && (
                      <p className="mt-2 text-sm text-haze/70">You need at least 2 players to start.</p>
                    )}
                  </div>
                ) : (
                  <p className="rounded-xl bg-ink/60 p-3 text-center font-bold">Waiting for the host to start…</p>
                )}
              </div>
            )}

            {/* ---- Player picks Truth or Dare ---- */}
            {state.phase === "choose" && current && (
              <div className="space-y-6">
                <TurnReveal names={names} finalName={current.name} turn={state.turn} />
                {myTurn ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => r.send({ t: "choose", kind: "truth" })} className="btn bg-truth py-8 text-3xl">
                      Truth
                    </button>
                    <button onClick={() => r.send({ t: "choose", kind: "dare" })} className="btn bg-dare py-8 text-3xl">
                      Dare
                    </button>
                  </div>
                ) : (
                  <p className="rounded-xl bg-ink/60 p-3 text-center font-bold">
                    Waiting for {current.name} to pick Truth or Dare…
                  </p>
                )}
                {isHost && (
                  <button onClick={() => r.send({ t: "skip" })} className="btn w-full bg-haze !py-2">
                    Skip {current.name}
                  </button>
                )}
              </div>
            )}

            {/* ---- Friends write suggestions, host picks ---- */}
            {state.phase === "suggest" && current && (
              <div className="space-y-4">
                <div className={`pop-in rounded-2xl border-2 border-black p-4 text-ink ${kindBg}`}>
                  <p className="text-sm font-extrabold">
                    {current.name} chose {state.kind}
                  </p>
                  <p className="mt-1 text-xl font-black leading-snug">
                    {myTurn
                      ? `Your friends are coming up with a ${kindWord} for you…`
                      : `Write a ${kindWord} for ${current.name}, or say it out loud on the call.`}
                  </p>
                </div>

                {!myTurn && (
                  <SuggestBox
                    label={`Your ${kindWord} for ${current.name}`}
                    mine={mySuggestion}
                    onSend={(text) => r.send({ t: "suggest", text })}
                  />
                )}

                {isHost ? (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-haze/80">
                      {state.suggestions.length === 0
                        ? "No written suggestions yet."
                        : `${state.suggestions.length} suggestion${state.suggestions.length > 1 ? "s" : ""}. Pick one:`}
                    </p>
                    {state.suggestions.map((s) => (
                      <div key={s.id} className="rounded-xl border-2 border-haze/20 bg-ink/60 p-3">
                        <p className="break-words font-bold">{s.text}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-haze/70">from {s.name}</span>
                          <button onClick={() => r.send({ t: "select", id: s.id })} className="btn bg-sun !px-3 !py-1.5 text-sm">
                            Pick this
                          </button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => r.send({ t: "voice" })} className="btn w-full bg-haze !py-2">
                      Use a {kindWord} said out loud instead
                    </button>
                    <button
                      onClick={() => r.send({ t: "skip" })}
                      className="w-full text-sm font-bold text-haze/60 underline underline-offset-4"
                    >
                      Skip {current.name}
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-sm text-haze/70">
                    The host picks one. You can also ask or dare {current.name} out loud on the call.
                  </p>
                )}
              </div>
            )}

            {/* ---- The challenge; only the host marks the result ---- */}
            {state.phase === "challenge" && current && (
              <div className="space-y-4">
                <div className={`pop-in rounded-2xl border-2 border-black p-5 text-ink ${kindBg}`}>
                  <p className="text-sm font-extrabold">
                    {current.name}
                    {myTurn ? ", your " : "'s "}
                    {state.kind}
                  </p>
                  {state.prompt ? (
                    <>
                      <p className="mt-2 break-words text-2xl font-black leading-snug">{state.prompt}</p>
                      {state.promptBy && <p className="mt-2 text-sm font-bold">from {state.promptBy}</p>}
                    </>
                  ) : (
                    <p className="mt-2 text-xl font-black leading-snug">
                      {myTurn
                        ? `Listen on the call: a friend will ${state.kind === "truth" ? "ask you a question" : "give you a dare"}.`
                        : `${state.kind === "truth" ? "Ask" : "Dare"} ${current.name} out loud on the call.`}
                    </p>
                  )}
                </div>

                {isHost ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => r.send({ t: "result", done: true })} className="btn bg-sun">
                        Completed
                      </button>
                      <button onClick={() => r.send({ t: "result", done: false })} className="btn bg-dare">
                        Not completed
                      </button>
                    </div>
                    <button onClick={() => r.send({ t: "reopen" })} className="btn w-full bg-haze !py-2">
                      Change the {kindWord}
                    </button>
                  </div>
                ) : (
                  <p className="rounded-xl bg-ink/60 p-3 text-center text-sm font-bold">
                    {myTurn
                      ? "Go for it. The host will mark when you're done."
                      : "The host will mark it as completed or not."}
                  </p>
                )}
              </div>
            )}

            {state.phase !== "lobby" && isHost && (
              <button
                onClick={() => r.send({ t: "end" })}
                className="mt-5 w-full text-sm font-bold text-haze/60 underline underline-offset-4"
              >
                End game and go back to lobby
              </button>
            )}
          </div>
        </section>

        {/* Voice / video tiles */}
        <section className="p-1">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            {ordered.map((p) => {
              const local = p.id === myId;
              return (
                <VideoTile
                  key={p.id}
                  name={p.name}
                  stream={local ? r.localStream : r.streams[p.id]}
                  local={local}
                  mic={local ? r.mic : p.mic}
                  cam={local ? r.cam : p.cam}
                  active={p.id === state.currentId}
                  isHost={p.id === state.hostId}
                  online={local || r.online.has(p.id)}
                  avatar={p.avatar}
                  speaking={speaking.has(p.id)}
                  hand={p.hand}
                  done={p.done}
                  failed={p.failed}
                  onMakeHost={isHost && !local ? () => makeHost(p.id, p.name) : undefined}
                  onKick={isHost && !local ? () => kick(p.id, p.name) : undefined}
                />
              );
            })}
          </div>
        </section>
      </div>
    </div>

    {/* Chat: tall right-hand column (about 90% of the screen height on desktop) */}
    <aside className="lg:flex lg:w-[340px] lg:shrink-0 lg:items-center xl:w-[420px] 2xl:w-[500px]">
      <Chat messages={r.messages} myId={myId} onSend={r.sendChat} className="h-[75vh] min-h-[26rem] w-full lg:h-[90vh]" />
    </aside>
    </main>
  );
}
