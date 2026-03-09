import { z } from 'zod';
import { insertMessageSchema, conversations, messages } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  conversations: {
    list: {
      method: 'GET' as const,
      path: '/api/conversations',
      responses: {
        200: z.array(z.custom<typeof conversations.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/conversations/:id',
      responses: {
        200: z.object({
            id: z.number(),
            title: z.string(),
            createdAt: z.string().or(z.date()),
            messages: z.array(z.custom<typeof messages.$inferSelect>())
        }),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/conversations',
      input: z.object({ title: z.string().optional() }),
      responses: {
        201: z.custom<typeof conversations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/conversations/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    messages: {
        create: {
            method: 'POST' as const,
            path: '/api/conversations/:id/messages',
            input: z.object({
              content: z.string(),
              attachments: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  mimeType: z.string(),
                  type: z.enum(["image", "pdf", "text"]),
                  dataUrl: z.string().optional(),
                  extractedText: z.string().optional(),
                })
              ).optional()
            }),
            // Streaming response, but we define successful init here
            responses: {
                200: z.void() 
            }
        }
    }
  },
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type ConversationResponse = z.infer<typeof api.conversations.list.responses[200]>[0];
export type ConversationDetailResponse = z.infer<typeof api.conversations.get.responses[200]>;
