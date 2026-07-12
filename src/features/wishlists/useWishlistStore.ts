import { create } from "zustand";
import { persistNSync } from "persist-and-sync";

export type WishDetails = {
  updatedAt: Date;
  createdAt: Date;
};

export type WishItems = {
  [productId: string]: WishDetails;
};

type WishlistStore = {
  wishlist: WishItems;
  toggleWishItem: (productId: string) => void;
  addWishItem: (productId: string) => void;
  removeWishItem: (productId: string) => void;
  setWishlist: (list: WishItems) => void;
  clearWishlist: () => void;
};

function emptyWishDetails(): WishDetails {
  const now = new Date();
  return { createdAt: now, updatedAt: now };
}

const useWishlistStore = create<WishlistStore>(
  persistNSync(
    (set) => ({
      wishlist: {},
      addWishItem: (productId) =>
        set((state) => {
          if (state.wishlist[productId]) return state;
          return {
            wishlist: {
              ...state.wishlist,
              [productId]: emptyWishDetails(),
            },
          };
        }),
      removeWishItem: (productId) =>
        set((state) => {
          if (!state.wishlist[productId]) return state;
          const updatedWishlist = { ...state.wishlist };
          delete updatedWishlist[productId];
          return { wishlist: updatedWishlist };
        }),
      toggleWishItem: (productId) =>
        set((state) => {
          if (state.wishlist[productId]) {
            const updatedWishlist = { ...state.wishlist };
            delete updatedWishlist[productId];
            return { wishlist: updatedWishlist };
          }
          return {
            wishlist: {
              ...state.wishlist,
              [productId]: emptyWishDetails(),
            },
          };
        }),
      setWishlist: (wishlist) => set(() => ({ wishlist })),
      clearWishlist: () => set(() => ({ wishlist: {} })),
    }),
    { name: "wishlist" },
  ),
);

export default useWishlistStore;
