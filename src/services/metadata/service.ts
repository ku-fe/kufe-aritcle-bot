import { ExternalServiceError } from '@/types/errors';
import ogs from 'open-graph-scraper';
import type { ArticleMetadata, MetadataService } from './types';

export class OpenGraphMetadataService implements MetadataService {
  async scrapeMetadata(url: string): Promise<ArticleMetadata> {
    try {
      const { error, result } = await ogs({ url });

      if (error) {
        throw new ExternalServiceError(error.toString(), 'OpenGraph');
      }

      return {
        title: result.ogTitle || result.twitterTitle || 'Untitled',
        description: result.ogDescription || result.twitterDescription || null,
        imageUrl:
          result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
      };
    } catch (error) {
      throw new ExternalServiceError(
        error instanceof Error ? error.message : 'Unknown error',
        'OpenGraph',
      );
    }
  }
}

// Export singleton instance
export const metadataService = new OpenGraphMetadataService();
