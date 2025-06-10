import axios from 'axios';

import { z } from 'zod';

export const GetDocumentListRequestSchema = z.object({
  locale: z.string().optional().default('ru'),
  beginTime: z.string().describe('RFC3339'),
  endTime: z.string().describe('RFC3339`'),
  sort: z.enum(['date', 'category']).default('category').optional(),
  order: z.enum(['desc', 'asc']).default('desc').optional(),
  category: z.string()
             .describe(
               'ID [категории документов](./financial-reports-and-accounting#tag/Dokumenty/paths/~1api~1v1~1documents~1categories/get) из поля `name`')
             .optional(),
  serviceName: z.string().describe('Уникальный ID документа').optional()
});

export type GetDocumentListRequest = z.infer<typeof GetDocumentListRequestSchema>;

export interface DocumentItem {
  serviceName: string;
  name: string;
  category: string;
  extensions: string[];
  creationTime: string;
  viewed: boolean;
}

export interface GetDocumentListResponse {
  data: {
    documents: DocumentItem[];
  };
}

export async function getDocumentList(args: GetDocumentListRequest, apiKey: string): Promise<GetDocumentListResponse> {
  const response = await axios.get('https://documents-api.wildberries.ru/api/v1/documents/list', {
    params: {
      locale: args.locale || 'en',
      beginTime: args.beginTime,
      endTime: args.endTime,
      sort: args.sort,
      order: args.order,
      category: args.category,
      serviceName: args.serviceName
    },
    headers: {
      Authorization: apiKey
    }
  });
  return response.data;
}
