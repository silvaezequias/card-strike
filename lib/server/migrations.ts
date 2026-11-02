/* ═══════════════════════════════════════════════
   MIGRAÇÕES
   Aplicadas em ordem na primeira conexão; cada uma
   roda uma vez só (tabela _cs_migrations). Nunca
   edite uma migração já publicada: crie outra.
   Cada comando termina em ";" + quebra de linha.
   ═══════════════════════════════════════════════ */

export const MIGRATIONS: string[] = [
  `
create table users (
  id uuid primary key default gen_random_uuid(),
  -- guest: só um nick, sem amigos. account: login por Google, Discord ou Steam.
  kind text not null check (kind in ('guest', 'account')),
  name text not null,
  -- Nome#1234: o número separa contas com o mesmo nome (só contas).
  tag int,
  avatar_url text,
  google_id text unique,
  discord_id text unique,
  steam_id text unique,
  status text not null default 'offline',
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create unique index users_name_tag on users (lower(name), tag) where kind = 'account';
create table friendships (
  -- Par ordenado (menor, maior) para não duplicar a amizade.
  user_low uuid not null references users(id) on delete cascade,
  user_high uuid not null references users(id) on delete cascade,
  requested_by uuid not null references users(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (user_low, user_high),
  check (user_low < user_high)
);
create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind text not null check (kind in ('private', 'queue')),
  host_id uuid not null references users(id) on delete cascade,
  host_team text not null check (host_team in ('police', 'faction')),
  guest_id uuid references users(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'started', 'closed')),
  match_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  from_id uuid not null references users(id) on delete cascade,
  to_id uuid not null references users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamptz not null default now()
);
create table match_queue (
  user_id uuid primary key references users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete set null,
  police_id uuid not null references users(id),
  faction_id uuid not null references users(id),
  state jsonb not null,
  version int not null default 0,
  -- Prazo do turno: quando passa, qualquer jogador pode cobrar o tempo esgotado.
  deadline timestamptz,
  -- Resultado do dado/roleta sorteado no servidor, enquanto anima.
  pending_roll jsonb,
  status text not null default 'active' check (status in ('active', 'finished')),
  winner text check (winner in ('police', 'faction')),
  end_reason text,
  police_seen timestamptz not null default now(),
  faction_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index matches_players on matches (police_id, faction_id, status);
create index invites_to on invites (to_id, status);
`,
  `
-- Fila: quem não renova a presença em 30 s sai sozinho.
alter table match_queue add column seen_at timestamptz not null default now();
`,
];
