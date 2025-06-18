'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Users, Clock, CalendarDays, MoreVertical, Eye, BarChart2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

type FollowUp = {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  days: string[];
  reminderTime: string | null;
  participants: number;
  createdAt: string;
  type?: string;
};

export default function FollowUpListPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchFollowUps = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_followups_for_admin_list');

      if (error) {
        console.error('Failed to fetch follow-ups:', error);
        setError(error.message);
      } else {
        const typedFollowUps = (data as FollowUp[] || []).map(fu => ({
          ...fu,
          participants: fu.participants || 0,
          days: fu.days || [],
          type: fu.type,
        }));
        setFollowUps(typedFollowUps);
      }
      setLoading(false);
    };

    fetchFollowUps();
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Follow-ups</h1>
        <Link href="/admin/follow-up/create/" className="text-sm font-medium text-primary">
          + New Follow-up
        </Link>
      </div>

      {loading && (
        <div className="text-center">
          <p>Loading follow-ups...</p>
        </div>
      )}

      {error && (
        <div className="text-center text-red-500">
          <p>Failed to load follow-ups: {error}</p>
        </div>
      )}
      
      {!loading && !error && followUps.length === 0 && (
         <div className="text-center py-16">
           <p className="text-muted-foreground mb-4">You haven&apos;t created any follow-ups yet.</p>
           <Link href="/admin/follow-up/create/" className="text-sm font-medium text-primary">
             + New Follow-up
           </Link>
         </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {followUps.map(fu => (
            <Card
              key={fu.id}
              className="relative group hover:shadow-lg transition-shadow cursor-pointer"
              onClick={e => {
                if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) return;
                router.push(`/admin/follow-up/${fu.id}`);
              }}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg flex-1 truncate">{fu.name}</CardTitle>
                    {fu.type === 'weekly' ? (
                      <Badge variant="destructive" className="uppercase text-xs">WEEKLY PULSE (legacy)</Badge>
                    ) : (
                      <Badge variant="outline" className="uppercase text-xs">{fu.frequency}</Badge>
                    )}
                  </div>
                  <CardDescription className="mb-2 text-muted-foreground line-clamp-2">{fu.description}</CardDescription>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {fu.days && fu.days.length > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1"><CalendarDays className="w-4 h-4" />{fu.days.join(', ')}</Badge>
                    )}
                    {fu.reminderTime && (
                      <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-4 h-4" />{fu.reminderTime}</Badge>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={e => e.stopPropagation()}>
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => router.push(`/admin/follow-up/${fu.id}`)}>
                      <Eye className="w-4 h-4 mr-2" /> View details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/admin/follow-up/${fu.id}/analytics`)}>
                      <BarChart2 className="w-4 h-4 mr-2" /> View Analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/admin/follow-up/${fu.id}/edit`)}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setToDelete(fu.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-0">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{fu.participants}</span>
                  <span className="text-muted-foreground text-xs">participants</span>
                </div>
              </CardContent>
              {toDelete === fu.id && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <div className="bg-white rounded shadow-lg p-6 w-72">
                    <div className="mb-4">Are you sure you want to delete <span className="font-semibold">{fu.name}</span>?</div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setToDelete(null)}>Cancel</Button>
                      <Button size="sm" variant="destructive" onClick={() => { setToDelete(null); alert('Deleted! (mock)'); }}>Delete</Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 