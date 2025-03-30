# KUFE Article Bot

KUFE 디스코드 서버를 위한 기술 아티클 공유 봇입니다. 사용자가 포럼 채널에 기술 아티클을 공유하면, 봇이 자동으로 메타데이터를 추출하고 Supabase에 저장합니다.

## 주요 기능

- 포럼 채널에 자동 게시물 생성
- 기술 아티클 URL 메타데이터 자동 추출
- 포럼 태그 기반 카테고리 자동 분류
- 중복 아티클 체크
- 자동 아카이브 기능

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

1. 지정된 포럼 채널에서 새 게시물을 작성합니다.
2. 게시물 내용에 공유하고 싶은 아티클의 URL을 포함합니다.
3. 적절한 태그를 선택합니다 (최대 3개).
4. 봇이 자동으로 메타데이터를 추출하고 저장합니다.

## 포럼 태그 매핑

- Frontend, Backend, DevOps, Mobile → Web
- AI, Blockchain, Security → Etc
- Architecture → Framework
- Database, Testing → Library
- Career → Career
- Other → Etc

## 개발 명령어

- `pnpm dev`: 개발 모드로 실행
- `pnpm build`: TypeScript 컴파일
- `pnpm start`: 프로덕션 모드로 실행
- `pnpm lint`: 코드 린팅
- `pnpm format`: 코드 포맷팅
