'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, CalendarDays, ChevronLeft, Pencil, BarChart2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const mockFollowUp = {
  id: '1',
  name: 'Daily Standup',
  description: 'Daily check-in for team members',
  frequency: 'Daily',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  reminderTime: '09:00',
  participants: [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Carol' },
  ],
  questions: [
    { id: 1, text: 'What did you complete yesterday?' },
    { id: 2, text: 'What will you work on today?' },
    { id: 3, text: 'Any blockers?' },
  ],
};

export default function FollowUpDetailPage() {
  const router = useRouter();
  return (
    <div className="max-w-5xl mx-auto py-8">
      <Button variant="ghost" className="mb-4" onClick={() => router.push('/admin/follow-up')}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to list
      </Button>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <CardTitle className="text-xl flex-1">{mockFollowUp.name}</CardTitle>
            <Badge variant="outline" className="uppercase text-xs">{mockFollowUp.frequency}</Badge>
          </div>
          <CardDescription className="mb-2 text-muted-foreground line-clamp-2">{mockFollowUp.description}</CardDescription>
          <div className="flex flex-wrap gap-2 mb-2">
            {mockFollowUp.days.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1"><CalendarDays className="w-4 h-4" />{mockFollowUp.days.join(', ')}</Badge>
            )}
            {mockFollowUp.reminderTime && (
              <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-4 h-4" />{mockFollowUp.reminderTime}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="font-semibold mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Participants ({mockFollowUp.participants.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {mockFollowUp.participants.map(u => (
                <Badge key={u.id} variant="secondary">{u.name}</Badge>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">Responses</span>
              <span className="text-muted-foreground">2/3 submitted</span>
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => router.push(`/admin/follow-up/${mockFollowUp.id}/responses`)}>
                View All Responses
              </Button>
            </div>
            <div className="flex gap-2">
              <Badge variant="default">Alice: Submitted</Badge>
              <Badge variant="default">Carol: Submitted</Badge>
              <Badge variant="secondary">Bob: Not Submitted</Badge>
            </div>
          </div>
          <div className="mb-6">
            <div className="font-semibold mb-2">Questions</div>
            <ol className="list-decimal list-inside space-y-1">
              {mockFollowUp.questions.map(q => (
                <li key={q.id} className="bg-muted/40 rounded px-3 py-2">{q.text}</li>
              ))}
            </ol>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => router.push(`/admin/follow-up/${mockFollowUp.id}/edit`)}><Pencil className="w-4 h-4 mr-1" />Edit</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 