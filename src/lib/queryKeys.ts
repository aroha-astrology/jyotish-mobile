// IST-aware date string: YYYY-MM-DD
function todayIST(): string {
  const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

export const queryKeys = {
  kundliCharts: () => ['kundli', 'charts'] as const,
  kundliChart: (id: string) => ['kundli', 'chart', id] as const,
  horoscopeDaily: (date?: string) => ['horoscope', 'daily', date ?? todayIST()] as const,
  horoscopeMonthly: (year: number, month: number) => ['horoscope', 'monthly', year, month] as const,
  panchangToday: (date?: string) => ['panchang', 'today', date ?? todayIST()] as const,
  chatSessions: () => ['chat', 'sessions'] as const,
  chatMessages: (sessionId: string) => ['chat', 'messages', sessionId] as const,
  userProfile: () => ['user', 'profile'] as const,
  credits: () => ['user', 'credits'] as const,
};
