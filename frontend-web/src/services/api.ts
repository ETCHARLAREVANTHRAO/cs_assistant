import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  'https://my-assistant-backend-nxwg.onrender.com';
const LOCAL_API_URL =
  (import.meta.env.VITE_LOCAL_API_URL as string | undefined) ||
  'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: API_URL,
});

export const localApi = axios.create({
  baseURL: LOCAL_API_URL,
});

api.interceptors.request.use(async (config) => {
  if (!auth) return config;

  // Wait for initial Firebase auth state to resolve (ensures stored sessions are restored)
  if (typeof auth.authStateReady === 'function') {
    try {
      await auth.authStateReady();
    } catch {
      // ignore initialization errors and fall through
    }
  }

  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // ignore token retrieval failure
    }
  }
  return config;
});

export type KnowledgeMode = 'server' | 'local' | 'hybrid';
export type AIEngine = 'cloud' | 'desktop-local';

export interface ChatResponse {
  reply: string;
  sources: string[];
  knowledge_mode: KnowledgeMode;
}

export async function sendChatMessage(
  message: string,
  sessionId?: string,
  knowledgeMode: KnowledgeMode = 'hybrid',
): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/chat', {
    message,
    session_id: sessionId,
    knowledge_mode: knowledgeMode,
  });
  return data;
}

export interface LocalChatResponse {
  reply: string;
  model: string;
  elapsed_seconds: number;
}

export async function sendLocalChatMessage(message: string): Promise<LocalChatResponse> {
  const { data } = await localApi.post<LocalChatResponse>('/local-chat', { message });
  return data;
}


export interface DoubtSolveResponse {
  answer: string;
  extracted_text: string;
}

