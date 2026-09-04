import { mergeGuestCartIntoAccount } from "./merge-guest-cart";

describe("mergeGuestCartIntoAccount", () => {
  it("merges guest quantities into existing cart rows", async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [{ product_id: "p1", quantity: 2 }],
              error: null,
            }),
          }),
        }),
        upsert,
      }),
    };

    const result = await mergeGuestCartIntoAccount(
      supabase as never,
      "user-1",
      {
        p1: { quantity: 3 },
        p2: { quantity: 1 },
      },
    );

    expect(result).toEqual({ merged: 2, error: null });
    expect(upsert).toHaveBeenCalledWith(
      [
        { user_id: "user-1", product_id: "p1", quantity: 5 },
        { user_id: "user-1", product_id: "p2", quantity: 1 },
      ],
      { onConflict: "user_id,product_id" },
    );
  });

  it("returns early when guest cart is empty", async () => {
    const upsert = jest.fn();
    const supabase = { from: jest.fn().mockReturnValue({ upsert }) };

    const result = await mergeGuestCartIntoAccount(
      supabase as never,
      "user-1",
      {},
    );

    expect(result).toEqual({ merged: 0, error: null });
    expect(upsert).not.toHaveBeenCalled();
  });
});
