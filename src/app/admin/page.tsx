'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Clock, FileText, UserMinus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import '@/utils/date'; // Import date utilities

export default function AdminDashboard() {
  const [missingCount, setMissingCount] = useState<number | null>(null);
  const [lastWeek, setLastWeek] = useState<number | null>(null);

  useEffect(() => {
    const fetchMissingCount = async () => {
      try {
        const currentDate = new Date();
        const currentWeek = currentDate.getWeek();
        const targetWeek = currentWeek > 1 ? currentWeek - 1 : currentWeek;
        setLastWeek(targetWeek);
        
        const response = await fetch(
          `/api/admin/submissions/missing?year=${currentDate.getFullYear()}&week=${targetWeek}`
        );
        const data = await response.json();
        
        if (response.ok && data.data.missing_users) {
          setMissingCount(data.data.missing_users.length);
        }
      } catch (error) {
        console.error('Error fetching missing submissions count:', error);
      }
    };

    fetchMissingCount();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/missing" className="block">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missing Submissions</CardTitle>
              <UserMinus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {missingCount === null ? '...' : missingCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Need attention for Week {lastWeek || '...'}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-time Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="late">Late Submissions</TabsTrigger>
          <TabsTrigger value="trends">Submission Trends</TabsTrigger>
        </TabsList>
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Placeholder for recent submissions list */}
                <div className="text-sm text-muted-foreground">
                  Loading recent submissions...
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="late" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Late Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Placeholder for late submissions list */}
                <div className="text-sm text-muted-foreground">
                  Loading late submissions...
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submission Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Placeholder for trends chart */}
                <div className="text-sm text-muted-foreground">
                  Loading submission trends...
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 