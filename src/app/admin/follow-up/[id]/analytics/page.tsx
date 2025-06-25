'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, BarChart2, Users, Clock } from 'lucide-react';

const mockStats = {
  completionRate: 0.92,
  avgResponseTime: 12, // minutes
  blockers: 3,
  totalPeriods: 10,
  completionTrend: [0.8, 0.85, 0.9, 0.95, 0.92, 0.93, 0.91, 0.94, 0.96, 0.92],
  blockersTrend: [1, 0, 2, 1, 0, 1, 0, 2, 1, 3],
  mostActive: [
    { id: '1', name: 'Alice', count: 10 },
    { id: '3', name: 'Carol', count: 9 },
    { id: '2', name: 'Bob', count: 7 },
  ],
  mostMissed: [
    { id: '2', name: 'Bob', count: 3 },
    { id: '4', name: 'Dan', count: 2 },
  ],
};

export default function FollowUpAnalyticsPage() {
  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-muted-foreground" />
          <input type="date" className="border rounded px-2 py-1" defaultValue="2025-06-01" />
          <span className="mx-1">to</span>
          <input type="date" className="border rounded px-2 py-1" defaultValue="2025-06-10" />
          <Button size="sm" variant="outline">Apply</Button>
        </div>
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base">Avg. Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{Math.round(mockStats.completionRate * 100)}%</div>
            <div className="text-xs text-muted-foreground">Last {mockStats.totalPeriods} periods</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Badge variant="secondary" className="px-2 py-1"><span role="img" aria-label="fire">🔥</span></Badge>
            <CardTitle className="text-base">Blockers Reported</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{mockStats.blockers}</div>
            <div className="text-xs text-muted-foreground">Last {mockStats.totalPeriods} periods</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <CardTitle className="text-base">Avg. Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{mockStats.avgResponseTime} min</div>
            <div className="text-xs text-muted-foreground">From period open</div>
          </CardContent>
        </Card>
      </div>
      {/* Trend charts (mock) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader><CardTitle>Completion Rate Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-32 flex items-end gap-1">
              {mockStats.completionTrend.map((v, i) => (
                <div key={i} className="bg-blue-400" style={{ height: `${v * 80 + 10}px`, width: '16px', borderRadius: '4px' }} />
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2">Each bar = 1 period</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Blockers Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-32 flex items-end gap-1">
              {mockStats.blockersTrend.map((v, i) => (
                <div key={i} className="bg-red-400" style={{ height: `${v * 20 + 10}px`, width: '16px', borderRadius: '4px' }} />
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2">Each bar = 1 period</div>
          </CardContent>
        </Card>
      </div>
      {/* Most active/missed participants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Most Active Participants</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {mockStats.mostActive.map(u => (
                <li key={u.id} className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  <span className="font-medium">{u.name}</span>
                  <span className="text-xs text-muted-foreground">{u.count} submissions</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Most Missed Participants</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {mockStats.mostMissed.map(u => (
                <li key={u.id} className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-600" />
                  <span className="font-medium">{u.name}</span>
                  <span className="text-xs text-muted-foreground">{u.count} missed</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 