'use client';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FollowUpForm, FollowUpFormValues } from '../../FollowUpForm';
import { createClient } from '@/utils/supabase/client';
// import { editFollowUpAction } from './actions'; // To be implemented

export default function EditFollowUpPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const [initialValues, setInitialValues] = useState<FollowUpFormValues | null>(null);
  const [allUsers, setAllUsers] = useState<{ id: string; email: string; name?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const fetchData = async () => {
      const supabase = createClient();
      // 1. Fetch follow-up details
      const { data: followUp, error } = await supabase
        .rpc('get_followup_details_by_id', { p_template_id: id })
        .single();
      // 2. Fetch all users
      const usersRes = await fetch('/api/admin/users');
      const usersJson = await usersRes.json();
      const users = usersJson.data || [];
      // 3. Transform followUp to FollowUpFormValues
      if (followUp) {
        const f = followUp as any;
        setInitialValues({
          name: f.name || '',
          description: f.description || '',
          questions: (f.questions || []).map((q: any, i: number) => ({
            id: q.id || i + 1,
            text: q.title || q.text || '',
            type: q.type || 'text',
            description: q.description || '',
            required: q.required || false,
            choices: q.choices || [],
          })),
          users: (f.participants || []).map((u: any) => u.id),
          frequency: f.frequency || 'daily',
          days: f.days || [],
          reminderTime: f.reminderTime || '09:00',
          templateId: f.id,
        });
      }
      setAllUsers(users);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (values: FollowUpFormValues) => {
    // await editFollowUpAction(values);
    alert('Follow-up updated! (mock)');
    router.push('/admin/follow-up');
  };

  if (loading || !initialValues) return <div className="max-w-3xl mx-auto py-8">Loading...</div>;

  return (
    <FollowUpForm
      initialValues={initialValues}
      allUsers={allUsers}
      mode="edit"
      onSubmit={handleSubmit}
      onCancel={() => router.push('/admin/follow-up')}
    />
  );
} 