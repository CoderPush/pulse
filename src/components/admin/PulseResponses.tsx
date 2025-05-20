import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface User {
  email: string;
  name: string | null;
}

interface Project {
  name: string;
  hours: number;
}

interface Response {
  user: User;
  response: string | Project[];
  hours?: number;
  submitted_at: string;
  is_late: boolean;
}

interface QuestionResponses {
  responses: Response[];
}

interface Questions {
  primary_project: QuestionResponses;
  additional_projects: QuestionResponses;
  manager: QuestionResponses;
  feedback: QuestionResponses;
  changes_next_week: QuestionResponses;
  milestones: QuestionResponses;
  other_feedback: QuestionResponses;
  hours_reporting_impact: QuestionResponses;
}

interface PulseResponsesProps {
  weekNumber: number;
}

export default function PulseResponses({ weekNumber }: PulseResponsesProps) {
  const [responses, setResponses] = useState<Questions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/pulses/${weekNumber}/responses`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch responses');
        }

        setResponses(data.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching responses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [weekNumber]);

  const renderResponseTable = useCallback((responses: Response[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Response</TableHead>
          {responses[0]?.hours !== undefined && <TableHead>Hours</TableHead>}
          <TableHead>Submitted</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {responses.map((response, index) => (
          <TableRow key={index}>
            <TableCell>
              <div>
                <p className="font-medium">{response.user.email}</p>
                <p className="text-sm text-gray-500">{response.user.name || 'N/A'}</p>
              </div>
            </TableCell>
            <TableCell>
              {Array.isArray(response.response) ? (
                <div className="space-y-1">
                  {response.response.map((project: Project, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span>{project.name}</span>
                      <Badge variant="secondary">{project.hours}h</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="whitespace-pre-wrap">{response.response}</span>
              )}
            </TableCell>
            {response.hours !== undefined && (
              <TableCell>
                <Badge variant="secondary">{response.hours}h</Badge>
              </TableCell>
            )}
            <TableCell>
              {new Date(response.submitted_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Badge variant={response.is_late ? "destructive" : "default"}>
                {response.is_late ? 'Late' : 'On Time'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ), []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">Loading responses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!responses) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">No responses found</p>
      </div>
    );
  }

  // CSV Export handler
  const handleExportCSV = async () => {
    try {
      const res = await fetch(`/api/admin/pulses/${weekNumber}/responses/export`);
      if (!res.ok) throw new Error('Failed to export CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submissions-week-${weekNumber}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="default"
          size="default"
          onClick={handleExportCSV}
        >
          Export CSV
        </Button>
      </div>
      <Tabs defaultValue="project" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="project">Projects</TabsTrigger>
          <TabsTrigger value="manager">Manager</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="project" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Primary Project</CardTitle>
            </CardHeader>
            <CardContent>
              {renderResponseTable(responses.primary_project.responses)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {renderResponseTable(responses.additional_projects.responses)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manager">
          <Card>
            <CardHeader>
              <CardTitle>Manager Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              {renderResponseTable(responses.manager.responses)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {renderResponseTable(responses.feedback.responses)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes Next Week</CardTitle>
            </CardHeader>
            <CardContent>
              {renderResponseTable(responses.changes_next_week.responses)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              {renderResponseTable(responses.milestones.responses)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Other Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {renderResponseTable(responses.other_feedback.responses)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact">
          <Card>
            <CardHeader>
              <CardTitle>Hours Reporting Impact</CardTitle>
            </CardHeader>
            <CardContent>
              {renderResponseTable(responses.hours_reporting_impact.responses)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 