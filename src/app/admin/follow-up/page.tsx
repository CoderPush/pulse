'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Users, Clock, CalendarDays, MoreVertical, Eye, BarChart2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const mockFollowUps = [
  {
    id: '1',
    name: 'Daily Standup',
    description: 'Daily check-in for team members',
    frequency: 'Daily',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    reminderTime: '09:00',
    participants: 12,
    createdAt: '2024-06-01',
  },
  {
    id: '2',
    name: 'Weekly Review',
    description: 'Friday team review',
    frequency: 'Weekly',
    days: ['Fri'],
    reminderTime: '16:00',
    participants: 8,
    createdAt: '2024-06-03',
  },
  {
    id: '3',
    name: 'Ad-hoc Survey',
    description: 'Quick feedback for new process',
    frequency: 'Ad-hoc',
    days: [],
    reminderTime: '',
    participants: 5,
    createdAt: '2024-06-10',
  },
];

export default function FollowUpListPage() {
  const [toDelete, setToDelete] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Follow-ups</h1>
        <Button asChild>
          <a href="/admin/follow-up/create">+ New Follow-up</a>
        </Button>
      </div>
      <div className="space-y-6">
        {mockFollowUps.map(fu => (
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
                  <Badge variant="outline" className="uppercase text-xs">{fu.frequency}</Badge>
                </div>
                <CardDescription className="mb-2 text-muted-foreground line-clamp-2">{fu.description}</CardDescription>
                <div className="flex flex-wrap gap-2 mb-2">
                  {fu.days.length > 0 && (
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
              {/* You can add more summary fields here if needed */}
            </CardContent>
            {/* Delete confirmation dialog (mock) */}
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
    </div>
  );
} 