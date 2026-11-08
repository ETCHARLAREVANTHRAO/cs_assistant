from pydantic import BaseModel, Field
from typing import Any, Literal, Optional


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    knowledge_mode: Literal["server", "local", "hybrid"] = "hybrid"


class ChatResponse(BaseModel):
    reply: str
    sources: list[str] = []
    knowledge_mode: Literal["server", "local", "hybrid"] = "hybrid"
    roadmap: Optional[dict[str, Any]] = None


class LocalChatRequest(BaseModel):
    message: str
    max_tokens: int = 128
    temperature: float = 0.2


class LocalChatResponse(BaseModel):
    reply: str
    model_path: str
    runner_path: str
    elapsed_seconds: float

class DocumentUploadResponse(BaseModel):
    filename: str
    chunks_stored: int
    message: str


class DocumentListResponse(BaseModel):
    documents: list[str]
    used_bytes: int = 0
    limit_bytes: int = 0




class DoubtSolveResponse(BaseModel):
    answer: str
    extracted_text: str = ""


class StudyPlanTaskCreate(BaseModel):
    title: str
    subject: str = ""
    topic: str = ""
    planned_date: str
    start_time: str = ""
    duration_minutes: int = 60
    priority: str = "medium"
    notes: str = ""
    reminder_enabled: bool = True


class StudyPlanTaskUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    planned_date: Optional[str] = None
    start_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    priority: Optional[str] = None
    notes: Optional[str] = None
    reminder_enabled: Optional[bool] = None
    completed: Optional[bool] = None


class StudyPlanTask(BaseModel):
    task_id: str
    title: str
    subject: str = ""
    topic: str = ""
    planned_date: str
    start_time: str = ""
    duration_minutes: int
    priority: str = "medium"
    notes: str = ""
    reminder_enabled: bool = True
    completed: bool = False
    completed_at: Optional[str] = None
    created_at: str
    updated_at: str


class StudyGoalUpdate(BaseModel):
    weekly_hours_goal: float


class StudyPlannerSummary(BaseModel):
    tasks: list[StudyPlanTask]
    today_key: str
    weekly_hours_goal: float
    weekly_completed_minutes: int
    weekly_planned_minutes: int
    completion_rate: float
    current_streak: int
    longest_streak: int
    completed_today: bool
    revision_reminders: list[StudyPlanTask]


class NotificationPreferences(BaseModel):
    revision_reminders: bool = True
    quiz_alerts: bool = True
    exam_updates: bool = True
    system_updates: bool = True
    daily_challenge: bool = True
    push_enabled: bool = False


class NotificationItem(BaseModel):
    notification_id: str
    title: str
    message: str
    type: str
    created_at: str
    read: bool = False
    action_route: Optional[str] = None
    priority: str = "normal"


class NotificationsResponse(BaseModel):
    notifications: list[NotificationItem]
    unread_count: int
    preferences: NotificationPreferences


class NotificationPreferencesUpdate(BaseModel):
    revision_reminders: Optional[bool] = None
    quiz_alerts: Optional[bool] = None
    exam_updates: Optional[bool] = None
    system_updates: Optional[bool] = None
    daily_challenge: Optional[bool] = None
    push_enabled: Optional[bool] = None


class PushTokenRegistration(BaseModel):
    token: str
    platform: str = "unknown"
    device_name: str = ""


class AdminAnnouncementCreate(BaseModel):
    title: str
    message: str
    action_route: Optional[str] = None
    priority: str = "normal"
    send_push: bool = False


class AdminAnnouncement(NotificationItem):
    active: bool = True
    created_by: str = ""

class ResourceFormulaSheet(BaseModel):
    subject: str
    chapter: str
    formulas: list[str]


class ResourceCheatSheet(BaseModel):
    subject: str
    chapter: str
    points: list[str]


class ResourceBookRecommendation(BaseModel):
    subject: str
    title: str
    author: str
    use_for: str


class ResourceShortTrick(BaseModel):
    subject: str
    title: str
    trick: str
    example: str = ""


class ResourcePYQSolution(BaseModel):
    paper_id: str
    paper_title: str
    question_id: str
    subject: Optional[str] = None
    chapter: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    question_type: str
    marks: float
    question: str
    options: Optional[dict[str, str]] = None
    image_url: Optional[str] = None
    correct_answer: Any
    explanation: Optional[str] = None
    solution_steps: Optional[list[str]] = None


class ErrorNotebookItem(BaseModel):
    notebook_id: str
    attempt_id: str
    paper_id: str
    paper_title: str
    submitted_at: str
    question_id: str
    subject: Optional[str] = None
    chapter: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    question_type: str
    marks: float
    marks_awarded: float
    time_spent_seconds: int = 0
    question: str
    options: Optional[dict[str, str]] = None
    image_url: Optional[str] = None
    given_answer: Optional[Any] = None
    correct_answer: Any
    explanation: Optional[str] = None
    solution_steps: Optional[list[str]] = None
    resolved: bool = False
    status: str = "needs_revision"
    note: str = ""


