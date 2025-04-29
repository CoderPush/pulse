'use client';

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

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export default function ImportDialog({ isOpen, onClose, onImportComplete }: ImportDialogProps) {
  const [emails, setEmails] = useState<string[]>([]);
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
      const lines = text.split('\n');
      
      // Skip empty lines and get non-empty lines
      const nonEmptyLines = lines.filter(line => line.trim().length > 0);
      
      if (nonEmptyLines.length === 0) {
        toast({
          title: 'Empty file',
          description: 'The CSV file is empty',
          variant: 'destructive',
        });
        return;
      }

      // Check if first line is a header
      const firstLine = nonEmptyLines[0].toLowerCase().trim();
      const isHeader = firstLine.includes('email') || firstLine.split(',')[0].trim() === 'email';
      
      // Process the lines, skipping header if present
      const startIndex = isHeader ? 1 : 0;
      const parsedEmails = nonEmptyLines
        .slice(startIndex)
        .map(line => line.trim())
        .filter(line => line && line.includes('@'))
        .map(line => line.split(',')[0].trim());
      
      if (parsedEmails.length === 0) {
        toast({
          title: 'No valid emails found',
          description: 'The CSV file does not contain any valid email addresses',
          variant: 'destructive',
        });
        return;
      }

      setEmails(parsedEmails);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!emails.length) {
      toast({
        title: 'No emails found',
        description: 'Please upload a CSV file with email addresses',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import users');
      }

      toast({
        title: 'Import successful',
        description: `Successfully imported ${data.successCount} users, skipped ${data.skipCount} existing users`,
      });

      onImportComplete();
      onClose();
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Users</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing email addresses to import users. The file can optionally include a header row with &quot;Email&quot; as the first column. Existing users will be skipped.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">CSV Format Requirements:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Email addresses must be in the first column</li>
                <li>Optional header row with &quot;Email&quot; as the first column</li>
                <li>One email address per line</li>
                <li>Empty lines are automatically skipped</li>
                <li>Invalid email formats are ignored</li>
              </ul>
              <p className="font-medium mt-2">Example CSV format:</p>
              <pre className="bg-gray-100 p-2 rounded text-xs">
                Email{'\n'}
                user@example.com{'\n'}
                another@example.com
              </pre>
            </div>
          </div>
          {emails.length > 0 && (
            <div className="max-h-60 overflow-y-auto border rounded-md p-4">
              <h4 className="text-sm font-medium mb-2">Found {emails.length} email addresses:</h4>
              <div className="space-y-1">
                {emails.map((email, index) => (
                  <div key={index} className="text-sm text-gray-600">{email}</div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!emails.length || isLoading}>
            {isLoading ? 'Importing...' : 'Import Users'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 