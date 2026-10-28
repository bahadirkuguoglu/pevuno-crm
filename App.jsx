import React, { useState, useEffect } from 'react';
import { 
  Users, ShoppingBag, PlusCircle, Calendar, RefreshCw, 
  TrendingUp, CheckCircle2, Clock, MapPin, Phone, 
  MessageSquare, DollarSign, Edit3, Trash2, Camera, 
  FileText, Star, Settings, Percent, Tag, LogOut, ChevronRight, Lock, ShieldCheck
} from 'lucide-react';

// Varsayılan Hizmet Kataloğu
const DEFAULT_SERVICES = [
  { id: '1', name: 'Koltuk Yıkama (Standart)', price: 1200, unit: 'adet' },
  { id: '2', name: 'L Koltuk Yıkama', price: 1500, unit: 'adet' },
  { id: '3', name: 'Yatak Yıkama (Çift Kişilik)', price: 900, unit: 'adet' },
  { id: '4', name: 'Halı Yıkama', price: 120, unit: 'm²' },
  { id: '5', name: 'Stor Perde Yıkama', price: 150, unit: 'm²' },
  { id: '6', name: 'Sandalye Yıkama', price: 150, unit: 'adet' },
];

// Saha Personeli Listesi (Ad, Şifre, Hakediş Oranı)
const WORKERS = [
  { id: 'w1', name: 'Yunus Yıldız', pin: '1234', defaultHakedis: 300 },
  { id: 'w2', name: 'Ahmet Demir', pin: '5678', defaultHakedis: 250 }
];

