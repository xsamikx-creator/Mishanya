-- Выполните этот файл один раз в Supabase → SQL Editor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mushvig-photos',
  'mushvig-photos',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Mushvig gallery public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'mushvig-photos');

create policy "Mushvig gallery public upload"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'mushvig-photos');

create policy "Mushvig gallery public delete"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'mushvig-photos');
