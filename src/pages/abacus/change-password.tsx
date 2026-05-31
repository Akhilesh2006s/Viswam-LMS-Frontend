import { FormEvent, useState } from 'react';
import { Link } from 'wouter';
import { AbacusModuleLayout } from '@/components/abacus/AbacusModuleLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePageTitle } from '@/hooks/use-page-title';
import { ABACUS_ROUTES } from '@/lib/abacus-routes';
import { installAbacusBrowserApi } from '@/lib/abacus-browser-api';
import { useEffect } from 'react';

export default function AbacusChangePasswordPage() {
  usePageTitle('Change Password');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('abacusUser') || localStorage.getItem('student') || '{}');

  useEffect(() => {
    installAbacusBrowserApi();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');
    setError('');
    const form = e.currentTarget;
    const oldPassword = (form.elements.namedItem('oldPassword') as HTMLInputElement).value;
    const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
    try {
      await window.AbacusAPI!.fetch('/portal/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      setMessage('Password updated successfully.');
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  return (
    <AbacusModuleLayout page="password" title="Change Password">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-center text-xl font-bold text-[#0b1f3a]">Change Password</h1>
        {user.email ? <p className="mt-2 text-center text-sm text-slate-500">Signed in as {user.email}</p> : null}
        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <Input name="oldPassword" type="password" placeholder="Current password" required />
          <Input name="newPassword" type="password" placeholder="New password (min 6 chars)" required />
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Update Password</Button>
          <Button type="button" variant="outline" className="w-full" asChild>
            <Link href={ABACUS_ROUTES.home}>Back to Home</Link>
          </Button>
        </form>
        {message ? <p className="mt-3 text-center text-sm text-green-700">{message}</p> : null}
        {error ? <p className="mt-3 text-center text-sm text-red-600">{error}</p> : null}
      </div>
    </AbacusModuleLayout>
  );
}