export default function App() {
  // Giriş ve Rol Durumları
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('pevuno_logged_user');
    return saved ? JSON.parse(saved) : null; // { role: 'admin' veya 'worker', name: '...' }
  });
  
  const [loginPin, setLoginPin] = useState('');
  const [loginType, setLoginType] = useState('admin'); // 'admin' veya 'worker'
  const [selectedWorkerId, setSelectedWorkerId] = useState(WORKERS[0].id);

  const [activeTab, setActiveTab] = useState('jobs'); 
  
  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem('pevuno_services');
    return saved ? JSON.parse(saved) : DEFAULT_SERVICES;
  });

  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem('pevuno_jobs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'JOB-101',
        customerName: 'Mehmet Öz',
        companyName: 'Öz İnşaat Ltd.',
        phone: '05321234567',
        address: 'Atatürk Mah. Lale Sok. No:5 Pendik / İstanbul',
        items: [{ serviceId: '1', serviceName: 'Koltuk Yıkama (Standart)', qty: 1, unitPrice: 1200 }],
        subtotal: 1200,
        discountType: 'amount',
        discountValue: 100,
        totalAmount: 1100,
        paidAmount: 500,
        status: 'Yolda / Adreste',
        date: '2026-10-28',
        note: 'Hassas şampuan kullanılacak.',
        assignedWorker: 'Yunus Yıldız',
        workerHakedis: 300,
        kvkkApproved: true,
        paymentMethod: 'Elden (Saha)', // 'Elden (Saha)' veya 'IBAN (Yönetici)'
        completedByWorker: false
      }
    ];
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('pevuno_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  // Yeni İş Formu
  const [newCustomer, setNewCustomer] = useState({ name: '', company: '', phone: '', address: '', note: '', kvkk: false });
  const [selectedItems, setSelectedItems] = useState([]);
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [jobDate, setJobDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignedWorker, setAssignedWorker] = useState(WORKERS[0].name);
  const [workerHakedis, setWorkerHakedis] = useState(WORKERS[0].defaultHakedis);

  // Katalog Yeni Hizmet
  const [newService, setNewService] = useState({ name: '', price: '', unit: 'adet' });
  const [editingServiceId, setEditingServiceId] = useState(null);

  // Fiş Modalı
  const [selectedJobForReceipt, setSelectedJobForReceipt] = useState(null);

  // Kayıt İşlemleri
  useEffect(() => { localStorage.setItem('pevuno_services', JSON.stringify(services)); }, [services]);
  useEffect(() => { localStorage.setItem('pevuno_jobs', JSON.stringify(jobs)); }, [jobs]);
  useEffect(() => { localStorage.setItem('pevuno_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('pevuno_logged_user', JSON.stringify(currentUser)); }, [currentUser]);

  // Yardımcı: Personel Adını Soyad Baş Harfiyle Yazma (Örn: Yunus Y.)
  const formatWorkerNameMasked = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    if (parts.length < 2) return fullName;
    const firstName = parts[0];
    const lastNameInitial = parts[parts.length - 1].charAt(0);
    return `${firstName} ${lastNameInitial}.`;
  };

  // Hesaplamalar
  const subtotal = selectedItems.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
  const calculateDiscount = () => {
    if (discountType === 'amount') return Number(discountValue) || 0;
    if (discountType === 'percent') return (subtotal * (Number(discountValue) || 0)) / 100;
    return 0;
  };
  const calculatedDiscount = calculateDiscount();
  const finalTotal = Math.max(0, subtotal - calculatedDiscount);

  // Giriş Yapma Fonksiyonu
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginType === 'admin') {
      if (loginPin === '1453' || loginPin === 'admin') { // Admin şifresi
        setCurrentUser({ role: 'admin', name: 'Bahadır (Yönetici)' });
      } else {
        alert('Hatalı Yönetici Şifresi! (Deneme için şifre: 1453)');
      }
    } else {
      const worker = WORKERS.find(w => w.id === selectedWorkerId);
      if (worker && loginPin === worker.pin) {
        setCurrentUser({ role: 'worker', name: worker.name });
      } else {
        alert('Hatalı Personel Şifresi! (Deneme için şifre: 1234)');
      }
    }
  };

  // Yeni İş Ekleme
  const handleCreateJob = (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone || selectedItems.length === 0) {
      alert('Lütfen müşteri adı, telefon ve en az 1 hizmet seçiniz.');
      return;
    }

    const newJobObj = {
      id: `JOB-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: newCustomer.name,
      companyName: newCustomer.company,
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
      assignedWorker,
      workerHakedis: Number(workerHakedis) || 0,
      kvkkApproved: newCustomer.kvkk,
      paymentMethod: 'Elden (Saha)',
      completedByWorker: false
    };

    setJobs([newJobObj, ...jobs]);
    setNewCustomer({ name: '', company: '', phone: '', address: '', note: '', kvkk: false });
    setSelectedItems([]);
    setDiscountType('none');
    setDiscountValue(0);
    setPaidAmount(0);
    setActiveTab('jobs');
  };

  // İş Silme
  const handleDeleteJob = (jobId) => {
    if (confirm('Bu iş kaydını silmek istediğinize emin misiniz?')) {
      setJobs(jobs.filter(j => j.id !== jobId));
    }
  };

  // İş Durumu Güncelleme
  const updateJobStatus = (jobId, newStatus) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
  };

  // Saha Personeli İş Tamamlama ve Ödeme Bildirimi
  const handleWorkerCompleteJob = (jobId, payMethod) => {
    setJobs(jobs.map(j => j.id === jobId ? { 
      ...j, 
      status: 'Tamamlandı', 
      completedByWorker: true, 
      paymentMethod: payMethod,
      paidAmount: j.totalAmount // Tamamı ödendi kabul edilir
    } : j));
    alert('İş başarıyla tamamlandı olarak işaretlendi ve yöneticiye bildirildi!');
  };

  // WhatsApp Mesajı (Personel adı maskelenmiş olarak gider)
  const sendWhatsAppMessage = (job) => {
    const remaining = job.totalAmount - job.paidAmount;
    const reviewLink = "https://g.page/r/pevuno-solution/review";
    const maskedWorker = formatWorkerNameMasked(job.assignedWorker);
    
    let msg = `Merhaba *${job.customerName}*,\n\n`;
    msg += `✨ *PEVUNO SOLUTION* profesyonel temizlik hizmetimiz tamamlanmıştır.\n`;
    msg += `👷 Sizi ziyaret eden ekibimiz: *${maskedWorker}*\n\n`;
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

  // Katalog İşlemleri
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

  // Finans Hesapları
  const totalRevenue = jobs.reduce((acc, j) => acc + j.totalAmount, 0);
  const totalCollected = jobs.reduce((acc, j) => acc + j.paidAmount, 0);
  const totalHakedis = jobs.reduce((acc, j) => acc + (j.workerHakedis || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalCollected - totalExpenses - totalHakedis;

  // --- EĞER GİRİŞ YAPILMADIYSA GİRİŞ EKRANI ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="bg-emerald-500 w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-slate-950 text-2xl font-black shadow-lg">
              ✨
            </div>
            <h1 className="text-2xl font-black text-slate-900">PEVUNO SOLUTION</h1>
            <p className="text-xs text-slate-500">Profesyonel Saha & Müşteri Yönetim Sistemi</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setLoginType('admin')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${loginType === 'admin' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
              >
                👑 Yönetici Girişi
              </button>
              <button
                type="button"
                onClick={() => setLoginType('worker')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${loginType === 'worker' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
              >
                👷 Saha Personeli
              </button>
            </div>

            {loginType === 'worker' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Personel Seçiniz</label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-slate-50"
                >
                  {WORKERS.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {loginType === 'admin' ? 'Yönetici Şifresi (1453)' : 'Personel Şifresi (1234)'}
              </label>
              <input
                type="password"
                required
                placeholder="Şifrenizi girin..."
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition"
            >
              Sisteme Giriş Yap 🚀
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- ANA CRM UYGULAMASI ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* Üst Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-2 rounded-xl text-slate-950 font-bold">✨</div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight">PEVUNO SOLUTION</h1>
              <p className="text-xs text-slate-400">Aktif Kullanıcı: <strong className="text-emerald-400">{currentUser.name}</strong></p>
            </div>
          </div>

          <button
            onClick={() => setCurrentUser(null)}
            className="bg-slate-800 hover:bg-rose-900/40 text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center space-x-1.5 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Çıkış Yap</span>
          </button>
        </div>

        {/* Sekmeler */}
        <div className="bg-slate-800 border-t border-slate-700">
          <div className="max-w-6xl mx-auto px-4 flex space-x-1 overflow-x-auto text-sm">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-3 flex items-center space-x-2 border-b-2 font-medium whitespace-nowrap ${activeTab === 'jobs' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>İş Listesi ({currentUser.role === 'worker' ? jobs.filter(j => j.assignedWorker === currentUser.name).length : jobs.length})</span>
            </button>

            {currentUser.role === 'admin' && (
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
                  <span>KVKK & Hatırlatıcılar</span>
                </button>

                <button
                  onClick={() => setActiveTab('finance')}
                  className={`px-4 py-3 flex items-center space-x-2 border-b-2 font-medium whitespace-nowrap ${activeTab === 'finance' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Kasa & Hakediş</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* İçerik Alanı */}
      <main className="max-w-6xl mx-auto px-4 py-6">

        {/* --- İŞ LİSTESİ --- */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                {currentUser.role === 'admin' ? 'Tüm Saha İşleri ve Müşteriler' : 'Bana Atanan İşler'}
              </h2>
              {currentUser.role === 'admin' && (
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
              {jobs
                .filter(j => currentUser.role === 'admin' || j.assignedWorker === currentUser.name)
                .map((job) => (
                <div key={job.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">{job.id}</span>
                        {job.kvkkApproved && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200 flex items-center">
                            <ShieldCheck className="w-3 h-3 mr-1" /> KVKK Onaylı
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 mt-1">{job.customerName}</h3>
                      {job.companyName && <p className="text-xs text-slate-500 font-medium">🏢 {job.companyName}</p>}
                    </div>

                    <div className="flex items-center space-x-2">
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
                        <option value="Sırada / Randevu">⏳ Sırada</option>
                        <option value="Yolda / Adreste">🚗 Yolda</option>
                        <option value="İşlem Yapılıyor">🧼 Temizlikte</option>
                        <option value="Tamamlandı">✅ Bitti</option>
                      </select>

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="İşi Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Adres & Personel Bilgisi */}
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
                        className="bg-white border border-slate-200 text-xs font-semibold px-2.5 py-1 rounded-lg text-slate-700 hover:bg-slate-100 shrink-0 shadow-sm"
                      >
                        Yol Tarifi
                      </a>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <a href={`tel:${job.phone}`} className="hover:underline font-mono">{job.phone}</a>
                      </div>
                      <div className="bg-slate-200/70 px-2 py-0.5 rounded font-medium">
                        👷 Giden: <strong>{formatWorkerNameMasked(job.assignedWorker)}</strong>
                      </div>
                    </div>

                    {job.note && (
                      <div className="mt-1 text-xs bg-amber-50 border border-amber-200 text-amber-900 p-2 rounded-lg">
                        📌 <strong>Not:</strong> {job.note}
                      </div>
                    )}
                  </div>

                  {/* Hizmet Kalemleri */}
                  <div className="space-y-1">
                    <div className="divide-y divide-slate-100 text-sm">
                      {job.items.map((item, idx) => (
                        <div key={idx} className="py-1 flex justify-between">
                          <span className="text-slate-700">{item.serviceName} x{item.qty}</span>
                          <span className="font-medium text-slate-900">{item.qty * item.unitPrice} TL</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fiyat & Hakediş */}
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm">
                    <div>
                      <span className="text-slate-500 text-xs">Toplam: </span>
                      <span className="font-extrabold text-base text-slate-900">{job.totalAmount} TL</span>
                      {currentUser.role === 'admin' && (
                        <span className="text-xs text-blue-600 block font-medium">Personel Hakedişi: {job.workerHakedis} TL</span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xs block text-slate-500">Ödeme Durumu</span>
                      <span className="text-xs font-bold text-emerald-600">
                        {job.paidAmount >= job.totalAmount ? `Ödendi (${job.paymentMethod})` : 'Bekliyor'}
                      </span>
                    </div>
                  </div>

                  {/* Saha Personeli İçin İş Bitiş & Ödeme Alma Butonu */}
                  {currentUser.role === 'worker' && job.status !== 'Tamamlandı' && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-emerald-900">İş bitti mi? Ödemeyi nasıl aldınız?</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleWorkerCompleteJob(job.id, 'Elden (Saha)')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow"
                        >
                          💵 Elden Aldım (Bitti)
                        </button>
                        <button
                          onClick={() => handleWorkerCompleteJob(job.id, 'IBAN (Yönetici)')}
                          className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-lg shadow"
                        >
                          🏦 IBAN'a Atıldı (Bitti)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* WhatsApp ve Fiş Butonları */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => sendWhatsAppMessage(job)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WP Mesajı (Maskeli)</span>
                    </button>

                    <button
                      onClick={() => setSelectedJobForReceipt(job)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 border border-slate-200 transition"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Servis Fişi</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- YENİ İŞ KAYDI (YÖNETİCİ) --- */}
        {activeTab === 'new-job' && currentUser.role === 'admin' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <PlusCircle className="w-6 h-6 text-emerald-600" />
              <span>Yeni Müşteri & İş Kaydı Oluştur</span>
            </h2>

            <form onSubmit={handleCreateJob} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Müşteri Adı Soyadı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Mehmet Öz"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Firma / Kurum Adı (Opsiyonel)</label>
                  <input
                    type="text"
                    placeholder="Örn: Öz İnşaat A.Ş."
                    value={newCustomer.company}
                    onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
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
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Saha Personeli Ata *</label>
                  <select
                    value={assignedWorker}
                    onChange={(e) => {
                      const name = e.target.value;
                      setAssignedWorker(name);
                      const wObj = WORKERS.find(w => w.name === name);
                      if (wObj) setWorkerHakedis(wObj.defaultHakedis);
                    }}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white"
                  >
                    {WORKERS.map(w => (
                      <option key={w.id} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Açık Adres *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="İlçe, Mahalle, Cadde, Sokak, Bina No, Daire..."
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Hizmet Kataloğu Seçimi */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Hizmet Kataloğu</label>
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
                      className="bg-white border border-slate-200 hover:border-emerald-500 p-3 rounded-xl text-left shadow-sm transition"
                    >
                      <div className="font-semibold text-xs text-slate-800">{srv.name}</div>
                      <div className="text-emerald-600 font-extrabold text-sm mt-1">{srv.price} TL <span className="text-xs text-slate-400">/ {srv.unit}</span></div>
                    </button>
                  ))}
                </div>

                {selectedItems.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                    <p className="text-xs font-bold text-slate-600">Seçilen Kalemler:</p>
                    {selectedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 text-sm">
                        <span className="font-medium text-slate-800">{item.serviceName}</span>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                            <button type="button" onClick={() => {
                              if (item.qty > 1) setSelectedItems(selectedItems.map((i, index) => index === idx ? { ...i, qty: i.qty - 1 } : i));
                              else setSelectedItems(selectedItems.filter((_, index) => index !== idx));
                            }} className="px-2 py-0.5 bg-slate-100 font-bold">-</button>
                            <span className="px-3 font-semibold text-xs">{item.qty}</span>
                            <button type="button" onClick={() => setSelectedItems(selectedItems.map((i, index) => index === idx ? { ...i, qty: i.qty + 1 } : i))} className="px-2 py-0.5 bg-slate-100 font-bold">+</button>
                          </div>
                          <span className="font-bold text-slate-900 w-16 text-right">{item.qty * item.unitPrice} TL</span>
                          <button type="button" onClick={() => setSelectedItems(selectedItems.filter((_, index) => index !== idx))} className="text-rose-500 font-bold text-xs">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* İndirim, Hakediş ve Toplam */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">İndirim Türü</label>
                    <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white">
                      <option value="none">İndirim Yok</option>
                      <option value="amount">Tutar (TL)</option>
                      <option value="percent">Yüzde (%)</option>
                    </select>
                  </div>

                  {discountType !== 'none' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">İndirim Miktarı</label>
                      <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Personel Hakedişi (TL)</label>
                    <input type="number" value={workerHakedis} onChange={(e) => setWorkerHakedis(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                  </div>
                </div>

                <div className="pt-3 border-t border-emerald-200 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500">Ara Toplam: {subtotal} TL</p>
                    {discountType !== 'none' && <p className="text-xs text-rose-600">İndirim: -{calculatedDiscount} TL</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Genel Toplam</span>
                    <span className="text-2xl font-black text-emerald-700">{finalTotal} TL</span>
                  </div>
                </div>
              </div>

              {/* KVKK Onay Kutusu ve Randevu Tarihi */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="kvkkCheck"
                    checked={newCustomer.kvkk}
                    onChange={(e) => setNewCustomer({ ...newCustomer, kvkk: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="kvkkCheck" className="text-xs text-slate-700 cursor-pointer">
                    Müşteriye KVKK Aydınlatma Metni gönderildi ve onay alındı (Periyodik hatırlatmalar için zorunludur).
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Randevu Tarihi</label>
                    <input type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Özel Saha Notu</label>
                    <input type="text" placeholder="Örn: Evde kedi var..." value={newCustomer.note} onChange={(e) => setNewCustomer({ ...newCustomer, note: e.target.value })} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition">
                İş Kaydını Oluştur ve Ata 🚀
              </button>
            </form>
          </div>
        )}

        {/* --- FİYAT KATALOĞU --- */}
        {activeTab === 'catalog' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Settings className="w-6 h-6 text-emerald-600" />
                <span>Hizmet & Fiyat Listesi Yönetimi</span>
              </h4>

              <form onSubmit={handleAddOrUpdateService} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input type="text" required placeholder="Hizmet Adı" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} className="sm:col-span-2 border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="number" required placeholder="Fiyat (TL)" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <div className="flex space-x-2">
                  <select value={newService.unit} onChange={(e) => setNewService({ ...newService, unit: e.target.value })} className="border border-slate-300 rounded-xl px-2 py-2 text-sm bg-white flex-1">
                    <option value="adet">adet</option>
                    <option value="m²">m²</option>
                    <option value="araç">araç</option>
                  </select>
                  <button type="submit" className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-sm shadow">
                    {editingServiceId ? 'Güncelle' : 'Ekle'}
                  </button>
                </div>
              </form>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {services.map((srv) => (
                  <div key={srv.id} className="p-4 flex items-center justify-between bg-white">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{srv.name}</h4>
                      <span className="text-xs text-slate-400">Birim: {srv.unit}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-extrabold text-slate-900">{srv.price} TL</span>
                      <button onClick={() => { setEditingServiceId(srv.id); setNewService({ name: srv.name, price: srv.price, unit: srv.unit }); }} className="p-2 text-slate-500 hover:text-emerald-600"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => setServices(services.filter(s => s.id !== srv.id))} className="p-2 text-slate-500 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- KVKK & HATIRLATICILAR --- */}
        {activeTab === 'reminders' && currentUser.role === 'admin' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-2">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <RefreshCw className="w-6 h-6 text-emerald-600" />
                <span>KVKK Onaylı Periyodik Hatırlatıcılar</span>
              </h2>
              <p className="text-xs text-slate-500">
                Sadece KVKK onay kutusu işaretlenmiş müşteriler yasal olarak toplu kampanya veya 6 aylık temizlik hatırlatmasına dahil edilir.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm mb-3">KVKK Onayı Veren Müşteriler ({jobs.filter(j => j.kvkkApproved).length})</h3>
              <div className="space-y-2">
                {jobs.filter(j => j.kvkkApproved).map(j => (
                  <div key={j.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                    <div>
                      <span className="font-bold text-slate-900">{j.customerName}</span>
                      <span className="text-xs text-slate-500 ml-2">({j.phone})</span>
                    </div>
                    <button onClick={() => sendWhatsAppMessage(j)} className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                      Hatırlatma Mesajı Gönder 📲
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- KASA & HAKEDİŞ --- */}
        {activeTab === 'finance' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Toplam Ciro</span>
                <div className="text-xl font-black text-slate-900 mt-1">{totalRevenue} TL</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Tahsil Edilen</span>
                <div className="text-xl font-black text-emerald-600 mt-1">{totalCollected} TL</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Personel Hakedişleri</span>
                <div className="text-xl font-black text-blue-600 mt-1">{totalHakedis} TL</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Net Kâr</span>
                <div className="text-xl font-black text-purple-600 mt-1">{netProfit} TL</div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- SERVİS FİŞİ MODALI --- */}
      {selectedJobForReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="border-b border-slate-200 pb-4 text-center space-y-1">
              <h2 className="text-2xl font-extrabold text-slate-900">PEVUNO SOLUTION</h2>
              <p className="text-xs text-slate-500">Profesyonel Temizlik & Hijyen Servis Fişi</p>
              <p className="text-xs font-medium text-emerald-700 mt-1">Saha Personeli: {formatWorkerNameMasked(selectedJobForReceipt.assignedWorker)}</p>
            </div>

            <div className="text-xs space-y-1 text-slate-600">
              <p><strong>Müşteri:</strong> {selectedJobForReceipt.customerName}</p>
              <p><strong>Telefon:</strong> {selectedJobForReceipt.phone}</p>
              <p><strong>Adres:</strong> {selectedJobForReceipt.address}</p>
              <p><strong>Ödeme Şekli:</strong> {selectedJobForReceipt.paymentMethod}</p>
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
              <p className="text-base font-black text-slate-900">Toplam Tutar: {selectedJobForReceipt.totalAmount} TL</p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs">Yazdır / PDF</button>
              <button onClick={() => setSelectedJobForReceipt(null)} className="bg-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
