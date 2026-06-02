'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getWeekNumber } from '@/lib/utils/date';
import { Input } from '@/components/ui/input';

interface MissingUser {
  id: string;
  email: string;
  name: string;
}

interface WeekInfo {
  year: number;
  week_number: number;
  submission_start: string;
  submission_end: string;
  late_submission_end: string;
}

export default function MissingSubmissionsPage() {
  const currentWeek = getWeekNumber();
  const currentYear = new Date().getFullYear();

  // Default to previous week
  const defaultWeek = currentWeek > 1 ? currentWeek - 1 : currentWeek;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedWeek, setSelectedWeek] = useState(defaultWeek);
  const [missingUsers, setMissingUsers] = useState<MissingUser[]>([]);
  const [weekInfo, setWeekInfo] = useState<WeekInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailSearch, setEmailSearch] = useState('');

  const filteredUsers = missingUsers.filter(user =>
    user.email.toLowerCase().includes(emailSearch.toLowerCase())
  );

  const fetchMissingSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/submissions/missing?year=${selectedYear}&week=${selectedWeek}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch missing submissions');
      }
      const data = await response.json();
      setMissingUsers(data.data.missing_users || []);
      setWeekInfo(data.data.week);
    } catch (err) {
      console.error('Error fetching missing submissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch missing submissions');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedWeek]);

  useEffect(() => {
    fetchMissingSubmissions();
  }, [fetchMissingSubmissions]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Missing Submissions</h1>
        <div className="flex items-center gap-4">
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedWeek.toString()}
            onValueChange={(value) => setSelectedWeek(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Week" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 53 }, (_, i) => i + 1).map((week) => (
                <SelectItem key={week} value={week.toString()}>
                  Week {week}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {weekInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Week {weekInfo.week_number} Submission Window</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Starts</p>
                <p>{new Date(weekInfo.submission_start).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Due By</p>
                <p>{new Date(weekInfo.submission_end).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Late Submission Until</p>
                <p>{new Date(weekInfo.late_submission_end).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Missing Users</CardTitle>
          <Input
            placeholder="Search by email..."
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            className="w-[250px]"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-red-500 py-8">
                    {error}
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8">
                    No missing submissions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
