import { categorySchema } from '@/services/category/types';
import { z } from 'zod';

export const articleSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  title: z.string(),
  description: z.string().nullable(),
  image_url: z.string().url().nullable(),
  submitted_by: z.string(),
  submitted_at: z.string().datetime(),
  channel_id: z.string(),
  categories: z.array(categorySchema.shape.value),
});

export type Article = z.infer<typeof articleSchema>;

export type CreateArticleInput = Omit<Article, 'id'>;

export interface ArticleService {
  saveArticle: (article: CreateArticleInput) => Promise<Article>;
  getArticleByUrl: (url: string) => Promise<Article | null>;
  getArticlesByCategory: (category: string) => Promise<Article[]>;
} 