class ErrorNotebookUpdate(BaseModel):
    resolved: Optional[bool] = None
    note: Optional[str] = None


class ResourcesSummaryResponse(BaseModel):
    pyq_solutions: list[ResourcePYQSolution]
    book_recommendations: list[ResourceBookRecommendation]
    formula_sheets: list[ResourceFormulaSheet]
    cheat_sheets: list[ResourceCheatSheet]
    short_tricks: list[ResourceShortTrick]
    error_notebook: list[ErrorNotebookItem]

class WeatherResponse(BaseModel):
    city: str
    temperature_c: float
    feels_like_c: float
    description: str
    humidity: int
    wind_speed_ms: float
    icon: str


# â”€â”€ GATE PYQ mock test â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

# Learning syllabus

class VideoLecture(BaseModel):
    title: str
    provider: str = "youtube"
    url: str
    embed_url: Optional[str] = None
    duration_minutes: Optional[int] = None


class LearningReferenceLink(BaseModel):
    title: str
    url: str
    type: str = "reference"


class LearningFlashcard(BaseModel):
    front: str
    back: str


class LearningDiagramEdge(BaseModel):
    from_: str = Field(alias="from")
    to: str

    class Config:
        populate_by_name = True


class LearningDiagram(BaseModel):
    title: str
    type: str = "concept_map"
    nodes: list[str] = []
    edges: list[LearningDiagramEdge] = []


class LearningQuizQuestion(BaseModel):
    question: str
    options: list[str]
    answer: str
    explanation: str = ""


class LearningPYQMatch(BaseModel):
    subject: str = ""
    chapter: str = ""
    name: str
    question_count: int = 0


class LearningWorkedExample(BaseModel):
    title: str
    problem: str
    solution: str


class LearningNoteSection(BaseModel):
    heading: str
    body: str


class LearningRevisionScheduleItem(BaseModel):
    when: str
    task: str


class LearningTopic(BaseModel):
    slug: str
    title: str
    priority: int
    difficulty: str = "Medium"
    estimated_study_minutes: int = 60
    status: str = "planned"
    concepts: list[str]
    written_notes: str = ""
    revision_summary: str = ""
    notes_by_language: dict[str, str] = {}
    revision_by_language: dict[str, str] = {}
    deep_notes: list[LearningNoteSection] = []
    formula_sheet: list[str] = []
    mind_map: list[str] = []
    pyq_concepts: list[str] = []
    common_mistakes: list[str] = []
    practice_tasks: list[str] = []
    study_flow: list[str] = []
    prerequisites: list[str] = []
    learning_outcomes: list[str] = []
    quick_checks: list[str] = []
    flashcards: list[LearningFlashcard] = []
    interview_prompts: list[str] = []
    diagram: Optional[LearningDiagram] = None
    quiz_questions: list[LearningQuizQuestion] = []
    worked_examples: list[LearningWorkedExample] = []
    memory_hooks: list[str] = []
    reading_pointers: list[str] = []
    revision_schedule: list[LearningRevisionScheduleItem] = []
    mastery_rubric: list[str] = []
    pyq_matches: list[LearningPYQMatch] = []
    pyq_match_count: int = 0
    reference_links: list[LearningReferenceLink] = []
    video_lectures: list[VideoLecture] = []


class LearningSubjectSummary(BaseModel):
    slug: str
    name: str
    exam_weight: str
    description: str
    topic_count: int


class LearningSubjectDetail(BaseModel):
    slug: str
    name: str
    exam_weight: str
    description: str
    topic_count: int = 0
    pyq_subject: str = ""
    pyq_available: bool = False
    curated_resources: list[LearningReferenceLink] = []
    roadmap: list[str] = []
    exam_strategy: list[str] = []
    milestones: list[str] = []
    topics: list[LearningTopic]


class LearningProgressItem(BaseModel):
    topic_key: str
    status: str = "not-started"
    bookmarked: bool = False
    updated_at: Optional[str] = None


class LearningProgressUpdate(BaseModel):
    status: Optional[str] = None
    bookmarked: Optional[bool] = None


class LearningProgressResponse(BaseModel):
    items: list[LearningProgressItem] = []

class PYQSectionSummary(BaseModel):
    section: str
    section_title: str
    question_count: int
    total_marks: float


class PYQPaperSummary(BaseModel):
    paper_id: str
    title: str
    year: int
    shift: int
    duration_minutes: int
    total_questions: int
    total_marks: float
    sections: list[PYQSectionSummary]


