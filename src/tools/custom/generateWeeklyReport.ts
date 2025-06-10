import { z } from 'zod';
import { DetailReportItem, getSalesReport } from '../api/getReportDetailByPeriod.js';
import { calcCommissionAndNds } from './calcCommissionAndNds.js';

export const GenerateWeeklyReportRequestSchema = z.object({
  dateFrom: z.string().describe('RFC3339'),
  dateTo: z.string().describe('RFC3339'),
  limit: z.number().max(100000).optional(),
  rrdid: z.number().optional()
});

type GenerateWeeklyReportRequest = z.infer<typeof GenerateWeeklyReportRequestSchema>;

interface MarkdownReport {
  markdown: string;
}

function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return '-';
  return value.toFixed(2);
}

function generateTable(items: DetailReportItem[]): string {
  // Group by brand_name and sum quantity, retail_amount, commission
  const brandMap = new Map<string, {quantity: number; retailAmount: number; commission: number}>();

  for (const item of items) {
    const brand = item.brand_name || 'Unknown';
    const quantity = item.quantity || 0;
    const retailAmount = item.retail_amount || 0;
    const commission = item.ppvz_sales_commission || 0;

    if (!brandMap.has(brand)) {
      brandMap.set(brand, { quantity: 0, retailAmount: 0, commission: 0 });
    }
    const agg = brandMap.get(brand)!;
    agg.quantity += quantity;
    agg.retailAmount += retailAmount;
    agg.commission += commission;
  }

  let table = '| Бренд | Кол-во | Сумма продаж | Комиссия |\n';
  table += '|-------|--------|--------------|----------|\n';

  for (const [brand, agg] of brandMap.entries()) {
    table
      += `| ${brand} | ${agg.quantity} | ${formatCurrency(agg.retailAmount)} | ${formatCurrency(agg.commission)} |\n`;
  }

  return table;
}

export async function generateWeeklyReport(
  input: GenerateWeeklyReportRequest,
  apiKey: string
): Promise<MarkdownReport> {
  const limit = input.limit ?? 100000;
  const rrdid = input.rrdid ?? 0;

  // Fetch detailed report items
  const items = await getSalesReport(
    {
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      limit,
      rrdid
    },
    apiKey
  );

  // Calculate totals
  const totals = calcCommissionAndNds(items);

  // Generate markdown report
  let markdown = `# Еженедельный отчёт по продажам и комиссиям\n\n`;
  markdown += `Период: **${input.dateFrom}** - **${input.dateTo}**\n\n`;

  markdown += `## Итоги\n\n`;
  markdown += `- Общая комиссия: **${formatCurrency(totals.totalCommission)}** руб.\n`;
  markdown += `- Общий НДС: **${formatCurrency(totals.totalNds)}** руб.\n`;
  markdown += `- Всего к перечислению: **${formatCurrency(totals.total)}** руб.\n\n`;

  markdown += `## Продажи по брендам\n\n`;
  markdown += generateTable(items);

  // Optionally, add a simple bar chart for sales by brand (ASCII)
  markdown += `\n## График продаж по брендам (кол-во)\n\n`;

  // Prepare data for bar chart
  const brandQuantities = Array.from(new Map(
    items.map(item => [item.brand_name || 'Unknown', 0])
  ).entries());

  for (const item of items) {
    const brand = item.brand_name || 'Unknown';
    const index = brandQuantities.findIndex(([b]) => b === brand);
    if (index !== -1) {
      brandQuantities[index][1] += item.quantity || 0;
    }
  }

  // Max quantity for scaling
  const maxQuantity = Math.max(...brandQuantities.map(([, qty]) => qty), 1);

  for (const [brand, qty] of brandQuantities) {
    const barLength = Math.round((qty / maxQuantity
                                 ) * 40);
    const bar = '█'.repeat(barLength);
    markdown += `${brand.padEnd(20)} | ${bar} ${qty}\n`;
  }

  return { markdown };
}
