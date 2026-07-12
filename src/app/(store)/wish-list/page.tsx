import RecommendationProductsSection from "@/features/products/components/RecommendationProductsSection";
import WishlistSection from "@/features/wishlists/components/WishlistSection";
import { Shell } from "@/components/layouts/Shell";
import { getSessionUser } from "@/lib/auth/admin";
import { getWishlistProductsForUser } from "@/lib/storefront/wishlist-server";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WishListPage() {
  const user = await getSessionUser();
  const initialProducts = user
    ? await getWishlistProductsForUser(user.id)
    : [];

  return (
    <Shell>
      <section className="flex items-center justify-between gap-3 py-4 md:py-8">
        <h1 className="text-2xl font-bold md:text-3xl">Your Wishlist</h1>
        <Link
          href="/shop"
          className="shrink-0 text-sm font-medium text-primary md:text-base"
        >
          Continue shopping
        </Link>
      </section>

      <WishlistSection
        serverUserId={user?.id ?? null}
        initialProducts={initialProducts}
      />

      <div className="mt-8 hidden md:block">
        <RecommendationProductsSection />
      </div>
    </Shell>
  );
}
