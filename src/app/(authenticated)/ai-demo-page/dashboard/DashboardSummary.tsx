import React from "react";
import { Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
import type { Question } from '@/types/followup';

type FormType = { form: Record<string, string>, questions: Question[] };

function getWeek(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  // ISO week: https://stackoverflow.com/a/6117889
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay()||7));
  const yearStart = new Date(d.getFullYear(),0,1);
  const weekNo = Math.ceil((((d.getTime()-yearStart.getTime())/86400000)+1)/7);
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2,"0")}`;
}

function getMonth(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}`;
}

export default function DashboardSummary({ forms, filterType, filterValue }: {
  forms: FormType[],
  filterType: 'week' | 'month',
  filterValue: string
}) {
  // Filter tasks by week or month
  const filtered = forms.filter(f => {
    const date = f.form.date;
    if (!date) return false;
    if (filterType === 'week' && filterValue) {
      return getWeek(date) === filterValue;
    }
    if (filterType === 'month' && filterValue) {
      return getMonth(date) === filterValue;
    }
    return true;
  });

  // Summary calculations
  const totalHours = filtered.reduce((sum, f) => {
    const h = parseFloat(f.form.hours || "0");
    return sum + (isNaN(h) ? 0 : h);
  }, 0);

  // Distribution by project
  const byProject: Record<string, number> = {};
  const byBucket: Record<string, number> = {};
  filtered.forEach(f => {
    const h = parseFloat(f.form.hours || "0");
    if (f.form.project) byProject[f.form.project] = (byProject[f.form.project] || 0) + (isNaN(h) ? 0 : h);
    if (f.form.bucket) byBucket[f.form.bucket] = (byBucket[f.form.bucket] || 0) + (isNaN(h) ? 0 : h);
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Daily Tasks Summary", 14, 20);
    doc.setFontSize(10);
    doc.text(`Filter: ${filterType} - ${filterValue}`, 14, 28);
    doc.text(`Total Hours: ${totalHours}`, 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Project', 'Bucket', 'Hours', 'Description', 'Link']],
      body: filtered.map(f => [
        f.form.date,
        f.form.project,
        f.form.bucket,
        f.form.hours,
        f.form.description,
        f.form.link || ''
      ]),
      columnStyles: {
        0: { cellWidth: 25 }, // Date - wider
        1: { cellWidth: 30 }, // Project - wider
        2: { cellWidth: 30 }, // Bucket - standard
        3: { cellWidth: 15 }, // Hours - smaller
        4: { cellWidth: 40 }, // Description - wider
        5: { cellWidth: 50 }  // Link - same as description
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

    doc.save(`daily-tasks-${filterValue}.pdf`);
  };

  // Chart data for projects (Bar)
  const projectChartData = {
    labels: Object.keys(byProject),
    datasets: [
      {
        label: 'Hours',
        data: Object.values(byProject),
        backgroundColor: '#60a5fa',
        borderColor: '#2563eb',
        borderWidth: 1,
      },
    ],
  };

  // Chart data for buckets (Bar)
  const bucketChartData = {
    labels: Object.keys(byBucket),
    datasets: [
      {
        label: 'Hours',
        data: Object.values(byBucket),
        backgroundColor: '#fde68a',
        borderColor: '#f59e42',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      {/* Weekly/Monthly Summary */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <div className="flex flex-wrap gap-6">
          <div className="bg-blue-50 rounded-lg px-4 py-3">
            <div className="text-sm text-gray-500">Total Hours</div>
            <div className="text-2xl font-bold text-blue-700">{totalHours}</div>
          </div>
          <div className="bg-green-50 rounded-lg px-4 py-3">
            <div className="text-sm text-gray-500">Projects</div>
            <div className="text-lg font-semibold text-green-700">{Object.keys(byProject).length}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg px-4 py-3">
            <div className="text-sm text-gray-500">Buckets</div>
            <div className="text-lg font-semibold text-yellow-700">{Object.keys(byBucket).length}</div>
          </div>
        </div>
      </div>

      {/* Distribution by Project */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Distribution by Project</h3>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-1/2 max-w-lg">
            {Object.entries(byProject).length === 0 ? (
              <span className="text-gray-400">No data</span>
            ) : (
              <Bar
                data={projectChartData}
                options={{
                  plugins: { legend: { display: false } },
                  responsive: true,
                  scales: {
                    x: { title: { display: true, text: 'Project' } },
                    y: { title: { display: true, text: 'Hours' }, beginAtZero: true }
                  }
                }}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byProject).map(([project, hours]) => (
              <span key={project} className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-sm font-medium">{project}: {hours}h</span>
            ))}
          </div>
        </div>
      </div>

      {/* Distribution by Bucket */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Distribution by Bucket</h3>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-1/2 max-w-lg">
            {Object.entries(byBucket).length === 0 ? (
              <span className="text-gray-400">No data</span>
            ) : (
              <Bar
                data={bucketChartData}
                options={{
                  plugins: { legend: { display: false } },
                  responsive: true,
                  scales: {
                    x: { title: { display: true, text: 'Bucket' } },
                    y: { title: { display: true, text: 'Hours' }, beginAtZero: true }
                  }
                }}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byBucket).map(([bucket, hours]) => (
              <span key={bucket} className="bg-yellow-100 text-yellow-700 rounded-full px-3 py-1 text-sm font-medium">{bucket}: {hours}h</span>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Section: List of all tasks matching filter */}
      <div>
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Details</h3>
            <button
                onClick={handleExportPDF}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold text-sm px-3 py-1 rounded-md shadow-sm transition"
            >
                Export PDF
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 border w-[100px]">Date</th>
                <th className="px-2 py-1 border w-1/6">Project</th>
                <th className="px-2 py-1 border w-1/6">Bucket</th>
                <th className="px-2 py-1 border w-1/12">Hours</th>
                <th className="px-2 py-1 border">Description</th>
                <th className="px-2 py-1 border">Link</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-4">No tasks found</td>
                </tr>
              )}
              {filtered.map((f, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-2 py-1 border">{f.form.date}</td>
                  <td className="px-2 py-1 border">{f.form.project}</td>
                  <td className="px-2 py-1 border">{f.form.bucket}</td>
                  <td className="px-2 py-1 border">{f.form.hours}</td>
                  <td className="px-2 py-1 border">{f.form.description}</td>
                  <td className="px-2 py-1 border">
                    {f.form.link && (
                      <a
                        href={f.form.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {f.form.link}
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
