import { afterEach, describe, expect, it, vi } from "vitest";
import { retryDelay, TimeoutError, withTimeout } from "./network";

describe("withTimeout", () => {
  afterEach(() => vi.useRealTimers());

  it("passes a value that arrives in time", async () => {
    await expect(withTimeout(Promise.resolve(1), 50)).resolves.toBe(1);
  });

  it("passes the original error through", async () => {
    await expect(withTimeout(Promise.reject(new Error("boom")), 50)).rejects.toThrow("boom");
  });

  it("rejects with TimeoutError when the server does not answer", async () => {
    vi.useFakeTimers();
    const p = withTimeout(new Promise(() => {}), 1000);
    vi.advanceTimersByTime(1000);
    await expect(p).rejects.toBeInstanceOf(TimeoutError);
  });
});

describe("retryDelay", () => {
  it("backs off and caps at 30 seconds", () => {
    expect([1, 2, 3, 4, 5, 9].map(retryDelay)).toEqual([3000, 6000, 12000, 24000, 30000, 30000]);
  });
});
