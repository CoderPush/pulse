'use client';
import { useRouter } from 'next/navigation';
import { FollowUpForm, FollowUpFormValues } from '../FollowUpForm';
import { createFollowUpAction } from './actions';
import { useEffect, useState } from 'react';

const emptyValues: FollowUpFormValues = {
  name: '',
  description: '',
  questions: [{
    id: '1',
    title: '',
    type: 'text',
    description: '',
    required: false,
    choices: [],
  }],
  users: [],
  frequency: 'daily',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  reminderTime: '09:00',
};

export default function CreateFollowUpPage() {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<{ id: string; email: string; name?: string }[]>([]);
  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => setAllUsers(data.data || []));
  }, []);

  console.log(allUsers);
  const handleSubmit = async (values: FollowUpFormValues) => {
    const result = await createFollowUpAction(values);
    if (result?.success) {
      router.push('/admin/follow-up');
    } else {
      alert(result?.error || 'Failed to create follow-up');
    }
  };
  return (
    <FollowUpForm
      initialValues={emptyValues}
      mode="create"
      allUsers={allUsers}
      onSubmit={handleSubmit}
      onCancel={() => router.push('/admin/follow-up')}
    />
  );
} 