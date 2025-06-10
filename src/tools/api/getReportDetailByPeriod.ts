import axios, { AxiosError } from 'axios';
import { calculateReportMetrics } from '../custom/calculateReportMetrics.js';
import { z } from 'zod';

// Request schema
export const SalesReportRequestSchema = z.object({
  dateFrom: z.string().describe('Начальная дата отчёта в формате RFC3339 (например: 2024-01-01 или 2024-01-01T00:00:00)'),
  dateTo: z.string().describe('Конечная дата отчёта в формате date (например: 2024-01-31)'),
  limit: z.number().min(1).max(100000).default(100000).optional().describe('Максимальное количество строк ответа (не более 100000)'),
  rrdid: z.number().min(0).optional().describe('Уникальный ID строки отчёта для пагинации (начинать с 0)')
});

// Response item schema
export const DetailReportItemSchema = z.object({
  realizationreport_id: z.number().describe('Номер отчёта'),
  date_from: z.string().describe('Дата начала отчётного периода'),
  date_to: z.string().describe('Дата конца отчётного периода'),
  create_dt: z.string().describe('Дата формирования отчёта'),
  currency_name: z.string().describe('Валюта отчёта'),
  suppliercontract_code: z.any().nullable().describe('Договор'),
  rrd_id: z.number().describe('Номер строки'),
  gi_id: z.number().describe('Номер поставки'),
  dlv_prc: z.number().describe('Фиксированный коэффициент склада по поставке'),
  fix_tariff_date_from: z.string().describe('Дата начала действия фиксации'),
  fix_tariff_date_to: z.string().describe('Дата окончания действия фиксации'),
  subject_name: z.string().describe('Предмет'),
  nm_id: z.number().describe('Артикул WB'),
  brand_name: z.string().describe('Бренд'),
  sa_name: z.string().describe('Артикул продавца'),
  ts_name: z.string().describe('Размер'),
  barcode: z.string().describe('Баркод'),
  doc_type_name: z.string().describe('Тип документа'),
  quantity: z.number().describe('Количество'),
  retail_price: z.number().describe('Цена розничная'),
  retail_amount: z.number().describe('Вайлдберриз реализовал Товар (Пр)'),
  sale_percent: z.number().describe('Согласованная скидка, %'),
  commission_percent: z.number().describe('Размер кВВ, %'),
  office_name: z.string().describe('Склад'),
  supplier_oper_name: z.string().describe('Обоснование для оплаты'),
  order_dt: z.string().describe('Дата заказа'),
  sale_dt: z.string().describe('Дата продажи'),
  rr_dt: z.string().describe('Дата операции'),
  shk_id: z.number().describe('Штрихкод'),
  retail_price_withdisc_rub: z.number().describe('Цена розничная с учетом согласованной скидки'),
  delivery_amount: z.number().describe('Количество доставок'),
  return_amount: z.number().describe('Количество возврата'),
  delivery_rub: z.number().describe('Услуги по доставке товара покупателю'),
  gi_box_type_name: z.string().describe('Тип коробов'),
  product_discount_for_report: z.number().describe('Согласованный продуктовый дисконт, %'),
  supplier_promo: z.number().describe('Промокод'),
  rid: z.number().describe('Уникальный ID заказа'),
  ppvz_spp_prc: z.number().describe('Скидка WB, %'),
  ppvz_kvw_prc_base: z.number().describe('Размер кВВ без НДС, % базовый'),
  ppvz_kvw_prc: z.number().describe('Итоговый кВВ без НДС, %'),
  sup_rating_prc_up: z.number().optional().describe('Размер снижения кВВ из-за рейтинга, %'),
  is_kgvp_v2: z.number().optional().describe('Размер снижения кВВ из-за акции, %'),
  ppvz_sales_commission: z.number().describe('Вознаграждение с продаж до вычета услуг поверенного, без НДС'),
  ppvz_for_pay: z.number().describe('К перечислению продавцу за реализованный товар'),
  ppvz_reward: z.number().describe('Возмещение за выдачу и возврат товаров на ПВЗ'),
  acquiring_fee: z.number().describe('Эквайринг/Комиссии за организацию платежей'),
  acquiring_percent: z.number().describe('Размер комиссии за эквайринг/Комиссии за организацию платежей, %'),
  payment_processing: z.string().describe('Тип платежа за Эквайринг/Комиссии за организацию платежей'),
  acquiring_bank: z.string().describe('Наименование банка-эквайера'),
  ppvz_vw: z.number().describe('Вознаграждение Вайлдберриз (ВВ), без НДС'),
  ppvz_vw_nds: z.number().describe('НДС с вознаграждения WB'),
  ppvz_office_name: z.string().describe('Наименование офиса доставки'),
  ppvz_office_id: z.number().describe('Номер офиса'),
  ppvz_supplier_id: z.number().describe('Номер партнёра'),
  ppvz_supplier_name: z.string().describe('Наименование партнёра'),
  ppvz_inn: z.string().describe('ИНН партнёра'),
  declaration_number: z.string().describe('Номер таможенной декларации'),
  bonus_type_name: z.string().optional().describe('Виды логистики, штрафов и доплат'),
  sticker_id: z.string().describe('Цифровое значение стикера'),
  site_country: z.string().describe('Страна продажи'),
  srv_dbs: z.boolean().describe('Признак услуги платной доставки'),
  penalty: z.number().describe('Общая сумма штрафов'),
  additional_payment: z.number().describe('Доплаты'),
  rebill_logistic_cost: z.number().describe('Возмещение издержек по перевозке/по складским операциям с товаром'),
  rebill_logistic_org: z.string().optional().describe('Организатор перевозки'),
  storage_fee: z.number().optional().describe('Стоимость хранения'),
  deduction: z.number().optional().describe('Прочие удержания/выплаты'),
  acceptance: z.number().optional().describe('Стоимость платной приёмки'),
  assembly_id: z.number().optional().describe('Номер сборочного задания'),
  kiz: z.string().optional().describe('Код маркировки'),
  srid: z.string().describe('Уникальный ID заказа'),
  report_type: z.number().describe('Тип отчёта: 1 — стандартный, 2 — для уведомления о выкупе'),
  is_legal_entity: z.boolean().describe('Признак B2B-продажи'),
  trbx_id: z.string().optional().describe('Номер короба для платной приёмки'),
  installment_cofinancing_amount: z.number().optional().describe('Скидка по программе софинансирования'),
  wibes_wb_discount_percent: z.number().optional().describe('Скидка Wibes, %')
});

