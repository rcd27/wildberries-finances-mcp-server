import axios from 'axios';

import { z } from 'zod';

export const GetDocumentCategoriesRequestSchema = z.object({
  locale: z.string().optional().default('en')
});

export type GetDocumentCategoriesRequest = z.infer<typeof GetDocumentCategoriesRequestSchema>;

export interface DocumentCategory {
  name: string;
  title: string;
}

export interface GetDocumentCategoriesResponse {
  data: {
    categories: DocumentCategory[];
  };
}

export async function getDocumentCategories(
  args: GetDocumentCategoriesRequest,
  apiKey: string
): Promise<GetDocumentCategoriesResponse> {
  const response = await axios.get('https://documents-api.wildberries.ru/api/v1/documents/categories', {
    params: {
      locale: args.locale || 'en'
    },
    headers: {
      Authorization: apiKey
    }
  });
  return response.data;
}
