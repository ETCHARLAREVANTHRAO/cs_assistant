import axios from 'axios';
import { Platform } from 'react-native';

// Web: route through Vercel proxy (/backend to Render) - no CORS needed
// Mobile: call Render directly
const RENDER_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://my-assistant-backend-nxwg.onrender.com';
export const BASE_URL = Platform.OS === 'web' ? '/backend' : RENDER_URL;

const api = axios.create({ baseURL: BASE_URL, timeout: 30000 });

// Mobile preview runs without Firebase auth for now.
api.interceptors.request.use(async (config) => config);

export type KnowledgeMode = 'server' | 'local' | 'hybrid';

export interface ChatResponse {
  reply: string;
  sources: string[];
  knowledge_mode: KnowledgeMode;
}

export interface WeatherData {
  city: string;
  temperature_c: number;
  feels_like_c: number;
  description: string;
  humidity: number;
  wind_speed_ms: number;
  icon: string;
}

export const chatApi = {
  send: async (message: string, knowledge_mode: KnowledgeMode = 'hybrid'): Promise<ChatResponse> => {
    const { data } = await api.post<ChatResponse>('/chat', { message, knowledge_mode });
    return data;
  },
};

export interface DocumentsResponse {
  documents: string[];
  used_bytes: number;
  limit_bytes: number;
}

