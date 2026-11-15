import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import {
  fetchFlashcardDecks,
  reviewFlashcardSm2,
  type FlashcardDeck,
  type FlashcardItem,
} from '../services/api';

export default function Flashcards() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('os');
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reviewedCount, setReviewedCount] = useState<number>(0);
  const [cardStates, setCardStates] = useState<Record<string, { reps: number; interval: number; ease: number }>>({});

  useEffect(() => {
    setIsLoading(true);
    fetchFlashcardDecks()
      .then((data) => {
        setDecks(data);
        if (data.length > 0) {
          setSelectedDeckId(data[0].deck_id);
          const initialStates: Record<string, { reps: number; interval: number; ease: number }> = {};
          data.forEach((d) => {
            d.cards.forEach((c) => {
              initialStates[c.id] = {
                reps: c.reps || 0,
                interval: c.interval_days || 1,
                ease: c.ease_factor || 2.5,
              };
            });
          });
          setCardStates(initialStates);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const currentDeck = decks.find((d) => d.deck_id === selectedDeckId) || decks[0];
  const cards = currentDeck?.cards || [];
  const currentCard: FlashcardItem | undefined = cards[currentCardIndex];

  // Handle SM-2 Review
  const handleReview = useCallback(
    async (rating: number) => {
      if (!currentCard) return;

      const currentStats = cardStates[currentCard.id] || { reps: 0, interval: 1, ease: 2.5 };
      try {
        const result = await reviewFlashcardSm2(
          currentCard.id,
          rating,
          currentStats.reps,
          currentStats.interval,
          currentStats.ease
        );

        setCardStates((prev) => ({
          ...prev,
          [currentCard.id]: {
            reps: result.reps,
            interval: result.interval_days,
            ease: result.ease_factor,
          },
        }));

        setReviewedCount((prev) => prev + 1);

        // Next card
        setIsFlipped(false);
        if (currentCardIndex + 1 < cards.length) {
          setCurrentCardIndex((prev) => prev + 1);
        } else {
          setCurrentCardIndex(0); // Loop back or complete
        }
      } catch {
        // Fallback next
        setIsFlipped(false);
        setCurrentCardIndex((prev) => (prev + 1) % cards.length);
      }
    },
    [currentCard, cardStates, currentCardIndex, cards.length]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleReview(0);
        else if (e.key === '2') handleReview(1);
        else if (e.key === '3') handleReview(2);
        else if (e.key === '4') handleReview(3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handleReview]);

  const currentCardStats = currentCard
    ? cardStates[currentCard.id] || { reps: 0, interval: 1, ease: 2.5 }
    : { reps: 0, interval: 1, ease: 2.5 };

  return (
    <Layout activePage="flashcards" title="GATE CS Flashcards">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900/60 via-teal-900/40 to-slate-900/80 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">psychology</span>
                <span>Spaced-Repetition Active Recall</span>
              </div>
              <h1 className="text-2xl font-black text-white">GATE CS SM-2 Flashcards</h1>
              <p className="text-sm text-slate-300 mt-1">
                Optimized with the SuperMemo-2 cognitive memory algorithm. Never forget formulas or subtle exam traps.
              </p>
            </div>

            {/* Session Stats */}
            <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-bold">Session Reviews</div>
                <div className="text-lg font-black text-emerald-400 font-mono">{reviewedCount}</div>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-bold">Deck Progress</div>
                <div className="text-lg font-black text-teal-300 font-mono">
                  {cards.length > 0 ? `${currentCardIndex + 1} / ${cards.length}` : '0 / 0'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deck Selector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {decks.map((deck) => (
            <button
              key={deck.deck_id}
              onClick={() => {
                setSelectedDeckId(deck.deck_id);
                setCurrentCardIndex(0);
                setIsFlipped(false);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                selectedDeckId === deck.deck_id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{deck.icon}</span>
              <span>{deck.title}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800/40 text-slate-300 font-mono">
                {deck.cards.length}
              </span>
            </button>
          ))}
        </div>

        {/* Main Card Arena */}
        {isLoading ? (
          <div className="h-80 flex items-center justify-center text-slate-400 text-sm">
            <span className="material-symbols-outlined text-3xl animate-spin mr-2">progress_activity</span>
            Loading flashcard decks...
          </div>
        ) : !currentCard ? (
          <div className="h-80 flex flex-col items-center justify-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">style</span>
            <span>No cards available in this deck.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 3D Flip Card Container */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="cursor-pointer select-none perspective-[1000px] h-96 w-full group"
            >
              <div
                className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
                  isFlipped ? '[transform:rotateY(180deg)]' : ''
                }`}
              >
                {/* Front Side */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">school</span>
                      <span>{currentDeck.subject}</span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Card {currentCardIndex + 1} of {cards.length}</span>
                  </div>

                  <div className="text-center px-4 my-auto">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-relaxed">
                      {currentCard.front}
                    </h2>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">keyboard</span>
                      <span>Press Space or click to flip</span>
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span>Reps: {currentCardStats.reps}</span>
                      <span>•</span>
                      <span>Interval: {currentCardStats.interval}d</span>
                    </div>
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-8 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>Detailed Answer & GATE Analysis</span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Flip to front</span>
                  </div>

                  <div className="space-y-4 my-auto overflow-y-auto max-h-56 pr-2">
                    <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                      {currentCard.back}
                    </p>

                    {currentCard.formula && (
                      <div className="bg-slate-100 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 rounded-xl p-3">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Standard Formula / Law:</div>
                        <div className="font-mono text-xs font-bold text-teal-300">{currentCard.formula}</div>
                      </div>
                    )}

                    {currentCard.exam_trap && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
                        <span className="material-symbols-outlined text-amber-400 text-sm mt-0.5">warning</span>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-amber-400">Frequent GATE Exam Trap:</div>
                          <div className="text-xs text-amber-200/90 mt-0.5">{currentCard.exam_trap}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    Rate recall difficulty below to schedule next review
                  </div>
                </div>
              </div>
            </div>

            {/* SM-2 Recall Rating Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-400 mb-3 text-center uppercase tracking-wider">
                How easily did you recall this answer?
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1: Again */}
                <button
                  onClick={() => handleReview(0)}
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 transition flex flex-col items-center gap-1 group"
                >
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <span>Again</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-rose-500/20 rounded-sm">1</span>
                  </div>
                  <span className="text-[10px] text-rose-300/70">Forgot (1 day)</span>
                </button>

                {/* 2: Hard */}
                <button
                  onClick={() => handleReview(1)}
                  className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 transition flex flex-col items-center gap-1 group"
                >
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <span>Hard</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/20 rounded-sm">2</span>
                  </div>
                  <span className="text-[10px] text-amber-300/70">Struggled (2 days)</span>
                </button>

                {/* 3: Good */}
                <button
                  onClick={() => handleReview(2)}
                  className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 transition flex flex-col items-center gap-1 group"
                >
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <span>Good</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-500/20 rounded-sm">3</span>
                  </div>
                  <span className="text-[10px] text-blue-300/70">Ideal recall (4 days)</span>
                </button>

                {/* 4: Easy */}
                <button
                  onClick={() => handleReview(3)}
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 transition flex flex-col items-center gap-1 group"
                >
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <span>Easy</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-500/20 rounded-sm">4</span>
                  </div>
                  <span className="text-[10px] text-emerald-300/70">Instant (7+ days)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
