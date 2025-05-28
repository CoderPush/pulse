'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Question } from '@/types/weekly-pulse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EditQuestionModal } from '@/components/admin/EditQuestionModal';

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState({ title: '', description: '', type: 'text', required: false });
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleQuestion, setToggleQuestion] = useState<Question | null>(null);
  const [toggleToActive, setToggleToActive] = useState(true);

  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => setQuestions(data.questions || []));
  }, []);

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form }),
    });
    setOpen(false);
    setForm({ title: '', description: '', type: 'text', required: false });
    // Refresh questions
    const res = await fetch('/api/questions');
    const data = await res.json();
    setQuestions(data.questions || []);
  };

  const refreshQuestions = async () => {
    const res = await fetch('/api/questions');
    const data = await res.json();
    setQuestions(data.questions || []);
  };

  const handleEdit = (q: Question) => {
    setEditQuestion(q);
    setEditOpen(true);
  };

  const handleToggleStatus = (q: Question, toActive: boolean) => {
    setToggleQuestion(q);
    setToggleToActive(toActive);
    setConfirmOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!toggleQuestion) return;
    await fetch(`/api/questions/${toggleQuestion.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: toggleToActive }),
    });
    setConfirmOpen(false);
    setToggleQuestion(null);
    refreshQuestions();
  };

  const coreQuestions = questions.filter(q => q.category);
  const dynamicQuestions = questions.filter(q => !q.category);

  const renderStatusBadge = (isActive?: boolean) => (
    isActive ? (
      <span className="inline-block px-2 py-0.5 text-xs rounded bg-green-100 text-green-800">Active</span>
    ) : (
      <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700">Inactive</span>
    )
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="mb-4">Add Question</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Question</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Title"
                    value={form.title}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Description"
                    value={form.description}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value: string) => setForm(f => ({ ...f, type: value }))}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="textarea">Textarea</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="required"
                    checked={form.required}
                    onCheckedChange={(checked: boolean) => setForm(f => ({ ...f, required: !!checked }))}
                  />
                  <Label htmlFor="required">Required</Label>
                </div>
                <DialogFooter>
                  <Button type="submit">Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <h2 className="text-lg font-semibold mt-8 mb-2">Core Questions (Fixed Fields)</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Core questions are mapped directly to fixed columns in the submissions table. These are stable, always-present fields in every submission.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title & Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Display Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coreQuestions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <div className="font-semibold">{q.title}</div>
                    {q.description && (
                      <div className="text-xs text-muted-foreground mt-1">{q.description}</div>
                    )}
                  </TableCell>
                  <TableCell>{q.type}</TableCell>
                  <TableCell>
                    {q.required ? (
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-green-100 text-green-800">Yes</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700">No</span>
                    )}
                  </TableCell>
                  <TableCell>{q.version}</TableCell>
                  <TableCell>{q.category || ""}</TableCell>
                  <TableCell>{q.display_order ?? ""}</TableCell>
                  <TableCell>{renderStatusBadge(q.is_active)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(q)}>Edit</Button>
                    {q.is_active ? (
                      <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleToggleStatus(q, false)}>Deactivate</Button>
                    ) : (
                      <Button size="sm" variant="secondary" className="ml-2" onClick={() => handleToggleStatus(q, true)}>Activate</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <h2 className="text-lg font-semibold mt-8 mb-2">Dynamic Questions</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Dynamic questions are flexible and can be added or changed at any time. Their answers are stored separately and are not tied to fixed columns in the submissions table.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title & Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Display Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dynamicQuestions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <div className="font-semibold">{q.title}</div>
                    {q.description && (
                      <div className="text-xs text-muted-foreground mt-1">{q.description}</div>
                    )}
                  </TableCell>
                  <TableCell>{q.type}</TableCell>
                  <TableCell>
                    {q.required ? (
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-green-100 text-green-800">Yes</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700">No</span>
                    )}
                  </TableCell>
                  <TableCell>{q.version}</TableCell>
                  <TableCell>{q.display_order ?? ""}</TableCell>
                  <TableCell>{renderStatusBadge(q.is_active)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(q)}>Edit</Button>
                    {q.is_active ? (
                      <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleToggleStatus(q, false)}>Deactivate</Button>
                    ) : (
                      <Button size="sm" variant="secondary" className="ml-2" onClick={() => handleToggleStatus(q, true)}>Activate</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <EditQuestionModal question={editQuestion} open={editOpen} onOpenChange={setEditOpen} onSave={refreshQuestions} />

          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{toggleToActive ? 'Activate' : 'Deactivate'} Question</DialogTitle>
              </DialogHeader>
              <p>Are you sure you want to {toggleToActive ? 'activate' : 'deactivate'} this question?</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button variant={toggleToActive ? 'secondary' : 'destructive'} onClick={confirmToggleStatus}>
                  {toggleToActive ? 'Activate' : 'Deactivate'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
        <CardFooter />
      </Card>
    </div>
  );
} 