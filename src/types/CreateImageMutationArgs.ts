export interface CreateImageMutationArgs {
  filename: string;
  url: string;
  postId: number;
  mimetype?: string;
  width?: number;
  height?: number;
}
