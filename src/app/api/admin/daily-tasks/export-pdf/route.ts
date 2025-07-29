import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { normalizeVietnameseString } from '@/lib/utils/string';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const user = searchParams.get('user');
  const month = searchParams.get('month');
  const week = searchParams.get('week');
  const project = searchParams.get('project'); // <-- Add this line

  // Query daily_tasks without pagination for PDF export
  let query = supabase
    .from('daily_tasks')
    .select('*, user:users(id, email, name)')
    .order('task_date', { ascending: false });

  if (user) {
    query = query.eq('user_id', user);
  }
  if (month) {
    query = query.gte('task_date', `${month}-01`).lte('task_date', `${month}-31`);
  }
  if (week) {
    const [year, weekNum] = week.split('-W');
    const firstDay = getDateOfISOWeek(Number(weekNum), Number(year));
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    query = query.gte('task_date', firstDay.toISOString().slice(0, 10)).lte('task_date', lastDay.toISOString().slice(0, 10));
  }
  if (project) {
    query = query.eq('project', project);
  }

  const { data: tasks, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get user info for filename
  let userInfo = '';
  if (tasks && tasks.length > 0 && tasks[0].user) {
    const userName = tasks[0].user.name || tasks[0].user.email;
    userInfo = `-${normalizeVietnameseString(userName).replace(/[^a-zA-Z0-9]/g, '-')}`;
  }

  // Calculate summary
  const totalHours = tasks?.reduce((sum, task) => sum + (task.hours || 0), 0) || 0;
  const totalTasks = tasks?.length || 0;

  // Create PDF
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(16);
  doc.text("Daily Tasks Report", 14, 20);
  doc.setFontSize(10);
  
  if (tasks && tasks.length > 0 && tasks[0].user) {
    doc.text(`User: ${normalizeVietnameseString(tasks[0].user.name || tasks[0].user.email)}`, 14, 28);
  }
  
  if (month) {
    doc.text(`Period: Month - ${month}`, 14, 36);
  } else if (week) {
    doc.text(`Period: Week - ${week}`, 14, 36);
  }
  
  doc.text(`Total Hours: ${totalHours}`, 14, 44);
  doc.text(`Total Tasks: ${totalTasks}`, 14, 52);

  // Table
  autoTable(doc, {
    startY: 60,
    head: [['Date', 'Project', 'Bucket', 'Hours', 'Description', 'Link']],
    body: tasks?.map(task => [
      task.task_date,
      normalizeVietnameseString(task.project || ''),
      normalizeVietnameseString(task.bucket || ''),
      task.hours || 0,
      normalizeVietnameseString(task.description || ''),
      task.link || ''
    ]) || [],
    columnStyles: {
      0: { cellWidth: 25 }, // Date
      1: { cellWidth: 30 }, // Project
      2: { cellWidth: 25 }, // Bucket
      3: { cellWidth: 15 }, // Hours
      4: { cellWidth: 50 }, // Description
      5: { cellWidth: 40 }  // Link
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
      halign: 'left'
    },
    headStyles: {
      fillColor: [75, 85, 99], // gray-600
      textColor: 255,
      fontStyle: 'bold'
    }
  });

  // Generate filename
  let filename = 'daily-tasks';
  if (userInfo) filename += userInfo;
  if (month) filename += `-${month}`;
  if (week) filename += `-${week}`;
  filename += '.pdf';

  // Convert to buffer
  const pdfBuffer = doc.output('arraybuffer');

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

// Helper: get first day of ISO week
function getDateOfISOWeek(week: number, year: number) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
} 