"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronUp, ChevronDown, Shield, ShieldOff, Bell, BellOff, UserCheck, UserX, Edit2, Check, X } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name?: string | null;
  is_admin: boolean;
  wants_daily_reminders?: boolean;
  is_active?: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [reminderFilter, setReminderFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [adminFilter, setAdminFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [sortField, setSortField] = useState<'email' | 'created_at'>('email');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [updatingUserIds, setUpdatingUserIds] = useState<Set<string>>(new Set());
  const [editingNameUserId, setEditingNameUserId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data.data || []);
      } catch {
        toast({
          title: "Error",
          description: "Could not load user data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [toast]);

  const filteredUsers = useMemo(() => {
    const filtered = users
      .filter(user => {
        // Status filter
        if (statusFilter === 'active') return user.is_active !== false;
        if (statusFilter === 'inactive') return user.is_active === false;
        return true;
      })
      .filter(user => {
        // Reminder filter
        if (reminderFilter === 'yes') return !!user.wants_daily_reminders;
        if (reminderFilter === 'no') return !user.wants_daily_reminders;
        return true;
      })
      .filter(user => {
        // Admin filter
        if (adminFilter === 'yes') return user.is_admin;
        if (adminFilter === 'no') return !user.is_admin;
        return true;
      })
      .filter(user => {
        // Search filter
        const search = searchQuery.toLowerCase();
        return (
          user.email.toLowerCase().includes(search) ||
          (user.name && user.name.toLowerCase().includes(search))
        );
      });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      if (sortField === 'email') {
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
      } else {
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchQuery, statusFilter, reminderFilter, adminFilter, sortField, sortDirection]);

  const handleSort = (field: 'email' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    setUpdatingUserIds(prev => new Set(prev).add(userId));
    try {
      // Optimistic UI update
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, ...updates } : user
        )
      );

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const updatedUser = await response.json();
      
      // Final update with server data
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, ...updatedUser.data } : user
        )
      );
      
      toast({
        title: "Success",
        description: "User updated successfully.",
      });

    } catch {
      toast({
        title: "Error",
        description: "Failed to update user. Reverting changes.",
        variant: "destructive",
      });
       // Re-fetch to revert optimistic update on failure
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.data || []);
    } finally {
      setUpdatingUserIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const startEditingName = (userId: string, currentName: string) => {
    setEditingNameUserId(userId);
    setEditingNameValue(currentName || '');
  };

  const cancelEditingName = () => {
    setEditingNameUserId(null);
    setEditingNameValue('');
  };

  const saveUserName = async (userId: string) => {
    if (editingNameValue.trim() === '') {
      toast({
        title: "Error",
        description: "Name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    await updateUser(userId, { name: editingNameValue.trim() });
    setEditingNameUserId(null);
    setEditingNameValue('');
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <div className="flex-grow">
          <Label htmlFor="search" className="sr-only">Search</Label>
          <Input
            id="search"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80"
          />
        </div>
        <div className="text-sm text-gray-600 pt-3">
          Showing {filteredUsers.length} users
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
            <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value as 'all' | 'active' | 'inactive')}>
              <SelectTrigger id="status-filter" className="w-[120px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="reminder-filter" className="text-sm font-medium">Daily Reminder</Label>
            <Select value={reminderFilter} onValueChange={(value: string) => setReminderFilter(value as 'all' | 'yes' | 'no')}>
              <SelectTrigger id="reminder-filter" className="w-[120px]">
                <SelectValue placeholder="Filter by reminder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div>
            <Label htmlFor="admin-filter" className="text-sm font-medium">Admin</Label>
            <Select value={adminFilter} onValueChange={(value: string) => setAdminFilter(value as 'all' | 'yes' | 'no')}>
              <SelectTrigger id="admin-filter" className="w-[120px]">
                <SelectValue placeholder="Filter by admin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-1">
                  Email
                  {sortField === 'email' ? (
                    sortDirection === 'asc' ? 
                      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
                      <ChevronDown className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-gray-300" />
                  )}
                </div>
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Daily Reminder</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  Created At
                  {sortField === 'created_at' ? (
                    sortDirection === 'asc' ? 
                      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
                      <ChevronDown className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-gray-300" />
                  )}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                  No users match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              <TooltipProvider>
                {filteredUsers.map((user, index) => (
                  <TableRow key={user.id} className={user.is_active === false ? 'bg-gray-100 text-gray-500' : ''}>
                    <TableCell className="text-center text-sm text-gray-500">{index + 1}</TableCell>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      {editingNameUserId === user.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingNameValue}
                            onChange={(e) => setEditingNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveUserName(user.id);
                              } else if (e.key === 'Escape') {
                                cancelEditingName();
                              }
                            }}
                            className="w-32"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => saveUserName(user.id)}
                            disabled={updatingUserIds.has(user.id)}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditingName}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 flex-1">{user.name || '-'}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingName(user.id, user.name || '')}
                            disabled={updatingUserIds.has(user.id)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={user.is_active === false ? "destructive" : "default"}
                              className={user.is_active === false ? "bg-red-100 text-red-800 border-red-200" : "bg-green-100 text-green-800 border-green-200"}
                            >
                              {user.is_active === false ? "Inactive" : "Active"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateUser(user.id, { is_active: !user.is_active })}
                              disabled={updatingUserIds.has(user.id)}
                            >
                              {user.is_active === false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-900 text-white">
                          <p>Click to toggle user activation status</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={user.is_admin ? "default" : "secondary"}
                              className={user.is_admin ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"}
                            >
                              {user.is_admin ? "Admin" : "User"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateUser(user.id, { is_admin: !user.is_admin })}
                              disabled={updatingUserIds.has(user.id)}
                            >
                              {user.is_admin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-900 text-white">
                          <p>Click to toggle admin privileges</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={user.wants_daily_reminders ? "default" : "secondary"}
                              className={user.wants_daily_reminders ? "bg-purple-100 text-purple-800 border-purple-200" : "bg-gray-100 text-gray-600 border-gray-200"}
                            >
                              {user.wants_daily_reminders ? "Reminder" : "No Reminder"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateUser(user.id, { wants_daily_reminders: !user.wants_daily_reminders })}
                              disabled={updatingUserIds.has(user.id)}
                            >
                              {user.wants_daily_reminders ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-900 text-white">
                          <p>Click to toggle daily reminders</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm" disabled={updatingUserIds.has(user.id)}>
                        <Link href={`/admin/users/${user.id}/daily-tasks`}>
                          View Tasks
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TooltipProvider>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 