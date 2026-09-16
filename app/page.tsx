'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BANGLADESH_DISTRICTS } from '@/lib/geoData';
import {
  Search,
  RefreshCw,
  Send,
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Edit3,
  UserCheck,
  PhoneCall,
  RotateCw,
  AlertTriangle,
  XCircle,
  Trash2,
  BookmarkCheck,
  FileText,
  Activity,
  Package,
  Layers,
  Shirt,
  User,
  LogOut,
  Save,
  PlusCircle,
} from 'lucide-react';

interface Order {
  id: number;
  storeId: string;
  storeName: string;
  invoice: string;
  customerName: string;
  phone: string;
  streetAddress: string;
  district?: string;
  thana?: string;
  size?: string;
  customNote?: string;
  total: string;
  status: string;
  dateCreated: string;
  items: string;
  staffName?: string;
  callDone?: boolean;
  trackingCode?: string;
  consignmentId?: number | string;
  courierStatus?: string;
  isNewRow?: boolean;
}

const STAFF_MEMBERS = ['Awlad Hossain', 'Emdadullah Sakib', 'Omar Faruque'];

const WOO_STATUSES = [
  { label: 'Pending payment', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'On hold (রাখুন)', value: 'on-hold' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Failed', value: 'failed' },
  { label: 'Draft', value: 'checkout-draft' },
  { label: 'Main Order Accepted (CF)', value: 'main-order-accepted' },
];

export default function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string>('Admin');
  const [orders, setOrders] = useState<Order[]>([]);
  const [initialOrders, setInitialOrders] = useState<Record<string, Order>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [trackingId, setTrackingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [hasLogoImg, setHasLogoImg] = useState<boolean>(true);

  const sendActivityLog = async (logText: string, targetType: 'activity' | 'courier' = 'activity') => {
    try {
      await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: logText, type: targetType }),
      });
    } catch (err) {
      console.error('Telegram Log Error:', err);
    }
  };

  useEffect(() => {
    fetch('/api/auth/check')
      .then((res) => {
        if (!res.ok) router.push('/login');
        else res.json().then((d) => d.username && setCurrentUser(d.username));
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const fetchOrders = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error(`সার্ভার এরর (Status: ${res.status})`);
      const data = await res.json();
      if (data && Array.isArray(data.orders)) {
        const mappedOrders: Order[] = data.orders.map((o: any) => ({
          ...o,
          streetAddress: o.address || '',
          district: o.district || '',
          thana: o.thana || '',
          size: o.size || '',
          customNote: '',
          staffName: o.staffName || '',
          courierStatus: o.courierStatus || '',
          isNewRow: false,
        }));
        setOrders(mappedOrders);

        const snapshot: Record<string, Order> = {};
        mappedOrders.forEach((item) => {
          snapshot[`${item.storeId}-${item.id}`] = JSON.parse(JSON.stringify(item));
        });
        setInitialOrders(snapshot);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      console.error('Failed to load orders', err);
      setMessage({ text: err.message || 'অর্ডার লোড করতে সমস্যা হয়েছে', type: 'error' });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  // খালি রো যোগ করা (In-Line Blank Row)
  const handleAddNewBlankRow = () => {
    const tempId = -Date.now();
    const blankOrder: Order = {
      id: tempId,
      storeId: 'store1',
      storeName: 'Ruhama Wear',
      invoice: 'NEW',
      customerName: '',
      phone: '',
      streetAddress: '',
      district: 'Patuakhali',
      thana: 'Patuakhali Sadar',
      size: 'XL',
      customNote: '',
      total: '',
      status: 'processing',
      dateCreated: new Date().toISOString(),
      items: '',
      staffName: currentUser,
      callDone: false,
      isNewRow: true,
    };

    setOrders((prev) => [blankOrder, ...prev]);
    setMessage({ text: 'একটি খালি নতুন রো যোগ করা হয়েছে। নাম ও তথ্য লিখে সেভ করুন।', type: 'success' });
  };

  const phoneOrderData = useMemo(() => {
    const data: Record<string, { count: number; recentOrders: Order[] }> = {};
    const now = new Date().getTime();

    orders.forEach((o) => {
      const cleanPhone = o.phone ? o.phone.replace(/[^0-9]/g, '') : '';
      if (cleanPhone.length >= 10) {
        if (!data[cleanPhone]) data[cleanPhone] = { count: 0, recentOrders: [] };
        data[cleanPhone].count += 1;
        const orderTime = new Date(o.dateCreated).getTime();
        if (now - orderTime <= 24 * 60 * 60 * 1000) {
          data[cleanPhone].recentOrders.push(o);
        }
      }
    });
    return data;
  }, [orders]);

  const handleFieldChange = (orderId: number, storeId: string, field: keyof Order, value: any) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId && order.storeId === storeId) {
          if (field === 'district') return { ...order, district: value, thana: '' };
          if (field === 'storeId') {
            const sName = value === 'store2' ? 'Aastha Naturals' : 'Ruhama Wear';
            return { ...order, storeId: value, storeName: sName };
          }
          return { ...order, [field]: value };
        }
        return order;
      })
    );
  };

  // সম্পূর্ণ অর্ডার সেভ ও কনফার্ম
  const handleSaveOrder = async (order: Order, overrideStatus?: string) => {
    if (!order.customerName.trim() || !order.phone.trim()) {
      setMessage({ text: 'অনুগ্রহ করে কাস্টমারের নাম এবং ফোন নম্বর লিখুন।', type: 'error' });
      return;
    }

    const newStatus = overrideStatus || order.status;
    const assignedStaff = order.staffName || currentUser;
    const key = `${order.storeId}-${order.id}`;
    const prev = initialOrders[key];

    // কোনো পরিবর্তন না হলে টেলিগ্রাম মেসেজ ব্লক
    if (!order.isNewRow && prev) {
      const isChanged =
        prev.customerName !== order.customerName ||
        prev.phone !== order.phone ||
        prev.streetAddress !== order.streetAddress ||
        prev.district !== order.district ||
        prev.thana !== order.thana ||
        prev.size !== order.size ||
        prev.total !== order.total ||
        prev.items !== order.items ||
        prev.status !== newStatus ||
        prev.staffName !== assignedStaff;

      if (!isChanged && !overrideStatus) {
        setMessage({ text: `Order #${order.invoice}-এ কোনো তথ্য পরিবর্তন করা হয়নি।`, type: 'success' });
        return;
      }
    }

    setUpdatingId(order.id);
    setMessage(null);

    try {
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: order.storeId,
          orderId: order.isNewRow ? 0 : order.id,
          status: newStatus,
          staffName: assignedStaff,
          customerName: order.customerName,
          phone: order.phone,
          streetAddress: order.streetAddress,
          district: order.district,
          thana: order.thana,
          size: order.size,
          items: order.items,
          total: order.total || '0',
        }),
      });

      const result = await res.json();

      if (res.ok) {
        const returnedId = result.order?.id || order.id;
        const finalInvoice = String(returnedId);

        const updatedOrder: Order = {
          ...order,
          id: returnedId,
          invoice: finalInvoice,
          status: newStatus,
          staffName: assignedStaff,
          isNewRow: false,
        };

        setOrders((prevOrders) =>
          prevOrders.map((o) => (o.id === order.id ? updatedOrder : o))
        );

        setInitialOrders((prevInit) => ({
          ...prevInit,
          [`${order.storeId}-${returnedId}`]: JSON.parse(JSON.stringify(updatedOrder)),
        }));

        setMessage({
          text: `Order #${finalInvoice} সফলভাবে WooCommerce-এ সেভ করা হয়েছে!`,
          type: 'success',
        });

        const logMsg = `✅ <b>${order.isNewRow ? 'নতুন অর্ডার তৈরি ও কনফার্ম' : 'অর্ডার আপডেট ও সেভ'}</b>\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `🏪 <b>স্টোর:</b> ${order.storeName}\n` +
          `📦 <b>ইনভয়েস:</b> #${finalInvoice}\n` +
          `👤 <b>কাস্টমার:</b> ${order.customerName} (<code>${order.phone}</code>)\n` +
          `📍 <b>ঠিকানা:</b> ${order.streetAddress || ''}, ${order.thana ? `${order.thana}, ` : ''}${order.district || ''}\n` +
          `👕 <b>আইটেম/সাইজ:</b> ${order.items || 'N/A'} ${order.size ? `[সাইজ: ${order.size}]` : ''}\n` +
          `💵 <b>টাকা:</b> ৳${order.total || '0'}\n` +
          `📌 <b>স্ট্যাটাস:</b> <code>${newStatus.toUpperCase()}</code>\n` +
          `👨‍💼 <b>কনফার্ম করেছেন:</b> ${currentUser}`;
        sendActivityLog(logMsg, 'activity');
      } else {
        setMessage({ text: result.error || 'সেভ করতে সমস্যা হয়েছে', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Network error', type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (order.isNewRow) {
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      return;
    }

    if (!confirm(`⚠️ সতর্কবার্তা! আপনি কি Order #${order.invoice} স্থায়ীভাবে মুছে ফেলতে চান?`)) return;

    setUpdatingId(order.id);
    setMessage(null);

    try {
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: order.storeId,
          orderId: order.id,
          action: 'delete',
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setOrders((prev) => prev.filter((o) => !(o.id === order.id && o.storeId === order.storeId)));
        setMessage({ text: `Order #${order.invoice} মুছে ফেলা হয়েছে!`, type: 'success' });

        const logMsg = `🗑️ <b>অর্ডার ডিলিট করা হয়েছে</b>\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `🏪 <b>স্টোর:</b> ${order.storeName}\n` +
          `📦 <b>ইনভয়েস:</b> #${order.invoice}\n` +
          `👤 <b>কাস্টমার:</b> ${order.customerName}\n` +
          `👨‍💼 <b>ডিলিট করেছেন:</b> ${currentUser}`;
        sendActivityLog(logMsg, 'activity');
      } else {
        setMessage({ text: result.error || 'ডিলিট করতে সমস্যা হয়েছে', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Network error', type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  // Steadfast কুরিয়ারে পাঠানো (গ্রুপ ৩ এ যাবে)
  const handleSendToSteadfast = async (order: Order) => {
    if (order.isNewRow) {
      alert('অনুগ্রহ করে আগে তথ্য সেভ (Save) করুন, এরপর কুরিয়ারে পাঠান।');
      return;
    }

    if (!confirm(`আপনি কি অর্ডার #${order.invoice} স্টেডফাস্ট কুরিয়ারে পাঠাতে চান?`)) return;

    setSendingId(order.id);
    setMessage(null);

    const addressParts = [
      order.streetAddress,
      order.thana ? `Thana: ${order.thana}` : '',
      order.district ? `District: ${order.district}` : '',
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ');
    const assignedStaff = order.staffName || currentUser;

    try {
      const res = await fetch('/api/courier/steadfast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice: order.invoice,
          recipient_name: order.customerName,
          recipient_phone: order.phone,
          recipient_address: fullAddress,
          cod_amount: order.total,
          note: order.customNote ? order.customNote.trim() : '',
        }),
      });

      const result = await res.json();

      if (res.ok && result.data) {
        const consignment = result.data.consignment || result.data;
        const tracking = consignment.tracking_code || 'Sent';
        const cid = consignment.consignment_id || '';
        const initialStatus = consignment.status || 'in_review';

        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id && o.storeId === order.storeId
              ? {
                  ...o,
                  trackingCode: tracking,
                  consignmentId: cid,
                  courierStatus: initialStatus,
                  staffName: assignedStaff,
                }
              : o
          )
        );

        handleSaveOrder(order);

        setMessage({
          text: `Order #${order.invoice} কুরিয়ারে পাঠানো হয়েছে! CID: ${cid}`,
          type: 'success',
        });

        // কুরিয়ার সংক্রান্ত বার্তা সরাসরি কুরিয়ার গ্রুপে (গ্রুপ ৩) পাঠানো
        const logMsg = `🚀 <b>STEADFAST কুরিয়ারে ডিসপ্যাচ করা হয়েছে</b>\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `🏪 <b>স্টোর:</b> ${order.storeName}\n` +
          `📦 <b>ইনভয়েস:</b> #${order.invoice}\n` +
          `👤 <b>কাস্টমার:</b> ${order.customerName} (<code>${order.phone}</code>)\n` +
          `📍 <b>ঠিকানা:</b> ${fullAddress}\n` +
          `💵 <b>COD:</b> ৳${order.total} ${order.size ? `(সাইজ: ${order.size})` : ''}\n` +
          `🏷️ <b>CID:</b> <code>${cid}</code> | <b>Tracking:</b> <code>${tracking}</code>\n` +
          `👨‍💼 <b>ডিসপ্যাচ করেছেন:</b> ${currentUser}`;
        sendActivityLog(logMsg, 'courier');
      } else {
        setMessage({ text: result.error || 'কুরিয়ারে পাঠাতে ব্যর্থ হয়েছে', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Network error', type: 'error' });
    } finally {
      setSendingId(null);
    }
  };

  const handleCheckCourierStatus = async (order: Order) => {
    if (!order.trackingCode && !order.consignmentId) return;

    setTrackingId(order.id);
    setMessage(null);

    try {
      const queryParam = order.consignmentId
        ? `consignment_id=${order.consignmentId}`
        : `tracking_code=${order.trackingCode}`;

      const res = await fetch(`/api/courier/track?${queryParam}`);
      const result = await res.json();

      if (res.ok && result.data) {
        const liveStatus = result.data.delivery_status || result.data.status || 'unknown';

        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id && o.storeId === order.storeId ? { ...o, courierStatus: liveStatus } : o
          )
        );

        setMessage({
          text: `Order #${order.invoice} বর্তমান স্ট্যাটাস: ${liveStatus.toUpperCase()}`,
          type: 'success',
        });
      } else {
        setMessage({ text: result.error || 'ট্র্যাকিং আপডেট পাওয়া যায়নি', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Tracking error', type: 'error' });
    } finally {
      setTrackingId(null);
    }
  };

  const getCourierBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'delivered') return 'bg-emerald-600 text-white border-emerald-800 shadow-sm';
    if (s === 'partial_delivered') return 'bg-teal-600 text-white border-teal-800';
    if (s === 'cancelled' || s === 'cancelled_approval_pending') return 'bg-rose-600 text-white border-rose-800';
    if (s === 'in_review' || s === 'pending') return 'bg-amber-400 text-slate-950 font-black border-amber-600';
    if (s.includes('transit') || s.includes('hold')) return 'bg-blue-600 text-white border-blue-800';
    return 'bg-slate-800 text-white border-slate-900';
  };

  const filteredOrders = orders.filter((order) => {
    if (order.isNewRow) return true;
    const matchesStore = selectedStore === 'all' || order.storeName.toLowerCase().includes(selectedStore.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status.toLowerCase() === selectedStatus.toLowerCase();
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.staffName && order.staffName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.district && order.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.thana && order.thana.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.size && order.size.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.trackingCode && order.trackingCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.consignmentId && String(order.consignmentId).includes(searchTerm));
    return matchesStore && matchesStatus && matchesSearch;
  });

  // ১২ ঘণ্টার ফরম্যাট (AM/PM) - বাংলাদেশ স্ট্যান্ডার্ড টাইম
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'processing') return 'bg-amber-100 text-amber-900 border-amber-400';
    if (s === 'completed') return 'bg-emerald-100 text-emerald-900 border-emerald-400';
    if (s === 'pending') return 'bg-blue-100 text-blue-900 border-blue-400';
    if (s === 'on-hold') return 'bg-purple-100 text-purple-900 border-purple-400 font-black';
    if (s === 'cancelled' || s === 'failed') return 'bg-rose-100 text-rose-900 border-rose-400';
    if (s === 'main-order-accepted') return 'bg-indigo-100 text-indigo-900 border-indigo-400';
    return 'bg-slate-200 text-slate-800 border-slate-400';
  };

  return (
    <div className="min-h-screen bg-slate-200/70 text-slate-900 p-4 md:p-6">
      <div className="max-w-[1950px] mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4 bg-white p-5 rounded-2xl shadow-md border-2 border-slate-300">
          <div
            onClick={() => (window.location.href = '/')}
            className="flex items-center gap-4 cursor-pointer select-none transition hover:opacity-90 active:scale-98"
            title="Dashboard Reload"
          >
            {hasLogoImg ? (
              <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center p-2 shadow-lg border-2 border-slate-800 shrink-0">
                <img
                  src="/logo.png"
                  alt="Black Rock Logo"
                  className="w-full h-full object-contain"
                  onError={() => setHasLogoImg(false)}
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center text-white shadow-lg border-2 border-slate-700 shrink-0">
                <Layers className="w-8 h-8 text-amber-400" />
              </div>
            )}

            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-widest text-slate-950 uppercase flex items-center gap-3">
                BLACK ROCK CORPORATION
              </h1>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mt-0.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Enterprise Multi-Store & Courier Logistics Portal</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAddNewBlankRow}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" /> + নতুন অর্ডার যোগ করুন
            </button>

            <div className="flex items-center gap-2 bg-slate-100 border-2 border-slate-300 px-3.5 py-2 rounded-xl shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-slate-950 text-white flex items-center justify-center">
                <User className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-left leading-tight">
                <div className="text-[10px] uppercase font-bold text-slate-500">বর্তমান লগইন:</div>
                <div className="text-xs font-black text-slate-900">{currentUser}</div>
              </div>
            </div>

            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Orders
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white px-4 py-2.5 rounded-xl font-black text-sm shadow-md transition active:scale-95 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> লগআউট
            </button>
          </div>
        </div>

        {/* Alerts */}
        {message && (
          <div
            className={`p-4 mb-4 rounded-xl flex items-center gap-2.5 shadow-sm font-bold text-sm ${
              message.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-400'
                : 'bg-rose-100 text-rose-900 border-2 border-rose-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-md border-2 border-slate-300 mb-6">
          <div className="flex gap-2.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
            <button
              onClick={() => setSelectedStore('all')}
              className={`px-5 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition cursor-pointer ${
                selectedStore === 'all' ? 'bg-slate-950 text-white shadow-md' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              All Stores
            </button>
            <button
              onClick={() => setSelectedStore('Ruhama Wear')}
              className={`px-5 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition cursor-pointer ${
                selectedStore === 'Ruhama Wear' ? 'bg-slate-950 text-white shadow-md' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Ruhama Wear
            </button>
            <button
              onClick={() => setSelectedStore('Aastha Naturals')}
              className={`px-5 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition cursor-pointer ${
                selectedStore === 'Aastha Naturals' ? 'bg-slate-950 text-white shadow-md' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Aastha Naturals BD
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-auto border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white text-slate-900 font-black focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">All Statuses (সব অর্ডার)</option>
              {WOO_STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search phone, size, thana, CID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-400 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-slate-600 font-black text-lg">অর্ডার লোড হচ্ছে...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-20 text-center text-slate-600 font-black text-lg">কোনো অর্ডার পাওয়া যায়নি।</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1850px]">
                <thead>
                  <tr className="bg-slate-950 text-white text-xs uppercase font-black tracking-widest">
                    <th className="p-4 w-36 border-r-2 border-slate-800">Store / Invoice</th>
                    <th className="p-4 w-60 border-r-2 border-slate-800">Customer Name (নাম)</th>
                    <th className="p-4 w-36 border-r-2 border-slate-800">Date & Time (12h)</th>
                    <th className="p-4 w-80 border-r-2 border-slate-800">Phone, Staff & Call</th>
                    <th className="p-4 w-[430px] border-r-2 border-slate-800">Address & District/Thana</th>
                    <th className="p-4 w-72 border-r-2 border-slate-800">Items, COD & Size</th>
                    <th className="p-4 w-52 text-center border-r-2 border-slate-800">Status & Save</th>
                    <th className="p-4 w-80 text-center">Steadfast Push & Live Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredOrders.map((order, index) => {
                    const cleanPhone = order.phone ? order.phone.replace(/[^0-9]/g, '') : '';
                    const phoneInfo = phoneOrderData[cleanPhone];
                    const isDuplicate = phoneInfo && phoneInfo.count > 1;
                    const isRecent = phoneInfo && phoneInfo.recentOrders.length > 1;

                    const selectedDistrictObj = BANGLADESH_DISTRICTS.find((d) => d.district === order.district);
                    const availableThanas = selectedDistrictObj ? selectedDistrictObj.thanas : [];

                    const isEven = index % 2 === 0;
                    const rowBgClass = order.isNewRow
                      ? 'bg-emerald-50 border-2 border-emerald-500 animate-in fade-in duration-200'
                      : isRecent
                      ? 'bg-rose-100/90 hover:bg-rose-200'
                      : isDuplicate
                      ? 'bg-amber-100/90 hover:bg-amber-200'
                      : isEven
                      ? 'bg-white hover:bg-sky-100/50'
                      : 'bg-slate-200/90 hover:bg-sky-100/50';

                    return (
                      <tr
                        key={`${order.storeId}-${order.id}`}
                        className={`transition-colors border-b-2 border-slate-300 ${rowBgClass}`}
                      >
                        {/* Store & Invoice */}
                        <td className="p-3.5 align-top font-black border-r-2 border-slate-300">
                          {order.isNewRow ? (
                            <select
                              value={order.storeId}
                              onChange={(e) => handleFieldChange(order.id, order.storeId, 'storeId', e.target.value)}
                              className="text-xs text-slate-950 bg-emerald-100 border-2 border-emerald-500 font-black px-2 py-1.5 rounded-lg block w-full mb-1.5 shadow-sm cursor-pointer"
                            >
                              <option value="store1">Ruhama Wear</option>
                              <option value="store2">Aastha Naturals</option>
                            </select>
                          ) : (
                            <span className="text-xs text-slate-950 bg-white border-2 border-slate-400 font-black px-2.5 py-1 rounded-md block w-fit mb-1.5 shadow-sm">
                              {order.storeName}
                            </span>
                          )}

                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-300/80 px-2 py-0.5 rounded border border-slate-400 inline-block">
                            {order.isNewRow ? '🆕 NEW' : `#${order.invoice}`}
                          </span>
                        </td>

                        {/* Customer Name: পরিচ্ছন্ন বর্ডারহীন এবং সম্পূর্ণ নাম ভিজিবল */}
                        <td className="p-3.5 align-top border-r-2 border-slate-300">
                          <textarea
                            rows={3}
                            value={order.customerName}
                            onChange={(e) => handleFieldChange(order.id, order.storeId, 'customerName', e.target.value)}
                            placeholder="কাস্টমারের নাম লিখুন..."
                            className="w-full font-black text-base text-slate-950 bg-transparent focus:bg-white border border-transparent focus:border-slate-400 rounded-lg p-1.5 transition resize-none outline-none leading-tight whitespace-normal break-words placeholder:text-slate-400 placeholder:text-xs"
                          />
                        </td>

                        {/* Date: 12-Hour Format (AM/PM) */}
                        <td className="p-3.5 align-top text-xs text-slate-800 whitespace-nowrap font-bold border-r-2 border-slate-300">
                          <div className="flex items-center gap-1.5 bg-white border-2 border-slate-300 p-2 rounded-lg shadow-sm">
                            <Calendar className="w-4 h-4 text-slate-600 shrink-0" />
                            <span>{formatDate(order.dateCreated)}</span>
                          </div>
                        </td>

                        {/* Phone, Staff & Call */}
                        <td className="p-3.5 align-top space-y-2 border-r-2 border-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-slate-600 shrink-0" />
                            <input
                              type="text"
                              value={order.phone}
                              placeholder="01XXXXXXXXX"
                              onChange={(e) => handleFieldChange(order.id, order.storeId, 'phone', e.target.value)}
                              className={`w-full text-xs font-mono font-black border-2 rounded-lg px-2.5 py-1.5 bg-white shadow-sm ${
                                isRecent
                                  ? 'border-red-600 text-red-800'
                                  : isDuplicate
                                  ? 'border-amber-600 text-amber-950'
                                  : 'border-slate-300 text-slate-950'
                              }`}
                            />
                          </div>

                          {isRecent ? (
                            <div className="flex items-center gap-1.5 bg-red-200 border-2 border-red-500 text-red-950 px-2.5 py-1 rounded-lg text-xs font-black animate-pulse">
                              <AlertTriangle className="w-4 h-4 shrink-0 text-red-700" />
                              <span>🚩 রিসেন্ট ডুপ্লিকেট! ({phoneInfo.recentOrders.length}টি অর্ডার)</span>
                            </div>
                          ) : isDuplicate ? (
                            <div className="flex items-center gap-1.5 bg-amber-200 border-2 border-amber-500 text-amber-950 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
                              <span>মোট অর্ডার: {phoneInfo.count}টি</span>
                            </div>
                          ) : null}

                          <div className="flex items-center gap-2 pt-1 border-t-2 border-slate-300/80">
                            <div className="flex items-center gap-1.5 w-1/2">
                              <UserCheck className="w-4 h-4 text-slate-700 shrink-0" />
                              <select
                                value={order.staffName || ''}
                                onChange={(e) => handleFieldChange(order.id, order.storeId, 'staffName', e.target.value)}
                                className="w-full text-xs font-black border-2 border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-900 focus:ring-2 focus:ring-slate-900 shadow-sm cursor-pointer"
                              >
                                <option value="">স্টাফ বাছুন</option>
                                {STAFF_MEMBERS.map((staff) => (
                                  <option key={staff} value={staff}>
                                    {staff}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <button
                              onClick={() => {
                                const newCallState = !order.callDone;
                                handleFieldChange(order.id, order.storeId, 'callDone', newCallState);
                                if (!order.staffName) {
                                  handleFieldChange(order.id, order.storeId, 'staffName', currentUser);
                                }
                              }}
                              className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg transition border-2 shadow-sm cursor-pointer ${
                                order.callDone
                                  ? 'bg-emerald-200 text-emerald-950 border-emerald-500'
                                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              {order.callDone ? 'কল হয়েছে' : 'কল দিন'}
                            </button>
                          </div>
                        </td>

                        {/* Address, District & Thana */}
                        <td className="p-3.5 align-top space-y-2 border-r-2 border-slate-300">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-4 h-4 text-slate-600 mt-1 shrink-0" />
                            <textarea
                              rows={2}
                              value={order.streetAddress}
                              onChange={(e) => handleFieldChange(order.id, order.storeId, 'streetAddress', e.target.value)}
                              placeholder="বিস্তারিত ঠিকানা..."
                              className="w-full text-xs font-bold text-slate-900 border-2 border-slate-300 rounded-lg px-2.5 py-1.5 bg-white resize-y shadow-sm focus:border-slate-900 leading-snug"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] font-black text-slate-800 block mb-0.5">জেলা (District)</label>
                              <select
                                value={order.district || ''}
                                onChange={(e) => handleFieldChange(order.id, order.storeId, 'district', e.target.value)}
                                className="w-full text-xs border-2 border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-950 font-black focus:ring-2 focus:ring-slate-900 shadow-sm cursor-pointer"
                              >
                                <option value="">জেলা বাছুন</option>
                                {BANGLADESH_DISTRICTS.map((d) => (
                                  <option key={d.district} value={d.district}>
                                    {d.district}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] font-black text-slate-800 block mb-0.5">থানা / উপজেলা</label>
                              <select
                                value={order.thana || ''}
                                disabled={!order.district}
                                onChange={(e) => handleFieldChange(order.id, order.storeId, 'thana', e.target.value)}
                                className="w-full text-xs border-2 border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-950 font-black focus:ring-2 focus:ring-slate-900 disabled:bg-slate-300 disabled:text-slate-500 shadow-sm cursor-pointer"
                              >
                                <option value="">থানা বাছুন</option>
                                {availableThanas.map((thana) => (
                                  <option key={thana} value={thana}>
                                    {thana}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </td>

                        {/* Items, COD & Size */}
                        <td className="p-3.5 align-top space-y-2 border-r-2 border-slate-300">
                          <div className="flex items-start gap-1.5">
                            <Edit3 className="w-4 h-4 text-slate-600 mt-1 shrink-0" />
                            <textarea
                              rows={2}
                              value={order.items}
                              onChange={(e) => handleFieldChange(order.id, order.storeId, 'items', e.target.value)}
                              placeholder="আইটেমের নাম ও বিবরণ..."
                              className="w-full text-xs font-bold text-slate-900 border-2 border-slate-300 rounded-lg px-2.5 py-1.5 bg-white resize-y shadow-sm leading-snug"
                            />
                          </div>

                          <div className="flex items-center gap-2.5 pt-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-black text-slate-800">COD:</span>
                              <input
                                type="number"
                                value={order.total}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => handleFieldChange(order.id, order.storeId, 'total', e.target.value)}
                                placeholder="৳"
                                className="w-20 text-xs font-black text-emerald-800 border-2 border-slate-300 rounded-lg px-2 py-1 bg-white shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                              />
                            </div>

                            <div className="flex items-center gap-1 bg-amber-50 border-2 border-amber-300 px-2 py-1 rounded-lg shadow-2xs">
                              <Shirt className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span className="text-[11px] font-black text-amber-950">সাইজ:</span>
                              <input
                                type="text"
                                value={order.size || ''}
                                onChange={(e) => handleFieldChange(order.id, order.storeId, 'size', e.target.value.toUpperCase())}
                                placeholder="XL"
                                className="w-16 text-xs font-black text-slate-950 uppercase text-center border-2 border-amber-400 rounded bg-white px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status & Save */}
                        <td className="p-3.5 align-top text-center space-y-2 border-r-2 border-slate-300">
                          <select
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(e) => handleSaveOrder(order, e.target.value)}
                            className={`w-full text-xs font-black border-2 rounded-xl px-2.5 py-2 text-center focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-sm ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {WOO_STATUSES.map((st) => (
                              <option key={st.value} value={st.value} className="bg-white text-slate-900 font-bold">
                                {st.label}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleSaveOrder(order)}
                            disabled={updatingId === order.id}
                            className="w-full flex items-center justify-center gap-1.5 text-xs font-black text-white bg-slate-950 hover:bg-slate-800 py-2 px-2 rounded-xl transition shadow-md cursor-pointer disabled:opacity-50"
                          >
                            <Save className={`w-3.5 h-3.5 ${updatingId === order.id ? 'animate-spin' : ''}`} />
                            {updatingId === order.id ? 'সেভ হচ্ছে...' : 'তথ্য সেভ ও কনফার্ম (Save)'}
                          </button>

                          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                            <button
                              onClick={() => handleSaveOrder(order, 'on-hold')}
                              disabled={updatingId === order.id}
                              title="রাখুন"
                              className="flex items-center justify-center gap-1 text-[11px] font-black text-purple-900 bg-white hover:bg-purple-100 border-2 border-purple-400 py-1 rounded-lg transition shadow-sm cursor-pointer"
                            >
                              <BookmarkCheck className="w-3 h-3" /> রাখুন
                            </button>

                            <button
                              onClick={() => handleSaveOrder(order, 'cancelled')}
                              disabled={updatingId === order.id}
                              title="বাতিল"
                              className="flex items-center justify-center gap-1 text-[11px] font-black text-rose-900 bg-white hover:bg-rose-100 border-2 border-rose-400 py-1 rounded-lg transition shadow-sm cursor-pointer"
                            >
                              <XCircle className="w-3 h-3" /> বাতিল
                            </button>

                            <button
                              onClick={() => handleDeleteOrder(order)}
                              disabled={updatingId === order.id}
                              title="ডিলিট"
                              className="flex items-center justify-center gap-1 text-[11px] font-black text-slate-800 hover:text-red-700 bg-white hover:bg-red-100 border-2 border-slate-300 py-1 rounded-lg transition shadow-sm cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> ডিলিট
                            </button>
                          </div>
                        </td>

                        {/* Steadfast Courier */}
                        <td className="p-3.5 align-top space-y-2">
                          <div className="text-left">
                            <label className="text-[11px] font-black text-slate-800 flex items-center gap-1 mb-0.5">
                              <FileText className="w-3.5 h-3.5 text-slate-600" /> কুরিয়ার স্পেশাল নোট:
                            </label>
                            <input
                              type="text"
                              value={order.customNote || ''}
                              onChange={(e) => handleFieldChange(order.id, order.storeId, 'customNote', e.target.value)}
                              placeholder="যেমন: দেখে ডেলিভারি দিন..."
                              className="w-full text-xs font-bold border-2 border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400 shadow-sm"
                            />
                          </div>

                          <button
                            onClick={() => handleSendToSteadfast(order)}
                            disabled={sendingId === order.id}
                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-black shadow-md transition w-full cursor-pointer ${
                              order.trackingCode || order.consignmentId
                                ? 'bg-slate-950 hover:bg-slate-800 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            <Send className="w-4 h-4" />
                            {sendingId === order.id
                              ? 'Sending...'
                              : order.trackingCode || order.consignmentId
                              ? 'Re-send Steadfast'
                              : 'Send to Steadfast'}
                          </button>

                          {(order.trackingCode || order.consignmentId) && (
                            <div className="bg-white border-2 border-slate-400 rounded-xl p-3 shadow-md space-y-2 text-left">
                              <div className="flex justify-between items-center text-xs pb-1.5 border-b-2 border-slate-200">
                                <span className="font-black text-slate-700 flex items-center gap-1">
                                  <Package className="w-4 h-4 text-slate-900" /> CID:
                                </span>
                                <span className="font-mono font-black text-slate-950 text-sm">{order.consignmentId || 'N/A'}</span>
                              </div>

                              <div>
                                <div className="text-[10px] font-black text-slate-600 flex items-center gap-1 mb-1">
                                  <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> বর্তমান অবস্থা:
                                </div>
                                <div
                                  className={`w-full py-1.5 px-2 rounded-lg text-center text-xs font-black uppercase tracking-wider border-2 ${getCourierBadge(
                                    order.courierStatus || 'in_review'
                                  )}`}
                                >
                                  {order.courierStatus ? order.courierStatus.replace(/_/g, ' ') : 'IN REVIEW'}
                                </div>
                              </div>

                              <button
                                onClick={() => handleCheckCourierStatus(order)}
                                disabled={trackingId === order.id}
                                className="flex items-center justify-center gap-1.5 text-xs font-black text-white bg-slate-950 hover:bg-slate-800 active:bg-black py-2 px-3 rounded-lg w-full transition shadow-sm disabled:opacity-50 cursor-pointer"
                              >
                                <RotateCw className={`w-3.5 h-3.5 ${trackingId === order.id ? 'animate-spin' : ''}`} />
                                {trackingId === order.id ? 'চেক হচ্ছে...' : '🔄 লাইভ স্ট্যাটাস আপডেট'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}