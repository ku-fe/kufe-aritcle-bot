# KUFE Article Bot

KUFE 디스코드 서버를 위한 기술 아티클 공유 봇입니다. 사용자가 공유하고 싶은 기술 아티클의 URL을 제출하면, 봇이 자동으로 포럼 채널에 게시물을 생성합니다.

## 주요 기능

- 기술 아티클 URL 제출 및 메타데이터 자동 추출
- 카테고리 태그 시스템 (최대 3개 선택 가능)
- 포럼 채널에 자동 게시물 생성
- 중복 아티클 체크
- 디스코드 슬래시 커맨드 지원

## 설치 방법

1. 저장소 클론

```bash
git clone https://github.com/your-username/kufe-article-bot.git
cd kufe-article-bot
```

2. 의존성 설치

```bash
pnpm install
```

3. 환경 변수 설정
   `.env` 파일을 생성하고 다음 변수들을 설정합니다:

```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
FORUM_CHANNEL_ID=your_forum_channel_id
```

4. 봇 실행

```bash
# 개발 모드
pnpm dev

# 프로덕션 모드
pnpm build
pnpm start
```

## 사용 방법

1. `/article` 명령어를 입력합니다.
2. 제공된 버튼을 통해 아티클의 카테고리를 선택합니다 (최대 3개).
3. URL 입력 모달이 나타나면 공유하고 싶은 아티클의 URL을 입력합니다.
4. 봇이 자동으로 메타데이터를 추출하여 포럼 채널에 게시물을 생성합니다.

## 개발 명령어

- `pnpm dev`: 개발 모드로 실행
- `pnpm build`: TypeScript 컴파일
- `pnpm start`: 프로덕션 모드로 실행
- `pnpm deploy`: 슬래시 커맨드 배포
- `pnpm lint`: 코드 린팅
- `pnpm format`: 코드 포맷팅
