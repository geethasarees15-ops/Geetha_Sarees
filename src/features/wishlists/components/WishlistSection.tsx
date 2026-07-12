"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import ProductCard from "@/features/products/components/ProductCard";
import ProductCardSkeleton from "@/features/products/components/ProductCardSkeleton";
import { fetchGuestWishlistProductsAction } from "@/features/wishlists/actions";
import useWishlistStore from "@/features/wishlists/useWishlistStore";
import type { WishlistProductView } from "@/lib/storefront/wishlist-server";
import { appendFromToSignIn } from "@/lib/auth/redirect";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";

type Props = {
  serverUserId: string | null;
  initialProducts: WishlistProductView[];
};

function productIdsKey(ids: string[]) {
  return [...ids].sort().join(",");
}

export default function WishlistSection({
  serverUserId,
  initialProducts,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const wishlist = useWishlistStore((s) => s.wishlist);
  const activeUserId = user?.id ?? serverUserId;
  const [guestProducts, setGuestProducts] = React.useState<
    WishlistProductView[]
  >([]);
  const [guestLoading, setGuestLoading] = React.useState(false);

  const localIds = React.useMemo(() => Object.keys(wishlist), [wishlist]);

  React.useEffect(() => {
    if (activeUserId) return;
    const ids = localIds;
    if (ids.length === 0) {
      setGuestProducts([]);
      return;
    }

    let cancelled = false;
    setGuestLoading(true);
    void fetchGuestWishlistProductsAction(ids)
      .then((rows) => {
        if (!cancelled) setGuestProducts(rows);
      })
      .finally(() => {
        if (!cancelled) setGuestLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeUserId, localIds]);

  // Keep list in sync when hearts remove items (logged-in list from server).
  const products = React.useMemo(() => {
    if (activeUserId) {
      const storeIds = Object.keys(wishlist);
      // Store may not be hydrated yet — prefer server list until client catch-up.
      if (storeIds.length === 0 && initialProducts.length > 0) {
        return initialProducts;
      }
      return initialProducts.filter((product) => Boolean(wishlist[product.id]));
    }
    const byId = new Map(guestProducts.map((p) => [p.id, p]));
    return localIds
      .map((id) => byId.get(id))
      .filter((p): p is WishlistProductView => Boolean(p));
  }, [activeUserId, guestProducts, initialProducts, localIds, wishlist]);

  const signInHref = appendFromToSignIn("/sign-in", pathname || "/wish-list");

  if (!activeUserId && localIds.length === 0) {
    return (
      <div className="space-y-4 rounded-lg border border-dashed px-4 py-10 text-center">
        <p className="text-base font-medium text-foreground">
          Your wishlist is empty
        </p>
        <p className="text-sm text-muted-foreground">
          Tap the heart on any product to save it here. Sign in so your list
          stays with you on every device.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href={signInHref}>Sign in to sync wishlist</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/shop">Browse sarees</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!activeUserId && guestLoading && products.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-x-2 gap-y-4 md:grid-cols-4 md:gap-x-4 md:gap-y-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-4 rounded-lg border border-dashed px-4 py-10 text-center">
        <p className="text-base font-medium text-foreground">
          {activeUserId
            ? "No saved products yet"
            : "Saved products are no longer available"}
        </p>
        <p className="text-sm text-muted-foreground">
          {activeUserId
            ? "Add items with the heart icon — they stay on your account so you can buy later."
            : "Those products may have been removed. Sign in after saving new items to keep them."}
        </p>
        <Button asChild variant="outline">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!activeUserId ? (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Saved on this device only ({products.length}).{" "}
            <span className="font-medium">Sign in</span> to keep your wishlist
            when you come back on phone or computer.
          </p>
          <Button asChild size="sm" className="shrink-0">
            <Link href={signInHref}>Sign in</Link>
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {products.length} saved{" "}
          {products.length === 1 ? "product" : "products"} — add to cart whenever
          you&apos;re ready.
        </p>
      )}

      <div
        className="grid grid-cols-2 gap-x-2 gap-y-4 md:grid-cols-4 md:gap-x-4 md:gap-y-8"
        data-wishlist-ids={productIdsKey(products.map((p) => p.id))}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {activeUserId ? (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.refresh()}
          >
            Refresh list
          </Button>
        </div>
      ) : null}
    </div>
  );
}