class PYQQuestionPublic(BaseModel):
    question_id: str
    question_type: str
    section: str
    section_title: str
    subject: Optional[str] = None
    chapter: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    question: str
    image_url: Optional[str] = None
    options: Optional[dict[str, str]] = None
    marks: float
    negative_marking: float


class PYQPaperDetail(PYQPaperSummary):
    questions: list[PYQQuestionPublic]


class PYQAttemptStartResponse(BaseModel):
    attempt_id: str
    started_at: str
    duration_minutes: int
    paper: PYQPaperDetail


class PYQSubmitRequest(BaseModel):
    answers: dict[str, Any] = {}
    time_spent_seconds: dict[str, int] = {}


class PYQQuestionResult(BaseModel):
    question_id: str
    section: str
    section_title: str
    subject: Optional[str] = None
    chapter: Optional[str] = None
    question_type: str
    marks: float
    negative_marking: float
    given_answer: Optional[Any] = None
    correct_answer: Any
    status: str
    marks_awarded: float
    time_spent_seconds: int = 0
    question: str
    options: Optional[dict[str, str]] = None
    image_url: Optional[str] = None
    explanation: Optional[str] = None
    solution_steps: Optional[list[str]] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None


class PYQSectionResult(BaseModel):
    section: str
    section_title: str
    total_questions: int
    time_spent_seconds: int = 0
    attempted: int
    correct: int
    incorrect: int
    unattempted: int
    max_marks: float
    marks_scored: float


class PYQResult(BaseModel):
    attempt_id: str
    paper_id: str
    paper_title: str
    total_marks: float
    max_marks: float
    correct: int
    incorrect: int
    unattempted: int
    duration_minutes: int
    time_taken_seconds: int
    submitted_at: str
    sections: list[PYQSectionResult]
    questions: list[PYQQuestionResult]


class PYQAttemptSummary(BaseModel):
    attempt_id: str
    paper_id: str
    paper_title: str
    total_marks: float
    max_marks: float
    submitted_at: str


# â”€â”€ Topic practice, daily practice, analytics, AI explain â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class PracticeStartRequest(BaseModel):
    subjects: list[str] = []
    chapters: list[str] = []
    topics: list[str] = []
    sections: list[str] = []
    difficulty: list[str] = []
    question_types: list[str] = []
    count: int = 15


class StreakInfo(BaseModel):
    current_streak: int
    longest_streak: int
    completed_today: bool


class DailyPracticeResponse(PYQAttemptStartResponse):
    already_submitted: bool = False
    streak: StreakInfo


class TopicFrequency(BaseModel):
    topic: str
    question_count: int
    total_marks: float




class PracticeOption(BaseModel):
    name: str
    question_count: int


class PracticeChapterOption(PracticeOption):
    subject: str


class PracticeTopicOption(PracticeOption):
    subject: str
    chapter: str


class PracticeTaxonomyResponse(BaseModel):
    subjects: list[PracticeOption]
    chapters: list[PracticeChapterOption]
    topics: list[PracticeTopicOption]
    difficulty: list[PracticeOption]
    question_types: list[PracticeOption]

class StatBucket(BaseModel):
    key: str
    attempted: int
    correct: int
    incorrect: int
    unattempted: int
    accuracy: float
    total_time_seconds: int = 0
    avg_time_seconds: float = 0.0




class ImprovementPoint(BaseModel):
    submitted_at: str
    paper_title: str
    total_marks: float
    max_marks: float
    accuracy: float


class TimeManagementSummary(BaseModel):
    total_time_seconds: int
    avg_time_per_attempted_seconds: float
    fastest_correct_seconds: Optional[int] = None
    slowest_incorrect_seconds: Optional[int] = None
    overtime_questions: int

class AnalyticsResponse(BaseModel):
    total_attempts: int
    total_marks: float
    total_max_marks: float
    overall_accuracy: float
    correct: int
    incorrect: int
    unattempted: int
    topics: list[StatBucket]
    subjects: list[StatBucket]
    chapters: list[StatBucket]
    sections: list[StatBucket]
    difficulty: list[StatBucket]
    weak_topics: list[StatBucket]
    strong_topics: list[StatBucket]
    improvement_graph: list[ImprovementPoint] = []
    time_management: TimeManagementSummary
    rank_prediction: Optional[str] = None
    percentile_prediction: Optional[float] = None
    personalized_study_plan: list[str] = []


class ExplainRequest(BaseModel):
    question: str
    options: Optional[dict[str, str]] = None
    question_type: str
    correct_answer: Any
    given_answer: Optional[Any] = None
    topic: Optional[str] = None
    explanation: Optional[str] = None


class ExplainResponse(BaseModel):
    explanation: str


class CodeExecutionRequest(BaseModel):
    code: str
    language: str = "c"


class CodeExecutionResponse(BaseModel):
    output: str
    language: str
    elapsed_ms: int
    success: bool

