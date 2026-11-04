import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { UpdateNotice } from '../../src/components/UpdateNotice';

afterEach(() => { vi.unstubAllGlobals(); });

it('announces a waiting update without activating it or reloading the open page', async () => {
  const worker = new EventTarget() as ServiceWorker;
  Object.defineProperty(worker, 'state', { value: 'installing', writable: true });
  const registration = new EventTarget() as ServiceWorkerRegistration;
  Object.defineProperty(registration, 'installing', { value: worker });
  Object.defineProperty(registration, 'waiting', { value: null, writable: true });
  const register = vi.fn().mockResolvedValue(registration);
  const postMessage = vi.fn();
  Object.defineProperty(worker, 'postMessage', { value: postMessage });
  vi.stubGlobal('navigator', { serviceWorker: { register, controller: {} } });
  render(<UpdateNotice />);
  await waitFor(() => expect(register).toHaveBeenCalled());
  registration.dispatchEvent(new Event('updatefound'));
  Object.defineProperty(worker, 'state', { value: 'installed' });
  worker.dispatchEvent(new Event('statechange'));
  expect(await screen.findByRole('status')).toHaveTextContent(/close all.*tabs/i);
  expect(postMessage).not.toHaveBeenCalled();
});
