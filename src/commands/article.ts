import { Message } from 'discord.js';
import { scrapeArticleMetadata } from '../services/scraper';
import { saveArticle } from '../services/supabase';

export async function handleArticleCommand(message: Message, args: string[]) {
  // Check if URL is provided
  if (args.length === 0) {
    await message.reply('Please provide an article URL. Usage: !article <url>');
    return;
  }

  const url = args[0];

  try {
    // Validate URL
    new URL(url);

    // Get article metadata
    const metadata = await scrapeArticleMetadata(url);
    if (!metadata) {
      await message.reply('Failed to fetch article metadata. Please check the URL and try again.');
      return;
    }

    // Save to database
    const article = await saveArticle({
      url,
      title: metadata.title,
      description: metadata.description,
      image_url: metadata.imageUrl,
      submitted_by: message.author.id,
      submitted_at: new Date().toISOString(),
      channel_id: message.channelId,
    });

    if (!article) {
      await message.reply('Failed to save the article. Please try again later.');
      return;
    }

    // Send success message
    await message.reply({
      content: 'Article submitted successfully!',
      embeds: [{
        title: metadata.title,
        description: metadata.description || 'No description available',
        url: url,
        image: metadata.imageUrl ? { url: metadata.imageUrl } : undefined,
        footer: {
          text: `Submitted by ${message.author.tag}`,
        },
        timestamp: new Date().toISOString(),
      }],
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid URL')) {
      await message.reply('Please provide a valid URL.');
    } else {
      console.error('Error handling article command:', error);
      await message.reply('An error occurred while processing your request. Please try again later.');
    }
  }
} 