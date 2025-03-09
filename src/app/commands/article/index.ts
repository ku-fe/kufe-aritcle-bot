import { 
  ActionRowBuilder,
  ChatInputCommandInteraction, 
  EmbedBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { ValidationError } from '@/types/errors';
import { articleService } from '@services/article/service';
import { metadataService } from '@services/metadata/service';
import { ARTICLE_CATEGORIES, CategoryValue } from '@services/category/types';

const MODAL_ID = 'article-submit-modal';
const URL_INPUT_ID = 'article-url';
const CATEGORIES_INPUT_ID = 'article-categories';

export async function handleArticleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId(MODAL_ID)
    .setTitle('기술 아티클 제출');

  const urlInput = new TextInputBuilder()
    .setCustomId(URL_INPUT_ID)
    .setLabel('아티클 URL')
    .setPlaceholder('https://example.com/article')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const categoriesInput = new TextInputBuilder()
    .setCustomId(CATEGORIES_INPUT_ID)
    .setLabel('카테고리 (쉼표로 구분)')
    .setPlaceholder('frontend, backend, devops')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(urlInput);
  const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(categoriesInput);

  modal.addComponents(firstRow, secondRow);

  await interaction.showModal(modal);
}

export async function handleArticleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  if (interaction.customId !== MODAL_ID) return;

  await interaction.deferReply();

  try {
    const url = interaction.fields.getTextInputValue(URL_INPUT_ID);
    const categoriesInput = interaction.fields.getTextInputValue(CATEGORIES_INPUT_ID);

    // URL 유효성 검사
    try {
      new URL(url);
    } catch {
      throw new ValidationError('올바른 URL을 입력해주세요.');
    }

    // 채널 ID 확인
    if (!interaction.channelId) {
      throw new ValidationError('채널을 찾을 수 없습니다.');
    }

    // 카테고리 처리
    const rawCategories = categoriesInput
      .split(',')
      .map(cat => cat.trim().toLowerCase())
      .filter(cat => cat.length > 0);

    // 카테고리 유효성 검사
    const categories = rawCategories.map(cat => {
      const category = Object.values(ARTICLE_CATEGORIES).find(c => 
        c.value === cat || c.label.toLowerCase() === cat
      );

      if (!category) {
        throw new ValidationError(
          `유효하지 않은 카테고리입니다: ${cat}\n사용 가능한 카테고리: ${
            Object.values(ARTICLE_CATEGORIES)
              .map(c => c.label)
              .join(', ')
          }`
        );
      }
      return category.value;
    }) as CategoryValue[];

    if (categories.length === 0) {
      throw new ValidationError('최소 하나의 카테고리를 선택해주세요.');
    }

    if (categories.length > 3) {
      throw new ValidationError('카테고리는 최대 3개까지만 선택할 수 있습니다.');
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
    console.error('아티클 제출 처리 중 오류 발생:', error);
    
    const errorMessage = error instanceof ValidationError
      ? error.message
      : '요청을 처리하는 중에 오류가 발생했습니다. 나중에 다시 시도해주세요.';

    await interaction.editReply({ content: errorMessage });
  }
} 