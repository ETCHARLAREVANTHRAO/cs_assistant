import { PYQAnswer } from '../../services/api';

export type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked' | 'answered_marked';

export interface QuestionUIState {
  visited: boolean;
  marked: boolean;
  answer: PYQAnswer;
}

export function questionStatus(state: QuestionUIState | undefined): QuestionStatus {
  if (!state || !state.visited) return 'not_visited';
  const hasAnswer = state.answer != null && (Array.isArray(state.answer) ? state.answer.length > 0 : state.answer !== '');
  if (state.marked) return hasAnswer ? 'answered_marked' : 'marked';
  return hasAnswer ? 'answered' : 'not_answered';
}
