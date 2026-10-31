import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Card, EmptyState, Pill, ScreenShell, theme } from '../components/MobileScaffold';
import { learningApi, LearningSubjectDetail, LearningTopic } from '../services/api';

const progressOptions = ['not-started', 'learning', 'revised', 'mastered'] as const;
type TopicProgress = (typeof progressOptions)[number];
const topicTabs = ['Overview', 'Learn', 'Practice', 'Revise', 'Videos', 'AI Tutor'] as const;
type TopicTab = (typeof topicTabs)[number];

export default function LearningScreen() {
  const navigation = useNavigation<any>();
  const [subjects, setSubjects] = useState<LearningSubjectDetail[]>([]);
  const [subjectSlug, setSubjectSlug] = useState('');
  const [topicSlug, setTopicSlug] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [progress, setProgress] = useState<Record<string, TopicProgress>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('learning-topic-progress'),
      AsyncStorage.getItem('learning-topic-bookmarks'),
    ])
      .then(([storedProgress, storedBookmarks]) => {
        setProgress(JSON.parse(storedProgress || '{}'));
        setBookmarks(JSON.parse(storedBookmarks || '{}'));
      })
      .catch(() => {});

    learningApi.progress()
      .then((items) => {
        const nextProgress: Record<string, TopicProgress> = {};
        const nextBookmarks: Record<string, boolean> = {};
        for (const item of items) {
          if (progressOptions.includes(item.status as TopicProgress)) {
            nextProgress[item.topic_key] = item.status as TopicProgress;
          }
          nextBookmarks[item.topic_key] = item.bookmarked;
        }
        setProgress(nextProgress);
        setBookmarks(nextBookmarks);
        AsyncStorage.setItem('learning-topic-progress', JSON.stringify(nextProgress)).catch(() => {});
        AsyncStorage.setItem('learning-topic-bookmarks', JSON.stringify(nextBookmarks)).catch(() => {});
      })
      .catch(() => {});

    learningApi.syllabus()
      .then((data) => {
        setSubjects(data);
        setSubjectSlug(data[0]?.slug ?? '');
        setTopicSlug(data[0]?.topics[0]?.slug ?? '');
      })
      .catch(() => setError('Could not load syllabus.'))
      .finally(() => setLoading(false));
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const visibleSubjects = useMemo(
    () =>
      subjects.filter((subject) => {
        const hasSaved = subject.topics.some((topic) => bookmarks[`${subject.slug}:${topic.slug}`]);
        if (showSavedOnly && !hasSaved) return false;
        if (!normalizedSearch) return true;
            const subjectText = `${subject.name} ${subject.description}`.toLowerCase();
            const topicHit = subject.topics.some((topic) =>
              `${topic.title} ${topic.concepts.join(' ')} ${topic.pyq_concepts.join(' ')}`.toLowerCase().includes(normalizedSearch),
            );
            return subjectText.includes(normalizedSearch) || topicHit;
          }),
    [bookmarks, normalizedSearch, showSavedOnly, subjects],
  );

  const activeSubject = useMemo(
    () => visibleSubjects.find((s) => s.slug === subjectSlug) ?? visibleSubjects[0] ?? subjects[0],
    [subjects, subjectSlug, visibleSubjects],
  );
  const visibleTopics = useMemo(() => {
    if (!activeSubject) return [];
    return activeSubject.topics.filter((topic) => {
      if (showSavedOnly && !bookmarks[`${activeSubject.slug}:${topic.slug}`]) return false;
      if (!normalizedSearch) return true;
      return `${topic.title} ${topic.concepts.join(' ')} ${topic.pyq_concepts.join(' ')}`.toLowerCase().includes(normalizedSearch);
    });
  }, [activeSubject, bookmarks, normalizedSearch, showSavedOnly]);
  const activeTopic = useMemo(
    () => visibleTopics.find((t) => t.slug === topicSlug) ?? visibleTopics[0] ?? activeSubject?.topics[0],
    [activeSubject, topicSlug, visibleTopics],
  );
  const savedCount = Object.values(bookmarks).filter(Boolean).length;
  const revisedCount = Object.values(progress).filter((value) => value === 'revised' || value === 'mastered').length;
  const masteredCount = Object.values(progress).filter((value) => value === 'mastered').length;
  const flattenedTopics = subjects.flatMap((subject) =>
    subject.topics.map((topic) => ({
      subject,
      topic,
      key: topicKey(subject.slug, topic.slug),
    })),
  );
  const continueItem =
    flattenedTopics.find((item) => progress[item.key] === 'learning') ??
    flattenedTopics.find((item) => progress[item.key] === 'revised') ??
    flattenedTopics.find((item) => bookmarks[item.key]) ??
    flattenedTopics[0];
  const recommendedItems = flattenedTopics
    .filter((item) => progress[item.key] !== 'mastered')
    .sort((a, b) => {
      const pyqDelta = b.topic.pyq_match_count - a.topic.pyq_match_count;
      if (pyqDelta !== 0) return pyqDelta;
      return a.topic.priority - b.topic.priority;
    })
    .slice(0, 3);
  const learningGoals = [
    { title: 'GATE CS', description: 'Syllabus, PYQs, revision, and mock-test flow.', match: 'operating-systems' },
    { title: 'Placements', description: 'DSA, CS fundamentals, aptitude, and interviews.', match: 'data-structures' },
    { title: 'Master Computer Science', description: 'Core CS from fundamentals to systems.', match: 'computer-organization' },
    { title: 'AI & Machine Learning', description: 'Math, ML, DL, NLP, and model foundations.', match: 'machine-learning' },
    { title: 'Generative AI', description: 'Transformers, LLMs, RAG, agents, and AI apps.', match: 'generative-ai' },
    { title: 'Build Projects', description: 'Turn topics into practical portfolio work.', match: 'software-engineering' },
  ];
  const learningPaths = [
    { title: 'GATE CS Roadmap', steps: ['Programming & DSA', 'Core CS', 'Mathematics', 'PYQ practice', 'Mock tests'] },
    { title: 'AI/ML Roadmap', steps: ['Python', 'Math for AI', 'Machine Learning', 'Deep Learning', 'NLP', 'Generative AI'] },
    { title: 'Placement Roadmap', steps: ['DSA patterns', 'DBMS/OS/CN', 'Aptitude', 'Interview prompts', 'Projects'] },
    { title: 'Core CS Roadmap', steps: ['Programming', 'Data structures', 'Algorithms', 'Systems', 'Software engineering'] },
  ];

  function topicKey(subject: string, topic: string) {
    return `${subject}:${topic}`;
  }

  function jumpToTopic(subject: LearningSubjectDetail, topic: LearningTopic) {
    setSubjectSlug(subject.slug);
    setTopicSlug(topic.slug);
  }

  function chooseGoal(match: string) {
    const subject =
      subjects.find((item) => item.slug === match) ??
      subjects.find((item) => item.slug.includes(match) || item.name.toLowerCase().includes(match.replace(/-/g, ' '))) ??
      subjects[0];
    if (subject) {
      setSubjectSlug(subject.slug);
      setTopicSlug(subject.topics[0]?.slug ?? '');
    }
  }

  async function updateProgress(key: string, value: TopicProgress) {
    const next = { ...progress, [key]: value };
    setProgress(next);
    await AsyncStorage.setItem('learning-topic-progress', JSON.stringify(next));
    learningApi.updateProgress(key, { status: value }).catch(() => {});
  }

  async function toggleBookmark(key: string) {
    const next = { ...bookmarks, [key]: !bookmarks[key] };
    setBookmarks(next);
    await AsyncStorage.setItem('learning-topic-bookmarks', JSON.stringify(next));
    learningApi.updateProgress(key, { bookmarked: next[key] }).catch(() => {});
  }

  function shareSubjectSheet(subject: LearningSubjectDetail) {
    const message = [
      subject.name,
      '',
      subject.description,
      '',
      'Roadmap',
      ...subject.roadmap.map((item) => `- ${item}`),
      '',
      'Exam Strategy',
      ...subject.exam_strategy.map((item) => `- ${item}`),
      '',
      'Topics',
      ...subject.topics.map((topic) => `- ${topic.title}: ${topic.difficulty}, ${topic.estimated_study_minutes} min`),
    ].join('\n');
    Share.share({ title: `${subject.name} Complete Sheet`, message }).catch(() => {});
  }

  return (
    <ScreenShell title="Learning" subtitle="Subject-wise GATE CS syllabus, notes, formulas, and PYQ concepts.">
      {loading ? (
        <View style={local.center}><ActivityIndicator color={theme.primary} /></View>
      ) : error ? (
        <View style={local.center}><Text style={local.error}>{error}</Text></View>
      ) : !activeSubject || !activeTopic ? (
        <EmptyState title="No syllabus found" />
      ) : (
        <ScrollView contentContainerStyle={local.scroll}>
          <View style={local.metrics}>
            <Metric label="Saved" value={savedCount} />
            <Metric label="Revised" value={revisedCount} />
            <Metric label="Mastered" value={masteredCount} />
          </View>

          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search subjects, topics, concepts, PYQ"
            placeholderTextColor={theme.muted}
            style={local.search}
          />
          <TouchableOpacity style={[local.filterButton, showSavedOnly && local.filterButtonActive]} onPress={() => setShowSavedOnly((value) => !value)}>
            <Text style={[local.filterText, showSavedOnly && { color: '#fff' }]}>Saved only</Text>
          </TouchableOpacity>
          <View style={local.languageRow}>
            <TouchableOpacity style={[local.languageButton, language === 'en' && local.languageButtonActive]} onPress={() => setLanguage('en')}>
              <Text style={[local.filterText, language === 'en' && { color: '#fff' }]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[local.languageButton, language === 'hi' && local.languageButtonActive]} onPress={() => setLanguage('hi')}>
              <Text style={[local.filterText, language === 'hi' && { color: '#fff' }]}>Hindi</Text>
            </TouchableOpacity>
          </View>

          {continueItem ? (
            <Card>
              <Text style={local.section}>Continue Learning</Text>
              <Text style={local.videoMeta}>{continueItem.subject.name}</Text>
              <Text style={local.topicTitle}>{continueItem.topic.title}</Text>
              <View style={local.progressTrack}>
                <View
                  style={[
                    local.progressFill,
                    {
                      width: progress[continueItem.key] === 'mastered'
                        ? '100%'
                        : progress[continueItem.key] === 'revised'
                          ? '72%'
                          : progress[continueItem.key] === 'learning'
                            ? '42%'
                            : '12%',
                    },
                  ]}
                />
              </View>
              <TouchableOpacity style={local.primaryAction} onPress={() => jumpToTopic(continueItem.subject, continueItem.topic)}>
                <Text style={local.primaryActionText}>Continue</Text>
              </TouchableOpacity>
            </Card>
          ) : null}

          <Text style={local.section}>Choose Your Goal</Text>
          <View style={local.goalGrid}>
            {learningGoals.map((goal) => (
              <TouchableOpacity key={goal.title} style={local.goalCard} onPress={() => chooseGoal(goal.match)}>
                <Text style={local.videoTitle}>{goal.title}</Text>
                <Text style={local.videoMeta}>{goal.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={local.section}>Recommended Next</Text>
          {recommendedItems.map((item) => (
            <TouchableOpacity key={item.key} style={local.recommendCard} onPress={() => jumpToTopic(item.subject, item.topic)}>
              <Text style={local.videoMeta}>{item.subject.name}</Text>
              <Text style={local.videoTitle}>{item.topic.title}</Text>
              <Text style={local.videoOpen}>{item.topic.pyq_match_count} linked PYQs</Text>
            </TouchableOpacity>
          ))}

          <Text style={local.section}>Learning Paths</Text>
          {learningPaths.map((path) => (
            <Card key={path.title}>
              <Text style={local.cardTitle}>{path.title}</Text>
              <View style={local.pathWrap}>
                {path.steps.map((step, index) => (
                  <Text key={step} style={local.pathStep}>{index + 1}. {step}</Text>
                ))}
              </View>
            </Card>
          ))}

          <Text style={local.section}>Explore All Subjects</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {visibleSubjects.map((subject) => {
              const active = subject.slug === activeSubject.slug;
              return (
                <TouchableOpacity
                  key={subject.slug}
                  style={[local.subjectChip, active && local.subjectChipActive]}
                  onPress={() => {
                    setSubjectSlug(subject.slug);
                    setTopicSlug(subject.topics[0]?.slug ?? '');
                  }}
                >
                  <Text style={[local.subjectChipText, active && { color: '#fff' }]}>{subject.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Card>
            <View style={local.subjectTop}>
              <Text style={local.subjectTitle}>{activeSubject.name}</Text>
              <Pill label={activeSubject.exam_weight} tone={activeSubject.exam_weight === 'Very High' ? 'danger' : 'primary'} />
            </View>
            {activeSubject.pyq_available ? <Pill label="PYQ linked" tone="success" /> : null}
            <Text style={local.muted}>{activeSubject.description}</Text>
            <TouchableOpacity style={local.saveButton} onPress={() => shareSubjectSheet(activeSubject)}>
              <Text style={local.saveText}>Share subject sheet</Text>
            </TouchableOpacity>
          </Card>

          <ListCard title="Subject Roadmap" items={activeSubject.roadmap} />
          <ListCard title="Exam Strategy" items={activeSubject.exam_strategy} />
          <ListCard title="Milestones" items={activeSubject.milestones} />
          <SubjectResourceCard subject={activeSubject} />

          <Text style={local.section}>Topics</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {visibleTopics.map((topic) => (
              <TouchableOpacity
                key={topic.slug}
                style={[local.topicChip, topic.slug === activeTopic.slug && local.topicChipActive]}
                onPress={() => setTopicSlug(topic.slug)}
              >
                <Text style={[local.topicChipText, topic.slug === activeTopic.slug && { color: '#fff' }]}>{topic.title}</Text>
                {bookmarks[topicKey(activeSubject.slug, topic.slug)] ? <Text style={local.bookmarkMark}>Saved</Text> : null}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TopicPanel
            topic={activeTopic}
            progressValue={progress[topicKey(activeSubject.slug, activeTopic.slug)] ?? 'not-started'}
            bookmarked={!!bookmarks[topicKey(activeSubject.slug, activeTopic.slug)]}
            onProgress={(value) => updateProgress(topicKey(activeSubject.slug, activeTopic.slug), value)}
            onBookmark={() => toggleBookmark(topicKey(activeSubject.slug, activeTopic.slug))}
            onPractice={() => navigation.navigate('PYQTab', { practiceTopic: activeTopic.title, practiceSubject: activeSubject.pyq_subject })}
            language={language}
          />
        </ScrollView>
      )}
    </ScreenShell>
  );
}

function SubjectResourceCard({ subject }: { subject: LearningSubjectDetail }) {
  return (
    <Card>
      <Text style={local.cardTitle}>Curated Resources</Text>
      {subject.curated_resources.map((link) => (
        <TouchableOpacity key={link.url} style={local.videoRow} onPress={() => Linking.openURL(link.url)}>
          <View style={{ flex: 1 }}>
            <Text style={local.videoTitle}>{link.title}</Text>
            <Text style={local.videoMeta}>{link.type}</Text>
          </View>
          <Text style={local.videoOpen}>Open</Text>
        </TouchableOpacity>
      ))}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={local.metric}>
      <Text style={local.metricLabel}>{label}</Text>
      <Text style={local.metricValue}>{value}</Text>
    </View>
  );
}

function TopicPanel({
  topic,
  progressValue,
  bookmarked,
  onProgress,
  onBookmark,
  onPractice,
  language,
}: {
  topic: LearningTopic;
  progressValue: TopicProgress;
  bookmarked: boolean;
  onProgress: (value: TopicProgress) => void;
  onBookmark: () => void;
  onPractice: () => void;
  language: 'en' | 'hi';
}) {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TopicTab>('Overview');
  const writtenNotes = topic.notes_by_language[language] || topic.written_notes;
  const revisionNotes = topic.revision_by_language[language] || topic.revision_summary;

  useEffect(() => {
    setActiveTab('Overview');
  }, [topic.slug]);

  const shareCheatSheet = () => {
    const message = [
      topic.title,
      '',
      `Difficulty: ${topic.difficulty}`,
      `Estimated study time: ${topic.estimated_study_minutes} minutes`,
      '',
      'Written Notes',
      writtenNotes,
      '',
      'Formula Sheet',
      ...topic.formula_sheet.map((item) => `- ${item}`),
      '',
      'PYQ Concepts',
      ...topic.pyq_concepts.map((item) => `- ${item}`),
    ].join('\n');
    Share.share({ title: `${topic.title} Cheat Sheet`, message }).catch(() => {});
  };

  return (
    <>
      <Card>
        <View style={local.topicActions}>
          <Pill label={`Priority ${topic.priority}`} tone="amber" />
          <Pill label={topic.difficulty} tone={topic.difficulty === 'Hard' ? 'danger' : 'primary'} />
          <Pill label={`${topic.estimated_study_minutes} min`} tone="primary" />
          {topic.pyq_match_count > 0 ? <Pill label={`${topic.pyq_match_count} PYQs`} tone="success" /> : null}
        </View>
        <Text style={local.topicTitle}>{topic.title}</Text>
        <Text style={local.muted}>{writtenNotes || revisionNotes || 'Study notes are ready for this topic.'}</Text>
        <TouchableOpacity style={local.saveButton} onPress={onBookmark}>
          <Text style={local.saveText}>{bookmarked ? 'Saved topic' : 'Save topic'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={local.saveButton} onPress={shareCheatSheet}>
          <Text style={local.saveText}>Share cheat sheet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={local.primaryAction} onPress={onPractice}>
          <Text style={local.primaryActionText}>Open PYQ practice</Text>
        </TouchableOpacity>
        <View style={local.progressWrap}>
          {progressOptions.map((option) => (
            <TouchableOpacity key={option} style={[local.progressButton, option === progressValue && local.progressButtonActive]} onPress={() => onProgress(option)}>
              <Text style={[local.progressText, option === progressValue && { color: '#fff' }]}>{option.replace('-', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={local.tabScroller}>
          {topicTabs.map((tab) => (
            <TouchableOpacity key={tab} style={[local.topicTab, activeTab === tab && local.topicTabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[local.topicTabText, activeTab === tab && { color: '#fff' }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>

      {activeTab === 'Overview' ? (
        <>
          <StudyQuestCard topic={topic} />
          <ExamSprintCard topic={topic} />
          <ListCard title="Prerequisites" items={topic.prerequisites} />
          <ListCard title="Learning Outcomes" items={topic.learning_outcomes} />
          <ListCard title="Study Flow" items={topic.study_flow} />
          <ListCard title="Mastery Rubric" items={topic.mastery_rubric} />
        </>
      ) : null}

      {activeTab === 'Learn' ? (
        <>
          <DiagramCard topic={topic} />
          <TextCard title="Written Notes" text={writtenNotes} />
          <ListCard title="Core Concepts" items={topic.concepts} />
          <ListCard title="Formula Sheet" items={topic.formula_sheet.length ? topic.formula_sheet : topic.concepts.slice(0, 4)} />
          <ListCard title="Mind Map" items={topic.mind_map} />
          <ListCard title="Reading Pointers" items={topic.reading_pointers} />
          <DeepNotesCard topic={topic} />
          <WorkedExamplesCard topic={topic} />
        </>
      ) : null}

      {activeTab === 'Practice' ? (
        <>
          <ListCard title="Practice Tasks" items={topic.practice_tasks} />
          <ListCard title="Quick Checks" items={topic.quick_checks} />
          <ListCard title="PYQ Concepts" items={topic.pyq_concepts} />
          <MistakeDrillCard topic={topic} />
          <TopicQuizCard topic={topic} />
          <PYQMatchesCard topic={topic} />
        </>
      ) : null}

      {activeTab === 'Revise' ? (
        <>
          <FocusTimerCard topic={topic} />
          <ConfidenceMeterCard topic={topic} />
          <TextCard title="Revision Summary" text={revisionNotes} />
          <ListCard title="Common Mistakes" items={topic.common_mistakes} />
          <ListCard title="Memory Hooks" items={topic.memory_hooks} />
          <RevisionScheduleCard topic={topic} />
          <FlashcardCard topic={topic} />
        </>
      ) : null}

      {activeTab === 'Videos' ? (
        <>
          <VideoCard topic={topic} />
          <ReferenceCard topic={topic} />
        </>
      ) : null}

      {activeTab === 'AI Tutor' ? (
        <AITutorCard
          topic={topic}
          onPrompt={(prompt) => navigation.navigate('ChatTab', { prompt })}
        />
      ) : null}
    </>
  );
}

function AITutorCard({ topic, onPrompt }: { topic: LearningTopic; onPrompt: (prompt: string) => void }) {
  const actions = [
    `Explain ${topic.title} simpler`,
    `Give one worked example on ${topic.concepts[0] ?? topic.title}`,
    `Generate 5 questions from ${topic.title}`,
    'Show related GATE PYQ patterns',
    `Summarize ${topic.title} for revision`,
    'Teach me interactively',
  ];

  return (
    <Card>
      <Text style={local.cardTitle}>AI Tutor Actions</Text>
      {actions.map((action) => (
        <TouchableOpacity key={action} style={local.aiAction} onPress={() => onPrompt(action)}>
          <Text style={local.videoTitle}>{action}</Text>
        </TouchableOpacity>
      ))}
    </Card>
  );
}

function PYQMatchesCard({ topic }: { topic: LearningTopic }) {
  if (!topic.pyq_matches.length) return null;
  return (
    <Card>
      <Text style={local.cardTitle}>Matched PYQ Practice</Text>
      {topic.pyq_matches.map((match) => (
        <View key={`${match.chapter}-${match.name}`} style={local.flashcard}>
          <Text style={local.videoTitle}>{match.name}</Text>
          <Text style={local.videoMeta}>{match.question_count} questions</Text>
        </View>
      ))}
    </Card>
  );
}

function DeepNotesCard({ topic }: { topic: LearningTopic }) {
  return (
    <Card>
      <Text style={local.cardTitle}>Deep Notes</Text>
      {topic.deep_notes.map((section) => (
        <View key={section.heading} style={local.flashcard}>
          <Text style={local.videoTitle}>{section.heading}</Text>
          <Text style={local.videoMeta}>{section.body}</Text>
        </View>
      ))}
    </Card>
  );
}

function RevisionScheduleCard({ topic }: { topic: LearningTopic }) {
  return (
    <Card>
      <Text style={local.cardTitle}>Revision Schedule</Text>
      {topic.revision_schedule.map((item) => (
        <View key={item.when} style={local.flashcard}>
          <Text style={local.videoTitle}>{item.when}</Text>
          <Text style={local.videoMeta}>{item.task}</Text>
        </View>
      ))}
    </Card>
  );
}

function WorkedExamplesCard({ topic }: { topic: LearningTopic }) {
  return (
    <Card>
      <Text style={local.cardTitle}>Worked Examples</Text>
      {topic.worked_examples.map((example) => (
        <View key={example.title} style={local.flashcard}>
          <Text style={local.videoTitle}>{example.title}</Text>
          <Text style={local.videoMeta}>{example.problem}</Text>
          <Text style={local.exampleSolution}>{example.solution}</Text>
        </View>
      ))}
    </Card>
  );
}

function FocusTimerCard({ topic }: { topic: LearningTopic }) {
  const [secondsLeft, setSecondsLeft] = useState(Math.min(topic.estimated_study_minutes, 25) * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setSecondsLeft(Math.min(topic.estimated_study_minutes, 25) * 60);
    setRunning(false);
  }, [topic.slug, topic.estimated_study_minutes]);

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          clearInterval(timer);
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const seconds = (secondsLeft % 60).toString().padStart(2, '0');

  return (
    <Card>
      <Text style={local.cardTitle}>Focus Timer</Text>
      <Text style={local.timerText}>{minutes}:{seconds}</Text>
      <Text style={local.videoMeta}>Use this for one focused pass on notes, examples, or PYQs.</Text>
      <View style={local.progressWrap}>
        <TouchableOpacity style={local.primaryAction} onPress={() => setRunning((value) => !value)}>
          <Text style={local.primaryActionText}>{running ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={local.progressButton} onPress={() => { setRunning(false); setSecondsLeft(5 * 60); }}>
          <Text style={local.progressText}>5 min</Text>
        </TouchableOpacity>
        <TouchableOpacity style={local.progressButton} onPress={() => { setRunning(false); setSecondsLeft(25 * 60); }}>
          <Text style={local.progressText}>25 min</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function StudyQuestCard({ topic }: { topic: LearningTopic }) {
  const [done, setDone] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setDone({});
  }, [topic.slug]);

  const steps = [
    `Read: ${topic.deep_notes[0]?.heading ?? 'Core notes'}`,
    `Recall: ${topic.flashcards[0]?.front ?? topic.concepts[0] ?? topic.title}`,
    `Solve: ${topic.practice_tasks[0] ?? 'one practice task'}`,
    `Check: ${topic.quiz_questions[0]?.question ?? 'one quick question'}`,
    `Revise: ${topic.revision_schedule[0]?.task ?? 'add this topic to revision'}`,
  ];
  const completed = steps.filter((_, index) => done[index]).length;

  return (
    <Card>
      <View style={local.cardHeaderRow}>
        <Text style={local.cardTitle}>Study Quest</Text>
        <Text style={local.questCount}>{completed}/{steps.length}</Text>
      </View>
      {steps.map((step, index) => (
        <TouchableOpacity
          key={step}
          style={[local.questStep, done[index] && local.questStepDone]}
          onPress={() => setDone((current) => ({ ...current, [index]: !current[index] }))}
        >
          <Text style={local.questMark}>{done[index] ? '[x]' : '[ ]'}</Text>
          <Text style={local.questText}>{step}</Text>
        </TouchableOpacity>
      ))}
    </Card>
  );
}

function ExamSprintCard({ topic }: { topic: LearningTopic }) {
  const cards = [
    { label: 'Must Know', value: topic.formula_sheet[0] ?? topic.concepts[0] ?? topic.title },
    { label: 'PYQ Trigger', value: topic.pyq_concepts[0] ?? topic.concepts[1] ?? topic.title },
    { label: 'Avoid', value: topic.common_mistakes[0] ?? 'Do not skip edge cases.' },
    { label: 'Do Now', value: topic.practice_tasks[0] ?? topic.quick_checks[0] ?? 'Solve one previous-year style question.' },
  ];

  return (
    <Card>
      <Text style={local.cardTitle}>Exam Sprint</Text>
      {cards.map((card) => (
        <View key={card.label} style={local.sprintRow}>
          <Text style={local.sprintLabel}>{card.label}</Text>
          <Text style={local.sprintText}>{card.value}</Text>
        </View>
      ))}
    </Card>
  );
}

function ConfidenceMeterCard({ topic }: { topic: LearningTopic }) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    setLevel(0);
  }, [topic.slug]);

  const labels = ['Lost', 'Warm', 'Steady', 'Ready', 'Exam ready'];
  const nextAction =
    level >= 4
      ? topic.pyq_concepts[0] ?? 'Attempt a timed PYQ set now.'
      : level >= 2
        ? topic.practice_tasks[0] ?? 'Solve two practice problems before moving on.'
        : topic.deep_notes[0]?.heading ?? 'Start with the first notes section.';

  return (
    <Card>
      <Text style={local.cardTitle}>Confidence Meter</Text>
      <View style={local.confidenceRow}>
        {labels.map((label, index) => (
          <TouchableOpacity
            key={label}
            style={[local.confidenceButton, index < level && local.confidenceButtonActive]}
            onPress={() => setLevel(index + 1)}
          >
            <Text style={[local.confidenceNumber, index < level && { color: '#fff' }]}>{index + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={local.sprintLabel}>{level ? labels[level - 1] : 'Rate your confidence'}</Text>
      <Text style={local.sprintText}>{nextAction}</Text>
    </Card>
  );
}

function MistakeDrillCard({ topic }: { topic: LearningTopic }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const mistakes = topic.common_mistakes.length ? topic.common_mistakes : ['Skipping edge cases before checking the final answer.'];
  const mistake = mistakes[activeIndex % mistakes.length];
  const correction = topic.quick_checks[activeIndex % Math.max(1, topic.quick_checks.length)] ?? 'Explain the correct reasoning in one clean sentence.';

  useEffect(() => {
    setActiveIndex(0);
    setRevealed(false);
  }, [topic.slug]);

  return (
    <Card>
      <View style={local.cardHeaderRow}>
        <Text style={local.cardTitle}>Mistake Drill</Text>
        <Text style={local.videoMeta}>{activeIndex + 1}/{mistakes.length}</Text>
      </View>
      <Text style={local.videoTitle}>{mistake}</Text>
      {revealed ? <Text style={local.drillFix}>{correction}</Text> : null}
      <View style={local.progressWrap}>
        <TouchableOpacity style={local.primaryAction} onPress={() => setRevealed((value) => !value)}>
          <Text style={local.primaryActionText}>{revealed ? 'Hide Fix' : 'Show Fix'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={local.progressButton}
          onPress={() => {
            setActiveIndex((index) => (index + 1) % mistakes.length);
            setRevealed(false);
          }}
        >
          <Text style={local.progressText}>Next</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function DiagramCard({ topic }: { topic: LearningTopic }) {
  if (!topic.diagram) return null;
  return (
    <Card>
      <Text style={local.cardTitle}>Concept Diagram</Text>
      <View style={local.diagramWrap}>
        {topic.diagram.nodes.map((node, index) => (
          <Text key={node} style={[local.diagramNode, index === 0 && local.diagramNodeMain]}>{node}</Text>
        ))}
      </View>
    </Card>
  );
}

function TextCard({ title, text }: { title: string; text: string }) {
  return (
    <Card>
      <Text style={local.cardTitle}>{title}</Text>
      <Text style={local.muted}>{text || 'Revision notes are ready for this topic.'}</Text>
    </Card>
  );
}

function TopicQuizCard({ topic }: { topic: LearningTopic }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  return (
    <Card>
      <Text style={local.cardTitle}>Topic Quiz</Text>
      {topic.quiz_questions.map((question, index) => {
        const selected = answers[index];
        return (
          <View key={question.question} style={local.quizQuestion}>
            <Text style={local.videoTitle}>{question.question}</Text>
            {question.options.map((option) => {
              const isSelected = selected === option;
              const isCorrect = selected && option === question.answer;
              return (
                <TouchableOpacity
                  key={option}
                  style={[local.quizOption, isCorrect && local.quizOptionCorrect, isSelected && !isCorrect && local.quizOptionWrong]}
                  onPress={() => setAnswers((current) => ({ ...current, [index]: option }))}
                >
                  <Text style={[local.quizOptionText, (isCorrect || (isSelected && !isCorrect)) && { color: '#fff' }]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
            {selected ? (
              <Text style={local.videoMeta}>
                {selected === question.answer ? 'Correct. ' : `Correct answer: ${question.answer}. `}
                {question.explanation}
              </Text>
            ) : null}
          </View>
        );
      })}
    </Card>
  );
}

function FlashcardCard({ topic }: { topic: LearningTopic }) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setRevealed({});
  }, [topic.slug]);

  return (
    <Card>
      <View style={local.cardHeaderRow}>
        <Text style={local.cardTitle}>Flashcards</Text>
        <TouchableOpacity onPress={() => setRevealed({})}>
          <Text style={local.videoOpen}>Reset</Text>
        </TouchableOpacity>
      </View>
      {topic.flashcards.length ? topic.flashcards.map((card) => (
        <TouchableOpacity
          key={`${card.front}-${card.back}`}
          style={[local.flashcard, revealed[topic.flashcards.indexOf(card)] && local.flashcardRevealed]}
          onPress={() => {
            const index = topic.flashcards.indexOf(card);
            setRevealed((current) => ({ ...current, [index]: !current[index] }));
          }}
        >
          <Text style={local.videoMeta}>{revealed[topic.flashcards.indexOf(card)] ? 'Answer' : 'Prompt'}</Text>
          <Text style={local.videoTitle}>{revealed[topic.flashcards.indexOf(card)] ? card.back : card.front}</Text>
          <Text style={local.videoOpen}>{revealed[topic.flashcards.indexOf(card)] ? 'Tap to hide' : 'Tap to reveal'}</Text>
        </TouchableOpacity>
      )) : (
        <Text style={local.listItem}>- Flashcards are ready.</Text>
      )}
    </Card>
  );
}

function ReferenceCard({ topic }: { topic: LearningTopic }) {
  return (
    <Card>
      <Text style={local.cardTitle}>Reference Links</Text>
      {topic.reference_links.length ? topic.reference_links.map((link) => (
        <TouchableOpacity key={link.url} style={local.videoRow} onPress={() => Linking.openURL(link.url)}>
          <View style={{ flex: 1 }}>
            <Text style={local.videoTitle}>{link.title}</Text>
            <Text style={local.videoMeta}>{link.type}</Text>
          </View>
          <Text style={local.videoOpen}>Open</Text>
        </TouchableOpacity>
      )) : (
        <Text style={local.listItem}>- Reference links are ready.</Text>
      )}
    </Card>
  );
}

function VideoCard({ topic }: { topic: LearningTopic }) {
  return (
    <Card>
      <Text style={local.cardTitle}>Video Lectures</Text>
      {topic.video_lectures.length ? topic.video_lectures.map((video) => (
        <TouchableOpacity key={video.url} style={local.videoRow} onPress={() => Linking.openURL(video.url)}>
          <View style={{ flex: 1 }}>
            <Text style={local.videoTitle}>{video.title}</Text>
            <Text style={local.videoMeta}>{video.provider}</Text>
          </View>
          <Text style={local.videoOpen}>Open</Text>
        </TouchableOpacity>
      )) : (
        <Text style={local.listItem}>- Video slots are ready.</Text>
      )}
    </Card>
  );
}

function ListCard({ title, items, empty = 'No items yet.' }: { title: string; items: string[]; empty?: string }) {
  return (
    <Card>
      <Text style={local.cardTitle}>{title}</Text>
      {(items.length ? items : [empty]).slice(0, 10).map((item, index) => (
        <Text key={`${item}-${index}`} style={local.listItem}>- {item}</Text>
      ))}
    </Card>
  );
}

const local = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 36 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: theme.danger },
  metrics: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metric: { flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 9, backgroundColor: theme.surface, padding: 10 },
  metricLabel: { color: theme.muted, fontSize: 10, fontWeight: '800' },
  metricValue: { color: theme.primary, fontSize: 18, fontWeight: '900', marginTop: 2 },
  search: { color: theme.text, borderWidth: 1, borderColor: theme.border, borderRadius: 10, backgroundColor: theme.surface, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12, fontSize: 13, fontWeight: '700' },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  goalCard: { width: '48%', minHeight: 112, borderWidth: 1, borderColor: theme.border, borderRadius: 9, backgroundColor: theme.surface, padding: 12 },
  recommendCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 9, backgroundColor: theme.surface, padding: 12, marginBottom: 8 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: theme.bg, overflow: 'hidden', marginTop: 10 },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: theme.primary },
  pathWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pathStep: { color: theme.muted, fontSize: 11, fontWeight: '800', borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: theme.bg },
  filterButton: { alignSelf: 'flex-start', borderWidth: 1, borderColor: theme.border, borderRadius: 9, backgroundColor: theme.surface, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 12 },
  filterButtonActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  filterText: { color: theme.muted, fontSize: 12, fontWeight: '900' },
  languageRow: { flexDirection: 'row', alignSelf: 'flex-start', borderWidth: 1, borderColor: theme.border, borderRadius: 9, overflow: 'hidden', marginBottom: 12 },
  languageButton: { paddingHorizontal: 12, paddingVertical: 9, backgroundColor: theme.surface },
  languageButtonActive: { backgroundColor: theme.primary },
  bookmarkMark: { color: theme.primary, fontSize: 10, fontWeight: '900', marginTop: 3 },
  subjectChip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, marginRight: 8 },
  subjectChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  subjectChipText: { color: theme.muted, fontWeight: '800', fontSize: 12 },
  subjectTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  subjectTitle: { color: theme.text, fontSize: 18, fontWeight: '900', flex: 1 },
  muted: { color: theme.muted, fontSize: 13, lineHeight: 20 },
  section: { color: theme.text, fontWeight: '900', fontSize: 15, marginBottom: 9 },
  topicChip: { maxWidth: 210, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 9, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, marginRight: 8 },
  topicChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  topicChipText: { color: theme.muted, fontWeight: '800', fontSize: 12 },
  topicTitle: { color: theme.text, fontWeight: '900', fontSize: 19, marginTop: 10, marginBottom: 8 },
  timerText: { color: theme.primary, fontSize: 32, fontWeight: '900', marginBottom: 4 },
  questCount: { color: theme.primary, fontSize: 12, fontWeight: '900', backgroundColor: theme.primaryFixed, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  questStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderWidth: 1, borderColor: theme.border, borderRadius: 9, padding: 11, backgroundColor: theme.bg, marginBottom: 8 },
  questStepDone: { borderColor: theme.success, backgroundColor: '#ecfdf5' },
  questMark: { color: theme.primary, fontWeight: '900', fontSize: 14, width: 18 },
  questText: { color: theme.text, fontSize: 12, lineHeight: 18, fontWeight: '700', flex: 1 },
  sprintRow: { borderWidth: 1, borderColor: theme.border, borderRadius: 9, padding: 11, backgroundColor: theme.bg, marginBottom: 8 },
  sprintLabel: { color: theme.primary, fontWeight: '900', fontSize: 11, marginBottom: 3 },
  sprintText: { color: theme.text, fontWeight: '700', fontSize: 12, lineHeight: 18 },
  confidenceRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  confidenceButton: { flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 9, paddingVertical: 10, alignItems: 'center', backgroundColor: theme.bg },
  confidenceButtonActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  confidenceNumber: { color: theme.muted, fontWeight: '900', fontSize: 12 },
  drillFix: { color: theme.primary, fontWeight: '700', fontSize: 12, lineHeight: 18, backgroundColor: theme.primaryFixed, borderRadius: 9, padding: 10, marginTop: 10 },
  topicActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  saveButton: { marginTop: 12, borderWidth: 1, borderColor: theme.border, borderRadius: 9, paddingVertical: 10, alignItems: 'center' },
  saveText: { color: theme.primary, fontWeight: '900', fontSize: 12 },
  primaryAction: { marginTop: 12, borderRadius: 9, paddingVertical: 11, alignItems: 'center', backgroundColor: theme.primary },
  primaryActionText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  progressWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  progressButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: theme.bg },
  progressButtonActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  progressText: { color: theme.muted, fontWeight: '900', fontSize: 11, textTransform: 'capitalize' },
  tabScroller: { marginTop: 12 },
  topicTab: { borderWidth: 1, borderColor: theme.border, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.bg, marginRight: 8 },
  topicTabActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  topicTabText: { color: theme.muted, fontWeight: '900', fontSize: 11 },
  aiAction: { borderWidth: 1, borderColor: theme.border, borderRadius: 9, padding: 12, backgroundColor: theme.bg, marginBottom: 8 },
  cardTitle: { color: theme.text, fontSize: 15, fontWeight: '900', marginBottom: 8 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  listItem: { color: theme.muted, fontSize: 13, lineHeight: 20, marginBottom: 5 },
  videoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.border, borderRadius: 9, padding: 12, backgroundColor: theme.bg },
  videoTitle: { color: theme.text, fontWeight: '800', fontSize: 13 },
  videoMeta: { color: theme.muted, fontSize: 12, marginTop: 3 },
  videoOpen: { color: theme.primary, fontWeight: '900', fontSize: 12 },
  exampleSolution: { color: theme.text, fontSize: 12, lineHeight: 18, marginTop: 6 },
  flashcard: { borderWidth: 1, borderColor: theme.border, borderRadius: 9, padding: 12, backgroundColor: theme.bg, marginBottom: 8 },
  flashcardRevealed: { borderColor: theme.primary, backgroundColor: theme.primaryFixed },
  diagramWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diagramNode: { color: theme.text, borderWidth: 1, borderColor: theme.border, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: theme.bg, fontSize: 12, fontWeight: '800' },
  diagramNodeMain: { color: '#fff', backgroundColor: theme.primary, borderColor: theme.primary },
  quizQuestion: { borderWidth: 1, borderColor: theme.border, borderRadius: 9, padding: 12, backgroundColor: theme.bg, marginBottom: 10 },
  quizOption: { borderWidth: 1, borderColor: theme.border, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 9, marginTop: 8 },
  quizOptionCorrect: { backgroundColor: theme.success, borderColor: theme.success },
  quizOptionWrong: { backgroundColor: theme.danger, borderColor: theme.danger },
  quizOptionText: { color: theme.muted, fontWeight: '800', fontSize: 12 },
});
