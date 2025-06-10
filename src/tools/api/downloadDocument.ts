import axios, { AxiosError } from 'axios';
import { z } from 'zod';

// Request schema
export const DocumentDownloadRequestSchema = z.object({
  serviceName: z.string().describe('Уникальный ID документа'),
  extension: z.string().describe('Формат документа (например: zip, pdf, xlsx)')
});

// Response schema
export const DocumentDownloadResponseSchema = z.object({
  data: z.object({
    fileName: z.string().describe('Название документа'),
    extension: z.string().describe('Формат документа'),
    document: z.string().describe('Документ в кодировке base64')
  })
});

// Error response schemas
export const DocumentDownloadErrorSchema = z.object({
  title: z.string().describe('Заголовок ошибки'),
  status: z.number().describe('HTTP статус-код'),
  detail: z.string().describe('Детализация ошибки'),
  requestId: z.string().describe('Уникальный ID запроса'),
  origin: z.string().describe('ID внутреннего сервиса WB')
});

// Types
export type DocumentDownloadRequest = z.infer<typeof DocumentDownloadRequestSchema>;
export type DocumentDownloadResponse = z.infer<typeof DocumentDownloadResponseSchema>;
export type DocumentDownloadError = z.infer<typeof DocumentDownloadErrorSchema>;

/**
 * Загружает документ из списка документов продавца Wildberries
 * @param input - Параметры запроса (serviceName и extension)
 * @param apiKey - API ключ продавца
 * @returns Promise с данными документа в base64
 * @throws Error при ошибках запроса или валидации
 */
export async function downloadDocument(
  input: DocumentDownloadRequest,
  apiKey: string
): Promise<DocumentDownloadResponse> {
  try {
    // Валидация входных параметров
    const validatedInput = DocumentDownloadRequestSchema.parse(input);

    const response = await axios.get('https://documents-api.wildberries.ru/api/v1/documents/download', {
      params: {
        serviceName: validatedInput.serviceName,
        extension: validatedInput.extension
      },
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 секунд таймаут для больших файлов
    });

    // Валидация ответа
    return DocumentDownloadResponseSchema.parse(response.data);

  } catch (error) {
    if (error instanceof AxiosError) {
      // Обработка HTTP ошибок
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        throw new Error(`Неправильный запрос: ${errorData.detail || 'serviceName and extension are required'}`);
      }
      
      if (error.response?.status === 401) {
        throw new Error('Пользователь не авторизован. Проверьте API ключ.');
      }
      
      if (error.response?.status === 429) {
        throw new Error('Превышен лимит запросов. Максимум 1 запрос в 10 секунд.');
      }
      
      throw new Error(`HTTP ошибка ${error.response?.status}: ${error.message}`);
    }
    
    // Обработка ошибок валидации Zod
    if (error instanceof z.ZodError) {
      throw new Error(`Ошибка валидации: ${error.errors.map(e => e.message).join(', ')}`);
    }
    
    // Прочие ошибки
    throw error;
  }
}

/**
 * Декодирует base64 документ в Buffer
 * @param base64Document - Документ в кодировке base64
 * @returns Buffer с данными файла
 */
export function decodeDocumentBase64(base64Document: string): Buffer {
  try {
    return Buffer.from(base64Document, 'base64');
  } catch (error) {
    throw new Error('Ошибка декодирования base64 документа');
  }
}

/**
 * Сохраняет документ в файл
 * @param documentResponse - Ответ от API с документом
 * @param outputPath - Путь для сохранения файла (опционально, по умолчанию используется fileName из ответа)
 * @returns Promise<string> - Путь к сохраненному файлу
 */
export async function saveDocumentToFile(
  documentResponse: DocumentDownloadResponse,
  outputPath?: string
): Promise<string> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const fileName = outputPath || documentResponse.data.fileName;
  const fileBuffer = decodeDocumentBase64(documentResponse.data.document);
  
  await fs.writeFile(fileName, fileBuffer);
  
  return path.resolve(fileName);
}

/**
 * Вспомогательная функция для получения и сохранения документа одним вызовом
 * @param serviceName - ID документа
 * @param extension - Формат документа
 * @param apiKey - API ключ
 * @param outputPath - Путь для сохранения (опционально)
 * @returns Promise<string> - Путь к сохраненному файлу
 */
export async function downloadAndSaveDocument(
  serviceName: string,
  extension: string,
  apiKey: string,
  outputPath?: string
): Promise<string> {
  const documentResponse = await downloadDocument(
    { serviceName, extension },
    apiKey
  );
  
  return await saveDocumentToFile(documentResponse, outputPath);
}

// Пример использования (закомментирован)
/*
async function example() {
  try {
    const apiKey = 'your-api-key';
    
    // Загрузка документа
    const document = await _downloadDocument({
      serviceName: 'redeem-notification-44841941',
      extension: 'zip'
    }, apiKey);
    
    console.log('Документ загружен:', document.data.fileName);
    
    // Сохранение в файл
    const filePath = await saveDocumentToFile(document);
    console.log('Файл сохранен:', filePath);
    
    // Или одним вызовом
    const savedPath = await downloadAndSaveDocument(
      'redeem-notification-44841941',
      'zip',
      apiKey,
      './downloads/document.zip'
    );
    console.log('Документ сохранен:', savedPath);
    
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}
*/
