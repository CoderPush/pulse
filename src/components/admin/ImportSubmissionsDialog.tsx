import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

interface ImportSubmissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedSubmissionRow {
  email: string;
  week_number: number;
  primary_project_name: string;
  primary_project_hours: number;
  additional_projects?: string;
  manager?: string;
  feedback?: string;
  changes_next_week?: string;
  hour_reporting_impact?: string;
  form_completion_time?: number;
  submitted_at?: string;
}

export default function ImportSubmissionsDialog({ isOpen, onClose, onImportComplete }: ImportSubmissionsDialogProps) {
  const [rows, setRows] = useState<ParsedSubmissionRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.type !== 'text/csv') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast({
          title: 'Empty or invalid file',
          description: 'The CSV file must have a header and at least one row',
          variant: 'destructive',
        });
        return;
      }
      const header = lines[0].split(',').map(h => h.trim());
      const dataRows = lines.slice(1);
      const parsed: ParsedSubmissionRow[] = dataRows.map(line => {
        const values = line.split(',');
        const row: Record<string, string | number | undefined> = {};
        header.forEach((h, i) => {
          row[h] = values[i]?.trim();
        });
        // Convert types more robustly
        if (typeof row.week_number === 'string') row.week_number = Number(row.week_number);
        if (typeof row.primary_project_hours === 'string') row.primary_project_hours = Number(row.primary_project_hours);
        if (typeof row.form_completion_time === 'string') row.form_completion_time = Number(row.form_completion_time);
        return row as unknown as ParsedSubmissionRow;
      }).filter(row =>
        typeof row.email === 'string' &&
        typeof row.week_number === 'number' &&
        typeof row.primary_project_name === 'string' &&
        typeof row.primary_project_hours === 'number'
      );
      if (!parsed.length) {
        toast({
          title: 'No valid rows',
          description: 'No valid submission rows found in the CSV',
          variant: 'destructive',
        });
        return;
      }
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!rows.length) {
      toast({
        title: 'No data',
        description: 'Please upload a CSV file with valid submission data',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/submissions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissions: rows }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to import submissions');
      }
      toast({
        title: 'Import successful',
        description: `Imported: ${data.successCount}, Failed: ${data.failCount}`,
      });
      setRows([]);
      onImportComplete();
      onClose();
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import submissions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Submissions</DialogTitle>
          <DialogDescription>
            Upload a CSV file with previous submissions. Required columns: <b>email, week_number, primary_project_name, primary_project_hours</b>.<br />
            Optional: additional_projects, manager, feedback, changes_next_week, hour_reporting_impact, form_completion_time, submitted_at
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          <div className="text-sm text-muted-foreground space-y-2 overflow-x-auto">
            <p className="font-medium">CSV Format Example:</p>
            <pre className="bg-gray-100 p-2 rounded text-xs whitespace-pre">
email,week_number,primary_project_name,primary_project_hours,additional_projects,manager,feedback,changes_next_week,hour_reporting_impact,form_completion_time,submitted_at
user1@example.com,23,Project Alpha,40,Project Beta:5;Project Gamma:3,Manager A,Good week,More focus,No impact,10,2024-06-06T12:00:00Z
user2@example.com,23,Project Beta,38,,,Manager B,Challenging week,Try new approach,Some impact,12,2024-06-07T09:30:00Z
            </pre>
          </div>
          {rows.length > 0 && (
            <div className="max-h-60 overflow-y-auto border rounded-md p-4">
              <h4 className="text-sm font-medium mb-2">Preview ({rows.length} rows):</h4>
              <div className="space-y-1">
                {rows.slice(0, 10).map((row, idx) => (
                  <div key={idx} className="text-xs text-gray-600">
                    {row.email} | Week {row.week_number} | {row.primary_project_name} | {row.primary_project_hours}h
                  </div>
                ))}
                {rows.length > 10 && <div className="text-xs text-gray-400">...and {rows.length - 10} more</div>}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!rows.length || isLoading}>
            {isLoading ? 'Importing...' : 'Import Submissions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 