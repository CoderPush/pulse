import React from "react";
import DailyPulseFormInner from "./DailyPulseFormInner";
import type { Question } from '@/types/followup';

interface TaskEditFormProps {
  editIdx: number | null;
  forms: Array<{ form: Record<string, string>, questions: Question[] }>;
  setForms: React.Dispatch<React.SetStateAction<Array<{ form: Record<string, string>, questions: Question[] }>>>;
  saveTasks: (tasks: Array<{ form: Record<string, string>, questions: Question[] }>) => void;
  setEditIdx: (idx: number | null) => void;
}

const TaskEditForm: React.FC<TaskEditFormProps> = ({ editIdx, forms, setForms, saveTasks, setEditIdx }) => {
  if (editIdx === null || !forms[editIdx]) return null;
  return (
    <div className="mb-8">
      <DailyPulseFormInner
        form={forms[editIdx].form}
        questions={forms[editIdx].questions}
        submitting={false}
        submitError={null}
        onChange={e => {
          const { name, value } = e.target;
          setForms(prev => prev.map((ff, i) => i === editIdx ? { ...ff, form: { ...ff.form, [name]: value } } : ff));
        }}
        onSubmit={e => {
          e.preventDefault();
          setForms(prev => {
            saveTasks(prev);
            return prev;
          });
          setEditIdx(null);
        }}
        submitLabel="Save"
        showCancel={true}
        onCancel={() => setEditIdx(null)}
      />
    </div>
  );
};

export default TaskEditForm;
