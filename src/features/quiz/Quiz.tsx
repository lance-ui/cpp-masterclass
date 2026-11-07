import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, RotateCcw, Award, HelpCircle } from 'lucide-react';
import { QuizQuestion } from '@/types';
import { calculateQuizScore } from '@/utils/courseLogic';

interface QuizProps {
  moduleId: string;
  moduleTitle: string;
  questions: QuizQuestion[];
  savedScore?: number;
  onSaveScore: (moduleId: string, percentage: number) => void;
}

export const Quiz: React.FC<QuizProps> = ({
  moduleId,
  moduleTitle,
  questions,
  savedScore,
  onSaveScore
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (submitted) return; // Prevent changing after submission
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const scoreResult = calculateQuizScore(selectedAnswers, questions);
    onSaveScore(moduleId, scoreResult.percentage);

    if (scoreResult.passed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const result = submitted ? calculateQuizScore(selectedAnswers, questions) : null;
  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = answeredCount === questions.length;

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        <p className="text-sm">Knowledge check questions for this module are being generated.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
      {/* Quiz Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            Knowledge Check: {moduleTitle}
          </h3>
          <p className="text-xs text-slate-500">
            {questions.length} Questions • 70% required to pass
          </p>
        </div>

        {savedScore !== undefined && !submitted && (
          <div className="px-3 py-1 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 rounded-xl text-xs font-semibold text-brand-700 dark:text-brand-400">
            Previous High Score: {savedScore}%
          </div>
        )}
      </div>

      {/* Result Card when submitted */}
      {result && (
        <div 
          className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
            result.passed
              ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800 text-brand-900 dark:text-brand-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-extrabold">{result.percentage}%</span>
              <span className="text-sm font-semibold">
                ({result.score} of {result.total} Correct)
              </span>
            </div>
            <p className="text-xs mt-1">
              {result.passed
                ? '🎉 Excellent work! You passed this module quiz.'
                : 'Review the explanations below and try again to improve your score.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Quiz</span>
          </button>
        </div>
      )}

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, qIndex) => {
          const userAnswer = selectedAnswers[q.id];
          const isCorrect = submitted && userAnswer === q.correctAnswer;
          const isWrong = submitted && userAnswer !== undefined && userAnswer !== q.correctAnswer;

          return (
            <div 
              key={q.id}
              className={`p-4 rounded-xl border transition-all ${
                submitted
                  ? isCorrect
                    ? 'border-brand-300 dark:border-brand-800 bg-brand-50/30 dark:bg-brand-950/20'
                    : 'border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs font-medium text-[var(--app-tertiary)]">
                  Question {qIndex + 1} of {questions.length}
                </span>
                {submitted && (
                  <span className="flex items-center space-x-1 text-xs font-bold">
                    {isCorrect ? (
                      <span className="text-brand-600 dark:text-brand-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Correct
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Incorrect
                      </span>
                    )}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                {q.question}
              </h4>

              <div className="space-y-2">
                {q.options.map((option, optIndex) => {
                  const isSelected = userAnswer === optIndex;
                  const isThisCorrect = submitted && optIndex === q.correctAnswer;

                  return (
                    <label
                      key={optIndex}
                      onClick={() => handleSelectOption(q.id, optIndex)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                        submitted
                          ? isThisCorrect
                            ? 'bg-brand-100 dark:bg-brand-950/80 border-brand-400 text-brand-900 dark:text-brand-200 font-semibold'
                            : isSelected
                            ? 'bg-red-100 dark:bg-red-950/80 border-red-400 text-red-900 dark:text-red-200'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 opacity-60'
                          : isSelected
                          ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-900 dark:text-brand-300 font-semibold shadow-2xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                            isSelected
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && '✓'}
                        </div>
                        <span>{option}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              {submitted && q.explanation && (
                <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold block text-slate-900 dark:text-white mb-0.5">Explanation:</span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}

        {!submitted && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              {answeredCount} of {questions.length} answered
            </span>
            <button
              type="submit"
              disabled={!allAnswered}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              Submit Answers
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
