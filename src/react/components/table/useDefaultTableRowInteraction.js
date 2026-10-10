import {useRef} from 'react';
import {getColumnKey} from '../inputs/defaultInputUtils';
import {getRowKey} from './DefaultTable.utils';

// Keep navigation locked while any cell in this row is editing or saving.
export default function useDefaultTableRowInteraction() {
  const blockedFields = useRef(new Map());
  const setRowInteraction = (row, column, blocked) => {
    const key = row?.id != null || row?.['@id'] != null ? getRowKey(row) : row;
    const fields = blockedFields.current.get(key) || new Set();
    const field = getColumnKey(column);
    if (blocked) fields.add(field);
    else fields.delete(field);
    if (fields.size) blockedFields.current.set(key, fields);
    else blockedFields.current.delete(key);
  };
  const canOpenRow = row => !blockedFields.current.has(row?.id != null || row?.['@id'] != null ? getRowKey(row) : row);
  return {canOpenRow, setRowInteraction};
}
