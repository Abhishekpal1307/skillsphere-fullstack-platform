
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

drop policy "Avatar images are publicly accessible" on storage.objects;

create policy "Users can list own avatars"
  on storage.objects for select using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );
