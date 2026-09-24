import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { profileService } from '../../services/profileService';
import { useToast } from '../../context/ToastContext';

type Props = { isOpen: boolean; onClose: () => void };
type Field = 'current' | 'next' | 'confirm';

const EMPTY = { current: '', next: '', confirm: '' };

export default function ChangePasswordModal({ isOpen, onClose }: Props) {
  const { showToast } = useToast();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [visible, setVisible] = useState<Record<Field, boolean>>({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setValues(EMPTY);
    setErrors({});
    setVisible({ current: false, next: false, confirm: false });
  };

  const close = () => {
    reset();
    onClose();
  };

  const validate = () => {
    const e: Partial<Record<Field, string>> = {};
    if (!values.current) e.current = 'Current password is required.';
    if (!values.next) e.next = 'New password is required.';
    else if (values.next.length < 8) e.next = 'Password must be at least 8 characters.';
    else if (values.next === values.current) e.next = 'New password must be different from your current password.';
    if (!values.confirm) e.confirm = 'Confirm password is required.';
    else if (values.next && values.confirm !== values.next) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await profileService.changePassword(values.current, values.next);
      showToast('Password changed successfully.', 'success');
      close();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not change password.';
      // Backend "current password" errors belong on that field
      if (/current password/i.test(msg)) setErrors({ current: msg });
      else showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: Field, label: string, autoComplete: string) => (
    <div>
      <label htmlFor={`pw-${field}`} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={`pw-${field}`}
          type={visible[field] ? 'text' : 'password'}
          value={values[field]}
          autoComplete={autoComplete}
          onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
          className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors[field] ? 'border-red-400' : 'border-gray-300'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => ({ ...v, [field]: !v[field] }))}
          aria-label={visible[field] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
        >
          {visible[field] ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {errors[field] && <p className="mt-1 text-xs text-red-600">{errors[field]}</p>}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={close} title="Change Password">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {renderField('current', 'Current Password', 'current-password')}
        {renderField('next', 'New Password', 'new-password')}
        {renderField('confirm', 'Confirm New Password', 'new-password')}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}