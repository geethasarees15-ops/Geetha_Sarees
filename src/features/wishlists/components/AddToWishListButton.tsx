"use client";
import { gql } from "@/gql";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";
import { useMutation } from "@urql/next";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Icons } from "@/components/layouts/icons";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import useWishlistStore from "../useWishlistStore";

type Props = {
  productId: string;
};

const AddProductToWishList = gql(/* GraphQL */ `
  mutation AddProductToWishList($productId: String, $userId: UUID) {
    insertIntowishlistCollection(
      objects: { user_id: $userId, product_id: $productId }
    ) {
      affectedCount
      records {
        __typename
        user_id
        product_id
      }
    }
  }
`);
const RemoveWishlistItemMutation = gql(/* GraphQL */ `
  mutation RemoveWishlistItemMutation($productId: String, $userId: UUID) {
    deleteFromwishlistCollection(
      filter: {
        and: [{ user_id: { eq: $userId } }, { product_id: { eq: $productId } }]
      }
      atMost: 1
    ) {
      records {
        __typename
      }
    }
  }
`);

function AddToWishListButton({ productId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const wishlist = useWishlistStore((s) => s.wishlist);
  const addWishItem = useWishlistStore((s) => s.addWishItem);
  const removeWishItem = useWishlistStore((s) => s.removeWishItem);
  const isSaved = Boolean(wishlist[productId]);

  const [, addToWishlist] = useMutation(AddProductToWishList);
  const [, removeWishlistItem] = useMutation(RemoveWishlistItemMutation);

  const onClickHandler = () => {
    if (!user) {
      // Save locally so the wishlist page works immediately, then offer account sync.
      if (isSaved) {
        removeWishItem(productId);
        toast({ title: "Removed from wishlist." });
      } else {
        addWishItem(productId);
        toast({
          title: "Saved on this device",
          description:
            "Open Wishlist anytime here. Sign in to keep it across devices.",
        });
      }
      return;
    }

    startTransition(async () => {
      if (isSaved) {
        const res = await removeWishlistItem({
          productId,
          userId: user.id,
        });
        if (res.error) {
          toast({
            title: "Could not remove from wishlist",
            description: res.error.message,
            variant: "destructive",
          });
          return;
        }
        removeWishItem(productId);
        toast({ title: "Removed from wishlist." });
      } else {
        const res = await addToWishlist({ productId, userId: user.id });
        if (res.error) {
          toast({
            title: "Could not save to wishlist",
            description: res.error.message,
            variant: "destructive",
          });
          return;
        }
        addWishItem(productId);
        toast({ title: "Added to wishlist" });
      }
      router.refresh();
    });
  };

  return (
    <Button
      className="rounded-full p-3"
      variant="ghost"
      disabled={pending}
      aria-pressed={isSaved}
      aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
      onClick={onClickHandler}
    >
      <Icons.heart
        className={cn(
          "h-4 w-4",
          isSaved ? "fill-red-600 text-red-600" : "fill-none",
        )}
      />
    </Button>
  );
}

export default AddToWishListButton;
