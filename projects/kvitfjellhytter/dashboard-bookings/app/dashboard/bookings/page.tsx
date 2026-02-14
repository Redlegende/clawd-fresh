import { createClient } from '@/lib/supabase/server';
import { BookingsTable } from './BookingsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Users, DollarSign } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Booking {
  id: string;
  booking_uid: string;
  reservation_code: string | null;
  booking_status: string | null;
  platform_type: string | null;
  listing_uid: string | null;
  property_uid: string | null;
  guest_uid: string | null;
  local_checkin_dttm: string | null;
  local_checkout_dttm: string | null;
  number_of_guests: number | null;
  price_currency: string | null;
  price_total: number | null;
  synced_at: string;
}

async function getBookings(): Promise<Booking[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('local_checkin_dttm', { ascending: false })
    .limit(100);
  
  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
  
  return data || [];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatCurrency(amount: number | null, currency: string | null): string {
  if (amount === null) return '-';
  const curr = currency || 'NOK';
  return `${amount.toLocaleString('nb-NO')} ${curr}`;
}

function getStatusBadge(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-800';
  
  const statusMap: Record<string, string> = {
    'confirmed': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'cancelled': 'bg-red-100 text-red-800',
    'completed': 'bg-blue-100 text-blue-800',
  };
  
  return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

export default async function BookingsPage() {
  const bookings = await getBookings();
  
  // Calculate stats
  const upcomingBookings = bookings.filter(b => {
    if (!b.local_checkin_dttm) return false;
    return new Date(b.local_checkin_dttm) >= new Date();
  });
  
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.price_total || 0), 0);
  const totalGuests = bookings.reduce((sum, b) => sum + (b.number_of_guests || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
        <a
          href="/dashboard"
          className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
        >
          ← Back to Dashboard
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Upcoming Bookings
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {upcomingBookings.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              From today onwards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Guests
            </CardTitle>
            <Users className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalGuests}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalRevenue, 'NOK')}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              From {bookings.length} bookings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No bookings found</p>
              <p className="text-sm mt-2">
                Click "Sync Now" on the dashboard to import bookings from iGMS
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Reservation</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Check-in</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Check-out</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Guests</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Platform</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {booking.reservation_code || booking.booking_uid.slice(0, 8)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {booking.booking_uid.slice(0, 16)}...
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {formatDate(booking.local_checkin_dttm)}
                      </td>
                      <td className="py-3 px-4">
                        {formatDate(booking.local_checkout_dttm)}
                      </td>
                      <td className="py-3 px-4">
                        {booking.number_of_guests || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize">
                          {booking.platform_type?.toLowerCase() || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(booking.booking_status)}`}>
                          {booking.booking_status || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(booking.price_total, booking.price_currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
