# Way A – Geetha Sarees database setup

## 1. Put `DATABASE_URL` in `.env.local`

Use **this shop’s** Supabase project only (never SSR Tex / Hub keys).

1. Open your Geetha Sarees Supabase project → **Settings → Database**
2. **Connection string** → **URI**
3. Replace `[YOUR-PASSWORD]` with the database password
4. Paste into `.env.local` as `DATABASE_URL=...`

## 2. Commands

```powershell
cd "e:\Geetha sarees"
npm run db:setup
```

(`db:push` then `db:seed`.)

## 3. Admin user

1. Supabase **Authentication** → enable **Email**
2. **Users** → add your email
3. SQL Editor:

```sql
UPDATE public.profiles SET is_admin = true WHERE email = 'your-email@gmail.com';
```

## 4. Run shop

```powershell
npm run dev
```

Open http://localhost:3000
