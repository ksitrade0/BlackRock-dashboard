//@ts-nocheck
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BANGLADESH_DISTRICTS } from '@/lib/geoData';
import StockBar from '@/app/component/StockBar';
import AdminInventoryPanel from '@/app/component/AdminInventoryPanel';
import {
  Search,
  RefreshCw,
  Send,
  CheckCircle,
  AlertCircle,
  Calendar,
  LogOut,
  Clock,
  MapPin,
  Phone,
  UserCheck,
  PhoneCall,
  RotateCw,
  AlertTriangle,
  XCircle,
  Trash2,
  BookmarkCheck,
  Package,
  Layers,
  Shirt,
  User,
  Save,
  Plus,
  BarChart2,
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

const PRODUCT_VARIATIONS = [
  'N সাদা-৩৮', 'N সাদা-৪০', 'N সাদা-৪২', 'N সাদা-৪৪',
  'N কালো-৩৮', 'N কালো-৪০', 'N কালো-৪২', 'N কালো-৪৪',
  'D সাদা-৩৮', 'D সাদা-৪০', 'D সাদা-৪২', 'D সাদা-৪৪',
  'D কালো-৩৮', 'D কালো-৪০', 'D কালো-৪২', 'D কালো-৪৪',
];

export default function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string>('omar faruque (Admin)');
  const [orders, setOrders] = useState<Order[]>([]);
  const [initialOrders, setInitialOrders] = useState<Record<string, Order>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [trackingId, setTrackingId] = useState<number | null>(null);
  const [reporting, setReporting] = useState<boolean>(false);
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

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleLogOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

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
    setMessage({ text: 'একটি খালি নতুন রো যোগ করা হয়েছে। তথ্য লিখে সেভ করুন।', type: 'success' });
  };

  const handleSendCourierReport = async () => {
    setReporting(true);
    setMessage({ text: 'কুরিয়ার অডিট রিপোর্ট তৈরি ও পাঠানো হচ্ছে...', type: 'success' });
    try {
      const now = new Date();
      const todayDate = now.toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' });
      const currentTime = now.toLocaleTimeString('en-BD', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: true });
      const isToday = (dateString: string) => {
        if (!dateString) return false;
        const d = new Date(dateString);
        return d.toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' }) === todayDate;
      };

      const sentToday = orders.filter((o) => (o.trackingCode || o.consignmentId) && isToday(o.dateCreated) && o.status !== 'completed' && o.status !== 'cancelled');
      const deliveredToday = orders.filter((o) => (o.status === 'completed' || o.courierStatus === 'delivered' || o.courierStatus === 'Delivered') && isToday(o.dateCreated));
      const pendingParcels = orders.filter((o) => (o.trackingCode || o.consignmentId) && o.status !== 'completed' && o.status !== 'cancelled' && o.courierStatus !== 'delivered' && o.courierStatus !== 'Delivered' && o.courierStatus !== 'cancelled');

      let totalCollection = 0;
      deliveredToday.forEach((o) => {
        totalCollection += parseFloat(o.total || '0');
      });

      let msg = `📊 <b>ডেইলি কুরিয়ার রিপোর্ট</b>\n`;
      msg += `📅 তারিখ: ${todayDate}\n`;
      msg += `⏰ সময়: ${currentTime}\n\n`;
      msg += `📦 <b>আজকে পাঠানো পার্সেল: ${sentToday.length} টি</b>\n`;
      sentToday.forEach((o, i) => {
        const cid = o.consignmentId || o.trackingCode || 'N/A';
        const name = o.customerName || 'কাস্টমার';
        const city = o.district || o.thana || 'ঠিকানা নাই';
        const items = o.items || 'আইটেম নাই';
        msg += `${i + 1}. #${o.invoice} / ${cid} | ${name} | ${city} | ${items} | ${o.total}\n`;
      });
      msg += `\n`;
      msg += `✅ <b>আজকে ডেলিভারি হওয়া পার্সেল: ${deliveredToday.length} টি</b>\n`;
      deliveredToday.forEach((o, i) => {
        const cid = o.consignmentId || o.trackingCode || 'N/A';
        const sentD = new Date(o.dateCreated).toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' });
        const name = o.customerName || 'কাস্টমার';
        msg += `${i + 1}. #${o.invoice} / ${cid} | ${sentD} / ${todayDate} = ${name} | ৳${o.total}\n`;
      });
      msg += `\n`;
      msg += `⏳ <b>মোট পেন্ডিং পার্সেল: ${pendingParcels.length} টি</b>\n`;
      pendingParcels.forEach((o, i) => {
        const cid = o.consignmentId || o.trackingCode || 'N/A';
        const sentD = new Date(o.dateCreated).toLocaleDateString('en-BD', { timeZone: 'Asia/Dhaka' });
        const name = o.customerName || 'কাস্টমার';
        msg += `${i + 1}. ${cid} - ${sentD} - ${name}\n`;
      });
      msg += `\n`;
      msg += `💰 <b>আজকের ডেলিভারি মোট কালেকশন: ৳${totalCollection}</b>\n\n`;
      msg += `👤 <i>রিপোর্টটি চেয়েছেন: ${currentUser}</i>`;

      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg, type: 'courier' }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: 'কুরিয়ার রিপোর্ট সফলভাবে টেলিগ্রামে পাঠানো হয়েছে!', type: 'success' });
      } else {
        setMessage({ text: data.error || 'রিপোর্ট পাঠাতে ব্যর্থ হয়েছে', type: 'error' });
      }
    } catch (err: any) {
      console.error('Courier Report Error:', err);
      setMessage({ text: err.message || 'রিপোর্ট তৈরি করতে এরর হয়েছে', type: 'error' });
    } finally {
      setReporting(false);
    }
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
            const sName = value === 'store2' ? 'Aastha Naturals BD' : 'Ruhama Wear';
            return { ...order, storeId: value, storeName: sName };
          }
          return { ...order, [field]: value };
        }
        return order;
      })
    );
  };

  const handleAddItem = (orderId: number, storeId: string, itemToAdd: string) => {
    if (!itemToAdd) return;
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId && order.storeId === storeId) {
          const currentItems = order.items ? order.items.split(',').map((s) => s.trim()).filter(Boolean) : [];
          if (!currentItems.includes(itemToAdd)) {
            currentItems.push(itemToAdd);
          }
          return { ...order, items: currentItems.join(', ') };
        }
        return order;
      })
    );
  };

  const handleRemoveItem = (orderId: number, storeId: string, indexToRemove: number) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId && order.storeId === storeId) {
          const currentItems = order.items ? order.items.split(',').map((s) => s.trim()).filter(Boolean) : [];
          currentItems.splice(indexToRemove, 1);
          return { ...order, items: currentItems.join(', ') };
        }
        return order;
      })
    );
  };

  const handleSaveOrder = async (order: Order, overrideStatus?: string) => {
    if (!order.customerName.trim() || !order.phone.trim()) {
      setMessage({ text: 'অনুগ্রহ করে কাস্টমারের নাম এবং ফোন নম্বর লিখুন।', type: 'error' });
      return;
    }
    const newStatus = overrideStatus || order.status;
    const assignedStaff = order.staffName || currentUser;
    const key = `${order.storeId}-${order.id}`;
    const prev = initialOrders[key];

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
        setMessage({ text: `Order #${order.invoice}-এ কোনো পরিবর্তন করা হয়নি।`, type: 'success' });
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
        setOrders((prevOrders) => prevOrders.map((o) => (o.id === order.id ? updatedOrder : o)));
        setInitialOrders((prevInit) => ({
          ...prevInit,
          [`${order.storeId}-${returnedId}`]: JSON.parse(JSON.stringify(updatedOrder)),
        }));
        setMessage({ text: `Order #${finalInvoice} সফলভাবে WooCommerce-এ সেভ করা হয়েছে!`, type: 'success' });

        const logMsg =
          `✅ <b>${order.isNewRow ? 'নতুন অর্ডার তৈরি ও কনফার্ম' : 'অর্ডার আপডেট ও সেভ'}</b>\n` +
          `-----------------------------------\n` +
          `🏪 <b>স্টোর:</b> ${order.storeName}\n` +
          `🏷️ <b>ইনভয়েস:</b> #${finalInvoice}\n` +
          `👤 <b>কাস্টমার:</b> ${order.customerName} (<code>${order.phone}</code>)\n` +
          `📍 <b>ঠিকানা:</b> ${order.streetAddress || ''}, ${order.thana ? `${order.thana}, ` : ''}${order.district || ''}\n` +
          `👕 <b>আইটেম/সাইজ:</b> ${order.items || 'N/A'} ${order.size ? `[সাইজ: ${order.size}]` : ''}\n` +
          `💰 <b>টাকা:</b> ৳${order.total || '0'}\n` +
          `📌 <b>স্ট্যাটাস:</b> <code>${newStatus.toUpperCase()}</code>\n` +
          `👨‍💻 <b>কনফার্ম করেছেন:</b> ${currentUser}`;
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
    if (!confirm(`সতর্কবার্তা! আপনি কি Order #${order.invoice} স্থায়ীভাবে মুছে ফেলতে চান?`)) return;
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
        const logMsg =
          `🗑️ <b>অর্ডার ডিলিট করা হয়েছে</b>\n` +
          `-----------------------------------\n` +
          `🏪 <b>স্টোর:</b> ${order.storeName}\n` +
          `🏷️ <b>ইনভয়েস:</b> #${order.invoice}\n` +
          `👤 <b>কাস্টমার:</b> ${order.customerName}\n` +
          `👨‍💻 <b>ডিলিট করেছেন:</b> ${currentUser}`;
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

  const handleSendToSteadfast = async (order: Order) => {
    if (order.isNewRow) {
      alert('অনুগ্রহ করে আগে তথ্য সেভ (Save) করুন, এরপর কুরিয়ারে পাঠান।');
      return;
    }
    if (!confirm(`আপনি কি অর্ডার #${order.invoice} স্টেডফাস্ট কুরিয়ারে পাঠাতে চান?`)) return;
    setSendingId(order.id);
    setMessage(null);
    const assignedStaff = currentUser;
    const addressParts = [
      order.streetAddress,
      order.thana ? `Thana: ${order.thana}` : '',
      order.district ? `District: ${order.district}` : '',
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ');
    order.staffName = currentUser;
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
        setMessage({ text: `Order #${order.invoice} কুরিয়ারে পাঠানো হয়েছে! CID: ${cid}`, type: 'success' });
        const logMsg =
          `🚚 <b>STEADFAST কুরিয়ারে ডিসপ্যাচ করা হয়েছে</b>\n` +
          `-----------------------------------\n` +
          `🏪 <b>স্টোর:</b> ${order.storeName}\n` +
          `🏷️ <b>ইনভয়েস:</b> #${order.invoice}\n` +
          `📍 <b>ঠিকানা:</b> ${fullAddress}\n` +
          `👤 <b>কাস্টমার:</b> ${order.customerName} (<code>${order.phone}</code>)\n` +
          `💰 <b>COD:</b> ৳${order.total} ${order.size ? `(সাইজ: ${order.size})` : ''}\n` +
          `📦 <b>CID:</b> <code>${cid}</code> | <b>Tracking:</b> <code>${tracking}</code>\n` +
          `👨‍💻 <b>ডিসপ্যাচ করেছেন:</b> ${currentUser}`;
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
      const queryParam = order.consignmentId ? `consignment_id=${order.consignmentId}` : `tracking_code=${order.trackingCode}`;
      const res = await fetch(`/api/courier/track?${queryParam}`);
      const result = await res.json();
      if (res.ok && result.data) {
        const liveStatus = result.data.delivery_status || result.data.status || 'unknown';
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id && o.storeId === order.storeId ? { ...o, courierStatus: liveStatus } : o))
        );
        setMessage({ text: `Order #${order.invoice} বর্তমান স্ট্যাটাস: ${liveStatus.toUpperCase()}`, type: 'success' });
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

  const formatOrderDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatOrderTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
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
    <div className="min-h-screen bg-slate-200/70 text-slate-900 md:p-6">
      <div className="max-w-[1950px] mx-auto">
        
        {/* Sticky/Fixed Header Area - এটা স্ক্রল করলে উপরে ফ্রিজ হয়ে থাকবে */}
        <div className="sticky top-0 z-50 bg-slate-200/95 backdrop-blur-md pb-4 pt-4 md:pt-0">
          
          {/* Main Dashboard Header */}
          <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-300">
            <div onClick={() => (window.location.href = '/')} className="flex items-center gap-3.5 cursor-pointer select-none transition hover:opacity-90" title="Dashboard Reload">
              {hasLogoImg ? (
                <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center p-1.5 shadow-sm border border-slate-800 shrink-0">
                  <img src="/logo.png" alt="Black Rock Logo" className="w-full h-full object-contain" onError={() => setHasLogoImg(false)} />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-white shadow-sm border border-slate-700 shrink-0">
                  <Layers className="w-6 h-6 text-amber-400" />
                </div>
              )}
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-wider text-slate-950 uppercase flex items-center gap-2">BLACK ROCK CORPORATION</h1>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Enterprise Multi-Store & Courier Logistics Portal</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
              <div className="flex flex-col justify-center items-center bg-slate-100 border border-slate-300 px-4 py-1.5 rounded-xl h-[78px] min-w-[170px] shadow-2xs">
                <User className="w-5 h-5 text-slate-700 mb-1" />
                <div className="text-xs font-black text-slate-900 leading-tight text-center">{currentUser}</div>
              </div>

              <div className="flex flex-col gap-1.5">
                <button onClick={fetchOrders} className="w-36 h-[36px] flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-bold text-xs transition border border-slate-300 cursor-pointer active:scale-95 shadow-2xs">
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} /> Refresh Orders
                </button>
                <button onClick={handleLogout} className="w-36 h-[36px] flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-xs transition border border-rose-200 cursor-pointer active:scale-95 shadow-2xs">
                  <Logout className="w-3.5 h-3.5" /> লগআউট
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <button onClick={handleSendCourierReport} disabled={reporting} className="w-48 h-[36px] flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-black text-white rounded-lg font-bold text-xs transition cursor-pointer border border-slate-800 disabled:opacity-50 shadow-2xs">
                  <BarChart2 className={`w-3.5 h-3.5 text-amber-400 ${reporting ? 'animate-spin' : ''}`} /> {reporting ? 'রিপোর্ট যাচ্ছে...' : 'কুরিয়ার অডিট রিপোর্ট'}
                </button>
                <button onClick={handleAddNewBlankRow} className="w-48 h-[36px] flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-bold text-xs transition cursor-pointer border border-slate-300 active:scale-95 shadow-2xs">
                  <Plus className="w-3.5 h-3.5 text-emerald-600 font-black" /> + নতুন অর্ডার যোগ করুন
                </button>
              </div>

              {/* Inventory & Purchase Panel */}
              <div className="flex flex-col gap-1.5 h-[78px] justify-between">
                <AdminInventoryPanel existingItems={PRODUCT_VARIATIONS} />
              </div>
            </div>
          </div>

          {/* Live Stock Bar */}
          <StockBar />

          {/* Filters Area */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white p-3.5 rounded-xl shadow-sm border border-slate-300 mt-6">
            <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
              <button onClick={() => setSelectedStore('all')} className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition cursor-pointer ${selectedStore === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>All Stores</button>
              <button onClick={() => setSelectedStore('Ruhama Wear')} className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition cursor-pointer ${selectedStore === 'Ruhama Wear' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Ruhama Wear</button>
              <button onClick={() => setSelectedStore('Aastha Naturals')} className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition cursor-pointer ${selectedStore === 'Aastha Naturals' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Aastha Naturals BD</button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto items-center">
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full sm:w-auto border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 font-bold focus:outline-none focus:border-slate-900 cursor-pointer">
                <option value="all">All Statuses (সব অর্ডার)</option>
                {WOO_STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input type="text" placeholder="Search phone, size, thana, CID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg font-bold focus:outline-none focus:border-slate-900 text-xs bg-white" />
              </div>
            </div>
          </div>
        </div>
        {/* End Sticky/Fixed Area */}

        {/* Alerts */}
        {message && (
          <div className={`p-3.5 mb-4 rounded-xl flex items-center gap-2.5 shadow-sm font-bold text-xs ${message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' : 'bg-rose-50 text-rose-900 border border-rose-300'}`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Orders Table with Horizontal Scrollbar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-slate-600 font-bold text-sm">অর্ডার লোড হচ্ছে...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-20 text-center text-slate-600 font-bold text-sm">কোনো অর্ডার পাওয়া যায়নি।</div>
          ) : (
            <div className="overflow-x-auto pb-4 custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1900px]">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] uppercase font-bold tracking-wider">
                    <th className="p-3.5 w-36 border-r border-slate-800">Invoice / Store</th>
                    <th className="p-3.5 w-60 border-r border-slate-800">Customer Name (নাম)</th>
                    <th className="p-3.5 w-40 border-r border-slate-800">Date & Time</th>
                    <th className="p-3.5 w-80 border-r border-slate-800">Phone, Call & Staff</th>
                    <th className="p-3.5 w-[440px] border-r border-slate-800">Address & Thana/District</th>
                    <th className="p-3.5 w-[440px] border-r border-slate-800">Items (Multi-Select & Remove), COD & Size</th>
                    <th className="p-3.5 w-80 text-center border-r border-slate-800">Status & Save</th>
                    <th className="p-3.5 w-80 text-center">Steadfast Push & Live Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {filteredOrders.map((order, index) => {
                    const cleanPhone = order.phone ? order.phone.replace(/[^0-9]/g, '') : '';
                    const phoneInfo = phoneOrderData[cleanPhone];
                    const isDuplicate = phoneInfo && phoneInfo.count > 1;
                    const isRecent = phoneInfo && phoneInfo.recentOrders.length > 1;
                    const selectedDistrictObj = BANGLADESH_DISTRICTS.find((d) => d.district === order.district);
                    const availableThanas = selectedDistrictObj ? selectedDistrictObj.thanas : [];
                    const isEven = index % 2 === 0;
                    const rowBgClass = order.isNewRow ? 'bg-emerald-50 border-2 border-emerald-500' : isRecent ? 'bg-rose-50 hover:bg-rose-100/70' : isDuplicate ? 'bg-amber-50 hover:bg-amber-100/70' : isEven ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/70 hover:bg-slate-100/70';
                    const currentItemList = order.items ? order.items.split(',').map((s) => s.trim()).filter(Boolean) : [];

                    return (
                      <tr key={`${order.storeId}-${order.id}`} className={`transition-colors border-b border-slate-200 ${rowBgClass}`}>
                        
                        {/* 1. Invoice / Store */}
                        <td className="p-3 align-top font-bold border-r border-slate-200 space-y-1.5">
                          <div className="w-full h-[32px] flex items-center justify-center font-mono text-xs font-black text-slate-950 bg-slate-100 border border-slate-300 rounded shadow-2xs">
                            {order.isNewRow ? 'NEW' : `#${order.invoice}`}
                          </div>
                          {order.isNewRow ? (
                            <select value={order.storeId} onChange={(e) => handleFieldChange(order.id, order.storeId, 'storeId', e.target.value)} className="w-full h-[32px] text-[11px] text-slate-900 bg-white font-bold px-2 rounded cursor-pointer border border-slate-300 shadow-2xs">
                              <option value="store1">Ruhama Wear</option>
                              <option value="store2">Aastha Naturals BD</option>
                            </select>
                          ) : (
                            <div className="w-full h-[32px] flex items-center justify-center text-[11px] text-slate-700 bg-white border border-slate-200 font-bold px-2 rounded shadow-2xs">
                              {order.storeName}
                            </div>
                          )}
                        </td>

                        {/* 2. Customer Name */}
                        <td className="p-3 align-top border-r border-slate-200">
                          <textarea rows={4} value={order.customerName} onChange={(e) => handleFieldChange(order.id, order.storeId, 'customerName', e.target.value)} placeholder="কাস্টমারের নাম..." className="w-full font-black text-sm text-slate-950 bg-transparent focus:bg-white border border-transparent focus:border-slate-300 rounded p-1 transition resize-none outline-none leading-snug whitespace-normal break-words placeholder:text-slate-400 placeholder:text-xs" />
                        </td>

                        {/* 3. Date & Time */}
                        <td className="p-3 align-top text-slate-700 font-bold border-r border-slate-200 space-y-1.5">
                          <div className="w-full h-[32px] flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 rounded shadow-2xs text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="font-bold text-slate-900">{formatOrderTime(order.dateCreated)}</span>
                          </div>
                          <div className="w-full h-[32px] flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 rounded shadow-2xs text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="font-bold text-slate-800">{formatOrderDate(order.dateCreated)}</span>
                          </div>
                        </td>

                        {/* 4. Phone, Call & Staff */}
                        <td className="p-3 align-top space-y-1.5 border-r border-slate-200">
                          <div className="w-full h-[34px] flex items-center gap-2 bg-white border border-slate-300 rounded px-2.5 shadow-2xs">
                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <input type="text" value={order.phone} placeholder="01XXXXXXXXX" onChange={(e) => handleFieldChange(order.id, order.storeId, 'phone', e.target.value)} className={`w-full text-xs font-mono font-black bg-transparent outline-none tracking-wide ${isRecent ? 'text-red-700' : isDuplicate ? 'text-amber-900' : 'text-slate-950'}`} />
                          </div>
                          {isRecent ? (
                            <div className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3 shrink-0 text-red-600" />
                              <span>রিসেন্ট ডুপ্লিকেট ({phoneInfo.recentOrders.length}টি)</span>
                            </div>
                          ) : isDuplicate ? (
                            <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3 shrink-0 text-amber-600" />
                              <span>মোট অর্ডার: {phoneInfo.count}টি</span>
                            </div>
                          ) : null}
                          <button onClick={() => { const newCallState = !order.callDone; handleFieldChange(order.id, order.storeId, 'callDone', newCallState); if (!order.staffName) { handleFieldChange(order.id, order.storeId, 'staffName', currentUser); } }} className={`w-full h-[34px] flex items-center justify-center gap-1.5 text-xs font-bold rounded transition border cursor-pointer shadow-2xs ${order.callDone ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'}`}>
                            <PhoneCall className="w-3.5 h-3.5" />
                            {order.callDone ? 'কল সম্পন্ন হয়েছে' : 'কল দিন'}
                          </button>
                          <div className="w-full h-[34px] flex items-center gap-2 bg-white border border-slate-300 rounded px-2.5 shadow-2xs">
                            <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <select value={order.staffName || ''} onChange={(e) => handleFieldChange(order.id, order.storeId, 'staffName', e.target.value)} className="w-full text-xs font-bold bg-transparent text-slate-900 cursor-pointer outline-none">
                              <option value="">স্টাফ নির্বাচন করুন</option>
                              {STAFF_MEMBERS.map((staff) => (
                                <option key={staff} value={staff}>{staff}</option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* 5. Address & Thana/District */}
                        <td className="p-3 align-top space-y-1.5 border-r border-slate-200">
                          <div className="flex items-start gap-1 bg-white border border-slate-300 rounded p-1.5 shadow-2xs">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 mt-1 shrink-0" />
                            <textarea rows={3} value={order.streetAddress} onChange={(e) => handleFieldChange(order.id, order.storeId, 'streetAddress', e.target.value)} placeholder="বিস্তারিত ঠিকানা..." className="w-full text-xs font-bold text-slate-900 bg-transparent resize-y leading-snug outline-none min-h-[58px]" />
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="h-[34px] flex items-center bg-white border border-slate-300 rounded px-2 shadow-2xs">
                              <select value={order.thana || ''} disabled={!order.district} onChange={(e) => handleFieldChange(order.id, order.storeId, 'thana', e.target.value)} className="w-full text-[11px] bg-transparent text-slate-900 font-bold disabled:text-slate-400 cursor-pointer outline-none">
                                <option value="">থানা বাছুন</option>
                                {availableThanas.map((thana) => (
                                  <option key={thana} value={thana}>{thana}</option>
                                ))}
                              </select>
                            </div>
                            <div className="h-[34px] flex items-center bg-white border border-slate-300 rounded px-2 shadow-2xs">
                              <select value={order.district || ''} onChange={(e) => handleFieldChange(order.id, order.storeId, 'district', e.target.value)} className="w-full text-[11px] bg-transparent text-slate-900 font-bold cursor-pointer outline-none">
                                <option value="">জেলা বাছুন</option>
                                {BANGLADESH_DISTRICTS.map((d) => (
                                  <option key={d.district} value={d.district}>{d.district}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </td>

                        {/* 6. Items (Multi-Select & Remove X), COD & Size */}
                        <td className="p-3 align-top space-y-1.5 border-r border-slate-200">
                          <div className="bg-white border border-slate-300 rounded p-1.5 shadow-2xs space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                              <span>সিলেক্টেড আইটেমসমূহ:</span>
                              <span className="text-emerald-700 font-mono">{currentItemList.length} পিস</span>
                            </div>
                            <div className="flex flex-wrap gap-1 min-h-[32px] p-1 bg-slate-50 border border-slate-200 rounded">
                              {currentItemList.length === 0 ? (
                                <span className="text-[11px] text-slate-400 italic px-1">কোনো আইটেম সিলেক্ট করা হয়নি</span>
                              ) : (
                                currentItemList.map((item, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs">
                                    {item}
                                    <button type="button" onClick={() => handleRemoveItem(order.id, order.storeId, idx)} className="text-rose-400 hover:text-rose-300 font-black cursor-pointer" title="আইটেমটি বাদ দিন">X</button>
                                  </span>
                                ))
                              )}
                            </div>
                            <select onChange={(e) => { if (e.target.value) { handleAddItem(order.id, order.storeId, e.target.value); e.target.value = ''; } }} className="w-full h-[32px] text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 cursor-pointer outline-none shadow-2xs">
                              <option value="">+ ড্রপডাউন থেকে আইটেম যোগ করুন...</option>
                              {PRODUCT_VARIATIONS.map((prod) => (
                                <option key={prod} value={prod}>{prod}</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="h-[34px] flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2.5 shadow-2xs">
                              <span className="text-xs font-black text-slate-700">COD:</span>
                              <input type="number" value={order.total} onFocus={(e) => e.target.select()} onChange={(e) => handleFieldChange(order.id, order.storeId, 'total', e.target.value)} placeholder="৳" className="w-full text-xs font-black text-emerald-800 bg-transparent outline-none" />
                            </div>
                            <div className="h-[34px] flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded px-2.5 shadow-2xs">
                              <Shirt className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                              <span className="text-[11px] font-black text-slate-600">সাইজ:</span>
                              <input type="text" value={order.size || ''} onChange={(e) => handleFieldChange(order.id, order.storeId, 'size', e.target.value.toUpperCase())} placeholder="XL" className="w-full text-xs font-black text-slate-950 uppercase text-center bg-white border border-slate-200 rounded py-0.5 outline-none" />
                            </div>
                          </div>
                        </td>

                        {/* 7. Status & Save */}
                        <td className="p-3 align-top text-center space-y-1.5 border-r border-slate-200">
                          <select value={order.status} disabled={updatingId === order.id} onChange={(e) => handleSaveOrder(order, e.target.value)} className={`w-full h-[34px] text-xs font-bold border rounded px-2.5 text-center cursor-pointer shadow-2xs ${getStatusColor(order.status)}`}>
                            {WOO_STATUSES.map((st) => (
                              <option key={st.value} value={st.value} className="bg-white text-slate-900">{st.label}</option>
                            ))}
                          </select>
                          <button onClick={() => handleSaveOrder(order)} disabled={updatingId === order.id} className="w-full h-[34px] flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded transition cursor-pointer disabled:opacity-50 shadow-2xs">
                            <Save className={`w-3.5 h-3.5 ${updatingId === order.id ? 'animate-spin' : ''}`} />
                            {updatingId === order.id ? 'সেভ হচ্ছে...' : 'তথ্য সেভ করুন (Save)'}
                          </button>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button onClick={() => handleSaveOrder(order, 'on-hold')} disabled={updatingId === order.id} title="রাখুন" className="h-[30px] flex items-center justify-center gap-1 text-[11px] font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded cursor-pointer shadow-2xs">
                              <BookmarkCheck className="w-3 h-3" /> রাখুন
                            </button>
                            <button onClick={() => handleSaveOrder(order, 'cancelled')} disabled={updatingId === order.id} title="বাতিল" className="h-[30px] flex items-center justify-center gap-1 text-[11px] font-bold text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded cursor-pointer shadow-2xs">
                              <XCircle className="w-3 h-3" /> বাতিল
                            </button>
                            <button onClick={() => handleDeleteOrder(order)} disabled={updatingId === order.id} title="ডিলিট" className="h-[30px] flex items-center justify-center gap-1 text-[11px] font-bold text-slate-700 hover:text-red-700 bg-slate-50 hover:bg-red-50 border border-slate-200 rounded cursor-pointer shadow-2xs">
                              <Trash2 className="w-3 h-3" /> ডিলিট
                            </button>
                          </div>
                        </td>

                        {/* 8. Steadfast Courier */}
                        <td className="p-3 align-top space-y-1.5">
                          <div className="w-full h-[34px] flex items-center bg-white border border-slate-300 rounded px-2.5 shadow-2xs">
                            <input type="text" value={order.customNote || ''} onChange={(e) => handleFieldChange(order.id, order.storeId, 'customNote', e.target.value)} placeholder="কুরিয়ার স্পেশাল নোট..." className="w-full text-xs font-bold text-slate-900 placeholder:text-slate-400 bg-transparent outline-none" />
                          </div>
                          <button onClick={() => handleSendToSteadfast(order)} disabled={sendingId === order.id} className={`w-full h-[34px] flex items-center justify-center gap-1.5 rounded text-xs font-bold transition cursor-pointer shadow-2xs ${order.trackingCode || order.consignmentId ? 'bg-slate-900 hover:bg-black text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}>
                            <Send className="w-3.5 h-3.5" />
                            {sendingId === order.id ? 'Sending...' : order.trackingCode || order.consignmentId ? 'Re-send Steadfast' : 'Send to Steadfast'}
                          </button>
                          {(order.trackingCode || order.consignmentId) && (
                            <div className="bg-slate-50 border border-slate-200 rounded p-2 space-y-1.5 text-left shadow-2xs">
                              <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-200">
                                <span className="font-bold text-slate-600 flex items-center gap-1">
                                  <Package className="w-3 h-3 text-slate-800" /> CID:
                                </span>
                                <span className="font-mono font-bold text-slate-900">{order.consignmentId || 'N/A'}</span>
                              </div>
                              <div className={`w-full py-1 px-1.5 rounded text-center text-[10px] font-bold uppercase tracking-wider border ${getCourierBadge(order.courierStatus || 'in_review')}`}>
                                {order.courierStatus ? order.courierStatus.replace(/_/g, ' ') : 'IN REVIEW'}
                              </div>
                              <button onClick={() => handleCheckCourierStatus(order)} disabled={trackingId === order.id} className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-800 bg-white hover:bg-slate-100 py-1 px-2 rounded w-full border border-slate-300 transition cursor-pointer shadow-2xs">
                                <RotateCw className={`w-3 h-3 ${trackingId === order.id ? 'animate-spin' : ''}`} />
                                {trackingId === order.id ? 'চেক হচ্ছে...' : 'লাইভ স্ট্যাটাস'}
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