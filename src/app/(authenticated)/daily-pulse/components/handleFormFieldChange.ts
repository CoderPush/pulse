import React from 'react';

// For a single form object
export function handleFormFieldChange(
  setForm: React.Dispatch<React.SetStateAction<Record<string, string | string[]>>>
) {
  return (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string | string[]; type: string; checked?: boolean } }
  ) => {
    if (
      typeof e.target.name !== 'string' ||
      typeof e.target.value === 'undefined'
    ) {
      return;
    }
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? (e.target as { checked: boolean }).checked : undefined;
    setForm(prev => {
      const newForm = { ...prev };
      if (type === 'checkbox') {
        const prevArr = Array.isArray(newForm[name]) ? (newForm[name] as string[]) : [];
        if (checked) {
          newForm[name] = [...prevArr, value as string];
        } else {
          newForm[name] = prevArr.filter((v: string) => v !== value);
        }
      } else {
        newForm[name] = value;
      }
      return newForm;
    });
  };
}

// For an array of forms (used in DailyPulseClient)
export function handleFormFieldChangeArray<T extends { form: Record<string, string | string[]> }>(
  setArray: React.Dispatch<React.SetStateAction<T[]>>,
  idx: number
) {
  return (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string | string[]; type: string; checked?: boolean } }
  ) => {
    const { name, value, type, checked } =
      'target' in e && typeof e.target === 'object'
        ? {
            name: e.target.name,
            value: e.target.value,
            type: e.target.type,
            checked: 'checked' in e.target ? (e.target as { checked?: boolean }).checked : undefined,
          }
        : { name: '', value: '', type: '', checked: false };
    setArray(prev =>
      prev.map((f, i) => {
        if (i !== idx) return f;
        const newForm = { ...f.form };
        if (type === 'checkbox') {
          const prevArr = Array.isArray(newForm[name]) ? (newForm[name] as string[]) : [];
          if (checked) {
            newForm[name] = [...prevArr, value as string];
          } else {
            newForm[name] = prevArr.filter((v: string) => v !== value);
          }
        } else {
          newForm[name] = value;
        }
        return { ...f, form: newForm };
      })
    );
  };
} 