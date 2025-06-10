#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Поддержка загрузки .env файла для переменных окружения
import dotenv from 'dotenv';
import { calculateReportMetrics } from './tools/custom/calculateReportMetrics.js';
import { getSalesReport, SalesReportRequest, SalesReportRequestSchema } from './tools/api/getReportDetailByPeriod.js';
import { downloadDocument, DocumentDownloadRequestSchema } from './tools/api/downloadDocument.js';
import { downloadDocumentsAll, DownloadDocumentsAllRequestSchema } from './tools/api/downloadDocumentsAll.js';
import { getDocumentCategories, GetDocumentCategoriesRequestSchema } from './tools/api/getDocumentCategories.js';
import { getDocumentList, GetDocumentListRequestSchema } from './tools/api/getDocumentList.js';
import { calcCommissionAndNds } from './tools/custom/calcCommissionAndNds.js';
import { generateWeeklyReport, GenerateWeeklyReportRequestSchema } from './tools/custom/generateWeeklyReport.js';

dotenv.config();

// Функция для получения apiKey из переменных окружения или аргументов командной строки
function getApiKey() {
  if (process.env.WB_FINANCES_OAUTH_TOKEN) {
    return process.env.WB_FINANCES_OAUTH_TOKEN;
  }
  const argApiKey = process.argv.find(arg => arg.startsWith('--apiKey='));
  if (argApiKey) {
    return argApiKey.split('=')[1];
  }
  return undefined;
}

type MCPResponse = {content: any[], isError: boolean}

async function withApiKey(block: (apiKey: string) => Promise<MCPResponse>): Promise<MCPResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      content: [{ type: 'text', text: 'API key is required. Please set WB_FINANCES_OAUTH_TOKEN environment variable or provide --apiKey argument.' }],
      isError: true
    };
  } else {
    return block(apiKey);
  }
}

const server = new McpServer(
  {
    name: 'wb-finances-mcp',
    version: '0.0.1'
  },
  {
    capabilities: { logging: {} }
  }
);

server.registerTool(
  'getReportDetailByPeriod',
  {
    description: 'Метод предоставляет детализации к [еженедельным отчётам реализации](https://seller.wildberries.ru/suppliers-mutual-settlements/reports-implementations/reports-weekly-new).\n' +
                 '\n' +
                 'Данные доступны с 29 января 2024 года.\n' +
                 '\n' +
                 '> **Важно!**  \n' +
                 '> Вы можете выгрузить данные в [Google Таблицы](https://dev.wildberries.ru/ru/cases/1)\n' +
                 '\n' +
                 '> **Ограничение:**  \n' +
                 '> Максимум 1 запрос в [минуту](/openapi/api-information#tag/Vvedenie/Limity-zaprosov) на один аккаунт продавца',
    inputSchema: SalesReportRequestSchema.shape
  },
  async (args: SalesReportRequest, _): Promise<MCPResponse> => {
    return withApiKey(async (apiKey: string): Promise<MCPResponse> => {
      const report = await getSalesReport(args, apiKey);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ items: report })
          }
        ],
        isError: false
      };
    });
  }
);

server.registerTool(
  'getTotalCommissionByPeriod',
  {
    description: 'Подсчёт отчислений в пользу WB + НДС за период',
    inputSchema: SalesReportRequestSchema.shape
  },
  async (args: SalesReportRequest, _): Promise<MCPResponse> => {
    return withApiKey(async (apiKey: string): Promise<MCPResponse> => {
      const report = await getSalesReport(args, apiKey);
      const commission = calcCommissionAndNds(report);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ totalCommission: commission })
          }
        ],
        isError: false
      };
    });
  }
);

server.registerTool(
  'getDocumentCategories',
  {
    description: 'Метод предоставляет категории документов для получения списка документов продавца',
    inputSchema: GetDocumentCategoriesRequestSchema.shape
  },
  async (args, _): Promise<MCPResponse> => {
    return withApiKey(async (apiKey: string): Promise<MCPResponse> => {
      const categories = await getDocumentCategories(args, apiKey);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(categories)
          }
        ],
        isError: false
      };
    });
  }
);

server.registerTool(
  'getDocumentList',
  {
    description: 'Метод предоставляет список документов продавца',
    inputSchema: GetDocumentListRequestSchema.shape
  },
  async (args, _): Promise<MCPResponse> => {
    return withApiKey(async (apiKey: string): Promise<MCPResponse> => {
      const documents = await getDocumentList(args, apiKey);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(documents)
          }
        ],
        isError: false
      };
    });
  }
);

server.registerTool(
  'downloadDocument',
  {
    description: 'Метод загружает один документ из списка документов продавца',
    inputSchema: DocumentDownloadRequestSchema.shape
  },
  async (args, _): Promise<MCPResponse> => {
    return withApiKey(async (apiKey: string): Promise<MCPResponse> => {
      const document = await downloadDocument(args, apiKey);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(document)
          }
        ],
        isError: false
      };
    });
  }
);

server.registerTool(
  'downloadDocumentsAll',
  {
    description: 'Метод загружает несколько документов из списка документов продавца',
    inputSchema: DownloadDocumentsAllRequestSchema.shape
  },
  async (args, _): Promise<MCPResponse> => {
    return withApiKey(async (apiKey: string): Promise<MCPResponse> => {
      const documents = await downloadDocumentsAll(args, apiKey);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(documents)
          }
        ],
        isError: false
      };
    });
  }
);

server.registerTool(
  'generateWeeklyReport',
  {
    description: 'Еженедельный отчёт по продажам и комиссиям',
    inputSchema: GenerateWeeklyReportRequestSchema.shape
  },
  async (args, _): Promise<MCPResponse> => {
    return withApiKey(async (apiKey: string): Promise<MCPResponse> => {
      const report = await generateWeeklyReport(args, apiKey);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(report)
          }
        ],
        isError: false
      };
    });
  }
);

server.registerTool(
  'calculateReportMetrics',
  {
    description: 'Вычисляет основные метрики по отчёту',
    inputSchema: GenerateWeeklyReportRequestSchema.shape
  },
  async (args, _): Promise<MCPResponse> => {
    return withApiKey(async (apiKey: string): Promise<MCPResponse> => {
      const report = await getSalesReport(args, apiKey);
      const result = calculateReportMetrics(report);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result)
          }
        ],
        isError: false
      };
    });
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('WB Finances MCP Server Running');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
