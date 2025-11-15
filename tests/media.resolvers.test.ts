import { resolvers } from "../src/resolvers";
import { Media } from "../src/models";

describe("Media resolvers", () => {
  test("resolveType returns Image", () => {
    const obj = { type: "IMAGE" } as Media;
    expect(resolvers.Media.__resolveType(obj)).toBe("Image");
  });

  test("resolveType returns Video", () => {
    const obj = { type: "VIDEO" } as Media;
    expect(resolvers.Media.__resolveType(obj)).toBe("Video");
  });
});