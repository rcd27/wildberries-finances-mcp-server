import { getDocumentList } from '../getDocumentList.js';
import dotenv from 'dotenv';

dotenv.config();

describe('getDocumentList test', () => {
  const apiKey = process.env.WB_FINANCES_OAUTH_TOKEN;

  beforeAll(() => {
    if (!apiKey) {
      throw new Error('WB_FINANCES_OAUTH_TOKEN environment variable is not set');
    }
  });

  it('Test integration', async () => {
    const response = await getDocumentList(
      {
        locale: 'ru',
        beginTime: '2025-05-18',
        endTime: '2025-05-25',
        sort: 'date',
        order: 'desc',
        category: 'commission-report',
        serviceName: ''
      },
      apiKey as string
    );
    expect(response).not.toBeNull();
  });
});