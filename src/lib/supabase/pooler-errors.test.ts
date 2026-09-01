import {
  isPoolerSocketError,
  isSessionPoolExhausted,
  mapProductSaveError,
  POOLER_INTERRUPTED_MESSAGE,
  POOLER_SESSION_EXHAUSTED_MESSAGE,
  PRODUCT_SAVE_MAY_EXIST_MESSAGE,
} from "./pooler-errors";

describe("mapProductSaveError", () => {
  it("maps postgres.js onclose races to a retry message", () => {
    const mapped = mapProductSaveError(
      new Error("Cannot set properties of undefined (setting 'onclose')"),
    );
    expect(mapped.message).toBe(POOLER_INTERRUPTED_MESSAGE);
  });

  it("maps session pool exhaustion to a retry message", () => {
    const mapped = mapProductSaveError(
      new Error(
        "(EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15",
      ),
    );
    expect(mapped.message).toBe(POOLER_SESSION_EXHAUSTED_MESSAGE);
  });

  it("maps unique violations to a refresh message instead of retrying blindly", () => {
    const mapped = mapProductSaveError({ code: "23505" });
    expect(mapped.message).toBe(PRODUCT_SAVE_MAY_EXIST_MESSAGE);
  });

  it("keeps real validation errors", () => {
    const mapped = mapProductSaveError(
      new Error("Select at least one product image."),
    );
    expect(mapped.message).toBe("Select at least one product image.");
  });
});

describe("isPoolerSocketError", () => {
  it("matches queue races from a recycled socket", () => {
    expect(
      isPoolerSocketError(
        new TypeError("Cannot read properties of undefined (reading 'queue')"),
      ),
    ).toBe(true);
  });

  it("does not match schema errors", () => {
    expect(isPoolerSocketError(new Error("column does not exist"))).toBe(false);
  });
});

describe("isSessionPoolExhausted", () => {
  it("matches Supabase session pool cap errors", () => {
    expect(
      isSessionPoolExhausted(
        new Error("EMAXCONNSESSION max clients reached in session mode"),
      ),
    ).toBe(true);
  });
});
