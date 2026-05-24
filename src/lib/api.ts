import { supabase } from './supabase';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = await getAuthHeader();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...auth,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Kundli ────────────────────────────────────────────────────

export interface GenerateKundliPayload {
  name: string;
  dob: string;       // YYYY-MM-DD
  tob: string;       // HH:MM
  tobSource?: string;
  pob: string;
  latitude: number;
  longitude: number;
  timezone: string;
  gender: string;
  primaryConcern?: string;
  harshMode?: boolean;
  isPrimary?: boolean;
}

export interface GenerateKundliResponse {
  success: boolean;
  data: {
    chartId: string;
    followUpQuestions: Array<{
      id: string;
      question: string;
      options: string[];
      why: string;
      dashaReference: string;
    }>;
  };
}

export const generateKundli = (payload: GenerateKundliPayload) =>
  apiFetch<GenerateKundliResponse>('/api/kundli/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getKundliCharts = () =>
  apiFetch<{ data: any[] }>('/api/kundli');

export const getKundliChart = (id: string) =>
  apiFetch<{ data: any }>(`/api/kundli/${id}`);

// ── Horoscope ─────────────────────────────────────────────────

export interface DailyHoroscopeData {
  general: string;
  career: string;
  love: string;
  health: string;
  luckyColor: string;
  luckyNumber: number;
  luckyDirection: string;
}

export const getDailyHoroscope = (date?: string) =>
  apiFetch<Record<string, DailyHoroscopeData>>(
    `/api/horoscope/daily${date ? `?date=${date}` : ''}`
  );

// ── Chat ──────────────────────────────────────────────────────

export const createChatSession = (chartId?: string) =>
  apiFetch<{ id: string; title: string }>('/api/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({ chartId }),
  });

export const getChatSessions = () =>
  apiFetch<{ data: any[] }>('/api/chat/sessions');

export const getChatMessages = (sessionId: string) =>
  apiFetch<{ data: any[] }>(`/api/chat/sessions/${sessionId}/messages`);

export interface StreamChatOptions {
  question: string;
  chartId?: string;
  language?: string;
  userName?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

export async function streamChat(opts: StreamChatOptions): Promise<void> {
  const auth = await getAuthHeader();

  const res = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...auth,
    },
    body: JSON.stringify({
      question: opts.question,
      chartId: opts.chartId,
      language: opts.language ?? 'en',
      userName: opts.userName,
      history: opts.history ?? [],
    }),
  });

  if (!res.ok) {
    opts.onError(new Error(`Chat error: HTTP ${res.status}`));
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    opts.onError(new Error('No response body'));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed.token) opts.onToken(parsed.token);
          if (parsed.done) opts.onDone();
        } catch {
          // ignore malformed lines
        }
      }
    }
    opts.onDone();
  } catch (err) {
    opts.onError(err instanceof Error ? err : new Error(String(err)));
  } finally {
    reader.releaseLock();
  }
}

// ── Panchang ──────────────────────────────────────────────────

export interface PanchangData {
  date: string;
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  vara: string;
  sunrise: string;
  sunset: string;
  rahuKaal: { start: string; end: string; display: string };
  gulikaKaal: { start: string; end: string; display: string };
  yamagandaKaal: { start: string; end: string; display: string };
  abhijitMuhurta: { start: string; end: string };
  ayanamsa: string;
  ayanamsaValue: number;
}

export const getPanchang = (date?: string, lat?: number, lng?: number) => {
  const params: string[] = [];
  if (date) params.push(`date=${date}`);
  if (lat !== undefined) params.push(`lat=${lat}`);
  if (lng !== undefined) params.push(`lng=${lng}`);
  const qs = params.length ? `?${params.join('&')}` : '';
  return apiFetch<{ success: boolean; data: PanchangData }>(`/api/panchang/today${qs}`);
};

// ── Notifications ─────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export const getNotifications = () =>
  apiFetch<{ data: AppNotification[]; unreadCount: number }>('/api/notifications');

export const markNotificationsRead = () =>
  apiFetch<void>('/api/notifications', { method: 'PATCH' });

export const clearNotifications = () =>
  apiFetch<void>('/api/notifications', { method: 'DELETE' });

export const getCreditsBalance = () =>
  apiFetch<{ success: boolean; data: { credits: number } }>('/api/credits/balance');

// ── Life Journey ──────────────────────────────────────────────

export interface LifeJourneyPhase {
  id: string;
  planet: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  theme: string;
  status: 'past' | 'current' | 'future';
  planetEmoji: string;
  description?: string;
}

export interface LifeJourneyData {
  currentPhase: LifeJourneyPhase | null;
  phases: LifeJourneyPhase[];
  currentAge: number;
  birthYear: number;
}

