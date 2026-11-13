import {useCallback, useState} from 'react';

export default function useDefaultTableCreateForm({onAdd, onSaved, resolvedActions, handleRefresh}) {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const closeCreateForm = useCallback(() => setIsCreateFormOpen(false), []);
  const canUseDefaultCreateForm = typeof resolvedActions?.save === 'function';
  const handleAdd = useCallback(() => {
    if (typeof onAdd === 'function') {
      return onAdd();
    }
    if (!canUseDefaultCreateForm) {
      return null;
    }
    setIsCreateFormOpen(true);
    return null;
  }, [canUseDefaultCreateForm, onAdd]);
  const resolvedOnAdd = typeof onAdd === 'function' || canUseDefaultCreateForm
    ? handleAdd
    : null;
  const handleDefaultCreateSaved = useCallback(
    savedItem => {
      closeCreateForm();
      onSaved?.(savedItem, null);
      handleRefresh?.();
    },
    [closeCreateForm, handleRefresh, onSaved],
  );
  return {isCreateFormOpen, closeCreateForm, resolvedOnAdd, handleDefaultCreateSaved};
}
