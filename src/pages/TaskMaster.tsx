import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { Layout } from '../components/layout/Layout';
import { useToast } from '../context/ToastContext';
import { taskMasterService } from '../services/taskService';

type TaskMasterRecord = { taskId: string; taskName: string; status: string };

export function TaskMaster() {
  const { showToast } = useToast();
  const [records, setRecords] = useState<TaskMasterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<TaskMasterRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<TaskMasterRecord | null>(null);
  const [form, setForm] = useState({ taskId: '', taskName: '', status: 'Active' });

  const load = async () => {
    try { setError(''); setLoading(true); setRecords(await taskMasterService.getAll()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load Task Master.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [query]);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return records.filter((record) => !value || record.taskId.toLowerCase().includes(value) || record.taskName.toLowerCase().includes(value));
  }, [query, records]);
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => { setEditing(null); setForm({ taskId: '', taskName: '', status: 'Active' }); setFormOpen(true); };
  const openEdit = (record: TaskMasterRecord) => { setEditing(record); setForm({ taskId: record.taskId, taskName: record.taskName, status: record.status }); setFormOpen(true); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (!form.taskName.trim()) throw new Error('Task Name is required.');
      if (editing) await taskMasterService.update(editing.taskId, { taskName: form.taskName.trim(), status: form.status });
      else await taskMasterService.create({ taskId: form.taskId.trim(), taskName: form.taskName.trim(), status: form.status });
      showToast(editing ? 'Task Master record updated successfully.' : 'Task Master record created successfully.');
      setEditing(null); setFormOpen(false); setForm({ taskId: '', taskName: '', status: 'Active' }); await load();
    } catch (err) { showToast(err instanceof Error ? err.message : 'Failed to save Task Master record.', 'error'); }
  };
  const remove = async () => {
    if (!deleting) return;
    try { await taskMasterService.delete(deleting.taskId); showToast('Task Master record deleted successfully.'); setDeleting(null); await load(); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Failed to delete Task Master record.', 'error'); }
  };

  return (
    <Layout breadcrumbs={[{ label: 'Master' }, { label: 'Task Master', path: '/master/task-master' }]} title="Task Master">
      <div className="mb-6 flex flex-col gap-4">
        <div><h1 className="text-2xl font-semibold text-slate-900">Task Master</h1><p className="mt-1 text-sm text-slate-500">Manage valid task identifiers and names</p></div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Task ID or Task Name" className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <Button onClick={openCreate}><Plus className="h-4 w-4" />Add New Task</Button>
        </div>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" /></div> : error ? <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div> : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="max-h-[calc(100vh-18rem)] overflow-auto"><table className="w-full text-left text-sm"><thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50"><tr>{['Actions', 'Task ID', 'Task Name', 'Status'].map((header) => <th key={header} className="px-4 py-3 font-medium text-slate-600">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">
            {visible.map((record) => <tr key={record.taskId} className="hover:bg-slate-50"><td className="px-4 py-3"><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => openEdit(record)}><Pencil className="h-4 w-4" />Edit</Button><Button variant="ghost" size="sm" onClick={() => setDeleting(record)}><Trash2 className="h-4 w-4 text-red-600" /></Button></div></td><td className="px-4 py-3 text-slate-600">{record.taskId}</td><td className="px-4 py-3 font-medium text-slate-900">{record.taskName}</td><td className="px-4 py-3 text-slate-600">{record.status}</td></tr>)}
            {visible.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-500">No Task Master records found.</td></tr>}
          </tbody></table></div>
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
        </div>
      )}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Task Master' : 'Add New Task'}>
        <form onSubmit={save} className="space-y-4">{editing && <input disabled value={form.taskId} placeholder="Task ID" className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />}<input value={form.taskName} onChange={(event) => setForm({ ...form, taskName: event.target.value })} placeholder="Task Name" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"><option value="Active">Active</option><option value="Inactive">Inactive</option></select><div className="flex gap-3"><Button type="submit">{editing ? 'Save Changes' : 'Add Task'}</Button><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button></div></form>
      </Modal>
      <ConfirmDialog isOpen={!!deleting} title="Delete Task Master Record?" message={deleting ? `Are you sure you want to delete "${deleting.taskId}"?` : ''} onConfirm={remove} onCancel={() => setDeleting(null)} />
    </Layout>
  );
}
