import { 
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction, 
  ComponentType,
  EmbedBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
  ButtonInteraction,
  ButtonComponent,
} from 'discord.js';
import { ValidationError } from '@/types/errors';
import { articleService } from '@services/article/service';
import { metadataService } from '@services/metadata/service';
import { ARTICLE_CATEGORIES } from '@services/category/types';

const MODAL_ID = 'article-submit-modal';
const URL_INPUT_ID = 'article-url';
const TAG_BUTTON_PREFIX = 'tag-button-';
const SUBMIT_BUTTON_ID = 'submit-article';

// 사용 가능한 태그 목록 생성
const AVAILABLE_TAGS = Object.entries(ARTICLE_CATEGORIES).map(([key, category], index) => ({
  id: (index + 1).toString(),
  key,
  ...category,
}));

export async function handleArticleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const selectedTags = new Set<string>();

  // 태그 선택을 위한 임베드 생성
  const embed = new EmbedBuilder()
    .setTitle('기술 아티클 태그 선택')
    .setDescription('아래 버튼을 클릭하여 태그를 선택해주세요 (최대 3개)\n선택이 완료되면 "다음 " 버튼을 클릭해주세요.');

  // 태그 버튼 생성
  const buttonRows: ActionRowBuilder<ButtonBuilder>[] = [];
  const buttons: ButtonBuilder[] = [];

  AVAILABLE_TAGS.forEach(tag => {
    const button = new ButtonBuilder()
      .setCustomId(`${TAG_BUTTON_PREFIX}${tag.id}`)
      .setLabel(`${tag.label}`)
      .setStyle(ButtonStyle.Secondary);
    
    buttons.push(button);

    // 5개의 버튼마다 새로운 행 생성
    if (buttons.length === 5 || tag.id === AVAILABLE_TAGS[AVAILABLE_TAGS.length - 1].id) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.splice(0, 5));
      buttonRows.push(row);
    }
  });

  // 제출 버튼 추가
  const submitRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(SUBMIT_BUTTON_ID)
        .setLabel('다음')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)
    );

  buttonRows.push(submitRow);

  const response = await interaction.reply({
    embeds: [embed],
    components: buttonRows,
    ephemeral: true,
  });

  // 버튼 인터랙션 수집
  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 180_000, // 3분
  });

  collector.on('collect', async (i: ButtonInteraction) => {
    if (!i.customId.startsWith(TAG_BUTTON_PREFIX) && i.customId !== SUBMIT_BUTTON_ID) return;

    if (i.customId === SUBMIT_BUTTON_ID) {
      if (selectedTags.size === 0) {
        await i.reply({
          content: '최소 하나의 태그를 선택해주세요.',
          ephemeral: true,
        });
        return;
      }

      collector.stop();

      // URL 입력 모달 표시
      const modal = new ModalBuilder()
        .setCustomId(MODAL_ID)
        .setTitle('기술 아티클 공유');

      const urlInput = new TextInputBuilder()
        .setCustomId(URL_INPUT_ID)
        .setLabel('아티클 URL')
        .setPlaceholder('https://example.com/article')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(urlInput);
      modal.addComponents(firstRow);

      await i.showModal(modal);
      return;
    }

    await i.deferUpdate();

    const tagId = i.customId.replace(TAG_BUTTON_PREFIX, '');
    const tag = AVAILABLE_TAGS.find(t => t.id === tagId);
    if (!tag) return;

    // 태그 선택 상태 업데이트
    if (selectedTags.has(tagId)) {
      selectedTags.delete(tagId);
    } else {
      if (selectedTags.size >= 3) {
        await i.followUp({
          content: '태그는 최대 3개까지만 선택할 수 있습니다.',
          ephemeral: true,
        });
        return;
      }
      selectedTags.add(tagId);
    }

    // 버튼 행 다시 생성
    const newButtonRows: ActionRowBuilder<ButtonBuilder>[] = [];
    const newButtons: ButtonBuilder[] = [];

    AVAILABLE_TAGS.forEach(tag => {
      const button = new ButtonBuilder()
        .setCustomId(`${TAG_BUTTON_PREFIX}${tag.id}`)
        .setLabel(tag.label)
        .setStyle(selectedTags.has(tag.id) ? ButtonStyle.Primary : ButtonStyle.Secondary);
      
      newButtons.push(button);

      if (newButtons.length === 5 || tag.id === AVAILABLE_TAGS[AVAILABLE_TAGS.length - 1].id) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(newButtons.splice(0, 5));
        newButtonRows.push(row);
      }
    });

    // 제출 버튼 추가
    const submitRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(SUBMIT_BUTTON_ID)
          .setLabel('제출하기')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(selectedTags.size === 0)
      );

    newButtonRows.push(submitRow);

    await i.editReply({
      embeds: [embed],
      components: newButtonRows,
    });
  });

  collector.on('end', async (_collected, reason) => {
    if (reason === 'time') {
      await interaction.editReply({
        content: '시간이 초과되었습니다. 다시 시도해주세요.',
        components: [],
      });
    }
  });
}

export async function handleArticleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  if (interaction.customId !== MODAL_ID) return;

  await interaction.deferReply();

  try {
    const url = interaction.fields.getTextInputValue(URL_INPUT_ID);

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

    // 선택된 태그 찾기
    const selectedButtons = interaction.message?.components
      ?.flatMap(row => row.components)
      .filter(component => {
        if (component instanceof ButtonComponent) {
          return component.customId?.startsWith(TAG_BUTTON_PREFIX) && 
                 component.style === ButtonStyle.Primary;
        }
        return false;
      }) ?? [];

    const categories = selectedButtons.map(button => {
      const tagId = button.customId?.replace(TAG_BUTTON_PREFIX, '');
      const tag = AVAILABLE_TAGS.find(t => t.id === tagId);
      if (!tag) {
        throw new ValidationError('유효하지 않은 태그가 선택되었습니다.');
      }
      return ARTICLE_CATEGORIES[tag.key as keyof typeof ARTICLE_CATEGORIES].value;
    });

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
            .addFields({ name: '태그', value: categoryLabels })
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

    // 태그 레이블 생성
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
          .addFields({ name: '태그', value: categoryLabels })
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