export interface CreateVideoMutationArgs {
  filename: string;
  url: string;
  postId: number;
  mimetype?: string;
  duration?: number;
  resolution?: string;
}
