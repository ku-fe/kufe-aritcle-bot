import ogs from 'open-graph-scraper';

export interface ArticleMetadata {
  title: string;
  description: string | null;
  imageUrl: string | null;
}

export async function scrapeArticleMetadata(url: string): Promise<ArticleMetadata | null> {
  try {
    const { result } = await ogs({ url });
    
    return {
      title: result.ogTitle || result.twitterTitle || '',
      description: result.ogDescription || result.twitterDescription || null,
      imageUrl: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
    };
  } catch (error) {
    console.error('Error scraping metadata:', error);
    return null;
  }
} 