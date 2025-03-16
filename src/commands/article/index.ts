import { botConfig } from '@/config/config';
import { articleService } from '@/services/article/service';
import {
  ARTICLE_CATEGORIES,
  type CategoryValue,
} from '@/services/category/types';
import { metadataService } from '@/services/metadata/service';
import { ValidationError } from '@/types/errors';
import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  ForumChannel,
  ModalBuilder,
  type ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

const MODAL_ID = 'article-submit-modal';
const URL_INPUT_ID = 'article-url';
const TAG_BUTTON_PREFIX = 'tag-button-';
const SUBMIT_BUTTON_ID = 'submit-article';

// 사용 가능한 태그 목록 생성
const AVAILABLE_TAGS = Object.entries(ARTICLE_CATEGORIES).map(
  ([key, category], index) => ({
    id: (index + 1).toString(),
    key,
    ...category,
  }),
);

export async function handleArticleCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    const selectedTags = new Set<string>();

    // 태그 선택을 위한 임베드 생성
    const embed = new EmbedBuilder()
      .setTitle('기술 아티클 태그 선택')
      .setDescription(
        '아래 버튼을 클릭하여 태그를 선택해주세요 (최대 3개)\n선택이 완료되면 "다음 " 버튼을 클릭해주세요.',
      );

    // 태그 버튼 생성
    const buttonRows: ActionRowBuilder<ButtonBuilder>[] = [];
    const buttons: ButtonBuilder[] = [];

    AVAILABLE_TAGS.forEach((tag) => {
      const button = new ButtonBuilder()
        .setCustomId(`${TAG_BUTTON_PREFIX}${tag.id}`)
        .setLabel(tag.label)
        .setStyle(ButtonStyle.Secondary);

      buttons.push(button);

      // 5개의 버튼마다 새로운 행 생성
      const isLastTag =
        AVAILABLE_TAGS.length > 0 &&
        tag.id === AVAILABLE_TAGS[AVAILABLE_TAGS.length - 1]?.id;
      if (buttons.length === 5 || isLastTag) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          buttons.splice(0, 5),
        );
        buttonRows.push(row);
      }
    });

    // 제출 버튼 추가
    const submitRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(SUBMIT_BUTTON_ID)
        .setLabel('다음')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
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
      try {
        if (
          !i.customId.startsWith(TAG_BUTTON_PREFIX) &&
          i.customId !== SUBMIT_BUTTON_ID
        )
          return;

        if (i.customId === SUBMIT_BUTTON_ID) {
          if (selectedTags.size === 0) {
            await i.reply({
              content: '최소 하나의 태그를 선택해주세요.',
              ephemeral: true,
            });
            return;
          }

          collector.stop('modal_opened');

          const selectedTagIds = Array.from(selectedTags).join(',');
          const modal = new ModalBuilder()
            .setCustomId(`${MODAL_ID}-${selectedTagIds}`)
            .setTitle('기술 아티클 공유');

          const urlInput = new TextInputBuilder()
            .setCustomId(URL_INPUT_ID)
            .setLabel('아티클 URL')
            .setPlaceholder('https://example.com/article')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const firstRow =
            new ActionRowBuilder<TextInputBuilder>().addComponents(urlInput);
          modal.addComponents(firstRow);

          await i.showModal(modal);
          return;
        }

        await i.deferUpdate();

        const tagId = i.customId.replace(TAG_BUTTON_PREFIX, '');
        const tag = AVAILABLE_TAGS.find((t) => t.id === tagId);
        if (!tag) return;

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

        AVAILABLE_TAGS.forEach((tag) => {
          const button = new ButtonBuilder()
            .setCustomId(`${TAG_BUTTON_PREFIX}${tag.id}`)
            .setLabel(tag.label)
            .setStyle(
              selectedTags.has(tag.id)
                ? ButtonStyle.Primary
                : ButtonStyle.Secondary,
            );

          newButtons.push(button);

          const isLastTag =
            AVAILABLE_TAGS.length > 0 &&
            tag.id === AVAILABLE_TAGS[AVAILABLE_TAGS.length - 1]?.id;
          if (newButtons.length === 5 || isLastTag) {
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              newButtons.splice(0, 5),
            );
            newButtonRows.push(row);
          }
        });

        // 제출 버튼 추가
        const submitRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(SUBMIT_BUTTON_ID)
            .setLabel('제출하기')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(selectedTags.size === 0),
        );

        newButtonRows.push(submitRow);

        await i.editReply({
          embeds: [embed],
          components: newButtonRows,
        });
      } catch (error) {
        console.error('Error in button interaction:', error);
      }
    });

    collector.on('end', (collected, reason) => {
      void (async () => {
        try {
          if (reason === 'time') {
            await interaction.editReply({
              content: '시간이 초과되었습니다. 다시 시도해주세요.',
              components: [],
            });
          } else if (reason === 'modal_opened') {
            await interaction.editReply({
              content: '태그 선택이 완료되었습니다.',
              components: [],
            });
          }
        } catch (error) {
          console.error('Error in collector end:', error);
        }
      })();
    });
  } catch (error) {
    console.error('Error in article command:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '명령어 처리 중 오류가 발생했습니다.',
        ephemeral: true,
      });
    }
  }
}

