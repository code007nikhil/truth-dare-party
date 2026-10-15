-- Truth & Dare – Friends Party: full Supabase schema (safe to re-run)
-- Before running: Authentication -> Providers -> enable "Anonymous sign-ins".

create extension if not exists pgcrypto;

-- ===== cleanup of older versions =====
drop function if exists public.draw_prompt(uuid, text);
drop function if exists public.reroll_prompt(uuid);
drop function if exists public.set_challenge(uuid, text);
drop function if exists public.next_turn(uuid);
drop function if exists public.create_room(text);
drop function if exists public.join_room(text, text);
drop table if exists public.used_prompts;
drop table if exists public.prompts;

-- ========== TABLES ==========
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid not null references auth.users(id) on delete cascade,
  phase text not null default 'lobby',
  current_user_id uuid references auth.users(id) on delete set null,
  kind text check (kind in ('truth','dare')),
  prompt text,       -- the suggestion the host picked (null = it will be said out loud on the call)
  prompt_by text,    -- name of the friend who wrote it
  turn int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.rooms add column if not exists prompt_by text;
alter table public.rooms drop constraint if exists rooms_phase_check;
alter table public.rooms add constraint rooms_phase_check
  check (phase in ('lobby','choose','suggest','challenge'));

create table if not exists public.room_players (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  mic boolean not null default true,
  cam boolean not null default false,
  had_turn boolean not null default false,
  done_count int not null default 0,
  fail_count int not null default 0,
  avatar int not null default 0,
  hand boolean not null default false,
  hand_at timestamptz,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (room_id, user_id)
);
alter table public.room_players add column if not exists last_seen timestamptz not null default now();
alter table public.room_players add column if not exists done_count int not null default 0;
alter table public.room_players add column if not exists fail_count int not null default 0;
alter table public.room_players add column if not exists avatar int not null default 0;
alter table public.room_players add column if not exists hand boolean not null default false;
alter table public.room_players add column if not exists hand_at timestamptz;
alter table public.room_players drop constraint if exists room_players_avatar_check;
alter table public.room_players add constraint room_players_avatar_check check (avatar between 0 and 19);
alter table public.room_players replica identity full;

-- Players removed by the host can't rejoin that room
create table if not exists public.room_bans (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (room_id, user_id)
);

-- One suggestion per friend per turn (they can replace it while the turn is in the suggest phase)
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  turn int not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  text text not null check (char_length(text) between 1 and 300),
  created_at timestamptz not null default now(),
  unique (room_id, turn, user_id)
);

-- ========== ROW LEVEL SECURITY ==========
alter table public.rooms        enable row level security;
alter table public.room_players enable row level security;
alter table public.suggestions  enable row level security;
alter table public.room_bans    enable row level security;  -- no policies: only the functions touch it

drop policy if exists "read rooms"   on public.rooms;
drop policy if exists "read players" on public.room_players;
drop policy if exists "update own player" on public.room_players;
drop policy if exists "read suggestions" on public.suggestions;

create policy "read rooms"   on public.rooms        for select to authenticated using (true);
create policy "read players" on public.room_players for select to authenticated using (true);
create policy "update own player" on public.room_players
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Players may only change their own mic/cam (not scores or turn flags)
revoke update on public.room_players from authenticated;
grant update (mic, cam) on public.room_players to authenticated;

-- Suggestions are private: the host sees all of them, everyone else only their own.
create policy "read suggestions" on public.suggestions for select to authenticated
  using (user_id = auth.uid()
         or exists (select 1 from public.rooms r where r.id = suggestions.room_id and r.host_id = auth.uid()));

