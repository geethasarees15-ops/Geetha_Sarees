import type { CartItems } from "@/features/carts/useCartStore";
import type { SupabaseClient } from "@supabase/supabase-js";

type CartRow = {
  product_id: string;
  quantity: number;
};

/**
 * Merge device guest cart into the signed-in user's Supabase cart.
 * Industry pattern: guest cart survives until login, then merges into account cart.
 */
export async function mergeGuestCartIntoAccount(
  supabase: SupabaseClient,
  userId: string,
  guestCart: CartItems,
): Promise<{ merged: number; error: string | null }> {
  const entries = Object.entries(guestCart).filter(
    ([, item]) => item.quantity > 0,
  );
  if (entries.length === 0) {
    return { merged: 0, error: null };
  }

  const productIds = entries.map(([productId]) => productId);
  const { data: existingRows, error: readError } = await supabase
    .from("carts")
    .select("product_id, quantity")
    .eq("user_id", userId)
    .in("product_id", productIds);

  if (readError) {
    return { merged: 0, error: readError.message };
  }

  const existingByProduct = new Map<string, number>(
    (existingRows ?? []).map((row: CartRow) => [row.product_id, row.quantity]),
  );

  const upsertRows = entries.map(([productId, item]) => {
    const existingQty = existingByProduct.get(productId) ?? 0;
    return {
      user_id: userId,
      product_id: productId,
      quantity: existingQty + item.quantity,
    };
  });

  const { error: upsertError } = await supabase.from("carts").upsert(upsertRows, {
    onConflict: "user_id,product_id",
  });

  if (upsertError) {
    return { merged: 0, error: upsertError.message };
  }

  return { merged: upsertRows.length, error: null };
}
