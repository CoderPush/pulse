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
import ImportDialog from '@/components/admin/ImportDialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';

interface User {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  created_at: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleNameEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditingName(user.name || '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingName(e.target.value);
  };

  const handleNameSave = async (user: User) => {
    if (editingName.trim() === user.name) {
      setEditingUserId(null);
      return;
    }
    setSavingName(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name: editingName.trim() }),
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
  }, [searchQuery]);

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

      {/* Search */}
      <div className="px-4 py-4">
        <Input
          type="text"
          placeholder="Search by email or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
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
                            type="text"
                            value={editingName}
                            onChange={handleNameChange}
                            onBlur={() => handleNameSave(user)}
                            onKeyDown={(e) => handleNameInputKeyDown(e, user)}
                            className="border rounded px-2 py-1 w-full text-sm focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            disabled={savingName}
                            aria-label="Edit user name"
                            autoComplete="name"
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
                      {user.is_admin ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          User
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAdminStatus(user.id, !user.is_admin)}
                      >
                        {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </Button>
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