import { DetailReportItem } from '../api/getReportDetailByPeriod.js';

type CommissionAndNdsResponse = {
  totalCommission: number,
  totalNds: number,
  total: number
};

export function calcCommissionAndNds(items: Array<DetailReportItem>): CommissionAndNdsResponse {
  let totalCommission = 0;
  let totalNds = 0;

  for (const item of items) {
    totalCommission += item.ppvz_sales_commission;
    totalNds += item.ppvz_vw_nds;
  }

  return {
    totalCommission,
    totalNds,
    total: totalCommission + totalNds
  };
}
