import React, { useState, useEffect } from 'react';
import { 
  Users, ShoppingBag, PlusCircle, Calendar, RefreshCw, 
  TrendingUp, CheckCircle2, Clock, MapPin, Phone, 
  MessageSquare, DollarSign, Edit3, Trash2, Camera, 
  FileText, Star, Settings, Percent, Tag, LogOut, ChevronRight
} from 'lucide-react';

// Varsayılan Hizmet Kataloğu (Yönetici panelden değiştirebilir)
const DEFAULT_SERVICES = [
  { id: '1', name: 'Koltuk Yıkama (Standart)', price: 1200, unit: 'adet' },
  { id: '2', name: 'L Koltuk Yıkama', price: 1500, unit: 'adet' },
  { id: '3', name: 'Yatak Yıkama (Çift Kişilik)', price: 900, unit: 'adet' },
  { id: '4', name: 'Halı Yıkama', price: 120, unit: 'm²' },
  { id: '5', name: 'Stor Perde Yıkama', price: 150, unit: 'm²' },
  { id: '6', name: 'Sandalye Yıkama', price: 150, unit: 'adet' },
  { id: '7', name: 'Araç Koltuk Yıkama', price: 1400, unit: 'araç' },
];

export default function App() {
  // Veri Durumları (LocalStorage destekli)
  const [role, setRole] = useState('admin'); // 'admin' veya 'worker'
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'new-job', 'catalog', 'reminders', 'finance'
  
  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem('pevuno_services');
    return saved ? JSON.parse(saved) : DEFAULT_SERVICES;
  });

  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem('pevuno_jobs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'JOB-101',
        customerName: 'Ahmet Yılmaz',
        phone: '05321234567',
        address: 'Atatürk Mah. Lale Sok. No:5 Pendik / İstanbul',
        items: [{ serviceId: '1', serviceName: 'Koltuk Yıkama (Standart)', qty: 1, unitPrice: 1200 }],
        subtotal: 1200,
        discountType: 'amount', // 'none', 'amount', 'percent'
        discountValue: 100,
        totalAmount: 1100,
        paidAmount: 500,
        status: 'Yolda / Adreste',
        date: '2026-10-27',
        note: 'Minderlerde leke var, hassas leke çıkarıcı kullanılacak.',
        beforeImg: null,
        afterImg: null
      }
    ];
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('pevuno_expenses');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Deterjan & Şampuan Alımı', amount: 850, date: '2026-10-25' }
    ];
  });

  // Yeni İş Formu Durumları
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', note: '' });
  const [selectedItems, setSelectedItems] = useState([]);
  const [discountType, setDiscountType] = useState('none'); // 'none', 'amount', 'percent'
  const [discountValue, setDiscountValue] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [jobDate, setJobDate] = useState(new Date().toISOString().split('T')[0]);

  // Yeni Hizmet Ekleme (Katalog İçin)
  const [newService, setNewService] = useState({ name: '', price: '', unit: 'adet' });
  const [editingServiceId, setEditingServiceId] = useState(null);

  // Fiş Modalı
  const [selectedJobForReceipt, setSelectedJobForReceipt] = useState(null);

  // Verileri Kaydetme
  useEffect(() => {
    localStorage.setItem('pevuno_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('pevuno_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('pevuno_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Hesaplama İşlevleri
  const subtotal = selectedItems.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
  
  const calculateDiscount = () => {
    if (discountType === 'amount') return Number(discountValue) || 0;
    if (discountType === 'percent') return (subtotal * (Number(discountValue) || 0)) / 100;
    return 0;
  };

  const calculatedDiscount = calculateDiscount();
  const finalTotal = Math.max(0, subtotal - calculatedDiscount);

  // İş Ekleme
  const handleCreateJob = (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone || selectedItems.length === 0) {
      alert('Lütfen müşteri adı, telefon ve en az 1 hizmet seçiniz.');
      return;
    }

    const newJobObj = {
      id: `JOB-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: newCustomer.name,
      phone: newCustomer.phone,
      address: newCustomer.address,
      note: newCustomer.note,
      items: selectedItems,
      subtotal,
      discountType,
      discountValue: Number(discountValue) || 0,
      totalAmount: finalTotal,
      paidAmount: Number(paidAmount) || 0,
      status: 'Sırada / Randevu',
      date: jobDate,
      beforeImg: null,
      afterImg: null
    };

    setJobs([newJobObj, ...jobs]);
    
    // Formu Sıfırla
    setNewCustomer({ name: '', phone: '', address: '', note: '' });
    setSelectedItems([]);
    setDiscountType('none');
    setDiscountValue(0);
    setPaidAmount(0);
    setActiveTab('jobs');
  };

  // İş Durumu Güncelleme
  const updateJobStatus = (jobId, newStatus) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
  };

  // WhatsApp Mesajı Gönderme
  const sendWhatsAppMessage = (job) => {
    const remaining = job.totalAmount - job.paidAmount;
    const reviewLink = "https://g.page/r/pevuno-solution/review";
    
    let msg = `Merhaba *${job.customerName}*,\n\n`;
    msg += `✨ *PEVUNO SOLUTION* profesyonel temizlik hizmetimiz tamamlanmıştır.\n\n`;
    msg += `📋 *Yapılan İşlemler:*\n`;
    job.items.forEach(i => {
      msg += `• ${i.serviceName} (${i.qty} ${services.find(s=>s.id===i.serviceId)?.unit || 'adet'})\n`;
    });
    
    if (job.discountValue > 0) {
      msg += `\n💰 Ara Toplam: ${job.subtotal} TL`;
      msg += `\n🏷️ İndirim: -${job.subtotal - job.totalAmount} TL`;
    }
    msg += `\n💳 *Toplam Tutar:* ${job.totalAmount} TL`;
    msg += `\n💵 *Ödenen:* ${job.paidAmount} TL`;
    msg += `\n📌 *Kalan Bakiye:* ${remaining > 0 ? `${remaining} TL` : 'Ödendi ✅'}\n\n`;
    msg += `Hizmetimizden memnun kaldıysanız Google üzerinden bize 5 yıldızlı yorum bırakarak destek olabilirsiniz:\n⭐ ${reviewLink}\n\n`;
    msg += `Bizi tercih ettiğiniz için teşekkür ederiz! 🧼🚿`;

    const encoded = encodeURIComponent(msg);
    const cleanPhone = job.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `9${cleanPhone}` : cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone}`;
    
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
  };

  // Katalog Yönetimi (Fiyat Güncelleme / Yeni Ekleme)
  const handleAddOrUpdateService = (e) => {
    e.preventDefault();
    if (!newService.name || !newService.price) return;

    if (editingServiceId) {
      setServices(services.map(s => s.id === editingServiceId ? { ...s, name: newService.name, price: Number(newService.price), unit: newService.unit } : s));
      setEditingServiceId(null);
    } else {
      setServices([...services, { id: Date.now().toString(), name: newService.name, price: Number(newService.price), unit: newService.unit }]);
    }
    setNewService({ name: '', price: '', unit: 'adet' });
  };

  const handleEditService = (srv) => {
    setEditingServiceId(srv.id);
    setNewService({ name: srv.name, price: srv.price, unit: srv.unit });
  };

  const handleDeleteService = (id) => {
    setServices(services.filter(s => s.id !== id));
  };

  // Finans Raporları
  const totalRevenue = jobs.reduce((acc, j) => acc + j.totalAmount, 0);
  const totalCollected = jobs.reduce((acc, j) => acc + j.paidAmount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalCollected - totalExpenses;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* Üst Header / Navigasyon */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-2 rounded-xl text-slate-950 font-bold">
              ✨
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight">PEVUNO SOLUTION</h1>
              <p className="text-xs text-slate-400">Profesyonel Temizlik CRM</p>
            </div>
          </div>

          {/* Rol Seçici (Admin / Saha Elemanı) */}
          <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setRole('admin')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${role === 'admin' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'}`}
            >
              👑 Yönetici
            </button>
            <button
              onClick={() => { setRole('worker'); setActiveTab('jobs'); }}
              className={`px-3 py-1.5 rounded-md font-medium transition ${role === 'worker' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:text-white'}`}
            >
              👷 Saha Ekibi
            </button>
          </div>
        </div>

        {/* Ana Sekme Menüsü */}
        <div className="bg-slate-800 border-t border-slate-700">
          <div className="max-w-6xl mx-auto px-4 flex space-x-1 overflow-x-auto text-sm">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-3 flex items-center space-x-2 border-b-2 font-medium whitespace-nowrap ${activeTab === 'jobs' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>İş Listesi ({jobs.length})</span>
            </button>

            {role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('new-job')}
                  className={`px-4 py-3 flex items-center space-x-2 border-b-2 font-medium whitespace-nowrap ${activeTab === 'new-job' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Yeni İş Kaydı</span>
                </button>

                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`px-4 py-3 flex items-center space-x-2 border-b-2 font-medium whitespace-nowrap ${activeTab === 'catalog' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Fiyat Kataloğu</span>
                </button>

                <button
                  onClick={() => setActiveTab('reminders')}
                  className={`px-4 py-3 flex items-center space-x-2 border-b-2 font-medium whitespace-nowrap ${activeTab === 'reminders' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>6 Ay Hatırlatıcı</span>
                </button>

                <button
                  onClick={() => setActiveTab('finance')}
                  className={`px-4 py-3 flex items-center space-x-2 border-b-2 font-medium whitespace-nowrap ${activeTab === 'finance' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Kasa & Ciro</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Ana İçerik Alanı */}
      <main className="max-w-6xl mx-auto px-4 py-6">

        {/* --- 1. İŞ LİSTESİ SEKMESİ --- */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Aktif & Geçmiş Saha İşleri</h2>
              {role === 'admin' && (
                <button
                  onClick={() => setActiveTab('new-job')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 shadow"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Yeni İş Ekle</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4 hover:shadow-md transition">
                  {/* Başlık ve Durum */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">{job.id}</span>
                      <h3 className="font-bold text-lg text-slate-900 mt-1">{job.customerName}</h3>
                      <p className="text-xs text-slate-500 flex items-center mt-0.5">
                        <Calendar className="w-3.5 h-3.5 mr-1" /> {job.date}
                      </p>
                    </div>

                    <select
                      value={job.status}
                      onChange={(e) => updateJobStatus(job.id, e.target.value)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${
                        job.status === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        job.status === 'İşlem Yapılıyor' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        job.status === 'Yolda / Adreste' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      <option value="Sırada / Randevu">⏳ Sırada / Randevu</option>
                      <option value="Yolda / Adreste">🚗 Yolda / Adreste</option>
                      <option value="İşlem Yapılıyor">🧼 İşlem Yapılıyor</option>
                      <option value="Tamamlandı">✅ Tamamlandı</option>
                    </select>
                  </div>

                  {/* Adres ve Yol Tarifi */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2 text-slate-700">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{job.address}</span>
                      </div>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white border border-slate-200 text-xs font-semibold px-2.5 py-1 rounded-lg text-slate-700 hover:bg-slate-100 shrink-0 flex items-center space-x-1 shadow-sm"
                      >
                        <span>Yol Tarifi</span>
                      </a>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-700 pt-1">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <a href={`tel:${job.phone}`} className="hover:underline font-mono">{job.phone}</a>
                    </div>

                    {job.note && (
                      <div className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-900 p-2 rounded-lg font-medium">
                        📌 <strong>Özel Not:</strong> {job.note}
                      </div>
                    )}
                  </div>

                  {/* Kalemler */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hizmet Detayı</p>
                    <div className="divide-y divide-slate-100 text-sm">
                      {job.items.map((item, idx) => (
                        <div key={idx} className="py-1 flex justify-between">
                          <span className="text-slate-700">{item.serviceName} x{item.qty}</span>
                          <span className="font-medium text-slate-900">{item.qty * item.unitPrice} TL</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fiyat Bilgisi */}
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm">
                    <div>
                      {job.discountValue > 0 && (
                        <span className="text-xs text-rose-600 font-semibold block">
                          İndirim Uygulandı (-{job.subtotal - job.totalAmount} TL)
                        </span>
                      )}
                      <span className="text-slate-500">Toplam: </span>
                      <span className="font-extrabold text-lg text-slate-900">{job.totalAmount} TL</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs block text-slate-500">Ödenen: {job.paidAmount} TL</span>
                      <span className={`text-xs font-bold ${job.totalAmount - job.paidAmount <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {job.totalAmount - job.paidAmount <= 0 ? 'Ödendi' : `Kalan: ${job.totalAmount - job.paidAmount} TL`}
                      </span>
                    </div>
                  </div>

                  {/* Aksiyon Butonları */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => sendWhatsAppMessage(job)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WP Mesajı Gönder</span>
                    </button>

                    <button
                      onClick={() => setSelectedJobForReceipt(job)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 border border-slate-200 transition"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Servis Fişi (PDF)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 2. YENİ İŞ KAYDI SEKMESİ --- */}
        {activeTab === 'new-job' && role === 'admin' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <PlusCircle className="w-6 h-6 text-emerald-600" />
              <span>Yeni Müşteri & İş Kaydı Oluştur</span>
            </h2>

            <form onSubmit={handleCreateJob} className="space-y-6">
              {/* Müşteri Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Müşteri Adı Soyadı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Mehmet Öz"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Telefon Numarası *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: 05321234567"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Açık Adres *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="İlçe, Mahalle, Cadde, Sokak, Bina No, Daire..."
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Hizmet Seçimi Kataloğu */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Hizmet Kataloğundan Seçin</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {services.map((srv) => (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => {
                        const exists = selectedItems.find(i => i.serviceId === srv.id);
                        if (exists) {
                          setSelectedItems(selectedItems.map(i => i.serviceId === srv.id ? { ...i, qty: i.qty + 1 } : i));
                        } else {
                          setSelectedItems([...selectedItems, { serviceId: srv.id, serviceName: srv.name, qty: 1, unitPrice: srv.price }]);
                        }
                      }}
                      className="bg-white border border-slate-200 hover:border-emerald-500 p-3 rounded-xl text-left shadow-sm transition hover:shadow"
                    >
                      <div className="font-semibold text-xs text-slate-800">{srv.name}</div>
                      <div className="text-emerald-600 font-extrabold text-sm mt-1">{srv.price} TL <span className="text-xs text-slate-400 font-normal">/ {srv.unit}</span></div>
                    </button>
                  ))}
                </div>

                {/* Seçilen Kalemler */}
                {selectedItems.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                    <p className="text-xs font-bold text-slate-600">Seçilen Hizmetler:</p>
                    {selectedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 text-sm">
                        <span className="font-medium text-slate-800">{item.serviceName}</span>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.qty > 1) {
                                  setSelectedItems(selectedItems.map((i, index) => index === idx ? { ...i, qty: i.qty - 1 } : i));
                                } else {
                                  setSelectedItems(selectedItems.filter((_, index) => index !== idx));
                                }
                              }}
                              className="px-2 py-0.5 bg-slate-100 font-bold hover:bg-slate-200"
                            >-</button>
                            <span className="px-3 font-semibold text-xs">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedItems(selectedItems.map((i, index) => index === idx ? { ...i, qty: i.qty + 1 } : i))}
                              className="px-2 py-0.5 bg-slate-100 font-bold hover:bg-slate-200"
                            >+</button>
                          </div>
                          <span className="font-bold text-slate-900 w-16 text-right">{item.qty * item.unitPrice} TL</span>
                          <button
                            type="button"
                            onClick={() => setSelectedItems(selectedItems.filter((_, index) => index !== idx))}
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                          >✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* İndirim ve Fiyat Paneli */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* İndirim Tipi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">İndirim Türü</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
                    >
                      <option value="none">İndirim Yok</option>
                      <option value="amount">Tutardan İndirim (TL)</option>
                      <option value="percent">Yüzde İndirimi (%)</option>
                    </select>
                  </div>

                  {/* İndirim Değeri */}
                  {discountType !== 'none' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        {discountType === 'amount' ? 'İndirim Tutarı (TL)' : 'İndirim Yüzdesi (%)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
                      />
                    </div>
                  )}

                  {/* Kapora / Ödenen */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Kapora / Alınan Ödeme (TL)</label>
                    <input
                      type="number"
                      min="0"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
                    />
                  </div>
                </div>

                {/* Özet Fiyat Tutar Kutusu */}
                <div className="pt-3 border-t border-emerald-200/60 flex flex-wrap justify-between items-center text-sm">
                  <div className="space-y-0.5">
                    <p className="text-slate-500 text-xs">Ara Toplam: <span className="font-semibold text-slate-700">{subtotal} TL</span></p>
                    {discountType !== 'none' && (
                      <p className="text-rose-600 text-xs font-medium">Uygulanan İndirim: -{calculatedDiscount} TL</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Genel Toplam Tutar</span>
                    <span className="text-2xl font-black text-emerald-700">{finalTotal} TL</span>
                  </div>
                </div>
              </div>

              {/* Not & Tarih */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Randevu Tarihi</label>
                  <input
                    type="date"
                    value={jobDate}
                    onChange={(e) => setJobDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Saha Notu / Müşteri İsteği</label>
                  <input
                    type="text"
                    placeholder="Örn: Evde kedi var, koltuk lekeleri yoğun..."
                    value={newCustomer.note}
                    onChange={(e) => setNewCustomer({ ...newCustomer, note: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition"
              >
                Müşteri ve İş Kaydını Tamamla 🚀
              </button>
            </form>
          </div>
        )}

        {/* --- 3. FİYAT KATALOĞU SEKMESİ (YÖNETİCİ İÇİN DİNAMİK FİYAT DEĞİŞTİRME) --- */}
        {activeTab === 'catalog' && role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Settings className="w-6 h-6 text-emerald-600" />
                <span>Hizmet & Fiyat Listesi Yönetimi</span>
              </h2>
              <p className="text-xs text-slate-500">
                Buradan dilediğiniz hizmetin birim fiyatını değiştirebilir veya yeni temizlik kalemleri ekleyebilirsiniz. Kod değiştirmeye gerek kalmadan panel doğrudan güncellenir.
              </p>

              {/* Yeni Hizmet Ekleme Formu */}
              <form onSubmit={handleAddOrUpdateService} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input
                  type="text"
                  required
                  placeholder="Hizmet Adı (Örn: Halı Yıkama)"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="sm:col-span-2 border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
                />
                <input
                  type="number"
                  required
                  placeholder="Fiyat (TL)"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
                />
                <div className="flex space-x-2">
                  <select
                    value={newService.unit}
                    onChange={(e) => setNewService({ ...newService, unit: e.target.value })}
                    className="border border-slate-300 rounded-xl px-2 py-2 text-sm bg-white flex-1"
                  >
                    <option value="adet">adet</option>
                    <option value="m²">m²</option>
                    <option value="araç">araç</option>
                    <option value="set">set</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm shrink-0 shadow"
                  >
                    {editingServiceId ? 'Güncelle' : 'Ekle'}
                  </button>
                </div>
              </form>

              {/* Mevcut Hizmet Listesi */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {services.map((srv) => (
                  <div key={srv.id} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{srv.name}</h4>
                      <span className="text-xs text-slate-400">Birim: {srv.unit}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-extrabold text-slate-900 text-base">{srv.price} TL</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditService(srv)}
                          className="p-2 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(srv.id)}
                          className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- 4. 6 AY HATIRLATICI SEKMESİ --- */}
        {activeTab === 'reminders' && role === 'admin' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-2">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <RefreshCw className="w-6 h-6 text-emerald-600" />
                <span>6 Ay Periyodik Yıkama Hatırlatıcıları</span>
              </h2>
              <p className="text-xs text-slate-500">
                Son temizliğin üzerinden 6 ay geçmiş müşterileriniz burada listelenir. Tek tıkla periyodik bakım/temizlik hatırlatma mesajı atabilirsiniz.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center py-12">
              <RefreshCw className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700">Hatırlatma zamanı gelen müşteri bulunamadı</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Son temizliğinin üzerinden 6 ay geçen müşterileriniz otomatik olarak bu alana düşecektir.
              </p>
            </div>
          </div>
        )}

        {/* --- 5. FINANS & CIRO SEKMESİ --- */}
        {activeTab === 'finance' && role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Özet Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Toplam İş Hacmi</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{totalRevenue} TL</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Tahsil Edilen Nakit</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{totalCollected} TL</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Net Kâr / Durum</span>
                <div className="text-2xl font-black text-blue-600 mt-1">{netProfit} TL</div>
              </div>
            </div>

            {/* Gider Ekleme Paneli */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 text-base">Gider & Masraf Kaydı</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Gider Açıklaması (Örn: Yakıt)"
                  className="sm:col-span-2 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Tutar (TL)"
                  className="border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- DİJİTAL SERVİS FİŞİ MODALI --- */}
      {selectedJobForReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="border-b border-slate-200 pb-4 text-center space-y-1">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">PEVUNO SOLUTION</h2>
              <p className="text-xs text-slate-500">Profesyonel Temizlik & Hijyen Hizmetleri</p>
              <div className="inline-block bg-slate-100 text-slate-700 text-xs px-3 py-1 rounded-full font-bold mt-2">
                DİJİTAL SERVİS FİŞİ / FATURA ÖZETİ
              </div>
            </div>

            <div className="text-xs space-y-1 text-slate-600">
              <p><strong>Müşteri:</strong> {selectedJobForReceipt.customerName}</p>
              <p><strong>Telefon:</strong> {selectedJobForReceipt.phone}</p>
              <p><strong>Adres:</strong> {selectedJobForReceipt.address}</p>
              <p><strong>Tarih:</strong> {selectedJobForReceipt.date}</p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left divide-y divide-slate-200">
                <thead className="bg-slate-50 font-bold text-slate-700">
                  <tr>
                    <th className="p-2.5">Hizmet</th>
                    <th className="p-2.5 text-center">Adet</th>
                    <th className="p-2.5 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedJobForReceipt.items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5">{i.serviceName}</td>
                      <td className="p-2.5 text-center">{i.qty}</td>
                      <td className="p-2.5 text-right font-semibold">{i.qty * i.unitPrice} TL</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-right text-xs">
              {selectedJobForReceipt.discountValue > 0 && (
                <p className="text-rose-600">İndirim: -{selectedJobForReceipt.subtotal - selectedJobForReceipt.totalAmount} TL</p>
              )}
              <p className="text-base font-black text-slate-900">Toplam Tutar: {selectedJobForReceipt.totalAmount} TL</p>
              <p className="text-emerald-600 font-bold">Ödenen: {selectedJobForReceipt.paidAmount} TL</p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Yazdır / PDF İndir
              </button>
              <button
                onClick={() => setSelectedJobForReceipt(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