// Response schema
export const SalesReportResponseSchema = z.array(DetailReportItemSchema);

// Error response schemas
export const SalesReportErrorSchema = z.union([
  z.object({
    errors: z.array(z.string()).describe('Массив ошибок')
  }),
  z.object({
    errors: z.string().describe('Строка с ошибкой')
  })
]);

export const AuthErrorSchema = z.object({
  title: z.string().describe('Заголовок ошибки'),
  detail: z.string().describe('Детали ошибки'),
  code: z.string().describe('Внутренний код ошибки'),
  requestId: z.string().describe('Уникальный ID запроса'),
  origin: z.string().describe('ID внутреннего сервиса WB'),
  status: z.number().describe('HTTP статус-код'),
  statusText: z.string().describe('Расшифровка HTTP статус-кода'),
  timestamp: z.string().describe('Дата и время запроса')
});

// Types
export type SalesReportRequest = z.infer<typeof SalesReportRequestSchema>;
export type SalesReportResponse = z.infer<typeof SalesReportResponseSchema>;
export type DetailReportItem = z.infer<typeof DetailReportItemSchema>;
export type SalesReportError = z.infer<typeof SalesReportErrorSchema>;
export type AuthError = z.infer<typeof AuthErrorSchema>;

/**
 * Получает отчёт о продажах по реализации из API Wildberries
 * @param input - Параметры запроса (dateFrom, dateTo, limit, rrdid)
 * @param apiKey - API ключ продавца
 * @returns Promise с массивом данных отчёта
 * @throws Error при ошибках запроса или валидации
 */