export async function handleArticleModalSubmit(
  interaction: ModalSubmitInteraction,
): Promise<void> {
  if (!interaction.customId.startsWith(MODAL_ID)) return;

  try {
    await interaction.deferReply({ ephemeral: true });

    const url = interaction.fields.getTextInputValue(URL_INPUT_ID);

    // URL 유효성 검사
    try {
      new URL(url);
    } catch {
      throw new ValidationError('올바른 URL을 입력해주세요.');
    }

    // 포럼 채널 확인
    const forumChannel = interaction.client.channels.cache.get(
      botConfig.forumChannelId,
    );

    if (!forumChannel || !(forumChannel instanceof ForumChannel)) {
      throw new ValidationError('포럼 채널을 찾을 수 없습니다.');
    }

    // 선택된 태그 가져오기
    const selectedTagIds = interaction.customId
      .replace(`${MODAL_ID}-`, '')
      .split(',');
    const categories = selectedTagIds
      .map((id) => AVAILABLE_TAGS.find((tag) => tag.id === id))
      .filter(
        (tag): tag is (typeof AVAILABLE_TAGS)[number] => tag !== undefined,
      );

    if (categories.length === 0) {
      throw new ValidationError('최소 하나의 태그를 선택해주세요.');
    }

    // URL 메타데이터 가져오기
    const metadata = await metadataService.scrapeMetadata(url);
    if (!metadata) {
      throw new ValidationError('URL에서 메타데이터를 가져올 수 없습니다.');
    }

    // 이미 등록된 아티클인지 확인
    const existingArticle = await articleService.getArticleByUrl(url);
    if (existingArticle) {
      throw new ValidationError('이미 등록된 아티클입니다.');
    }

    try {
      // 포럼 게시물 생성
      const thread = await forumChannel.threads.create({
        name: metadata.title || 'No Title',
        message: {
          embeds: [
            new EmbedBuilder()
              .setTitle(metadata.title || 'No Title')
              .setDescription(metadata.description || 'No Description')
              .setURL(url)
              .setImage(metadata.imageUrl || null)
              .addFields(
                { name: '제출자', value: `<@${interaction.user.id}>` },
                {
                  name: '카테고리',
                  value: categories.map((tag) => tag?.label).join(', '),
                },
              )
              .setTimestamp(),
          ],
        },
      });

      // 아티클 저장
      await articleService.saveArticle({
        url,
        title: metadata.title || 'No Title',
        description: metadata.description || 'No Description',
        image_url: metadata.imageUrl || null,
        categories: categories
          .map(
            (tag) =>
              ARTICLE_CATEGORIES[tag?.key as keyof typeof ARTICLE_CATEGORIES]
                ?.value,
          )
          .filter((value): value is CategoryValue => Boolean(value)),
        submitted_by: interaction.user.id,
        submitted_at: new Date().toISOString(),
        channel_id: forumChannel.id,
      });

      await interaction.editReply({
        content: `아티클이 성공적으로 등록되었습니다.\n스레드 링크: ${thread.url}`,
      });
    } catch (error) {
      console.error('Error creating forum thread:', error);
      throw new ValidationError('포럼 게시물 생성 중 오류가 발생했습니다.');
    }
  } catch (error) {
    console.error('Error in modal submit:', error);
    if (error instanceof ValidationError) {
      await interaction.editReply({ content: error.message });
      return;
    }
    await interaction.editReply({
      content: '아티클 등록 중 오류가 발생했습니다.',
    });
  }
}
