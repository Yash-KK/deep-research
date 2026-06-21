import { ArrowUp, Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { createJob } from '../api/jobs';

interface Props {
  onJobCreated: () => void;
}

export default function QuestionForm({ onJobCreated }: Props) {
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;

    setSubmitting(true);
    try {
      await createJob(q);
      setQuestion('');
      toast.success("Research queued — we'll get back to you shortly!", {
        icon: '🔍',
        duration: 4000,
      });
      onJobCreated();
    } catch {
      toast.error('Failed to submit question. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <form onSubmit={handleSubmit}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder="Ask anything… What are the latest AI safety developments? How does the US housing market look in 2025?"
          className="w-full text-gray-900 placeholder-gray-400 text-sm resize-none focus:outline-none leading-relaxed"
          disabled={submitting}
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Press <kbd className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">Enter</kbd> to submit,{' '}
            <kbd className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">Shift+Enter</kbd> for new line
          </p>
          <button
            type="submit"
            disabled={!question.trim() || submitting}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ArrowUp size={14} />
            )}
            {submitting ? 'Queuing…' : 'Research'}
          </button>
        </div>
      </form>
    </div>
  );
}
