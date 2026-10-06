import { redirect } from 'next/navigation';

export default function AdminScannerRedirect() {
  redirect('/organizer/check-in');
}
