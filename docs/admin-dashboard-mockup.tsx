import { useState } from 'react';

export default function AdminDashboard() {
  const [weekFilter, setWeekFilter] = useState('Week 17 (Current)');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchEmail, setSearchEmail] = useState('');
  
  // Mock data
  const submissions = [
    { 
      email: 'john.doe@company.com', 
      project: 'Apollo', 
      hours: 40, 
      manager: 'jane.smith@company.com', 
      status: 'On Time' 
    },
    { 
      email: 'alice.wang@company.com', 
      project: 'Mercury', 
      hours: 35, 
      manager: 'robert.johnson@company.com', 
      status: 'On Time' 
    },
    { 
      email: 'michael.brown@company.com', 
      project: 'Jupiter', 
      hours: 45, 
      manager: 'linda.taylor@company.com', 
      status: 'Late' 
    },
    { 
      email: 'sarah.miller@company.com', 
      project: 'Neptune', 
      hours: 38, 
      manager: 'james.wilson@company.com', 
      status: 'Not Submitted' 
    },
    { 
      email: 'david.garcia@company.com', 
      project: 'Venus', 
      hours: 42, 
      manager: 'emily.davis@company.com', 
      status: 'On Time' 
    }
  ];
  
  // Helper function for status badge styling
  const getStatusStyle = (status) => {
    switch(status) {
      case 'On Time':
        return 'bg-green-100 text-green-800';
      case 'Late':
        return 'bg-red-100 text-red-800';
      case 'Not Submitted':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const handleExport = () => {
    alert('Exporting data as CSV...');
  };
  
  const handleFilter = () => {
    alert(`Filtering by: ${weekFilter}, ${statusFilter}, Search: ${searchEmail}`);
  };
  
  const handleViewSubmission = (email) => {
    alert(`Viewing submission details for ${email}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 shadow">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-white">
            Weekly Pulse Tracker - Admin Dashboard
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow">
            {/* Filter Section */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 rounded-t-lg">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {/* Week Filter */}
                <div>
                  <label htmlFor="week" className="block text-sm font-medium text-gray-700">
                    Filter by Week:
                  </label>
                  <select
                    id="week"
                    name="week"
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    value={weekFilter}
                    onChange={(e) => setWeekFilter(e.target.value)}
                  >
                    <option>Week 17 (Current)</option>
                    <option>Week 16</option>
                    <option>Week 15</option>
                    <option>Week 14</option>
                    <option>Week 13</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Submission Status:
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option>All Statuses</option>
                    <option>On Time</option>
                    <option>Late</option>
                    <option>Not Submitted</option>
                  </select>
                </div>

                {/* Email Search */}
                <div className="lg:col-span-2">
                  <label htmlFor="email-search" className="block text-sm font-medium text-gray-700">
                    Search by Email:
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="email-search"
                      id="email-search"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      placeholder="Enter email address..."
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                    />
                    <button
                      type="button"
                      className="ml-3 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={handleFilter}
                    >
                      Filter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manager
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {submission.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission.project}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission.hours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission.manager}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(submission.status)}`}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                          onClick={() => handleViewSubmission(submission.email)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <button
                    onClick={handleExport}
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{' '}
                      <span className="font-medium">70</span> employees
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <a
                        href="#"
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-indigo-50 text-sm font-medium text-indigo-600 hover:bg-gray-50"
                      >
                        1
                      </a>
                      <a
                        href="#"
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        2
                      </a>
                      <a
                        href="#"
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        3
                      </a>
                      <a
                        href="#"
                        className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Next</span>
                        →
                      </a>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
