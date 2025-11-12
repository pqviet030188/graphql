import { resolvers } from "../src/resolvers";
import { Media, Image, Video, MediaWithDetails } from "../src/models";

describe("Media resolvers", () => {
  test("resolveType returns Image", () => {
    const obj = { type: "IMAGE" } as Media;
    expect(resolvers.Media.__resolveType(obj)).toBe("Image");
  });

  test("resolveType returns Video", () => {
    const obj = { type: "VIDEO" } as Media;
    expect(resolvers.Media.__resolveType(obj)).toBe("Video");
  });

  test("Image resolver returns width/height", () => {
    const parent = { imageDetails: { width: 100, height: 200 } } as MediaWithDetails;
    expect(resolvers.Image.width(parent)).toBe(100);
    expect(resolvers.Image.height(parent)).toBe(200);
  });

  test("Video resolver returns duration", () => {
    const parent = { videoDetails: { duration: 90 } } as MediaWithDetails;
    expect(resolvers.Video.duration(parent)).toBe(90);
  });
});