export async function solveDoubt(input: {
  message: string;
  subject?: string;
  topic?: string;
  file?: File | null;
}): Promise<DoubtSolveResponse> {
  const form = new FormData();
  form.append('message', input.message);
  form.append('subject', input.subject ?? '');
  form.append('topic', input.topic ?? '');
  if (input.file) form.append('file', input.file);
  const { data } = await api.post<DoubtSolveResponse>('/doubts/solve', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export interface DocumentsResponse {
  documents: string[];
  used_bytes: number;
  limit_bytes: number;
}

export async function getDocuments(): Promise<DocumentsResponse> {
  const { data } = await api.get<DocumentsResponse>('/documents');
  return data;
}

export interface UploadResponse {
  filename: string;
  chunks_stored: number;
  message: string;
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<UploadResponse>('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteDocument(filename: string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(
    `/documents/${encodeURIComponent(filename)}`,
  );
  return data;
}

export interface DriveSyncResponse {
  ingested: string[];
  skipped: string[];
  failed: string[];
}

export async function syncDrive(): Promise<DriveSyncResponse> {
  const { data } = await api.post<DriveSyncResponse>('/documents/drive-sync');
  return data;
}

// â”€â”€ GATE PYQ mock test â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface PYQSectionSummary {
  section: string;
  section_title: string;
  subject: string | null;
  chapter: string | null;
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
  subject: string | null;
  chapter: string | null;
  question_type: 'MCQ' | 'MSQ' | 'NAT';
  marks: number;
  negative_marking: number;
  given_answer: PYQAnswer;
  correct_answer: string | string[];
  status: 'correct' | 'incorrect' | 'unattempted';
  marks_awarded: number;
  time_spent_seconds: number;
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
  time_spent_seconds: number;
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

// image_url / option-image paths come back as "/pyq-assets/..." â€” resolve against the API host.
export const pyqAssetUrl = (path: string): string => `${API_URL}${path}`;

export async function pyqListPapers(): Promise<PYQPaperSummary[]> {
  const { data } = await api.get<PYQPaperSummary[]>('/pyq/papers');
  return data;
}

export async function pyqGetPaper(paperId: string): Promise<PYQPaperDetail> {
  const { data } = await api.get<PYQPaperDetail>(`/pyq/papers/${paperId}`);
  return data;
}

export async function pyqStartAttempt(paperId: string): Promise<PYQAttemptStartResponse> {
  const { data } = await api.post<PYQAttemptStartResponse>(`/pyq/papers/${paperId}/attempts`);
  return data;
}

export async function pyqSubmitAttempt(
  attemptId: string,
  answers: Record<string, PYQAnswer>,
  time_spent_seconds: Record<string, number> = {},
): Promise<PYQResult> {
  const { data } = await api.post<PYQResult>(`/pyq/attempts/${attemptId}/submit`, { answers, time_spent_seconds });
  return data;
}

export async function pyqGetResult(attemptId: string): Promise<PYQResult> {
  const { data } = await api.get<PYQResult>(`/pyq/attempts/${attemptId}`);
  return data;
}


export interface PracticeFilter {
  subjects?: string[];
  chapters?: string[];
  topics?: string[];
  sections?: string[];
  difficulty?: string[];
  question_types?: string[];
  count?: number;
}

export interface PracticeOption {
  name: string;
  question_count: number;
}

export interface PracticeChapterOption extends PracticeOption {
  subject: string;
}

export interface PracticeTopicOption extends PracticeOption {
  subject: string;
  chapter: string;
}

export interface PracticeTaxonomyResponse {
  subjects: PracticeOption[];
  chapters: PracticeChapterOption[];
  topics: PracticeTopicOption[];
  difficulty: PracticeOption[];
  question_types: PracticeOption[];
}

export async function pyqGetPracticeTaxonomy(): Promise<PracticeTaxonomyResponse> {
  const { data } = await api.get<PracticeTaxonomyResponse>('/pyq/practice/taxonomy');
  return data;
}

export async function pyqStartPractice(filter: PracticeFilter): Promise<PYQAttemptStartResponse> {
  const { data } = await api.post<PYQAttemptStartResponse>('/pyq/practice/start', filter);
  return data;
}

export async function pyqListAttempts(): Promise<PYQAttemptSummary[]> {
  const { data } = await api.get<PYQAttemptSummary[]>('/pyq/attempts');
  return data;
}


export interface StatBucket {
  key: string;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
  total_time_seconds: number;
  avg_time_seconds: number;
}

export interface ImprovementPoint {
  submitted_at: string;
  paper_title: string;
  total_marks: number;
  max_marks: number;
  accuracy: number;
}

export interface TimeManagementSummary {
  total_time_seconds: number;
  avg_time_per_attempted_seconds: number;
  fastest_correct_seconds: number | null;
  slowest_incorrect_seconds: number | null;
  overtime_questions: number;
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
  subjects: StatBucket[];
  chapters: StatBucket[];
  sections: StatBucket[];
  difficulty: StatBucket[];
  weak_topics: StatBucket[];
  strong_topics: StatBucket[];
  improvement_graph: ImprovementPoint[];
  time_management: TimeManagementSummary;
  rank_prediction: string | null;
  percentile_prediction: number | null;
  personalized_study_plan: string[];
}

export async function pyqGetAnalytics(): Promise<AnalyticsResponse> {
  const { data } = await api.get<AnalyticsResponse>('/pyq/analytics');
  return data;
}

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

export interface StudyPlanTaskUpdate {
  title?: string;
  subject?: string;
  topic?: string;
  planned_date?: string;
  start_time?: string;
  duration_minutes?: number;
  priority?: string;
  notes?: string;
  reminder_enabled?: boolean;
  completed?: boolean;
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

export async function plannerGetSummary(): Promise<StudyPlannerSummary> {
  const { data } = await api.get<StudyPlannerSummary>('/planner/summary');
  return data;
}

export async function plannerCreateTask(input: StudyPlanTaskCreate): Promise<StudyPlanTask> {
  const { data } = await api.post<StudyPlanTask>('/planner/tasks', input);
  return data;
}

export async function plannerUpdateTask(taskId: string, input: StudyPlanTaskUpdate): Promise<StudyPlanTask> {
  const { data } = await api.patch<StudyPlanTask>(`/planner/tasks/${taskId}`, input);
  return data;
}

export async function plannerCompleteTask(taskId: string): Promise<StudyPlanTask> {
  const { data } = await api.post<StudyPlanTask>(`/planner/tasks/${taskId}/complete`);
  return data;
}

export async function plannerDeleteTask(taskId: string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/planner/tasks/${taskId}`);
  return data;
}

export async function plannerSetGoal(weekly_hours_goal: number): Promise<StudyPlannerSummary> {
  const { data } = await api.put<StudyPlannerSummary>('/planner/goal', { weekly_hours_goal });
  return data;
}

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

export async function notificationsList(): Promise<NotificationsResponse> {
  const { data } = await api.get<NotificationsResponse>('/notifications');
  return data;
}

export async function notificationsUnreadCount(): Promise<{ unread_count: number }> {
  const { data } = await api.get<{ unread_count: number }>('/notifications/unread-count');
  return data;
}

export async function notificationsMarkRead(notificationId: string): Promise<NotificationsResponse> {
  const { data } = await api.post<NotificationsResponse>(`/notifications/${encodeURIComponent(notificationId)}/read`);
  return data;
}

export async function notificationsMarkAllRead(): Promise<NotificationsResponse> {
  const { data } = await api.post<NotificationsResponse>('/notifications/read-all');
  return data;
}

export async function notificationsGetPreferences(): Promise<NotificationPreferences> {
  const { data } = await api.get<NotificationPreferences>('/notifications/preferences');
  return data;
}

export async function notificationsUpdatePreferences(
  input: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const { data } = await api.put<NotificationPreferences>('/notifications/preferences', input);
  return data;
}

export interface AdminAnnouncement extends NotificationItem {
  active: boolean;
  created_by: string;
}

export async function adminListAnnouncements(): Promise<AdminAnnouncement[]> {
  const { data } = await api.get<AdminAnnouncement[]>('/notifications/admin/announcements');
  return data;
}

export async function adminCreateAnnouncement(input: {
  title: string;
  message: string;
  action_route?: string;
  priority?: string;
  send_push?: boolean;
}): Promise<{ announcement: AdminAnnouncement; push: { sent: number; details: unknown } }> {
  const { data } = await api.post<{ announcement: AdminAnnouncement; push: { sent: number; details: unknown } }>(
    '/notifications/admin/announcements',
    input,
  );
  return data;
}

export async function adminDeactivateAnnouncement(announcementId: string): Promise<{ status: string }> {
  const { data } = await api.delete<{ status: string }>(`/notifications/admin/announcements/${encodeURIComponent(announcementId)}`);
  return data;
}
export interface ResourceBookRecommendation {
  subject: string;
  title: string;
  author: string;
  use_for: string;
}

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

export interface ErrorNotebookItem {
  notebook_id: string;
  attempt_id: string;
  paper_id: string;
  paper_title: string;
  submitted_at: string;
  question_id: string;
  subject: string | null;
  chapter: string | null;
  topic: string | null;
  difficulty: string | null;
  question_type: 'MCQ' | 'MSQ' | 'NAT';
  marks: number;
  marks_awarded: number;
  time_spent_seconds: number;
  question: string;
  options: Record<string, string> | null;
  image_url: string | null;
  given_answer: string | string[] | null;
  correct_answer: string | string[];
  explanation: string | null;
  solution_steps: string[] | null;
  resolved: boolean;
  status: string;
  note: string;
}

export interface ResourcesSummaryResponse {
  pyq_solutions: ResourcePYQSolution[];
  formula_sheets: ResourceFormulaSheet[];
  cheat_sheets: ResourceCheatSheet[];
  short_tricks: ResourceShortTrick[];
  book_recommendations: ResourceBookRecommendation[];
  error_notebook: ErrorNotebookItem[];
}

export async function resourcesGetSummary(): Promise<ResourcesSummaryResponse> {
  const { data } = await api.get<ResourcesSummaryResponse>('/resources/summary');
  return data;
}

export async function resourcesUpdateErrorNotebook(
  notebookId: string,
  input: { resolved?: boolean; note?: string },
): Promise<ResourcesSummaryResponse> {
  const { data } = await api.patch<ResourcesSummaryResponse>(`/resources/error-notebook/${encodeURIComponent(notebookId)}`, input);
  return data;
}
export async function aiTutor(input: { topic: string; level?: string }): Promise<{ answer: string }> {
  const { data } = await api.post<{ answer: string }>('/ai/tutor', input);
  return data;
}

export async function aiQuizGenerator(input: { topic: string; count?: number; difficulty?: string }): Promise<{ answer: string }> {
  const { data } = await api.post<{ answer: string }>('/ai/quiz-generator', input);
  return data;
}

export async function aiExamMentor(input: { concern: string }): Promise<{ answer: string }> {
  const { data } = await api.post<{ answer: string }>('/ai/exam-mentor', input);
  return data;
}

export async function aiRevisionPlan(input: { days: number; target: string }): Promise<{ answer: string }> {
  const { data } = await api.post<{ answer: string }>('/ai/revision-plan', input);
  return data;
}

export async function getExamInfo(): Promise<any> {
  const { data } = await api.get('/exam-info');
  return data;
}

export async function getMotivation(): Promise<any> {
  const { data } = await api.get('/motivation');
  return data;
}

export async function getRevision(): Promise<any> {
  const { data } = await api.get('/revision');
  return data;
}

export async function getCommunity(): Promise<any> {
  const { data } = await api.get('/community');
  return data;
}

export async function createCommunityPost(input: { title: string; content: string; category?: string }): Promise<any> {
  const { data } = await api.post('/community/posts', input);
  return data;
}
export interface AdminContentPayload {
  formula_sheets: ResourceFormulaSheet[];
  cheat_sheets: ResourceCheatSheet[];
  book_recommendations: ResourceBookRecommendation[];
  short_tricks: ResourceShortTrick[];
  exam_info: any;
  mentor_sessions: Array<{ title: string; status: string }>;
  learning_overrides: Record<string, any>;
}

export async function adminGetContent(): Promise<AdminContentPayload> {
  const { data } = await api.get<AdminContentPayload>('/admin/content');
  return data;
}

export async function adminSaveContent(input: Partial<AdminContentPayload>): Promise<AdminContentPayload> {
  const { data } = await api.put<AdminContentPayload>('/admin/content', input);
  return data;
}

export async function adminResetContent(): Promise<AdminContentPayload> {
  const { data } = await api.post<AdminContentPayload>('/admin/content/reset');
  return data;
}
export interface AdminDashboardUser {
  user_id: string;
  email: string;
  display_name: string;
  created_at: string | null;
  last_active_at: string | null;
  documents: number;
  storage_bytes: number;
  attempts: number;
  submitted_attempts: number;
  planner_tasks: number;
  completed_planner_tasks: number;
  daily_messages: number;
  monthly_tokens: number;
}

export interface AdminDashboardResponse {
  generated_at: string;
  users: {
    total: number;
    tracked_profiles: number;
    new_today: number;
    new_7d: number;
    new_30d: number;
    active_today: number;
    active_7d: number;
    active_30d: number;
  };
  activity: {
    documents: number;
    storage_bytes: number;
    pyq_attempts: number;
    submitted_attempts: number;
    planner_tasks: number;
    completed_planner_tasks: number;
    community_posts: number;
    daily_messages: number;
    monthly_tokens: number;
  };
  recent_users: AdminDashboardUser[];
}

export async function activityPing(input: { email?: string; display_name?: string }): Promise<{ status: string }> {
  const { data } = await api.post<{ status: string }>('/usage/activity', input);
  return data;
}

export async function adminGetDashboard(): Promise<AdminDashboardResponse> {
  const { data } = await api.get<AdminDashboardResponse>('/admin/dashboard');
  return data;
}
export default api;

// Learning syllabus

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

export interface LearningSubjectSummary {
  slug: string;
  name: string;
  exam_weight: string;
  description: string;
  topic_count: number;
}

export interface LearningSubjectDetail extends LearningSubjectSummary {
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

export async function learningGetSyllabus(): Promise<LearningSubjectDetail[]> {
  const { data } = await api.get<LearningSubjectDetail[]>('/learning/syllabus');
  return data;
}

export async function learningGetSubject(subjectSlug: string): Promise<LearningSubjectDetail> {
  const { data } = await api.get<LearningSubjectDetail>(`/learning/subjects/${subjectSlug}`);
  return data;
}

export async function learningGetProgress(): Promise<LearningProgressItem[]> {
  const { data } = await api.get<{ items: LearningProgressItem[] }>('/learning/progress');
  return data.items;
}

export async function learningUpdateProgress(topicKey: string, payload: { status?: string; bookmarked?: boolean }): Promise<LearningProgressItem> {
  const { data } = await api.put<LearningProgressItem>(`/learning/progress/${encodeURIComponent(topicKey)}`, payload);
  return data;
}

export async function learningDownloadSubjectPdf(subjectSlug: string): Promise<Blob> {
  const { data } = await api.get<Blob>(`/learning/subjects/${subjectSlug}/cheat-sheet.pdf`, { responseType: 'blob' });
  return data;
}

export async function learningDownloadAllPdf(): Promise<Blob> {
  const { data } = await api.get<Blob>('/learning/cheat-sheet.pdf', { responseType: 'blob' });
  return data;
}

export interface CodeExecutionResult {
  output: string;
  language: string;
  elapsed_ms: number;
  success: boolean;
}

export async function executeCodeSnippet(code: string, language: string = 'c'): Promise<CodeExecutionResult> {
  const { data } = await api.post<CodeExecutionResult>('/learning/execute-code', { code, language });
  return data;
}

export interface DictionaryLookupResult {
  word: string;
  phonetic?: string;
  meanings: Array<{
    partOfSpeech?: string;
    definitions?: string[];
    synonyms?: string[];
  }>;
}

export async function lookupDictionaryTerm(word: string): Promise<DictionaryLookupResult> {
  const { data } = await api.get<DictionaryLookupResult>(`/learning/dictionary/${encodeURIComponent(word)}`);
  return data;
}

export interface ResearchSection {
  id: string;
  title: string;
  type: string;
  summary: string;
  key_takeaways: string[];
  excerpt: string;
}

export interface ResearchFormulaVariable {
  symbol: string;
  meaning: string;
}

export interface ResearchFormula {
  id: string;
  name: string;
  section: string;
  latex: string;
  explanation: string;
  variables: ResearchFormulaVariable[];
  derivation_summary: string;
}

export interface ResearchTable {
  id: string;
  title: string;
  section: string;
  headers: string[];
  rows: string[][];
  key_insight: string;
  markdown?: string;
}

export interface ResearchGraphDataset {
  label: string;
  data: number[];
  color: string;
}

export interface ResearchGraph {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'radar';
  xAxisLabel: string;
  yAxisLabel: string;
  labels: string[];
  datasets: ResearchGraphDataset[];
  description: string;
}

export interface ResearchPaperSummary {
  paper_id: string;
  title: string;
  authors: string[];
  year: number;
  citation_count: string;
  tldr: string;
  section_count: number;
  formula_count: number;
  table_count: number;
}

export interface ResearchPaperDetail {
  paper_id: string;
  title: string;
  authors: string[];
  affiliation?: string;
  year: number;
  citation_count: string;
  tldr: string;
  abstract: string;
  sections: ResearchSection[];
  formulas: ResearchFormula[];
  tables: ResearchTable[];
  graphs: ResearchGraph[];
}

export interface ResearchChatReply {
  reply: string;
  citations: string[];
  paper_id: string;
}

export async function fetchResearchPapers(): Promise<{ papers: ResearchPaperSummary[] }> {
  try {
    const { data } = await api.get<{ papers: ResearchPaperSummary[] }>('/research/papers');
    return data;
  } catch {
    return {
      papers: [
        {
          paper_id: 'vaswani2017',
          title: 'Attention Is All You Need',
          authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'et al.'],
          year: 2017,
          citation_count: '145,000+',
          tldr: 'Introduced the Transformer architecture, replacing RNNs with self-attention mechanisms to achieve massive parallelizability.',
          section_count: 6,
          formula_count: 4,
          table_count: 2,
        },
        {
          paper_id: 'he2015resnet',
          title: 'Deep Residual Learning for Image Recognition',
          authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
          year: 2015,
          citation_count: '210,000+',
          tldr: 'Introduced deep residual learning framework (ResNet) with skip connections, enabling networks of 152+ layers.',
          section_count: 4,
          formula_count: 2,
          table_count: 1,
        },
      ],
    };
  }
}

export async function fetchResearchPaper(paperId: string): Promise<ResearchPaperDetail> {
  const { data } = await api.get<ResearchPaperDetail>(`/research/paper/${paperId}`);
  return data;
}

export async function uploadResearchPaper(file: File): Promise<ResearchPaperDetail> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<ResearchPaperDetail>('/research/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function sendResearchChatMessage(paperId: string, message: string): Promise<ResearchChatReply> {
  const { data } = await api.post<ResearchChatReply>('/research/chat', {
    paper_id: paperId,
    message,
  });
  return data;
}