-- ========== INTERNAL HELPER ==========
create or replace function public.pick_next(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_cur uuid; v_pick uuid; v_count int;
begin
  delete from suggestions where room_id = p_room;
  select current_user_id into v_cur from rooms where id = p_room;
  select count(*) into v_count from room_players where room_id = p_room;

  if v_count < 2 then
    update rooms set phase='lobby', current_user_id=null, kind=null, prompt=null, prompt_by=null where id = p_room;
    return;
  end if;

  select user_id into v_pick from room_players
   where room_id = p_room and not had_turn and user_id is distinct from v_cur
   order by random() limit 1;

  if v_pick is null then  -- everyone has played: new round
    update room_players set had_turn = false where room_id = p_room;
    select user_id into v_pick from room_players
     where room_id = p_room and user_id is distinct from v_cur
     order by random() limit 1;
  end if;

  update room_players set had_turn = true where room_id = p_room and user_id = v_pick;
  update rooms set phase='choose', current_user_id=v_pick, kind=null, prompt=null, prompt_by=null, turn=turn+1
   where id = p_room;
end $$;
revoke execute on function public.pick_next(uuid) from public, anon, authenticated;

-- ========== GAME FUNCTIONS (called from the app with supabase.rpc) ==========
create or replace function public.create_room(p_name text, p_avatar int default 0) returns text
language plpgsql security definer set search_path = public as $$
declare v_code text; v_room uuid;
        v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  loop
    v_code := '';
    for i in 1..5 loop
      v_code := v_code || substr(v_chars, 1 + floor(random()*length(v_chars))::int, 1);
    end loop;
    exit when not exists (select 1 from rooms where code = v_code);
  end loop;
  insert into rooms (code, host_id) values (v_code, auth.uid()) returning id into v_room;
  insert into room_players (room_id, user_id, name, avatar)
  values (v_room, auth.uid(), p_name, least(greatest(coalesce(p_avatar, 0), 0), 19));
  return v_code;
end $$;

create or replace function public.join_room(p_code text, p_name text, p_avatar int default 0) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_room uuid; v_avatar int := least(greatest(coalesce(p_avatar, 0), 0), 19);
begin
  select id into v_room from rooms where code = upper(p_code);
  if v_room is null then raise exception 'Room not found. Check the code and make sure the host is still in the room.'; end if;
  if exists (select 1 from room_bans where room_id = v_room and user_id = auth.uid()) then
    raise exception 'You were removed from this room by the host.';
  end if;
  insert into room_players (room_id, user_id, name, avatar) values (v_room, auth.uid(), p_name, v_avatar)
    on conflict (room_id, user_id) do update set name = excluded.name, avatar = excluded.avatar, last_seen = now();
  return v_room;
end $$;

create or replace function public.start_game(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from rooms where id = p_room and host_id = auth.uid()) then
    raise exception 'Only the host can start';
  end if;
  perform pick_next(p_room);
end $$;

-- Step 1: the player whose turn it is picks Truth or Dare.
create or replace function public.choose_kind(p_room uuid, p_kind text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('truth','dare') then raise exception 'Invalid choice'; end if;
  if not exists (select 1 from rooms
                 where id = p_room and phase = 'choose' and current_user_id = auth.uid()) then
    raise exception 'Not your turn';
  end if;
  update rooms set phase = 'suggest', kind = p_kind, prompt = null, prompt_by = null where id = p_room;
end $$;

-- Step 2: every other player writes a question/dare (one each; sending again replaces it).
create or replace function public.submit_suggestion(p_room uuid, p_text text) returns void
language plpgsql security definer set search_path = public as $$
declare v_name text; v_turn int; v_text text := btrim(p_text);
begin
  if v_text is null or char_length(v_text) not between 1 and 300 then
    raise exception 'Write between 1 and 300 characters';
  end if;
  select name into v_name from room_players where room_id = p_room and user_id = auth.uid();
  if v_name is null then raise exception 'You are not in this room'; end if;
  select turn into v_turn from rooms
   where id = p_room and phase = 'suggest' and current_user_id is distinct from auth.uid();
  if v_turn is null then raise exception 'Suggestions are closed, or it is your own turn'; end if;
  insert into suggestions (room_id, turn, user_id, name, text)
  values (p_room, v_turn, auth.uid(), v_name, v_text)
  on conflict (room_id, turn, user_id) do update set text = excluded.text, name = excluded.name, created_at = now();
end $$;

-- Step 3a: host picks one of the suggestions.
create or replace function public.select_challenge(p_room uuid, p_suggestion uuid) returns void
language plpgsql security definer set search_path = public as $$
declare s suggestions;
begin
  if not exists (select 1 from rooms where id = p_room and host_id = auth.uid() and phase = 'suggest') then
    raise exception 'Only the host can pick';
  end if;
  select sg.* into s from suggestions sg
   join rooms r on r.id = sg.room_id and r.turn = sg.turn
   where sg.id = p_suggestion and sg.room_id = p_room;
  if s.id is null then raise exception 'Suggestion not found'; end if;
  update rooms set phase = 'challenge', prompt = s.text, prompt_by = s.name where id = p_room;
end $$;

-- Step 3b: host skips the written ones; friends ask/dare out loud on the call.
create or replace function public.use_voice(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from rooms where id = p_room and host_id = auth.uid() and phase = 'suggest') then
    raise exception 'Only the host can do this';
  end if;
  update rooms set phase = 'challenge', prompt = null, prompt_by = null where id = p_room;
end $$;

-- Step 4: only the host marks it completed or not, then the next player is picked.
create or replace function public.mark_result(p_room uuid, p_done boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_cur uuid;
begin
  select current_user_id into v_cur from rooms
   where id = p_room and host_id = auth.uid() and phase = 'challenge';
  if v_cur is null then raise exception 'Only the host can mark the result'; end if;
  update room_players
     set done_count = done_count + (case when p_done then 1 else 0 end),
         fail_count = fail_count + (case when p_done then 0 else 1 end)
   where room_id = p_room and user_id = v_cur;
  perform pick_next(p_room);
end $$;

-- Host changes their mind: go back to the suggestions (same turn) and pick a different one.
create or replace function public.reopen_suggestions(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from rooms where id = p_room and host_id = auth.uid() and phase = 'challenge') then
    raise exception 'Only the host can change the challenge';
  end if;
  update rooms set phase = 'suggest', prompt = null, prompt_by = null where id = p_room;
end $$;

-- Host skips the current player (e.g. away from keyboard) without scoring.
create or replace function public.skip_turn(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from rooms where id = p_room and host_id = auth.uid() and phase <> 'lobby') then
    raise exception 'Only the host can skip';
  end if;
  perform pick_next(p_room);
end $$;

-- Host removes a player from the room (they can't rejoin it).
create or replace function public.kick_player(p_room uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r rooms;
begin
  select * into r from rooms where id = p_room and host_id = auth.uid();
  if not found then raise exception 'Only the host can remove players'; end if;
  if p_user = auth.uid() then raise exception 'You cannot remove yourself'; end if;
  if not exists (select 1 from room_players where room_id = p_room and user_id = p_user) then return; end if;
  insert into room_bans (room_id, user_id) values (p_room, p_user) on conflict do nothing;
  delete from suggestions where room_id = p_room and user_id = p_user;
  delete from room_players where room_id = p_room and user_id = p_user;
  if r.phase <> 'lobby' and (r.current_user_id = p_user
      or (select count(*) from room_players where room_id = p_room) < 2) then
    perform pick_next(p_room);
  end if;
end $$;

-- Raise or lower a hand. Anyone can change their own; the host can lower anyone's.
create or replace function public.set_hand(p_room uuid, p_user uuid, p_up boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_user = auth.uid() then
    null;
  elsif p_up = false and exists (select 1 from rooms where id = p_room and host_id = auth.uid()) then
    null;
  else
    raise exception 'Not allowed';
  end if;
  update room_players
     set hand = p_up, hand_at = case when p_up then now() else null end
   where room_id = p_room and user_id = p_user and hand is distinct from p_up;
end $$;

-- Host hands the host role to another player in the room.
create or replace function public.transfer_host(p_room uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from rooms where id = p_room and host_id = auth.uid()) then
    raise exception 'Only the host can do this';
  end if;
  if p_user = auth.uid() or not exists (select 1 from room_players where room_id = p_room and user_id = p_user) then
    raise exception 'Choose another player in this room';
  end if;
  update rooms set host_id = p_user where id = p_room;
end $$;

create or replace function public.end_game(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from rooms where id = p_room and host_id = auth.uid()) then
    raise exception 'Only the host can end the game';
  end if;
  delete from suggestions where room_id = p_room;
  update room_players set had_turn = false, done_count = 0, fail_count = 0 where room_id = p_room;
  update rooms set phase='lobby', current_user_id=null, kind=null, prompt=null, prompt_by=null where id = p_room;
end $$;

-- Leaving: if the host leaves, the longest-present player becomes host (room closes if nobody is left).
create or replace function public.leave_room(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r rooms; v_new uuid;
begin
  select * into r from rooms where id = p_room;
  if not found then return; end if;
  if r.host_id = auth.uid() then
    select user_id into v_new from room_players
     where room_id = p_room and user_id <> auth.uid() order by joined_at limit 1;
    if v_new is null then
      delete from rooms where id = p_room;
      return;
    end if;
    update rooms set host_id = v_new where id = p_room;
  end if;
  delete from suggestions where room_id = p_room and user_id = auth.uid();
  delete from room_players where room_id = p_room and user_id = auth.uid();
  if r.phase <> 'lobby' and (r.current_user_id = auth.uid()
      or (select count(*) from room_players where room_id = p_room) < 2) then
    perform pick_next(p_room);
  end if;
end $$;

-- Called by every player every ~10s. Removes anyone silent for 45s+, fixes the turn,
-- and passes the host role on if the host's tab died.
create or replace function public.heartbeat(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  r rooms;
  v_stale interval := interval '45 seconds';
  v_cur_stale boolean;
  v_removed int;
  v_new uuid;
begin
  update room_players set last_seen = now() where room_id = p_room and user_id = auth.uid();
  if not found then return; end if;

  select * into r from rooms where id = p_room;
  if not found then return; end if;

  if exists (select 1 from room_players
              where room_id = p_room and user_id = r.host_id and last_seen < now() - v_stale) then
    select user_id into v_new from room_players
     where room_id = p_room and user_id <> r.host_id and last_seen >= now() - v_stale
     order by joined_at limit 1;
    if v_new is null then
      delete from rooms where id = p_room;
      return;
    end if;
    update rooms set host_id = v_new where id = p_room;
  end if;

  v_cur_stale := r.current_user_id is not null and exists (
    select 1 from room_players
     where room_id = p_room and user_id = r.current_user_id and last_seen < now() - v_stale);

  with del as (
    delete from room_players where room_id = p_room and last_seen < now() - v_stale returning 1
  ) select count(*) into v_removed from del;

  if v_removed > 0 and r.phase <> 'lobby'
     and (v_cur_stale or (select count(*) from room_players where room_id = p_room) < 2) then
    perform pick_next(p_room);
  end if;
end $$;

-- ========== REALTIME ==========
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='rooms') then
    alter publication supabase_realtime add table public.rooms;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='room_players') then
    alter publication supabase_realtime add table public.room_players;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='suggestions') then
    alter publication supabase_realtime add table public.suggestions;
  end if;
end $$;
