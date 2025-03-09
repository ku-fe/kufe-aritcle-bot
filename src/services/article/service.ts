import { supabase } from '@/infrastructure/supabase/client';
import { DatabaseError } from '@/types/errors';
import { Article, ArticleService, CreateArticleInput } from './types';

export class SupabaseArticleService implements ArticleService {
  async saveArticle(article: CreateArticleInput): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .insert([article])
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to save article: ${error.message}`);
    }

    return data;
  }

  async getArticleByUrl(url: string): Promise<Article | null> {
    const { data, error } = await supabase
      .from('articles')
      .select()
      .eq('url', url)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new DatabaseError(`Failed to get article: ${error.message}`);
    }

    return data;
  }

  async getArticlesByCategory(category: string): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select()
      .contains('categories', [category])
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to get articles by category: ${error.message}`);
    }

    return data;
  }
}

// Export singleton instance
export const articleService = new SupabaseArticleService(); 