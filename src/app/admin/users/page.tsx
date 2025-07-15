'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Pencil, Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ImportDialog from '@/components/admin/ImportDialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';

interface User {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  created_at: string;
  wants_daily_reminders: boolean;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyReminderUsers, setShowOnlyReminderUsers] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [savingName, setSavingName] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async (search?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (showOnlyReminderUsers) params.append('wants_daily_reminders', 'true');
      
      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, newStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          is_admin: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      // Refresh the users list
      fetchUsers(searchQuery);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const toggleReminderStatus = async (userId: string, newStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, wants_daily_reminders: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update user reminder status');
      
      // Update local state for instant feedback
      setUsers(users => users.map(u => u.id === userId ? { ...u, wants_daily_reminders: newStatus } : u));
      toast({ title: 'Success', description: `Daily reminder status updated.`, variant: 'default' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'An unknown error occurred.', variant: 'destructive' });
      // Re-fetch to revert optimistic update on failure
      fetchUsers(searchQuery);
    }
  };

  const handleNameEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditingName(user.name || '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingName(e.target.value);
  };

  const handleNameSave = async (user: User) => {
    const newName = editingName.trim();
    if (newName === '' || newName === user.name) {
      setEditingUserId(null);
      return;
    }
    setSavingName(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name: newName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update name');
      setEditingUserId(null);
      fetchUsers(searchQuery);
      toast({ title: 'Name updated', description: `User name updated successfully.`, variant: 'default' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update name');
      toast({ title: 'Error', description: 'Failed to update name', variant: 'destructive' });
    } finally {
      setSavingName(false);
    }
  };

  const handleNameCancel = () => {
    setEditingUserId(null);
  };

  const handleNameInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, user: User) => {
    if (e.key === 'Enter') {
      handleNameSave(user);
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, showOnlyReminderUsers]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">User Management</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Users
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-4 py-4 flex items-center space-x-4">
        <Input
          type="text"
          placeholder="Search by email or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <div className="flex items-center space-x-2">
          <Switch
            id="daily-reminder-filter"
            checked={showOnlyReminderUsers}
            onCheckedChange={setShowOnlyReminderUsers}
          />
          <Label htmlFor="daily-reminder-filter">Show users with daily reminders</Label>
        </div>
      </div>

      {/* Users Table */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading users...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              {error}
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No users found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Admin Status</TableHead>
                  <TableHead>Daily Reminder</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {editingUserId === user.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            id={`edit-user-name-${user.id}`}
                            name={`edit-user-name-${user.id}`}
                            type="text"
                            value={editingName}
                            onChange={handleNameChange}
                            onKeyDown={(e) => handleNameInputKeyDown(e, user)}
                            className="border rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            disabled={savingName}
                            aria-label="Edit user name"
                            autoComplete="off"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleNameSave(user)}
                            disabled={savingName}
                            aria-label="Save name"
                          >
                            {savingName ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleNameCancel}
                            disabled={savingName}
                            aria-label="Cancel edit"
                          >
                            <X className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                          </Button>
                        </div>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="group cursor-pointer hover:bg-blue-50 focus:bg-blue-50 rounded px-2 py-1 inline-flex items-center gap-1 transition-colors w-full"
                              onClick={() => handleNameEdit(user)}
                              tabIndex={0}
                              aria-label="Edit user name"
                            >
                              <span className="group-hover:underline text-left flex-1">{user.name || '-'}</span>
                              <Pencil
                                className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-focus:text-blue-500 transition-all opacity-0 group-hover:opacity-100 group-focus:opacity-100 scale-90 group-hover:scale-100 group-focus:scale-100"
                                aria-hidden="true"
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent sideOffset={4}>
                            Click to edit name
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger>
                          <Switch
                            checked={user.is_admin}
                            onCheckedChange={(newStatus) =>
                              toggleAdminStatus(user.id, newStatus)
                            }
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {user.is_admin
                            ? 'Admin status is ON'
                            : 'Admin status is OFF'}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                          <TooltipTrigger>
                              <Switch
                                  checked={user.wants_daily_reminders}
                                  onCheckedChange={(newStatus) =>
                                      toggleReminderStatus(user.id, newStatus)
                                  }
                              />
                          </TooltipTrigger>
                          <TooltipContent>
                              {user.wants_daily_reminders
                                  ? 'Daily reminder is ON'
                                  : 'Daily reminder is OFF'}
                          </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportComplete={() => fetchUsers(searchQuery)}
      />
    </div>
  );
} 