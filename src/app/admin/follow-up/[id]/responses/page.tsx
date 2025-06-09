'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const mockPeriods = [
  { id: '2024-06-12', label: '2024-06-12' },
  { id: '2024-06-11', label: '2024-06-11' },
  { id: '2024-06-10', label: '2024-06-10' },
];

const mockFollowUp = {
  id: '1',
  name: 'Daily Standup',
  questions: [
    { id: 1, text: 'Previous work day progress' },
    { id: 2, text: 'Plans for today' },
    { id: 3, text: 'Any blockers?' },
  ],
  participants: [
    { id: '1', name: 'Alice', role: 'Developer', avatar: 'A' },
    { id: '2', name: 'Bob', role: 'Developer', avatar: 'B' },
    { id: '3', name: 'Carol', role: 'Developer', avatar: 'C' },
  ],
};

const mockSubmissions = [
  { userId: '1', submittedAt: '2024-06-12T09:10:00Z', answers: [
    { questionId: 1, answer: 'Finished feature X.' },
    { questionId: 2, answer: 'Start feature Y.' },
    { questionId: 3, answer: '' },
  ]},
  { userId: '3', submittedAt: '2024-06-12T09:15:00Z', answers: [
    { questionId: 1, answer: 'Reviewed PRs.' },
    { questionId: 2, answer: 'Bug fixes.' },
    { questionId: 3, answer: 'Waiting for review.' },
  ]},
];

const completionRate = `${mockSubmissions.length}/${mockFollowUp.participants.length}`;
const allSubmitted = mockSubmissions.length === mockFollowUp.participants.length;
const blockers = mockSubmissions.filter(r => r.answers.find(a => a.questionId === 3 && a.answer)).length;

export default function FollowUpResponsesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(mockPeriods[0].id);
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header and back button */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ChevronLeft className="w-5 h-5" /></Button>
        <h1 className="text-2xl font-bold">Responses</h1>
        <span className="text-muted-foreground ml-2">for <span className="font-semibold">{mockFollowUp.name}</span></span>
      </div>
      {/* Period selector and summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="font-medium">Period:</span>
          <select
            className="border rounded px-2 py-1"
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
          >
            {mockPeriods.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-2 text-base">
            <span role="img" aria-label="clap">👏</span> {allSubmitted ? 'All users filled out the reports' : `${completionRate} submitted`}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-2 text-base">
            <span role="img" aria-label="fire">🔥</span> {blockers} blocker{blockers === 1 ? '' : 's'} or attention point{blockers === 1 ? '' : 's'} reported
          </Badge>
        </div>
      </div>
      {/* Questions/Answers as cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockFollowUp.questions.map(q => (
          <Card key={q.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg text-center">{q.text}{q.id === 3 && <span className="ml-1" role="img" aria-label="fire">🔥</span>}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              {mockFollowUp.participants.map(user => {
                const response = mockSubmissions.find(r => r.userId === user.id);
                const answer = response?.answers.find(a => a.questionId === q.id)?.answer;
                const notSubmitted = !response;
                return (
                  <div
                    key={user.id}
                    className={
                      'flex gap-3 items-start border-t pt-3 first:border-t-0 first:pt-0' +
                      (notSubmitted ? ' bg-red-50' : '')
                    }
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-lg">
                      {user.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name}</span>
                        {notSubmitted && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold">Not Submitted</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">{user.role}</div>
                      <div className="text-base">
                        {answer ? (
                          answer
                        ) : (
                          <span className="italic text-red-600 flex items-center gap-1">
                            <svg width={16} height={16} fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                            No response
                          </span>
                        )}
                      </div>
                      {response && (
                        <div className="text-xs text-muted-foreground mt-1">Posted {Math.floor((Date.now() - new Date(response.submittedAt).getTime()) / 60000)} minutes ago</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 