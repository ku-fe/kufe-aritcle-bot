import { z } from 'zod';

export const metadataSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
});

export type ArticleMetadata = z.infer<typeof metadataSchema>;

export interface MetadataService {
  scrapeMetadata: (url: string) => Promise<ArticleMetadata>;
}
