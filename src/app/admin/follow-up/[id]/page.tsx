'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays, Clock, ChevronLeft, BarChart2, Pencil } from 'lucide-react';
import Link from 'next/link';

type Participant = {
  id: string;
  name: string;
  email: string;
};

type Question = {
  id: string;
  title: string;
  type: string;
  description: string;
  required: boolean;
  choices: string[];
  display_order: number;
};

type FollowUpDetails = {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  days: string[];
  reminderTime: string | null;
  participants: Participant[] | null;
  questions?: Question[];
};

export default function FollowUpDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const [followUp, setFollowUp] = useState<FollowUpDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .rpc('get_followup_details_by_id', { p_template_id: id })
        .single();
      if (!error) setFollowUp(data as FollowUpDetails);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="max-w-5xl mx-auto py-8">Loading...</div>;
  }

  if (!followUp) {
    return (
      <div className="max-w-5xl mx-auto py-8 text-center">
        <p className="text-muted-foreground mb-4">Follow-up not found.</p>
        <Button variant="outline" asChild>
          <Link href="/admin/follow-up">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to list
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" asChild>
          <Link href="/admin/follow-up">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to list
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/follow-up/${id}/responses`}>
              <span className="flex items-center"><BarChart2 className="w-4 h-4 mr-2" />View Responses</span>
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/follow-up/${id}/analytics`}>
              <BarChart2 className="w-4 h-4 mr-2" />
              View Analytics
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/follow-up/${id}/edit`}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{followUp.name}</CardTitle>
              <CardDescription>{followUp.description}</CardDescription>
            </div>
            <Badge variant="outline" className="uppercase">{followUp.frequency}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {followUp.days && followUp.days.length > 0 && (
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">Days</p>
                <p className="text-muted-foreground">{followUp.days.join(', ')}</p>
              </div>
            </div>
          )}
          {followUp.reminderTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">Reminder Time</p>
                <p className="text-muted-foreground">{followUp.reminderTime}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Questions ({followUp.questions?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {followUp.questions && followUp.questions.length > 0 ? (
              followUp.questions.map((q, idx) => (
                <div key={q.id || idx} className="border rounded p-3 bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">Q{idx + 1}:</span>
                    <span>{q.title}</span>
                    {q.required && <Badge variant="secondary" className="ml-2">Required</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Type: {q.type}</div>
                  {q.description && <div className="mb-1 text-sm">{q.description}</div>}
                  {(q.type === 'multiple_choice' || q.type === 'checkbox') && q.choices && q.choices.length > 0 && (
                    <div className="text-xs">Choices: {q.choices.join(', ')}</div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No questions defined for this follow-up.</p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Participants ({followUp.participants?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {followUp.participants && followUp.participants.length > 0 ? (
              followUp.participants.map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>{p.name ? p.name.charAt(0).toUpperCase() : p.email.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{p.email}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No participants assigned to this follow-up yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 