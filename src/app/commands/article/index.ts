import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { ValidationError } from '@/types/errors';
import { articleService } from '@services/article/service';
import { metadataService } from '@services/metadata/service';
import { ARTICLE_CATEGORIES, CategoryValue } from '@services/category/types';

export async function handleArticleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  try {
    const url = interaction.options.getString('url', true);

    // URL 유효성 검사
    try {
      new URL(url);
    } catch {
      throw new ValidationError('올바른 URL을 입력해주세요.');
    }

    // 카테고리 가져오기 (중복 제거 및 null 제거)
    const rawCategories = [
      interaction.options.getString('category1', true),
      interaction.options.getString('category2', false),
      interaction.options.getString('category3', false),
    ].filter((category, index, self) => 
      category !== null && self.indexOf(category) === index
    );

    // 카테고리 유효성 검사
    const categories = rawCategories.map(cat => {
      if (!Object.values(ARTICLE_CATEGORIES).some(c => c.value === cat)) {
        throw new ValidationError(`유효하지 않은 카테고리입니다: ${cat}`);
      }
      return cat;
    }) as CategoryValue[];

    if (categories.length === 0) {
      throw new ValidationError('최소 하나의 카테고리를 선택해주세요.');
    }

    // 아티클 중복 확인
    const existingArticle = await articleService.getArticleByUrl(url);
    if (existingArticle) {
      const categoryLabels = existingArticle.categories
        .map(cat => ARTICLE_CATEGORIES[cat.toUpperCase() as keyof typeof ARTICLE_CATEGORIES]?.label || cat)
        .join(', ');

      await interaction.editReply({
        content: '이미 등록된 아티클입니다.',
        embeds: [
          new EmbedBuilder()
            .setTitle(existingArticle.title)
            .setDescription(existingArticle.description || '설명 없음')
            .setURL(existingArticle.url)
            .setImage(existingArticle.image_url || null)
            .addFields({ name: '카테고리', value: categoryLabels })
            .setFooter({
              text: `이전 등록자: ${interaction.user.tag}`,
            })
            .setTimestamp(new Date(existingArticle.submitted_at)),
        ],
      });
      return;
    }

    // 아티클 메타데이터 가져오기
    const metadata = await metadataService.scrapeMetadata(url);

    // 데이터베이스에 저장
    const article = await articleService.saveArticle({
      url,
      title: metadata.title,
      description: metadata.description,
      image_url: metadata.imageUrl,
      submitted_by: interaction.user.id,
      submitted_at: new Date().toISOString(),
      channel_id: interaction.channelId,
      categories,
    });

    // 카테고리 레이블 생성
    const categoryLabels = categories
      .map(cat => ARTICLE_CATEGORIES[cat.toUpperCase() as keyof typeof ARTICLE_CATEGORIES]?.label || cat)
      .join(', ');

    // 성공 메시지 전송
    await interaction.editReply({
      content: '아티클이 성공적으로 등록되었습니다!',
      embeds: [
        new EmbedBuilder()
          .setTitle(article.title)
          .setDescription(article.description || '설명 없음')
          .setURL(article.url)
          .setImage(article.image_url || null)
          .addFields({ name: '카테고리', value: categoryLabels })
          .setFooter({
            text: `등록자: ${interaction.user.tag}`,
          })
          .setTimestamp(new Date(article.submitted_at)),
      ],
    });
  } catch (error) {
    console.error('아티클 명령어 처리 중 오류 발생:', error);
    
    const errorMessage = error instanceof ValidationError
      ? error.message
      : '요청을 처리하는 중에 오류가 발생했습니다. 나중에 다시 시도해주세요.';

    if (interaction.deferred) {
      await interaction.editReply({ content: errorMessage });
    } else {
      await interaction.reply({ content: errorMessage });
    }
  }
} 