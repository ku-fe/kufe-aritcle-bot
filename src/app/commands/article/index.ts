import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { ValidationError } from '../../../types/errors';
import { articleService } from '../../../services/article/service';
import { metadataService } from '../../../services/metadata/service';

export async function handleArticleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  try {
    const url = interaction.options.getString('url', true);

    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new ValidationError('Please provide a valid URL.');
    }

    // Check if article already exists
    const existingArticle = await articleService.getArticleByUrl(url);
    if (existingArticle) {
      await interaction.editReply({
        content: 'This article has already been submitted.',
        embeds: [
          new EmbedBuilder()
            .setTitle(existingArticle.title)
            .setDescription(existingArticle.description || 'No description available')
            .setURL(existingArticle.url)
            .setImage(existingArticle.image_url || null)
            .setFooter({
              text: `Previously submitted by ${interaction.user.tag}`,
            })
            .setTimestamp(new Date(existingArticle.submitted_at)),
        ],
      });
      return;
    }

    // Get article metadata
    const metadata = await metadataService.scrapeMetadata(url);

    // Save to database
    const article = await articleService.saveArticle({
      url,
      title: metadata.title,
      description: metadata.description,
      image_url: metadata.imageUrl,
      submitted_by: interaction.user.id,
      submitted_at: new Date().toISOString(),
      channel_id: interaction.channelId,
    });

    // Send success message
    await interaction.editReply({
      content: 'Article submitted successfully!',
      embeds: [
        new EmbedBuilder()
          .setTitle(article.title)
          .setDescription(article.description || 'No description available')
          .setURL(article.url)
          .setImage(article.image_url || null)
          .setFooter({
            text: `Submitted by ${interaction.user.tag}`,
          })
          .setTimestamp(new Date(article.submitted_at)),
      ],
    });
  } catch (error) {
    console.error('Error handling article command:', error);
    
    const errorMessage = error instanceof ValidationError
      ? error.message
      : 'An error occurred while processing your request. Please try again later.';

    if (interaction.deferred) {
      await interaction.editReply({ content: errorMessage });
    } else {
      await interaction.reply({ content: errorMessage });
    }
  }
} 