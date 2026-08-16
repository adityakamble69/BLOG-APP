-- Run this once in your Supabase project's SQL Editor
-- (Project -> SQL Editor -> New query -> paste -> Run).

create table if not exists users (
  id bigint generated always as identity primary key,
  name varchar(100) not null,
  email varchar(150) not null unique,
  password varchar(255) not null,
  created_at timestamptz not null default now()
);

create table if not exists blogs (
  id bigint generated always as identity primary key,
  user_id bigint not null references users(id) on delete cascade,
  title varchar(255) not null,
  content text not null,
  category varchar(50),
  image text,
  created_at timestamptz not null default now()
);

create index if not exists blogs_user_id_idx on blogs (user_id);
create index if not exists blogs_created_at_idx on blogs (created_at desc);

-- Lock these tables out of Supabase's auto-generated public REST/GraphQL API.
-- Our Express backend talks to Postgres with the service role key, which
-- bypasses Row Level Security entirely -- so this just makes sure nobody can
-- read or write users/blogs directly through the client-side (anon key) API,
-- since no policies are defined below. All access goes through our own API.
alter table users enable row level security;
alter table blogs enable row level security;
