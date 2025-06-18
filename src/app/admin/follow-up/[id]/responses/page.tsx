'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

// --- Types ---
type Question = { id: string; text: string; description: string | null; display_order: number; };
type Answer = { question_id: string; answer: string; };
type Participant = { id: string; name: string | null; email: string | null; avatar: string; };
type Submission = { user_id: string; submitted_at: string; answers: Answer[] | null; };
type FollowUpData = { id: string; name: string; questions: Question[] | null; participants: Participant[] | null; submissions: Submission[] | null; };
type Period = { id: number; label: string; start_date: string; end_date?: string; };

export default function FollowUpResponsesPage() {
  const params = useParams();
  const templateId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number | undefined>(undefined);
  const [data, setData] = useState<FollowUpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch periods on mount
  useEffect(() => {
    if (!templateId) {
      setError('No template ID found for this page.');
      return;
    }
    const fetchPeriods = async () => {
      console.log('Calling get_submission_periods_for_template with', templateId);
      const supabase = createClient();
      const { data, error } = await supabase
        .rpc('get_submission_periods_for_template', { p_template_id: templateId });
      if (error) {
        setError(error.message || 'Failed to fetch periods');
        return;
      }
      if (data && data.length > 0) {
        setPeriods(data);
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayPeriod = data.find(
          (p: { start_date: string; end_date?: string | null }) =>
            todayStr >= p.start_date.slice(0, 10) &&
            (!p.end_date || todayStr <= p.end_date.slice(0, 10))
        );
        setSelectedPeriod(todayPeriod ? todayPeriod.id : data[0].id);
      }
    };
    fetchPeriods();
  }, [templateId]);

  // Fetch responses when selectedPeriod changes
  useEffect(() => {
    if (!templateId || !selectedPeriod) return;
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .rpc('get_followup_responses', {
          p_template_id: templateId,
          p_submission_period_id: selectedPeriod,
        })
        .single();
      if (!error) setData(data as FollowUpData);
      setLoading(false);
    };
    fetchData();
  }, [templateId, selectedPeriod]);

  const completionRate = data?.submissions ? `${data.submissions.length}/${data.participants?.length}` : `0/${data?.participants?.length || 0}`;
  const allSubmitted = data?.submissions?.length === data?.participants?.length;
  const blockers = data?.submissions?.filter(r => r.answers?.find(a => a.question_id === data.questions?.[2]?.id && a.answer)).length || 0;

  if (error) {
    return <div className="max-w-6xl mx-auto py-8 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/follow-up/${templateId}`}><ChevronLeft className="w-5 h-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Responses</h1>
        <span className="text-muted-foreground ml-2">for <span className="font-semibold">{data?.name}</span></span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="font-medium">Period:</span>
          <select
            className="border rounded px-2 py-1"
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(Number(e.target.value))}
            disabled={loading || periods.length === 0}
          >
            {periods.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-2 text-base">
            <span role="img" aria-label="clap">👏</span> {allSubmitted ? 'All users submitted' : `${completionRate} submitted`}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-2 text-base">
             <span role="img" aria-label="fire">🔥</span> {blockers} blocker{blockers === 1 ? '' : 's'} reported
          </Badge>
        </div>
      </div>
      {loading ? <div className="text-center py-10">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.questions?.map(q => (
            <Card key={q.id} className="flex flex-col">
              <CardHeader><CardTitle className="text-lg text-center">{q.text}</CardTitle></CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                {data.participants?.map(user => {
                  const submission = data.submissions?.find(s => s.user_id === user.id);
                  const answer = submission?.answers?.find(a => a.question_id === q.id)?.answer;
                  return (
                    <div key={user.id} className={`flex gap-3 items-start border-t pt-3 first:border-t-0 first:pt-0 ${!submission ? ' bg-red-50/50 p-2 rounded' : ''}`}>
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-lg">
                        {user.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name || user.email}</span>
                          {!submission && <Badge variant="destructive" className="text-xs">Not Submitted</Badge>}
                        </div>
                        <div className="text-base mt-1">
                          {submission ? (answer || <span className="italic text-muted-foreground">No response</span>) : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 