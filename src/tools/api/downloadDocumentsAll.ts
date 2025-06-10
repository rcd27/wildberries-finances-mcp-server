import axios from 'axios';

import { z } from 'zod';

export const DownloadDocumentParamSchema = z.object({
  serviceName: z.string().describe('Уникальный ID документа'),
  extension: z.string().describe('Формат документа'),
});

export const DownloadDocumentsAllRequestSchema = z.object({
  params: z.array(DownloadDocumentParamSchema)
});

export type DownloadDocumentsAllRequest = z.infer<typeof DownloadDocumentsAllRequestSchema>;

export interface DownloadDocumentsAllResponse {
  data: {
    fileName: string;
    extension: string;
    document: string; // base64 encoded document
  };
}

export async function downloadDocumentsAll(args: DownloadDocumentsAllRequest, apiKey: string): Promise<DownloadDocumentsAllResponse> {
  const response = await axios.post('https://documents-api.wildberries.ru/api/v1/documents/download/all', args, {
    headers: {
      Authorization: apiKey
    }
  });
  return response.data;
}
