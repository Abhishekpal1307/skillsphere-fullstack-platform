
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  skills text[] default '{}'::text[],
  projects jsonb default '[]'::jsonb,
  resume_link text,
  experience_level text check (experience_level in ('junior','mid','senior','lead')) default 'junior',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can delete own profile"
  on public.profiles for delete using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Jobs
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  location text,
  type text check (type in ('full-time','part-time','contract','internship','remote')) default 'full-time',
  salary text,
  category text,
  description text,
  apply_url text,
  posted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.jobs enable row level security;

create policy "Jobs are viewable by everyone"
  on public.jobs for select using (true);
create policy "Authenticated users can insert jobs"
  on public.jobs for insert with check (auth.uid() is not null);
create policy "Posters can delete own jobs"
  on public.jobs for delete using (auth.uid() = posted_by);

-- Saved jobs
create table public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);

alter table public.saved_jobs enable row level security;

create policy "Users view own saved jobs"
  on public.saved_jobs for select using (auth.uid() = user_id);
create policy "Users save own jobs"
  on public.saved_jobs for insert with check (auth.uid() = user_id);
create policy "Users unsave own jobs"
  on public.saved_jobs for delete using (auth.uid() = user_id);

-- Storage bucket for avatars
insert into storage.buckets (id, name, public) values ('avatars','avatars', true);

create policy "Avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');
create policy "Users can upload own avatar"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Users can update own avatar"
  on storage.objects for update using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Users can delete own avatar"
  on storage.objects for delete using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );
