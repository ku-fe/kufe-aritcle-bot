import { z } from 'zod';

export const ARTICLE_CATEGORIES = {
  JAVASCRIPT: {
    value: 'javascript',
    label: 'JavaScript',
  },
  TYPESCRIPT: {
    value: 'typescript',
    label: 'TypeScript',
  },
  REACT: {
    value: 'react',
    label: 'React',
  },
  NEXTJS: {
    value: 'nextjs',
    label: 'Next.js',
  },
  WEB: {
    value: 'web',
    label: 'Web',
  },
  LIBRARY: {
    value: 'library',
    label: 'Library',
  },
  FRAMEWORK: {
    value: 'framework',
    label: 'Framework',
  },
  ESSAY: {
    value: 'essay',
    label: 'Essay',
  },
  CAREER: {
    value: 'career',
    label: 'Career',
  },
  ETC: {
    value: 'etc',
    label: 'Etc',
  },
} as const;

export type CategoryKey = keyof typeof ARTICLE_CATEGORIES;
export type CategoryValue = (typeof ARTICLE_CATEGORIES)[CategoryKey]['value'];

export const categorySchema = z.object({
  value: z.enum([
    'javascript',
    'typescript',
    'react',
    'nextjs',
    'web',
    'library',
    'framework',
    'essay',
    'career',
    'etc',
  ]),
  label: z.string(),
});

export type Category = z.infer<typeof categorySchema>;

export const categoriesArraySchema = z.array(categorySchema);
