'use client';
import { useRouter } from 'next/navigation';
import { FollowUpForm, FollowUpFormValues } from '../../FollowUpForm';

const mockFollowUp: FollowUpFormValues = {
  name: 'Daily Standup',
  description: 'Daily check-in for team members',
  questions: [
    { id: 1, text: 'What did you complete yesterday?', short: 'Yesterday', type: 'open-ended' },
    { id: 2, text: 'What will you work on today?', short: 'Today', type: 'open-ended' },
    { id: 3, text: 'Any blockers?', short: 'Blockers', type: 'open-ended' },
  ],
  users: ['1', '2'],
  frequency: 'daily',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  reminderTime: '09:00',
};
const allUsers = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Carol' },
];

export default function EditFollowUpPage() {
  const router = useRouter();
  const handleSubmit = (values: FollowUpFormValues) => {
    alert('Follow-up saved! (mock)');
    router.push('/admin/follow-up');
  };
  return (
    <FollowUpForm
      initialValues={mockFollowUp}
      allUsers={allUsers}
      mode="edit"
      onSubmit={handleSubmit}
      onCancel={() => router.push('/admin/follow-up')}
    />
  );
} 