export const documentsApi = {
  list: async (): Promise<DocumentsResponse> => {
    const { data } = await api.get<DocumentsResponse>('/documents');
    return data;
  },

  upload: async (uri: string, filename: string, file?: File): Promise<string> => {
    if (Platform.OS === 'web') {
      // `file` is always a real File object when called from the native <input type="file">
      if (!(file instanceof File)) throw new Error('No file provided.');

      const form = new FormData();
      form.append('file', file, file.name);

      let res: Response;
      try {
        res = await fetch(`${BASE_URL}/documents/upload`, { method: 'POST', body: form });
      } catch (netErr: any) {
        throw new Error('Network error - could not reach server: ' + (netErr.message ?? 'Failed to fetch'));
      }

      if (!res.ok) {
        let detail = `Server error ${res.status}`;
        try {
          const body = await res.text();
          try { detail = (JSON.parse(body).detail) || detail; } catch { if (body) detail = body.slice(0, 300); }
        } catch {}
        throw new Error(detail);
      }
      const json = await res.json();
      return json.message || 'Uploaded successfully!';
    }
    // Mobile: use axios with RN file object
    const form = new FormData();
    form.append('file', { uri, name: filename, type: 'application/octet-stream' } as any);
    const { data } = await api.post<{ message: string }>('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.message;
  },

  delete: async (filename: string): Promise<void> => {
    await api.delete(`/documents/${encodeURIComponent(filename)}`);
  },
};

export const weatherApi = {
  get: async (city: string): Promise<WeatherData> => {
    const { data } = await api.get<WeatherData>('/weather', { params: { city } });
    return data;
  },
};

export const usageApi = {
  get: async () => {
    const { data } = await api.get('/usage');
    return data;
  },
};

export interface DoubtSolveResponse {
  answer: string;
  extracted_text: string;
}

export const doubtsApi = {
  solve: async (input: { message: string; subject?: string; topic?: string; uri?: string; filename?: string }): Promise<DoubtSolveResponse> => {
    const form = new FormData();
    form.append('message', input.message);
    form.append('subject', input.subject ?? '');
    form.append('topic', input.topic ?? '');
    if (input.uri && input.filename) {
      form.append('file', { uri: input.uri, name: input.filename, type: 'application/octet-stream' } as any);
    }
    const { data } = await api.post<DoubtSolveResponse>('/doubts/solve', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export const signOut = async () => {
  return Promise.resolve();
};

// GATE PYQ mock test

export interface PYQSectionSummary {
  section: string;
  section_title: string;
  question_count: number;
  total_marks: number;
}

export interface PYQPaperSummary {
  paper_id: string;
  title: string;
  year: number;
  shift: number;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  sections: PYQSectionSummary[];
}

export interface PYQQuestion {
  question_id: string;
  question_type: 'MCQ' | 'MSQ' | 'NAT';
  section: string;
  section_title: string;
  question: string;
  image_url: string | null;
  options: Record<string, string> | null;
  marks: number;
  negative_marking: number;
}

export interface PYQPaperDetail extends PYQPaperSummary {
  questions: PYQQuestion[];
}

export interface PYQAttemptStartResponse {
  attempt_id: string;
  started_at: string;
  duration_minutes: number;
  paper: PYQPaperDetail;
}

export type PYQAnswer = string | string[] | null;

export interface PYQQuestionResult {
  question_id: string;
  section: string;
  section_title: string;
  question_type: 'MCQ' | 'MSQ' | 'NAT';
  marks: number;
  negative_marking: number;
  given_answer: PYQAnswer;
  correct_answer: string | string[];
  status: 'correct' | 'incorrect' | 'unattempted';
  marks_awarded: number;
  question: string;
  options: Record<string, string> | null;
  image_url: string | null;
  explanation: string | null;
  solution_steps: string[] | null;
  topic: string | null;
  difficulty: string | null;
}

export interface PYQSectionResult {
  section: string;
  section_title: string;
  total_questions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  max_marks: number;
  marks_scored: number;
}

export interface PYQResult {
  attempt_id: string;
  paper_id: string;
  paper_title: string;
  total_marks: number;
  max_marks: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  duration_minutes: number;
  time_taken_seconds: number;
  submitted_at: string;
  sections: PYQSectionResult[];
  questions: PYQQuestionResult[];
}

export interface PYQAttemptSummary {
  attempt_id: string;
  paper_id: string;
  paper_title: string;
  total_marks: number;
  max_marks: number;
  submitted_at: string;
}

export interface PracticeFilter {
  topics?: string[];
  sections?: string[];
  difficulty?: string[];
  count?: number;
}

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  completed_today: boolean;
}

export interface DailyPracticeResponse extends PYQAttemptStartResponse {
  already_submitted: boolean;
  streak: StreakInfo;
}

export interface TopicFrequency {
  topic: string;
  question_count: number;
  total_marks: number;
}

export interface StatBucket {
  key: string;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
}

export interface AnalyticsResponse {
  total_attempts: number;
  total_marks: number;
  total_max_marks: number;
  overall_accuracy: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  topics: StatBucket[];
  sections: StatBucket[];
  difficulty: StatBucket[];
  weak_topics: StatBucket[];
  strong_topics: StatBucket[];
  subjects?: StatBucket[];
  chapters?: StatBucket[];
  improvement_graph?: Array<{ submitted_at: string; paper_title: string; total_marks: number; max_marks: number; accuracy: number }>;
  time_management?: {
    total_time_seconds: number;
    avg_time_per_attempted_seconds: number;
    fastest_correct_seconds: number | null;
    slowest_incorrect_seconds: number | null;
    overtime_questions: number;
  };
  rank_prediction?: string | null;
  percentile_prediction?: number | null;
  personalized_study_plan?: string[];
}

export interface ExplainRequest {
  question: string;
  options: Record<string, string> | null;
  question_type: string;
  correct_answer: string | string[];
  given_answer: PYQAnswer;
  topic: string | null;
  explanation: string | null;
}

// image_url / option-image paths come back as "/pyq-assets/..." - resolve against
// the same host the API client is already using.
export const pyqAssetUrl = (path: string): string => `${BASE_URL}${path}`;

export const pyqApi = {
  listPapers: async (): Promise<PYQPaperSummary[]> => {
    const { data } = await api.get<PYQPaperSummary[]>('/pyq/papers');
    return data;
  },

  getPaper: async (paperId: string): Promise<PYQPaperDetail> => {
    const { data } = await api.get<PYQPaperDetail>(`/pyq/papers/${paperId}`);
    return data;
  },

  startAttempt: async (paperId: string): Promise<PYQAttemptStartResponse> => {
    const { data } = await api.post<PYQAttemptStartResponse>(`/pyq/papers/${paperId}/attempts`);
    return data;
  },

  submitAttempt: async (attemptId: string, answers: Record<string, PYQAnswer>): Promise<PYQResult> => {
    const { data } = await api.post<PYQResult>(`/pyq/attempts/${attemptId}/submit`, { answers });
    return data;
  },

  getResult: async (attemptId: string): Promise<PYQResult> => {
    const { data } = await api.get<PYQResult>(`/pyq/attempts/${attemptId}`);
    return data;
  },

  listAttempts: async (): Promise<PYQAttemptSummary[]> => {
    const { data } = await api.get<PYQAttemptSummary[]>('/pyq/attempts');
    return data;
  },

  startPractice: async (filter: PracticeFilter): Promise<PYQAttemptStartResponse> => {
    const { data } = await api.post<PYQAttemptStartResponse>('/pyq/practice/start', filter);
    return data;
  },

  getDaily: async (): Promise<DailyPracticeResponse> => {
    const { data } = await api.get<DailyPracticeResponse>('/pyq/daily');
    return data;
  },

  getTopics: async (): Promise<TopicFrequency[]> => {
    const { data } = await api.get<TopicFrequency[]>('/pyq/topics');
    return data;
  },

  getAnalytics: async (): Promise<AnalyticsResponse> => {
    const { data } = await api.get<AnalyticsResponse>('/pyq/analytics');
    return data;
  },

  explainQuestion: async (payload: ExplainRequest): Promise<string> => {
    const { data } = await api.post<{ explanation: string }>('/pyq/explain', payload);
    return data.explanation;
  },
};

export interface VideoLecture {
  title: string;
  provider: string;
  url: string;
  embed_url: string | null;
  duration_minutes: number | null;
}

export interface LearningReferenceLink {
  title: string;
  url: string;
  type: string;
}

export interface LearningFlashcard {
  front: string;
  back: string;
}

export interface LearningDiagram {
  title: string;
  type: string;
  nodes: string[];
  edges: { from: string; to: string }[];
}

export interface LearningQuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface LearningWorkedExample {
  title: string;
  problem: string;
  solution: string;
}

export interface LearningNoteSection {
  heading: string;
  body: string;
}

export interface LearningRevisionScheduleItem {
  when: string;
  task: string;
}

export interface LearningPYQMatch {
  subject: string;
  chapter: string;
  name: string;
  question_count: number;
}

export interface LearningTopic {
  slug: string;
  title: string;
  priority: number;
  difficulty: string;
  estimated_study_minutes: number;
  status: string;
  concepts: string[];
  written_notes: string;
  revision_summary: string;
  notes_by_language: Record<string, string>;
  revision_by_language: Record<string, string>;
  deep_notes: LearningNoteSection[];
  formula_sheet: string[];
  mind_map: string[];
  pyq_concepts: string[];
  common_mistakes: string[];
  practice_tasks: string[];
  study_flow: string[];
  prerequisites: string[];
  learning_outcomes: string[];
  quick_checks: string[];
  flashcards: LearningFlashcard[];
  interview_prompts: string[];
  diagram: LearningDiagram | null;
  quiz_questions: LearningQuizQuestion[];
  worked_examples: LearningWorkedExample[];
  memory_hooks: string[];
  reading_pointers: string[];
  revision_schedule: LearningRevisionScheduleItem[];
  mastery_rubric: string[];
  pyq_matches: LearningPYQMatch[];
  pyq_match_count: number;
  reference_links: LearningReferenceLink[];
  video_lectures: VideoLecture[];
}

export interface LearningSubjectDetail {
  slug: string;
  name: string;
  exam_weight: string;
  description: string;
  topic_count: number;
  pyq_subject: string;
  pyq_available: boolean;
  curated_resources: LearningReferenceLink[];
  roadmap: string[];
  exam_strategy: string[];
  milestones: string[];
  topics: LearningTopic[];
}

export interface LearningProgressItem {
  topic_key: string;
  status: string;
  bookmarked: boolean;
  updated_at: string | null;
}

export const learningApi = {
  syllabus: async (): Promise<LearningSubjectDetail[]> => {
    const { data } = await api.get<LearningSubjectDetail[]>('/learning/syllabus');
    return data;
  },
  progress: async (): Promise<LearningProgressItem[]> => {
    const { data } = await api.get<{ items: LearningProgressItem[] }>('/learning/progress');
    return data.items;
  },
  updateProgress: async (topicKey: string, payload: { status?: string; bookmarked?: boolean }): Promise<LearningProgressItem> => {
    const { data } = await api.put<LearningProgressItem>(`/learning/progress/${encodeURIComponent(topicKey)}`, payload);
    return data;
  },
};

export interface StudyPlanTaskCreate {
  title: string;
  subject?: string;
  topic?: string;
  planned_date: string;
  start_time?: string;
  duration_minutes?: number;
  priority?: string;
  notes?: string;
  reminder_enabled?: boolean;
}

export interface StudyPlanTask {
  task_id: string;
  title: string;
  subject: string;
  topic: string;
  planned_date: string;
  start_time: string;
  duration_minutes: number;
  priority: string;
  notes: string;
  reminder_enabled: boolean;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudyPlannerSummary {
  tasks: StudyPlanTask[];
  today_key: string;
  weekly_hours_goal: number;
  weekly_completed_minutes: number;
  weekly_planned_minutes: number;
  completion_rate: number;
  current_streak: number;
  longest_streak: number;
  completed_today: boolean;
  revision_reminders: StudyPlanTask[];
}

export const plannerApi = {
  summary: async (): Promise<StudyPlannerSummary> => {
    const { data } = await api.get<StudyPlannerSummary>('/planner/summary');
    return data;
  },
  createTask: async (input: StudyPlanTaskCreate): Promise<StudyPlanTask> => {
    const { data } = await api.post<StudyPlanTask>('/planner/tasks', input);
    return data;
  },
  completeTask: async (taskId: string): Promise<StudyPlanTask> => {
    const { data } = await api.post<StudyPlanTask>(`/planner/tasks/${taskId}/complete`);
    return data;
  },
  updateTask: async (taskId: string, input: Partial<StudyPlanTask>): Promise<StudyPlanTask> => {
    const { data } = await api.patch<StudyPlanTask>(`/planner/tasks/${taskId}`, input);
    return data;
  },
  deleteTask: async (taskId: string): Promise<{ message: string }> => {
    const { data } = await api.delete<{ message: string }>(`/planner/tasks/${taskId}`);
    return data;
  },
  setGoal: async (weekly_hours_goal: number): Promise<StudyPlannerSummary> => {
    const { data } = await api.put<StudyPlannerSummary>('/planner/goal', { weekly_hours_goal });
    return data;
  },
};

export interface NotificationPreferences {
  revision_reminders: boolean;
  quiz_alerts: boolean;
  exam_updates: boolean;
  system_updates: boolean;
  daily_challenge: boolean;
  push_enabled: boolean;
}

export interface NotificationItem {
  notification_id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  read: boolean;
  action_route: string | null;
  priority: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unread_count: number;
  preferences: NotificationPreferences;
}

export const notificationApi = {
  list: async (): Promise<NotificationsResponse> => {
    const { data } = await api.get<NotificationsResponse>('/notifications');
    return data;
  },
  unreadCount: async (): Promise<number> => {
    const { data } = await api.get<{ unread_count: number }>('/notifications/unread-count');
    return data.unread_count;
  },
  markRead: async (notificationId: string): Promise<NotificationsResponse> => {
    const { data } = await api.post<NotificationsResponse>(`/notifications/${encodeURIComponent(notificationId)}/read`);
    return data;
  },
  markAllRead: async (): Promise<NotificationsResponse> => {
    const { data } = await api.post<NotificationsResponse>('/notifications/read-all');
    return data;
  },
  getPreferences: async (): Promise<NotificationPreferences> => {
    const { data } = await api.get<NotificationPreferences>('/notifications/preferences');
    return data;
  },
  updatePreferences: async (input: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const { data } = await api.put<NotificationPreferences>('/notifications/preferences', input);
    return data;
  },
  registerPushToken: async (input: { token: string; platform: string; device_name?: string }): Promise<{ status: string }> => {
    const { data } = await api.post<{ status: string }>('/notifications/push-token', input);
    return data;
  },
};

export interface ResourceFormulaSheet {
  subject: string;
  chapter: string;
  formulas: string[];
}

export interface ResourceCheatSheet {
  subject: string;
  chapter: string;
  points: string[];
}

export interface ResourceShortTrick {
  subject: string;
  title: string;
  trick: string;
  example: string;
}

export interface ResourcePYQSolution {
  paper_id: string;
  paper_title: string;
  question_id: string;
  subject: string | null;
  chapter: string | null;
  topic: string | null;
  difficulty: string | null;
  question_type: 'MCQ' | 'MSQ' | 'NAT';
  marks: number;
  question: string;
  options: Record<string, string> | null;
  image_url: string | null;
  correct_answer: string | string[];
  explanation: string | null;
  solution_steps: string[] | null;
}

export interface ErrorNotebookItem extends ResourcePYQSolution {
  notebook_id: string;
  attempt_id: string;
  submitted_at: string;
  given_answer: string | string[] | null;
  marks_awarded: number;
  time_spent_seconds: number;
  resolved: boolean;
  status: string;
  note: string;
}

export interface ResourcesSummaryResponse {
  pyq_solutions: ResourcePYQSolution[];
  formula_sheets: ResourceFormulaSheet[];
  cheat_sheets: ResourceCheatSheet[];
  short_tricks: ResourceShortTrick[];
  error_notebook: ErrorNotebookItem[];
}

export const resourcesApi = {
  summary: async (): Promise<ResourcesSummaryResponse> => {
    const { data } = await api.get<ResourcesSummaryResponse>('/resources/summary');
    return data;
  },
  updateErrorNotebook: async (notebookId: string, input: { resolved?: boolean; note?: string }): Promise<ResourcesSummaryResponse> => {
    const { data } = await api.patch<ResourcesSummaryResponse>(`/resources/error-notebook/${encodeURIComponent(notebookId)}`, input);
    return data;
  },
};

export const aiApi = {
  tutor: async (input: { topic: string; level?: string }): Promise<string> => {
    const { data } = await api.post<{ answer: string }>('/ai/tutor', input);
    return data.answer;
  },
  quiz: async (input: { topic: string; count?: number; difficulty?: string }): Promise<string> => {
    const { data } = await api.post<{ answer: string }>('/ai/quiz-generator', input);
    return data.answer;
  },
  mentor: async (input: { concern: string }): Promise<string> => {
    const { data } = await api.post<{ answer: string }>('/ai/exam-mentor', input);
    return data.answer;
  },
  revisionPlan: async (input: { days: number; target: string }): Promise<string> => {
    const { data } = await api.post<{ answer: string }>('/ai/revision-plan', input);
    return data.answer;
  },
};

export const productApi = {
  examInfo: async (): Promise<any> => (await api.get('/exam-info')).data,
  motivation: async (): Promise<any> => (await api.get('/motivation')).data,
  revision: async (): Promise<any> => (await api.get('/revision')).data,
  community: async (): Promise<any> => (await api.get('/community')).data,
  createCommunityPost: async (input: { title: string; content: string; category?: string }): Promise<any> => {
    const { data } = await api.post('/community/posts', input);
    return data;
  },
};

