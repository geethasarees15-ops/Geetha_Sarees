import { logServerError } from "@/lib/api/public-error";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { SUPABASE_MEDIA_BUCKET } from "@/lib/utils";

/** Best-effort delete of storage objects (never throws). */
export async function deleteMediaStorageKeys(keys: string[]) {
  const uniqueKeys = [
    ...new Set(keys.map((key) => key.trim()).filter(Boolean)),
  ];
  if (uniqueKeys.length === 0) return;

  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .remove(uniqueKeys);

  if (error) {
    logServerError("deleteMediaStorageKeys", error);
  }
}