export async function getSalesReport(
  input: SalesReportRequest,
  apiKey: string
): Promise<SalesReportResponse> {
  try {
    // Валидация входных параметров
    const validatedInput = SalesReportRequestSchema.parse(input);

    const params: Record<string, any> = {
      dateFrom: validatedInput.dateFrom,
      dateTo: validatedInput.dateTo
    };

    // Добавляем опциональные параметры только если они заданы
    if (validatedInput.limit !== undefined) {
      params.limit = validatedInput.limit;
    }
    if (validatedInput.rrdid !== undefined) {
      params.rrdid = validatedInput.rrdid;
    }

    const response = await axios.get('https://statistics-api.wildberries.ru/api/v5/supplier/reportDetailByPeriod', {
      params,
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 секунд таймаут для больших отчётов
    });

    // Валидация ответа
    return SalesReportResponseSchema.parse(response.data);

  } catch (error) {
    if (error instanceof AxiosError) {
      // Обработка HTTP ошибок
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (Array.isArray(errorData.errors)) {
          throw new Error(`Неправильный запрос: ${errorData.errors.join(', ')}`);
        } else if (typeof errorData.errors === 'string') {
          throw new Error(`Неправильный запрос: ${errorData.errors}`);
        } else {
          throw new Error('Неправильный запрос. Проверьте параметры dateFrom и dateTo.');
        }
      }

      if (error.response?.status === 401) {
        throw new Error('Пользователь не авторизован. Проверьте API ключ.');
      }

      if (error.response?.status === 429) {
        throw new Error('Превышен лимит запросов. Максимум 1 запрос в минуту.');
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
 * Получает полный отчёт с автоматической пагинацией
 * @param input - Параметры запроса (dateFrom, dateTo, limit)
 * @param apiKey - API ключ продавца
 * @param onProgress - Callback для отслеживания прогресса (опционально)
 * @returns Promise с полным массивом данных отчёта
 */
export async function getFullSalesReport(
  input: Omit<SalesReportRequest, 'rrdid'>,
  apiKey: string,
  onProgress?: (loadedCount: number, lastRrdId: number) => void
): Promise<SalesReportResponse> {
  const allData: DetailReportItem[] = [];
  let rrdid = 0;
  let hasMoreData = true;

  while (hasMoreData) {
    const batch = await getSalesReport(
      { ...input, rrdid },
      apiKey
    );

    if (batch.length === 0) {
      hasMoreData = false;
    } else {
      allData.push(...batch);
      rrdid = batch[batch.length - 1].rrd_id;

      if (onProgress) {
        onProgress(allData.length, rrdid);
      }

      // Пауза между запросами для соблюдения лимитов (1 запрос в минуту)
      if (hasMoreData) {
        await new Promise(resolve => setTimeout(resolve, 61000)); // 61 секунда
      }
    }
  }

  return allData;
}

/**
 * Сохраняет отчёт в CSV файл
 * @param reportData - Данные отчёта
 * @param fileName - Имя файла (по умолчанию генерируется автоматически)
 * @returns Promise<string> - Путь к сохраненному файлу
 */
export async function saveSalesReportToCSV(
  reportData: SalesReportResponse,
  fileName?: string
): Promise<string> {
  const fs = await import('fs/promises');
  const path = await import('path');

  if (reportData.length === 0) {
    throw new Error('Нет данных для сохранения');
  }

  const defaultFileName = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
  const outputFileName = fileName || defaultFileName;

  // Получаем заголовки из первой записи
  const headers = Object.keys(reportData[0]);

  // Создаем CSV содержимое
  const csvRows = [
    headers.join(','), // Заголовки
    ...reportData.map(row =>
      headers.map(header => {
        const value = (row as any)[header];
        // Экранируем значения, содержащие запятые или кавычки
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ];

  const csvContent = csvRows.join('\n');

  await fs.writeFile(outputFileName, csvContent, 'utf8');

  return path.resolve(outputFileName);
}

/**
 * Группирует отчёт по артикулу WB
 * @param reportData - Данные отчёта
 * @returns Объект с группировкой по nm_id
 */
export function groupReportByArticle(reportData: SalesReportResponse): Record<number, DetailReportItem[]> {
  return reportData.reduce((groups, item) => {
    const nmId = item.nm_id;
    if (!groups[nmId]) {
      groups[nmId] = [];
    }
    groups[nmId].push(item);
    return groups;
  }, {} as Record<number, DetailReportItem[]>);
}

/**
 * Вспомогательная функция для получения и сохранения отчёта одним вызовом
 * @param dateFrom - Начальная дата
 * @param dateTo - Конечная дата
 * @param apiKey - API ключ
 * @param fileName - Имя файла для сохранения (опционально)
 * @param includeFullReport - Получать ли полный отчёт с пагинацией
 * @returns Promise<{reportData, filePath, metrics}> - Данные отчёта, путь к файлу и метрики
 */
export async function getSalesReportAndSave(
  dateFrom: string,
  dateTo: string,
  apiKey: string,
  fileName?: string,
  includeFullReport = false
): Promise<{
  reportData: SalesReportResponse;
  filePath: string;
  metrics: ReturnType<typeof calculateReportMetrics>;
}> {
  const reportData = includeFullReport
                     ? await getFullSalesReport({ dateFrom, dateTo }, apiKey)
                     : await getSalesReport({ dateFrom, dateTo }, apiKey);

  const filePath = await saveSalesReportToCSV(reportData, fileName);
  const metrics = calculateReportMetrics(reportData);

  return {
    reportData,
    filePath,
    metrics
  };
}

// Пример использования (закомментирован)
/*
 async function example() {
 try {
 const apiKey = 'your-api-key';

 // Получение отчёта за период
 const report = await getSalesReport({
 dateFrom: '2024-01-01',
 dateTo: '2024-01-31',
 limit: 1000
 }, apiKey);

 console.log(`Получено ${report.length} записей`);

 // Получение полного отчёта с пагинацией
 const fullReport = await getFullSalesReport({
 dateFrom: '2024-01-01',
 dateTo: '2024-01-31'
 }, apiKey, (loadedCount, lastRrdId) => {
 console.log(`Загружено ${loadedCount} записей, последний rrd_id: ${lastRrdId}`);
 });

 // Сохранение в CSV
 const csvPath = await saveSalesReportToCSV(fullReport, 'my_sales_report.csv');
 console.log('Отчёт сохранен:', csvPath);

 // Вычисление метрик
 const metrics = calculateReportMetrics(fullReport);
 console.log('Метрики отчёта:', metrics);

 // Группировка по артикулам
 const groupedByArticle = groupReportByArticle(fullReport);
 console.log('Уникальных артикулов:', Object.keys(groupedByArticle).length);

 // Или получить и сохранить одним вызовом
 const { reportData, filePath, metrics: reportMetrics } = await getSalesReportAndSave(
 '2024-01-01',
 '2024-01-31',
 apiKey,
 'sales_report.csv',
 true // получить полный отчёт
 );

 console.log('Отчёт получен и сохранен:', filePath);
 console.log('Метрики:', reportMetrics);

 } catch (error) {
 console.error('Ошибка:', error.message);
 }
 }
 */