// API returns { phases: [{ planet, title, isCurrent, isActive, startYear, endYear, ...}], birthYear, name, gender }
// We normalize that to LifeJourneyPhase shape (status, theme, currentPhase) here so the
// screen code can use a single consistent interface.
export const getLifeJourney = async (
  chartId: string,
): Promise<{ success: boolean; data: LifeJourneyData }> => {
  const raw = await apiFetch<{
    success: boolean;
    data: {
      phases: Array<{
        index: number;
        planet: string;
        title: string;
        startYear: number;
        endYear: number;
        startAge: number;
        endAge: number;
        isCurrent: boolean;
        isActive: boolean;
      }>;
      birthYear: number;
      name?: string;
    };
  }>(`/api/life-journey?chartId=${chartId}`);

  if (!raw.success || !raw.data) {
    return { success: false, data: { currentPhase: null, phases: [], currentAge: 0, birthYear: 0 } };
  }

  const PLANET_EMOJI: Record<string, string> = {
    Sun: '☀️', Moon: '🌙', Mars: '♂️', Mercury: '☿', Jupiter: '♃',
    Venus: '♀️', Saturn: '♄', Rahu: '☊', Ketu: '☋',
  };
  const nowYear = new Date().getFullYear();
  const phases: LifeJourneyPhase[] = raw.data.phases.map((p) => ({
    id: `${p.index}-${p.planet}`,
    planet: p.planet,
    startYear: p.startYear,
    endYear: p.endYear,
    startAge: p.startAge,
    endAge: p.endAge,
    theme: p.title,
    status: p.isCurrent ? 'current' : p.endYear < nowYear ? 'past' : 'future',
    planetEmoji: PLANET_EMOJI[p.planet] ?? '✦',
  }));
  const currentPhase = phases.find((p) => p.status === 'current') ?? null;
  const currentAge = currentPhase?.startAge ?? Math.max(0, nowYear - raw.data.birthYear);
  return {
    success: true,
    data: { currentPhase, phases, currentAge, birthYear: raw.data.birthYear },
  };
};

// ── Profiles ──────────────────────────────────────────────────

export interface ProfileData {
  id: string;
  name: string;
  date_of_birth: string;
  time_of_birth: string;
  place_of_birth: string;
  gender: string;
  created_at: string;
}

export const getProfiles = () =>
  apiFetch<{ data: ProfileData[] }>('/api/profiles');

// ── Reports ───────────────────────────────────────────────────

export interface ReportData {
  id: string;
  subject_name: string;
  type: string;
  status: string;
  created_at: string;
  pdf_url?: string;
}

// Backend returns `report_type` — map it to `type` for the screen.
export const getReports = async (): Promise<{ data: ReportData[] }> => {
  const raw = await apiFetch<{ reports?: Array<Record<string, unknown>>; data?: Array<Record<string, unknown>> }>(
    '/api/reports/my-reports',
  );
  const list = (raw.reports ?? raw.data ?? []) as Array<Record<string, unknown>>;
  return {
    data: list.map((r) => ({
      id: String(r.id),
      subject_name: (r.subject_name as string) ?? '',
      type: ((r.report_type as string) ?? (r.type as string) ?? '').replace(/_/g, ' '),
      status: (r.status as string) ?? 'pending',
      created_at: (r.created_at as string) ?? new Date().toISOString(),
      pdf_url: r.pdf_url as string | undefined,
    })),
  };
};

// ── Vastu ─────────────────────────────────────────────────────

export interface VastuPlacement {
  roomId: string;
  direction: string;
}

export interface VastuRoomScore {
  room: string;
  currentDirection: string;
  idealDirections: string[];
  score: number;
  status: string;
  suggestion: string;
}

export interface VastuResult {
  overallScore: number;
  analysis: {
    vastuScores?: VastuRoomScore[];
    generalRemedies?: string[];
  };
}

export const analyzeVastu = (payload: { roomLayout: Record<string, string[]>; roomDetails?: Record<string, string> }) =>
  apiFetch<{ success: boolean; data: VastuResult }>('/api/vastu/analyze', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ── Palm Reading ───────────────────────────────────────────────

export interface PalmLineData {
  present?: boolean;
  length?: string;
  depth?: string;
  branches?: string;
  curvature?: string;
  strength?: string;
  interpretation?: string;
}

export interface PalmAnalysis {
  handShape?: { type?: string; vedic_element?: string; description?: string };
  majorLines?: Record<string, PalmLineData>;
  soulPurpose?: string;
  overallPersonality?: string;
  careerSuggestions?: string[];
  healthWarnings?: string[];
  luckyPeriods?: string[];
  relationshipOutlook?: string;
  financialOutlook?: string;
  remedies?: string[];
  vedicCorrelation?: string;
  panditMessage?: string;
}

export const getPalmLatest = () =>
  apiFetch<{ reading: { id: string; hand: string; analysis: PalmAnalysis; created_at: string } | null }>('/api/palm/latest');

export const enqueuePalmReading = (imageBase64: string, hand: 'left' | 'right') =>
  apiFetch<{ success: boolean; data: { readingId: string; cached: boolean; analysis?: PalmAnalysis }; error?: string }>('/api/palm/enqueue', {
    method: 'POST',
    body: JSON.stringify({ imageBase64, hand }),
  });

// ── Credits / Payments ────────────────────────────────────────

export interface CreditTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'reward' | 'refund';
  amount: number;
  description: string;
  created_at: string;
}

