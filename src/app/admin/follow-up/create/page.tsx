'use client';
import { useRouter } from 'next/navigation';
import { FollowUpForm, FollowUpFormValues } from '../FollowUpForm';

const emptyValues: FollowUpFormValues = {
  name: '',
  description: '',
  questions: [{ id: 1, text: '', short: '', type: 'open-ended' }],
  users: [],
  frequency: 'daily',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  reminderTime: '09:00',
};
const allUsers = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Carol' },
];

export default function CreateFollowUpPage() {
  const router = useRouter();
  const handleSubmit = (values: FollowUpFormValues) => {
    alert('Follow-up created! (mock)');
    router.push('/admin/follow-up');
  };
  return (
    <FollowUpForm
      initialValues={emptyValues}
      allUsers={allUsers}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={() => router.push('/admin/follow-up')}
    />
  );
} 