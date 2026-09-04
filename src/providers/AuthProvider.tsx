"use client";

import useCartStore from "@/features/carts/useCartStore";
import { mergeGuestCartIntoAccount } from "@/lib/cart/merge-guest-cart";
import { useToast } from "@/components/ui/use-toast";
import { AuthUser, Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import useWishlistStore from "@/features/wishlists/useWishlistStore";

type SupabaseAuthContextType = {
  user: AuthUser | null;
  session: Session | null;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  user: null,
  session: null,
});

export const useAuth = () => {
  const client = useContext(SupabaseAuthContext);
  return client;
};

interface SupabaseAuthProviderProps {
  children: React.ReactNode;
}

const WELCOME_TOAST_KEY = "auth:welcomed-user-id";

function hasWelcomedInSession(userId: string) {
  try {
    return sessionStorage.getItem(WELCOME_TOAST_KEY) === userId;
  } catch {
    return false;
  }
}

function markWelcomedInSession(userId: string) {
  try {
    sessionStorage.setItem(WELCOME_TOAST_KEY, userId);
  } catch {
    // Ignore storage access failures (private mode/restrictions).
  }
}

function clearWelcomedInSession() {
  try {
    sessionStorage.removeItem(WELCOME_TOAST_KEY);
  } catch {
    // Ignore storage access failures (private mode/restrictions).
  }
}

export const SupabaseAuthProvider: React.FC<SupabaseAuthProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const removeAllCartStorage = useCartStore((s) => s.removeAllProducts);
  const setWishlist = useWishlistStore((s) => s.setWishlist);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);
  const { toast } = useToast();
  const router = useRouter();
  const lastWelcomedUserId = useRef<string | null>(null);

  const loadWishlistForUser = (userId: string) => {
    const supabase = createClient();
    supabase
      .from("wishlist")
      .select()
      .eq("user_id", userId)
      .then((data) => {
        const wishlistItems: Parameters<typeof setWishlist>[0] = {};

        data?.data?.forEach((item) => {
          wishlistItems[item.product_id] = {
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.created_at),
          };
        });

        setWishlist(wishlistItems);
      });
  };

  /** Merge device-local hearts into DB, then reload account wishlist. */
  const syncLocalWishlistToAccount = async (userId: string) => {
    const supabase = createClient();
    const localIds = Object.keys(useWishlistStore.getState().wishlist);
    if (localIds.length > 0) {
      const rows = localIds.map((productId) => ({
        user_id: userId,
        product_id: productId,
      }));
      const { error } = await supabase.from("wishlist").upsert(rows, {
        onConflict: "user_id,product_id",
        ignoreDuplicates: true,
      });
      if (error) {
        console.error("[wishlist] failed to sync local items:", error.message);
      }
    }
    loadWishlistForUser(userId);
  };

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const supabase = createClient();
      const authChange = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);

        switch (_event) {
          case "INITIAL_SESSION":
            supabase.auth.getUser().then(async ({ data }) => {
              setUser(data.user);
              if (data.user?.id) {
                const guestCart = useCartStore.getState().cart;
                if (Object.keys(guestCart).length > 0) {
                  const { merged, error } = await mergeGuestCartIntoAccount(
                    supabase,
                    data.user.id,
                    guestCart,
                  );
                  if (!error && merged > 0) {
                    removeAllCartStorage();
                  }
                }
                void syncLocalWishlistToAccount(data.user.id);
              }
            });
            break;
          case "PASSWORD_RECOVERY":
            supabase.auth.getUser().then(({ data }) => {
              setUser(data.user);
            });
            if (
              typeof window !== "undefined" &&
              !window.location.pathname.startsWith("/reset-password")
            ) {
              router.push("/reset-password");
            }
            break;

          case "SIGNED_IN":
            supabase.auth.getUser().then(async ({ data }) => {
              setUser(data.user);

              if (!data.user) return;

              const guestCart = useCartStore.getState().cart;
              if (Object.keys(guestCart).length > 0) {
                const { merged, error } = await mergeGuestCartIntoAccount(
                  supabase,
                  data.user.id,
                  guestCart,
                );
                if (error) {
                  console.error("[cart] guest merge failed:", error);
                } else if (merged > 0) {
                  removeAllCartStorage();
                }
              }
            });

            if (session?.user?.id) {
              void syncLocalWishlistToAccount(session.user.id);
            }

            if (
              session?.user?.id &&
              session.user.id !== lastWelcomedUserId.current &&
              !hasWelcomedInSession(session.user.id)
            ) {
              lastWelcomedUserId.current = session.user.id;
              markWelcomedInSession(session.user.id);
              toast({
                title: "Welcome back.",
                description: "You are already signed in.",
              });
            }
            break;
          case "SIGNED_OUT":
            setUser(null);
            lastWelcomedUserId.current = null;
            clearWelcomedInSession();
            removeAllCartStorage();
            clearWishlist();
            break;

          case "TOKEN_REFRESHED":
          case "USER_UPDATED":
          case "MFA_CHALLENGE_VERIFIED":
            supabase.auth.getUser().then(({ data }) => {
              setUser(data.user);
            });
            break;
        }
      });

      subscription = authChange.data.subscription;
    } catch (error) {
      console.error("[auth] Failed to initialize client auth provider", error);
      setUser(null);
      setSession(null);
    }

    return () => subscription?.unsubscribe();
  }, [clearWishlist, removeAllCartStorage, router, setWishlist, toast]);

  return (
    <SupabaseAuthContext.Provider value={{ user, session }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};
