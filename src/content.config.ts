import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { LANG_CODES } from './lib/site.mjs';

// The content rules here are checked on every build. scripts/validate-content.mjs adds
// cross-file checks (numbering, verses) and prints how complete each language is.

const text = z.string().trim().min(1);

// Text in several languages. English is required; the others are added as they are written.
const multi = z
  .object({
    en: text,
    ...Object.fromEntries(LANG_CODES.filter((c) => c !== 'en').map((c) => [c, text.optional()])),
  })
  .strict();

const scriptOverrides = z
  .object({ iast: text.optional(), te: text.optional(), ta: text.optional(), kn: text.optional(), ml: text.optional(), bn: text.optional(), gu: text.optional(), or: text.optional() })
  .strict()
  .optional();

const names = defineCollection({
  loader: glob({ pattern: '*.json', base: './content/names' }),
  schema: z
    .object({
      number: z.number().int().min(1).max(1000),
      verse: z.number().int().min(1).max(183),
      slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
      devanagari: text,
      iastSplit: text,
      archana: text,
      syllables: z.array(text).default([]),
      words: z
        .array(z.object({ sa: text, meaning: multi, scriptOverrides }).strict())
        .min(1),
      meaning: multi,
      explanation: multi,
      inner: multi,
      story: multi,
      commentary: z
        .object({ sanskrit: text, translation: multi, source: text })
        .strict()
        .nullable()
        .default(null),
      sources: z.array(text).default([]),
      scriptOverrides,
      archanaOverrides: scriptOverrides,
      audio: z
        .object({ chant: text.nullable(), slow: text.nullable() })
        .strict()
        .default({ chant: null, slow: null }),
      review: z
        .object({ status: z.enum(['draft', 'reviewed']), reviewedBy: text.optional(), notes: text.optional() })
        .strict(),
    })
    .strict(),
});

export const collections = { names };
