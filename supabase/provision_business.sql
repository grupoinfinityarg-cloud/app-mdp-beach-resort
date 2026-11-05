-- Run in the Supabase SQL Editor after creating the staff user in
-- Authentication > Users. Replace the email placeholder before running.
do $$
declare
  v_business_id uuid;
  v_user_id uuid;
  v_staff_email text := 'estiloargentooficial@gmail.com';
begin
  insert into public.businesses (slug, name, branch_name)
  values ('tu-balneario-del-mar', 'MDP BEACH & RESORT', 'MDP BEACH & RESORT')
  on conflict (slug) do update
    set name = excluded.name,
        branch_name = excluded.branch_name,
        updated_at = now()
  returning id into v_business_id;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(v_staff_email)
  limit 1;

  if v_user_id is null then
    raise exception 'No existe un usuario de Supabase Auth con el email %. Créalo en Authentication > Users y vuelve a ejecutar este script.', v_staff_email;
  end if;

  insert into public.business_memberships (business_id, user_id, role)
  values (v_business_id, v_user_id, 'cashier')
  on conflict (business_id, user_id) do update
    set role = excluded.role;
end;
$$;
