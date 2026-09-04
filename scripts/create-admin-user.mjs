/**
 * Create (or reset) the Geetha Sarees admin user.
 * Usage: node scripts/create-admin-user.mjs
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import postgres from "postgres";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env.local") });

const EMAIL = "Geethasarees15@gmail.com";
const PASSWORD = "Geetha123";

async function main() {
  const ref = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
  const key = process.env.DATABASE_SERVICE_ROLE;
  if (!ref || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_PROJECT_REF and DATABASE_SERVICE_ROLE");
    process.exit(1);
  }

  const supabase = createClient(`https://${ref}.supabase.co`, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listErr) {
    console.error(listErr.message);
    process.exit(1);
  }

  let user = list.users.find(
    (u) => u.email?.toLowerCase() === EMAIL.toLowerCase(),
  );

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) {
      console.error(error.message);
      process.exit(1);
    }
    user = data.user;
    console.log("Created user");
  } else {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
    });
    if (error) {
      console.error(error.message);
      process.exit(1);
    }
    console.log("User exists — password updated");
  }

  const { error: metaErr } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, isAdmin: true },
  });
  if (metaErr) {
    console.error(metaErr.message);
    process.exit(1);
  }

  const { error: profErr } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    is_admin: true,
  });
  if (profErr) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error(profErr.message);
      process.exit(1);
    }
    const sql = postgres(dbUrl, { max: 1 });
    try {
      await sql`
        insert into profiles (id, email, is_admin, name)
        values (${user.id}, ${user.email}, true, 'Geetha Sarees')
        on conflict (id) do update set is_admin = true, email = excluded.email
      `;
    } finally {
      await sql.end();
    }
  }

  console.log(`Admin ready: ${EMAIL}`);
}

main();
