'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getWeekNumber } from '@/utils/date';
import { useToast } from '@/components/ui/use-toast';

interface MissingUser {
  id: string;
  email: string;
  name: string;
  last_reminder: {
    sent_at: string;
    sent_by: string;
  } | null;
}

interface WeekInfo {
  year: number;
  week_number: number;
  submission_start: string;
  submission_end: string;
  late_submission_end: string;
}

interface SendingStatus {
  inProgress: boolean;
  current: number;
  total: number;
  processingUsers: Set<string>;
}

export default function MissingSubmissionsPage() {
  const { toast } = useToast();
  const currentWeek = getWeekNumber();
  const currentYear = new Date().getFullYear();
  
  // Default to previous week
  const defaultWeek = currentWeek > 1 ? currentWeek - 1 : currentWeek;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedWeek, setSelectedWeek] = useState(defaultWeek);
  const [missingUsers, setMissingUsers] = useState<MissingUser[]>([]);
  const [weekInfo, setWeekInfo] = useState<WeekInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sendingStatus, setSendingStatus] = useState<SendingStatus>({
    inProgress: false,
    current: 0,
    total: 0,
    processingUsers: new Set()
  });

  // Sort users with selected ones at the top
  const sortedUsers = useMemo(() => {
    return [...missingUsers].sort((a, b) => {
      // First sort by selected status
      if (selectedUsers.includes(a.id) && !selectedUsers.includes(b.id)) return -1;
      if (!selectedUsers.includes(a.id) && selectedUsers.includes(b.id)) return 1;
      
      // Then sort by last reminder (never reminded first)
      if (!a.last_reminder && b.last_reminder) return -1;
      if (a.last_reminder && !b.last_reminder) return 1;
      if (a.last_reminder && b.last_reminder) {
        const aDate = new Date(a.last_reminder.sent_at);
        const bDate = new Date(b.last_reminder.sent_at);
        return aDate.getTime() - bDate.getTime();
      }
      
      // Finally sort by email alphabetically
      return a.email.localeCompare(b.email);
    });
  }, [missingUsers, selectedUsers]);

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

  const handleRowClick = (userId: string) => {
    setSelectedUsers(prev => {
      const isSelected = prev.includes(userId);
      return isSelected ? prev.filter(id => id !== userId) : [...prev, userId];
    });
  };

  const handleSelectAllUsers = (checked: boolean) => {
    setSelectedUsers(checked ? missingUsers.map(user => user.id) : []);
  };

  const sendReminder = async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/submissions/remind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: [userId],
          year: selectedYear,
          week: selectedWeek,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reminder');
      }

      const data = await response.json();
      const result = data.results[0];

      if (!result.success) {
        throw new Error(result.error || 'Failed to send reminder');
      }

      // Update the user's last reminder timestamp
      setMissingUsers(prev => prev.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            last_reminder: {
              sent_at: new Date().toISOString(),
              sent_by: 'current_user' // You might want to get the actual user name
            }
          };
        }
        return user;
      }));

      return true;
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to send reminder',
        variant: "destructive"
      });
      return false;
    }
  };

  const handleSingleRemind = async (userId: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent row selection when clicking the button

    setSendingStatus(prev => ({
      ...prev,
      processingUsers: new Set([...prev.processingUsers, userId])
    }));

    const success = await sendReminder(userId);

    setSendingStatus(prev => ({
      ...prev,
      processingUsers: new Set([...prev.processingUsers].filter(id => id !== userId))
    }));

    if (success) {
      toast({
        title: "Success",
        description: "Reminder sent successfully",
      });
    }
  };

  const handleBulkRemind = async () => {
    if (selectedUsers.length === 0) return;

    setSendingStatus({
      inProgress: true,
      current: 0,
      total: selectedUsers.length,
      processingUsers: new Set()
    });

    for (const userId of selectedUsers) {
      await sendReminder(userId);
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between sends
      setSendingStatus(prev => ({
        ...prev,
        current: prev.current + 1
      }));
    }

    setSendingStatus({
      inProgress: false,
      current: 0,
      total: 0,
      processingUsers: new Set()
    });
    setSelectedUsers([]);

    toast({
      title: "Success",
      description: "All reminders sent successfully",
    });
  };

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
          <div className="flex items-center gap-4">
            <Button
              variant="default"
              onClick={handleBulkRemind}
              disabled={selectedUsers.length === 0 || sendingStatus.inProgress}
            >
              {sendingStatus.inProgress
                ? `Sending ${sendingStatus.current}/${sendingStatus.total}...`
                : `Send Reminders (${selectedUsers.length})`}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedUsers.length === missingUsers.length && missingUsers.length > 0}
                    onCheckedChange={handleSelectAllUsers}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Last Reminder</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-red-500 py-8">
                    {error}
                  </TableCell>
                </TableRow>
              ) : sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No missing submissions found
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers.map((user) => (
                  <TableRow 
                    key={user.id}
                    className={`cursor-pointer hover:bg-gray-50 ${
                      selectedUsers.includes(user.id) ? 'bg-blue-50 hover:bg-blue-100' : ''
                    }`}
                    onClick={() => handleRowClick(user.id)}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => handleRowClick(user.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.last_reminder ? (
                        <span className="text-sm text-gray-500">
                          {new Date(user.last_reminder.sent_at).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleSingleRemind(user.id, e)}
                        disabled={sendingStatus.processingUsers.has(user.id)}
                      >
                        {sendingStatus.processingUsers.has(user.id) ? 'Sending...' : 'Remind'}
                      </Button>
                    </TableCell>
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