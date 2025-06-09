'use client';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const mockUser = {
  name: 'Chau',
  avatar: 'C',
  streak: 5,
  completion: 92,
};

const mockAssigned = [
  {
    id: '1',
    name: 'Daily Standup',
    due: 'today',
    time: '09:00',
    status: 'not_submitted',
  },
  {
    id: '2',
    name: 'Weekly Pulse',
    due: 'this week',
    status: 'not_submitted',
  },
  {
    id: '3',
    name: 'Ad-hoc Survey',
    due: 'today',
    status: 'not_submitted',
  },
];

const mockHistory = [
  {
    id: '1',
    name: 'Daily Standup',
    date: '2025-06-12',
    status: 'submitted',
  },
  {
    id: '2',
    name: 'Weekly Pulse',
    date: '2025-W23',
    status: 'missed',
  },
];

function getFillRoute(name: string) {
  if (name === 'Daily Standup') return '/daily-pulse';
  if (name === 'Weekly Pulse') return '/history';
  if (name === 'Ad-hoc Survey') return '/daily-pulse'; // or a specific route if you have one
  return '/';
}

export default function UserHomePage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-gradient-to-r from-green-200 to-blue-200 shadow">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-blue-500 text-white flex items-center justify-center text-3xl font-bold shadow-lg">{mockUser.avatar}</div>
        <div>
          <div className="text-2xl font-extrabold text-gray-900">Welcome back, {mockUser.name}!</div>
          <div className="text-green-700 text-sm font-medium">🔥 Streak: {mockUser.streak} days • 🏆 Completion: {mockUser.completion}%</div>
        </div>
      </div>
      <div className="mb-10">
        <h2 className="font-bold mb-3 text-lg text-gray-800">Your Check-ins</h2>
        <div className="space-y-4">
          {mockAssigned.map(a => (
            <Card key={a.id} className="rounded-xl shadow hover:shadow-lg transition">
              <CardContent className="flex items-center justify-between py-5">
                <div>
                  <div className="font-semibold text-gray-900">{a.name}</div>
                  <div className="text-xs text-muted-foreground">Due {a.due}{a.time ? ` • ${a.time}` : ''}</div>
                </div>
                {a.status === 'submitted' ? (
                  <Badge className="bg-green-500 text-white flex items-center gap-1"><span>✔️</span>Submitted</Badge>
                ) : (
                  <div className="flex gap-2 items-center">
                    <Badge className="bg-yellow-400 text-white flex items-center gap-1"><span>⏰</span>Not Submitted</Badge>
                    <Link href={getFillRoute(a.name)}>
                      <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">Fill Now</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div>
        <h2 className="font-bold mb-3 text-lg text-gray-800">Recent Submissions</h2>
        <div className="space-y-3">
          {mockHistory.map(h => (
            <Card key={h.id} className="rounded-xl shadow">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <div className="font-semibold text-gray-900">{h.name}</div>
                  <div className="text-xs text-muted-foreground">{h.date}</div>
                </div>
                {h.status === 'submitted' ? (
                  <Badge className="bg-green-500 text-white flex items-center gap-1"><span>✔️</span>Submitted</Badge>
                ) : (
                  <Badge className="bg-red-500 text-white flex items-center gap-1"><span>❌</span>Missed</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <Button className="mt-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">View All History</Button>
      </div>
    </div>
  );
} 