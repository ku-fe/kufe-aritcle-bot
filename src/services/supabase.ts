import { createClient } from '@supabase/supabase-js';
import { env } from '../config/config';

// Define database types
export interface Article {
  id: string;
  url: string;
  title: string;
  description: string | null;
  image_url: string | null;
  submitted_by: string;
  submitted_at: string;
  channel_id: string;
}

// Create Supabase client
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

// Article-related functions
export async function saveArticle(article: Omit<Article, 'id'>): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .insert([article])
    .select()
    .single();

  if (error) {
    console.error('Error saving article:', error);
    return null;
  }

  return data;
} 