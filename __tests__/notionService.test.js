const mockDatabasesQuery = jest.fn();

jest.mock('@notionhq/client', () => {
  return {
    Client: jest.fn(() => ({
      databases: {
        query: mockDatabasesQuery,
      },
    })),
  };
});

const { getAnnualGoals, getQuarterlyGoals, getWeeklyGoals, getDailyTasks } = require('../services/notionService');

describe('notionService', () => {
  beforeEach(() => {
    mockDatabasesQuery.mockClear();
    mockDatabasesQuery.mockResolvedValue({ results: [] });
  });

  it('should call the Notion client with the correct database ID for annual goals', async () => {

    await getAnnualGoals();

    expect(mockDatabasesQuery).toHaveBeenCalledWith({
      database_id: process.env.NOTION_ANNUAL_GOALS_DB_ID,
    });
  });

  it('should call the Notion client with the correct database ID for quarterly goals', async () => {
    mockDatabasesQuery.mockResolvedValue({ results: [] });

    await getQuarterlyGoals();

    expect(mockDatabasesQuery).toHaveBeenCalledWith({
      database_id: process.env.NOTION_QUARTERLY_GOALS_DB_ID,
    });
  });

  it('should call the Notion client with the correct database ID for weekly goals', async () => {
    mockDatabasesQuery.mockResolvedValue({ results: [] });

    await getWeeklyGoals();

    expect(mockDatabasesQuery).toHaveBeenCalledWith({
      database_id: process.env.NOTION_WEEKLY_GOALS_DB_ID,
    });
  });

  it('should call the Notion client with the correct database ID and filter for daily tasks', async () => {
    mockDatabasesQuery.mockResolvedValue({ results: [] });

    // Mock Date to ensure consistent test results for daily tasks
    const mockDate = new Date('2025-08-01T10:00:00.000Z');
    const RealDate = Date;
    const spy = jest.spyOn(global, 'Date').mockImplementation(() => new RealDate(mockDate.getTime()));

    await getDailyTasks();

    const yesterday = new Date(mockDate);
    yesterday.setDate(mockDate.getDate() - 1);

    expect(mockDatabasesQuery).toHaveBeenCalledWith({
      database_id: process.env.NOTION_DAILY_PLANNER_DB_ID,
      filter: {
        or: [
          {
            property: 'Date',
            date: {
              equals: yesterday.toISOString().split('T')[0],
            },
          },
          {
            property: 'Date',
            date: {
              equals: mockDate.toISOString().split('T')[0],
            },
          },
        ],
      },
    });

    spy.mockRestore();
  });
});