export const getCreditHistory = () =>
  apiFetch<{ data: CreditTransaction[] }>('/api/credits/history');

export const redeemCoupon = (code: string) =>
  apiFetch<{ success: boolean; credits: number; message: string }>('/api/credits/redeem', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });

export const createCreditOrder = (pack: { credits: number; amount: number }) =>
  apiFetch<{ orderId: string; amount: number; currency: string }>('/api/credits/order', {
    method: 'POST',
    body: JSON.stringify(pack),
  });

// ── Location ──────────────────────────────────────────────────

export interface PincodeResult {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export const lookupPincode = (pincode: string) =>
  apiFetch<{ data: PincodeResult }>(`/api/location/pincode?pincode=${pincode}`);

// ── Match ─────────────────────────────────────────────────────

export interface MatchPersonPayload {
  name: string;
  dob: string;
  tob: string;
  pob: string;
  latitude: number;
  longitude: number;
  timezone: string;
  gender: string;
}

export const calculateMatch = (payload: {
  profile1: MatchPersonPayload;
  profile2: MatchPersonPayload;
  system: 'ashtakoota' | 'dashakoota';
}) =>
  apiFetch<{
    success: boolean;
    data: {
      totalScore: number;
      maxScore: number;
      scores: Record<string, { obtained: number; max: number; description: string }>;
      detailedAnalysis: {
        overallVerdict?: string;
        summaryNarrative?: string;
        remediesIfNeeded?: string[];
        mangalDoshaAnalysis?: string;
      };
    };
  }>('/api/match/calculate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ── Couple ────────────────────────────────────────────────────

export const analyzeCouple = (payload: { chart1Id: string; chart2Id: string; husbandChartId: string }) =>
  apiFetch<{ success: boolean; data: any }>('/api/couple', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ── Report Generation ────────────────────────────────────────

export const generateReport = (payload: { tier: string; chartId: string }) =>
  apiFetch<{ success: boolean; data: { report_id: string } }>('/api/reports/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getReportStatus = (id: string) =>
  apiFetch<{ data: { status: string; download_url?: string; progress?: string } }>(`/api/reports/status/${id}`);

// ── Life Journey Phase ────────────────────────────────────────

export const getLifeJourneyPhase = (chartId: string, phaseIndex: number) =>
  apiFetch<{ success: boolean; data: any }>('/api/life-journey', {
    method: 'POST',
    body: JSON.stringify({ chartId, phaseIndex }),
  });

export const submitPhaseFeedback = (eventId: string, feedback: 'agree' | 'maybe' | 'disagree') =>
  apiFetch<{ success: boolean; data: any }>('/api/life-journey/feedback', {
    method: 'POST',
    body: JSON.stringify({ eventId, feedback }),
  });

// ── Numerology Report ────────────────────────────────────────

export const generateNumerologyReport = (payload: {
  name: string; dob: string; gender: string;
  maritalStatus?: string; concern?: string; occupation?: string;
}) =>
  apiFetch<{ success: boolean; data: { report_id: string; status: string } }>('/api/numerology/report', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getNumerologyReportStatus = (reportId: string) =>
  apiFetch<{ data: { status: string; download_url?: string } }>(`/api/numerology/report/status/${reportId}`);

// ── Gochar (Planetary Transits) ──────────────────────────────────────────────

export const getGochar = (chartId: string) =>
  apiFetch<{ success: boolean; data: any }>('/api/gochar', {
    method: 'POST',
    body: JSON.stringify({ chartId }),
  });

// ── Varshaphal (Annual Predictions) ──────────────────────────────────────────

export const getVarshaphal = (chartId: string, year: number) =>
  apiFetch<{ success: boolean; data: any }>('/api/varshaphal', {
    method: 'POST',
    body: JSON.stringify({ chartId, year }),
  });

// ── Prashna (Horary Astrology) ───────────────────────────────────────────────

export const getPrashna = (question: string, city: string) =>
  apiFetch<{ success: boolean; data: any }>('/api/prashna', {
    method: 'POST',
    body: JSON.stringify({ question, city }),
  });

// ── Muhurta ───────────────────────────────────────────────────────────────────

export const getMuhurta = (payload: {
  eventType: string;
  startDate: string;
  endDate: string;
  location: string;
  chartId?: string;
}) =>
  apiFetch<{ success: boolean; data: any }>('/api/muhurta/calculate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ── Tarot ─────────────────────────────────────────────────────────────────────

export const getTarot = (question: string, spreadType: string) =>
  apiFetch<{ success: boolean; data: any }>('/api/tarot', {
    method: 'POST',
    body: JSON.stringify({ question, spreadType }),
  });

// ── Dreams ────────────────────────────────────────────────────────────────────

export const interpretDream = (dream: string, chartId?: string) =>
  apiFetch<{ success: boolean; data: any }>('/api/dreams', {
    method: 'POST',
    body: JSON.stringify({ dream, chartId }),
  });

// ── Baby Names ────────────────────────────────────────────────────────────────

export const getBabyNames = (payload: {
  dob: string;
  gender: 'male' | 'female';
  count?: number;
  chartId?: string;
}) =>
  apiFetch<{ success: boolean; data: any }>('/api/baby-names', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ── KP System ─────────────────────────────────────────────────────────────────

export const getKPSystem = (chartId: string) =>
  apiFetch<{ success: boolean; data: any }>('/api/kp-system', {
    method: 'POST',
    body: JSON.stringify({ chartId }),
  });

// ── Divisional Charts (Vargas) ────────────────────────────────────────────────

export const generateDivisionalCharts = (chartId: string) =>
  apiFetch<{ success: boolean; data: any }>('/api/divisional-charts/generate', {
    method: 'POST',
    body: JSON.stringify({ kundliChartId: chartId }),
  });

export const getDivisionalChart = (chartId: string, varga: string) =>
  apiFetch<{ success: boolean; data: any }>(`/api/divisional-charts/${chartId}`, {
    method: 'POST',
    body: JSON.stringify({ varga }),
  });

// ── Video ─────────────────────────────────────────────────────────────────────

export const generateVideo = (payload: {
  type: string;
  language: string;
  focusArea: string;
  question?: string;
  chartId?: string;
}) =>
  apiFetch<{ success: boolean; data: { video_id: string } }>('/api/video/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getVideoHistory = () =>
  apiFetch<{ data: any[] }>('/api/video/history');

export const getVideoStatus = (id: string) =>
  apiFetch<{ data: { status: string; video_url?: string; thumbnail_url?: string } }>(`/api/video/status/${id}`);

// ── Referral ──────────────────────────────────────────────────────────────────

export const getReferral = () =>
  apiFetch<{
    success: boolean;
    data: {
      referralCode: string;
      totalReferrals: number;
      creditsEarned: number;
      history: Array<{ name: string; date: string; status: string }>;
    };
  }>('/api/referral');

export const redeemReferral = (code: string) =>
  apiFetch<{ success: boolean; message: string }>('/api/referral', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });

// ── User Location ─────────────────────────────────────────────────────────────

export const updateUserLocation = (lat: number, lng: number, city?: string) =>
  apiFetch<{ success: boolean }>('/api/user/location', {
    method: 'POST',
    body: JSON.stringify({ lat, lng, city }),
  });

export const saveLifeContext = (payload: { marital_status?: string; profession?: string; financial_status?: string }) =>
  apiFetch<{ success: boolean; data: unknown }>('/api/user/life-context', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

// ── Remedies ──────────────────────────────────────────────────────────────────

export const getKundliRemedies = (chartId: string) =>
  apiFetch<{ success: boolean; data: any }>('/api/remedies', {
    method: 'POST',
    body: JSON.stringify({ chartId }),
  });

// ── Personal Daily ────────────────────────────────────────────────────────────

export const getPersonalDaily = (chartId: string) =>
  apiFetch<{ success: boolean; data: any }>('/api/horoscope/personal-daily', {
    method: 'POST',
    body: JSON.stringify({ chartId }),
  });

// ── Life Decisions ────────────────────────────────────────────────────────────

export const getLifeDecision = (category: string, chartId: string) =>
  apiFetch<{ success: boolean; data: any }>(`/api/life-decisions/${category}`, {
    method: 'POST',
    body: JSON.stringify({ chartId }),
  });

// ── Feature Insights (independent-first architecture) ──────────────────────

export interface FeatureInsightResponse {
  featureKey: string;
  source: 'lite_ai' | 'report_enriched' | 'deterministic';
  content: Record<string, unknown>;
}

export const getFeatureInsight = (
  featureKey: string,
  chartId: string,
  opts?: { language?: string; paramsHash?: string },
) => {
  const params = new URLSearchParams({ chartId });
  if (opts?.language)   params.set('language',   opts.language);
  if (opts?.paramsHash) params.set('paramsHash', opts.paramsHash);
  return apiFetch<FeatureInsightResponse>(`/api/insights/${featureKey}?${params}`);
};
