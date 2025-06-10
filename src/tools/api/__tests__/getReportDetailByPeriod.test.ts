import dotenv from 'dotenv';
import { DetailReportItem, getSalesReport } from '../getReportDetailByPeriod.js';

dotenv.config();

describe('getReportDetailByPeriod test', () => {
  const apiKey = process.env.WB_FINANCES_OAUTH_TOKEN;

  beforeAll(() => {
    if (!apiKey) {
      throw new Error('WB_FINANCES_OAUTH_TOKEN environment variable is not set');
    }
  });

  it('Test integration', async () => {
    await getSalesReport({ dateFrom: '2025-05-20', dateTo: '2025-05-21', limit: 1, rrdid: 0 }, apiKey as string)
      .then((res: Array<DetailReportItem>) => {
          expect(res.length).toBeGreaterThan(0);
          console.log(res);
        }
      )
      .catch(err => console.log(err));
  }, 100_000);
});