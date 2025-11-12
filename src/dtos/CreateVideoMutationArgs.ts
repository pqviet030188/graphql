export interface CreateVideoMutationArgs {
  filename: string;
  url: string;
  mimetype?: string;
  duration?: number;
  resolution?: string;
}
