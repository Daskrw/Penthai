DO $$
DECLARE
  target_email text := 'adminpenthai@penthai.co';
  admin_uid uuid := 'a0000000-0000-0000-0000-000000000004';
  existing_uid uuid;
BEGIN
  -- 1. Find any existing corrupted user to completely wipe them out
  SELECT id INTO existing_uid FROM auth.users WHERE email = target_email LIMIT 1;
  
  IF existing_uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = existing_uid;
    DELETE FROM public.profiles WHERE id = existing_uid;
    DELETE FROM auth.identities WHERE user_id = existing_uid;
    DELETE FROM auth.users WHERE id = existing_uid;
  END IF;

  -- 2. Insert WITH all token columns set to empty strings (GoTrue crashes on NULLs)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change_token_current,
    email_change, phone, phone_change, phone_change_token, reauthentication_token
  ) VALUES (
    admin_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    target_email, crypt('}eK4rUbnWlx4', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Admin PenThai"}'::jsonb, now(), now(),
    '', '', '', '',
    '', '', '', '', ''
  );

  -- 3. Recreate Identity
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at) 
  VALUES (admin_uid, admin_uid, target_email, 'email', jsonb_build_object('sub', admin_uid::text, 'email', target_email), now(), now(), now());

  -- 4. Recreate Profile & Admin Role
  INSERT INTO public.profiles (id, email, full_name) VALUES (admin_uid, target_email, 'Admin PenThai');
  INSERT INTO public.user_roles (user_id, role) VALUES (admin_uid, 'admin');
END $$;
