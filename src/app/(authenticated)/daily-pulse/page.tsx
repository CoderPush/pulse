"use client";
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CalendarDays, Flame, CheckCircle2, XCircle, Eye } from 'lucide-react';
import React from 'react';

const mockUser = {
  name: 'Chau',
  avatar: 'C',
  streak: 12,
  completion: 98,
};

const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

// Generate mock daily pulse data for the current month
function getMonthDays(year: number, month: number) {
  const days = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const monthDays = getMonthDays(currentYear, currentMonth);

// Mock status: submitted, missed, not_assigned
const mockStatusByDay: Record<number, 'submitted' | 'missed' | 'not_assigned'> = {
  1: 'submitted', 2: 'submitted', 3: 'missed', 4: 'submitted', 5: 'submitted',
  6: 'missed', 7: 'submitted', 8: 'submitted', 9: 'not_assigned', 10: 'submitted',
  11: 'missed', 12: 'submitted', 13: 'submitted', 14: 'submitted', 15: 'missed',
  16: 'submitted', 17: 'submitted', 18: 'not_assigned', 19: 'submitted', 20: 'missed',
  21: 'submitted', 22: 'submitted', 23: 'submitted', 24: 'missed', 25: 'submitted',
  26: 'submitted', 27: 'submitted', 28: 'missed', 29: 'submitted', 30: 'submitted', 31: 'not_assigned',
};

const mockAssigned = [
  {
    id: '1',
    name: 'Daily Standup',
    due: '09:00',
    status: 'not_submitted', // set to not_submitted for demo
  },
  {
    id: '2',
    name: 'Product Sync',
    due: '11:00',
    status: 'not_submitted',
  },
  {
    id: '3',
    name: 'Ad-hoc Survey',
    due: '15:00',
    status: 'not_submitted',
  },
];

// Table data for each day
const mockTableRows = monthDays.map((date) => {
  const day = date.getDate();
  const status = mockStatusByDay[day] || 'not_assigned';
  return {
    date: date.toISOString().slice(0, 10),
    name: status !== 'not_assigned' ? 'Daily Standup' : '-',
    status,
    isToday:
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear(),
  };
});

function getStatusColor(status: string) {
  if (status === 'submitted') return 'bg-green-500 text-white';
  if (status === 'missed') return 'bg-red-500 text-white';
  if (status === 'not_assigned') return 'bg-gray-300 text-gray-500';
  return '';
}

export default function DailyPulsePage() {
  // Calendar grid: get first day of week for the 1st of the month
  const firstDayOfWeek = monthDays[0].getDay();
  // Show form if any assigned daily standup is not submitted
  const dailyStandup = mockAssigned.find(a => a.name === 'Daily Standup' && a.status === 'not_submitted');
  const [showForm, setShowForm] = useState(!!dailyStandup);
  const [form, setForm] = useState({
    yesterday: '',
    today: '',
    blockers: '',
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setShowForm(false);
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Vibrant header */}
      <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-gradient-to-r from-green-200 via-blue-200 to-cyan-200 shadow">
        <Avatar className="w-14 h-14 text-3xl font-bold">
          <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white">{mockUser.avatar}</AvatarFallback>
        </Avatar>
        <div>
          <div className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-green-600" />
            Daily Pulse
          </div>
          <div className="text-green-700 text-sm font-medium flex items-center gap-3 mt-1">
            <Flame className="w-4 h-4 text-orange-500" />
            Streak: <span className="font-bold">{mockUser.streak} days</span>
            <span className="text-blue-700">•</span>
            Completion: <span className="font-bold">{mockUser.completion}%</span>
          </div>
        </div>
      </div>
      {/* Daily Standup Fill Form */}
      {showForm && (
        <Card className="mb-8 border-green-400 shadow-lg">
          <CardContent className="py-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-lg font-bold text-green-700">You haven't filled your Daily Standup yet!</span>
              <Badge className="bg-yellow-400 text-white flex items-center gap-1"><span>⏰</span>Not Submitted</Badge>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">What did you work on yesterday?</label>
                <Textarea name="yesterday" value={form.yesterday} onChange={handleChange} required placeholder="Yesterday I..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">What will you work on today?</label>
                <Textarea name="today" value={form.today} onChange={handleChange} required placeholder="Today I plan to..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Any blockers?</label>
                <Input name="blockers" value={form.blockers} onChange={handleChange} placeholder="No blockers" />
              </div>
              <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white w-full mt-2">Submit Daily Standup</Button>
            </form>
          </CardContent>
        </Card>
      )}
      {submitted && (
        <Card className="mb-8 border-green-400 shadow-lg">
          <CardContent className="py-6 flex items-center gap-3">
            <span className="text-lg font-bold text-green-700">✅ Daily Standup submitted! Have a great day!</span>
          </CardContent>
        </Card>
      )}
      {/* Calendar View */}
      <div className="mb-10">
        <h2 className="font-bold mb-3 text-lg text-gray-800">This Month's Check-in Overview</h2>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-500 mb-2">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for first week */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={i}></div>
            ))}
            {/* Days of month */}
            {monthDays.map((date) => {
              const day = date.getDate();
              const status = mockStatusByDay[day] || 'not_assigned';
              const isToday =
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
              return (
                <div
                  key={day}
                  className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm cursor-pointer transition-all
                    ${getStatusColor(status)}
                    ${isToday ? 'ring-2 ring-blue-400 border-2 border-blue-400' : ''}
                    ${status === 'not_assigned' ? 'opacity-50' : 'hover:scale-110'}
                  `}
                  title={status.charAt(0).toUpperCase() + status.slice(1)}
                >
                  {day}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Submitted</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Missed</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span> Not Assigned</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-blue-400 inline-block"></span> Today</div>
          </div>
        </div>
      </div>
      {/* Assigned check-ins (today) */}
      <div className="mb-10">
        <h2 className="font-bold mb-3 text-lg text-gray-800">Today's Check-ins</h2>
        <div className="space-y-4">
          {mockAssigned.map(a => (
            <Card key={a.id} className="rounded-xl shadow hover:shadow-lg transition border-green-200">
              <CardContent className="flex items-center justify-between py-5">
                <div>
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-green-500" /> {a.name}
                  </div>
                  <div className="text-xs text-muted-foreground">Due at {a.due}</div>
                </div>
                {a.status === 'submitted' ? (
                  <Badge className="bg-green-500 text-white flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />Submitted</Badge>
                ) : (
                  <div className="flex gap-2 items-center">
                    <Badge className="bg-yellow-400 text-white flex items-center gap-1"><XCircle className="w-4 h-4" />Not Submitted</Badge>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" disabled>Fill Now</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      {/* Table View */}
      <div>
        <h2 className="font-bold mb-3 text-lg text-gray-800">Daily Pulse History (This Month)</h2>
        <div className="overflow-x-auto rounded-xl shadow bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-green-50 text-green-900">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Check-in</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockTableRows.map((row) => (
                <tr key={row.date} className={row.isToday ? 'bg-blue-50 font-bold' : ''}>
                  <td className="px-4 py-2 whitespace-nowrap">{row.date}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{row.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {row.status === 'submitted' && <Badge className="bg-green-500 text-white">Submitted</Badge>}
                    {row.status === 'missed' && <Badge className="bg-red-500 text-white">Missed</Badge>}
                    {row.status === 'not_assigned' && <Badge className="bg-gray-300 text-gray-500">Not Assigned</Badge>}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {row.status !== 'not_assigned' && (
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Eye className="w-4 h-4" /> View
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 