import { clamp } from "@/lib/example";

// Placeholder test — delete alongside `src/lib/example.ts`.
describe("clamp", () => {
  it("returns the value when it is already in range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to the bounds", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });
});
