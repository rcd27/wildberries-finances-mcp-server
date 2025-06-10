import { SalesReportResponse } from '../api/getReportDetailByPeriod.js';

/**
 * Вычисляет основные метрики по отчёту
 * @param reportData - Данные отчёта
 * @returns Объект с метриками
 */
export function calculateReportMetrics(reportData: SalesReportResponse) {
  const totalQuantity = reportData.reduce((sum, item) => sum + item.quantity, 0);
  const totalRetailAmount = reportData.reduce((sum, item) => sum + item.retail_amount, 0);
  const totalForPay = reportData.reduce((sum, item) => sum + item.ppvz_for_pay, 0);
  const totalCommission = reportData.reduce((sum, item) => sum + item.ppvz_sales_commission, 0);
  const totalPenalty = reportData.reduce((sum, item) => sum + item.penalty, 0);
  const totalStorageFee = reportData.reduce((sum, item) => sum + (item.storage_fee || 0), 0);

  return {
    totalQuantity,
    totalRetailAmount,
    totalForPay,
    totalCommission,
    totalPenalty,
    totalStorageFee,
    uniqueArticles: new Set(reportData.map(item => item.nm_id)).size,
    totalOrders: reportData.length
  };
}