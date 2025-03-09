import { ChatInputCommandInteraction, Message } from 'discord.js';
import { scrapeArticleMetadata } from '../services/scraper';
import { saveArticle } from '../services/supabase';

export async function handleArticleCommand(interaction: ChatInputCommandInteraction | Message, args: string[]) {
  // Get URL from either interaction or message
  const url = interaction instanceof ChatInputCommandInteraction
    ? interaction.options.getString('url', true)
    : args[0];

  // Check if URL is provided
  if (!url) {
    const response = 'Please provide an article URL. Usage: /article <url>';
    if (interaction instanceof ChatInputCommandInteraction) {
      await interaction.reply(response);
    } else {
      await interaction.reply(response);
    }
    return;
  }

  try {
    // Validate URL
    new URL(url);

    // For slash commands, defer the reply
    if (interaction instanceof ChatInputCommandInteraction) {
      await interaction.deferReply();
    }

    // Get article metadata
    const metadata = await scrapeArticleMetadata(url);
    if (!metadata) {
      const response = 'Failed to fetch article metadata. Please check the URL and try again.';
      if (interaction instanceof ChatInputCommandInteraction) {
        await interaction.editReply(response);
      } else {
        await interaction.reply(response);
      }
      return;
    }

    // Save to database
    const article = await saveArticle({
      url,
      title: metadata.title,
      description: metadata.description,
      image_url: metadata.imageUrl,
      submitted_by: interaction instanceof ChatInputCommandInteraction 
        ? interaction.user.id 
        : interaction.author.id,
      submitted_at: new Date().toISOString(),
      channel_id: interaction.channelId,
    });

    if (!article) {
      const response = 'Failed to save the article. Please try again later.';
      if (interaction instanceof ChatInputCommandInteraction) {
        await interaction.editReply(response);
      } else {
        await interaction.reply(response);
      }
      return;
    }

    // Send success message
    const replyOptions = {
      content: 'Article submitted successfully!',
      embeds: [{
        title: metadata.title,
        description: metadata.description || 'No description available',
        url: url,
        image: metadata.imageUrl ? { url: metadata.imageUrl } : undefined,
        footer: {
          text: `Submitted by ${interaction instanceof ChatInputCommandInteraction 
            ? interaction.user.tag 
            : interaction.author.tag}`,
        },
        timestamp: new Date().toISOString(),
      }],
    };

    if (interaction instanceof ChatInputCommandInteraction) {
      await interaction.editReply(replyOptions);
    } else {
      await interaction.reply(replyOptions);
    }

  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid URL')) {
      const response = 'Please provide a valid URL.';
      if (interaction instanceof ChatInputCommandInteraction) {
        if (interaction.deferred) {
          await interaction.editReply(response);
        } else {
          await interaction.reply(response);
        }
      } else {
        await interaction.reply(response);
      }
    } else {
      console.error('Error handling article command:', error);
      const errorMessage = 'An error occurred while processing your request. Please try again later.';
      if (interaction instanceof ChatInputCommandInteraction) {
        if (interaction.deferred) {
          await interaction.editReply(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
} 