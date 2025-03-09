import { z } from 'zod';

export const ARTICLE_CATEGORIES = {
  FRONTEND: {
    value: 'frontend',
    label: 'Frontend',
    description: 'Frontend development, web frameworks, and UI libraries',
  },
  BACKEND: {
    value: 'backend',
    label: 'Backend',
    description: 'Backend development, APIs, and server-side technologies',
  },
  DEVOPS: {
    value: 'devops',
    label: 'DevOps',
    description: 'DevOps, CI/CD, and infrastructure',
  },
  DATABASE: {
    value: 'database',
    label: 'Database',
    description: 'Databases, data modeling, and query optimization',
  },
  MOBILE: {
    value: 'mobile',
    label: 'Mobile',
    description: 'Mobile app development for iOS and Android',
  },
  AI_ML: {
    value: 'ai-ml',
    label: 'AI/ML',
    description: 'Artificial Intelligence and Machine Learning',
  },
  SECURITY: {
    value: 'security',
    label: 'Security',
    description: 'Security, authentication, and data protection',
  },
  ARCHITECTURE: {
    value: 'architecture',
    label: 'Architecture',
    description: 'Software architecture and system design',
  },
  CAREER: {
    value: 'career',
    label: 'Career',
    description: 'Career development and software industry insights',
  },
  OTHER: {
    value: 'other',
    label: 'Other',
    description: 'Other technical topics',
  },
} as const;

export type CategoryKey = keyof typeof ARTICLE_CATEGORIES;
export type CategoryValue = typeof ARTICLE_CATEGORIES[CategoryKey]['value'];

export const categorySchema = z.object({
  value: z.enum([
    'frontend',
    'backend',
    'devops',
    'database',
    'mobile',
    'ai-ml',
    'security',
    'architecture',
    'career',
    'other'
  ]),
  label: z.string(),
  description: z.string(),
});

export type Category = z.infer<typeof categorySchema>;

export const categoriesArraySchema = z.array(categorySchema); 