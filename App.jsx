import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Users, ShoppingBag, MessageSquare, Plus, Phone, Calendar, Trash2, CheckCircle, Clock } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', notes: '' });
  const [newOrder, setNewOrder] = useState({ customer_id: '', service_type: 'Koltuk Yıkama', price: '', status: 'Bekliyor', date: '' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: custData } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      const { data: ordData } = await supabase.from('orders').select('*, customers(name, phone)').order('created_at', { ascending: false });
      if (custData) setCustomers(custData);
      if (ordData) setOrders(ordData);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCustomer(e) {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;
    const { error } = await supabase.from('customers').insert([newCustomer]);
    if (!error) {
      setNewCustomer({ name: '', phone: '', address: '', notes: '' });
      fetchData();
    }
  }

  async function handleAddOrder(e) {
    e.preventDefault();
    if (!newOrder.customer_id || !newOrder.price) return;
    const { error } = await supabase.from('orders').insert([newOrder]);
    if (!error) {
      setNewOrder({ customer_id: '', service_type: 'Koltuk Yıkama', price: '', status: 'Bekliyor', date: '' });
      fetchData();
    }
  }

  function sendWhatsApp(phone, name, service) {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Merhaba ${name}, Pevuno Solution temizlik hizmetiniz (${service}) hakkında iletişime geçiyoruz. Sağlıklı günler dileriz!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-12">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" /> Pevuno Solution CRM
          </h1>
          <span className="text-xs bg-blue-700 px-2.5 py-1 rounded-full font-medium">Mobil PWA</span>
        </div>
      </header>

      {/* Navigation */}
      <div className="max-w-4xl mx-auto px-4 mt-4">
        <div className="flex bg-white rounded-xl shadow-sm p-1 border border-slate-200">
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex-1 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition ${activeTab === 'customers' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Users className="w-4 h-4" /> Müşteriler ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <ShoppingBag className="w-4 h-4" /> Siparişler ({orders.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
        ) : activeTab === 'customers' ? (
          <div className="space-y-6">
            {/* Add Customer Form */}
            <form onSubmit={handleAddCustomer} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="font-semibold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" /> Yeni Müşteri Ekle
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Müşteri Adı Soyadı"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Telefon Numarası"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Adres Bilgisi"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm transition shadow-sm">
                Müşteriyi Kaydet
              </button>
            </form>

            {/* Customer List */}
            <div className="space-y-3">
              {customers.map((c) => (
                <div key={c.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900">{c.name}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5"><Phone className="w-3.5 h-3.5" /> {c.phone}</p>
                    {c.address && <p className="text-xs text-slate-400 mt-1">{c.address}</p>}
                  </div>
                  <button
                    onClick={() => sendWhatsApp(c.phone, c.name, 'Genel')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white p-2.5 rounded-xl transition shadow-sm flex items-center justify-center"
                    title="WhatsApp Mesajı Gönder"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Add Order Form */}
            <form onSubmit={handleAddOrder} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="font-semibold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" /> Yeni Sipariş / İş Ekle
              </h2>
              <select
                value={newOrder.customer_id}
                onChange={(e) => setNewOrder({ ...newOrder, customer_id: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="">Müşteri Seçin</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Hizmet Türü (Örn: Koltuk Yıkama)"
                  value={newOrder.service_type}
                  onChange={(e) => setNewOrder({ ...newOrder, service_type: e.target.value })}
                  className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="number"
                  placeholder="Ücret (TL)"
                  value={newOrder.price}
                  onChange={(e) => setNewOrder({ ...newOrder, price: e.target.value })}
                  className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm transition shadow-sm">
                Siparişi Ekle
              </button>
            </form>

            {/* Order List */}
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900">{o.customers?.name || 'Müşteri'}</h3>
                    <p className="text-sm text-blue-600 font-medium">{o.service_type} - {o.price} TL</p>
                    <span className="inline-block text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full mt-1 font-medium">{o.status}</span>
                  </div>
                  {o.customers?.phone && (
                    <button
                      onClick={() => sendWhatsApp(o.customers.phone, o.customers.name, o.service_type)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white p-2.5 rounded-xl transition shadow-sm flex items-center justify-center"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
