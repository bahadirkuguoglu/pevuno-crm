import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Briefcase, PlusCircle, Calendar, Clock, MapPin, Phone, 
  CheckCircle, AlertCircle, FileText, Camera, Navigation, MessageSquare, 
  TrendingUp, Shield, UserCheck, RefreshCw, Trash2, Edit3, DollarSign, 
  ChevronRight, ArrowRight, Printer, Sparkles, Filter, Search, X, Check
} from 'lucide-react';

// --- SERVICE CATALOG DEFAULTS ---
const DEFAULT_SERVICES = [
  { id: '1', name: 'Koltuk Yıkama (Standart)', price: 1200, unit: 'adet' },
  { id: '2', name: 'L Koltuk Yıkama', price: 1500, unit: 'adet' },
  { id: '3', name: 'Yatak Yıkama (Çift Kişilik)', price: 900, unit: 'adet' },
  { id: '4', name: 'Halı Yıkama', price: 120, unit: 'm²' },
  { id: '5', name: 'Stor Perde Yıkama', price: 150, unit: 'm²' },
  { id: '6', name: 'Sandalye Yıkama', price: 150, unit: 'adet' },
  { id: '7', name: 'Araç Koltuk Yıkama', price: 1400, unit: 'araç' },
];

const GOOGLE_REVIEW_LINK = "https://g.page/r/pevuno-solution/review";

export default function App() {
  // --- STATE MANAGEMENT ---
  const [role, setRole] = useState('admin'); // 'admin' | 'field'
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'new_job' | 'reminders' | 'finance' | 'services'
  const [jobs, setJobs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [services, setServices] = useState(DEFAULT_SERVICES);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals & Active Selections
  const [selectedJobForReceipt, setSelectedJobForReceipt] = useState(null);
  const [selectedJobForPhotos, setSelectedJobForPhotos] = useState(null);
  const [editingJob, setEditingJob] = useState(null);

  // New Expense Form State
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'Malzeme' });

  // New Job Form State
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    note: '',
    selectedServices: [], // [{ serviceId, quantity, total }]
    deposit: 0,
    status: 'Sırada / Randevu', // 'Sırada / Randevu' | 'Saha Ekibi Yolda' | 'İşlem Yapılıyor' | 'İş Bitti / Tamamlandı'
    date: new Date().toISOString().split('T')[0]
  });

  // --- INITIAL LOAD & LOCAL STORAGE SYNC ---
  useEffect(() => {
    const savedJobs = localStorage.getItem('pevuno_jobs');
    const savedExpenses = localStorage.getItem('pevuno_expenses');
    const savedServices = localStorage.getItem('pevuno_services');

    if (savedJobs) {
      try { setJobs(JSON.parse(savedJobs)); } catch (e) { console.error(e); }
    } else {
      // Demo Data Initialization
      const sampleJobs = [
        {
          id: 'job-101',
          customerName: 'Ahmet Yılmaz',
          phone: '05321234567',
          address: 'Atatürk Mah. Karanfil Sok. No:12 D:4, Kadıköy / İstanbul',
          note: 'Koltuklarda çay lekesi var, leke çıkarıcı ve hassas şampuan kullanılacak.',
          items: [
            { id: '1', name: 'L Koltuk Yıkama', price: 1500, quantity: 1, total: 1500 },
            { id: '6', name: 'Sandalye Yıkama', price: 150, quantity: 4, total: 600 }
          ],
          totalAmount: 2100,
          deposit: 500,
          paymentStatus: 'Kapora Alındı',
          status: 'Saha Ekibi Yolda',
          createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          date: new Date().toISOString().split('T')[0],
          completedAt: null,
          beforePhoto: null,
          afterPhoto: null
        },
        {
          id: 'job-100',
          customerName: 'Ayşe Demir',
          phone: '05559876543',
          address: 'Moda Cad. Çıkmaz Sok. No:8, Kadıköy / İstanbul',
          note: 'Evde kedi var, anti-alerjen Yatak Yıkama tercih edildi.',
          items: [
            { id: '3', name: 'Yatak Yıkama (Çift Kişilik)', price: 900, quantity: 1, total: 900 }
          ],
          totalAmount: 900,
          deposit: 900,
          paymentStatus: 'Ödendi',
          status: 'İş Bitti / Tamamlandı',
          createdAt: new Date(Date.now() - 190 * 24 * 3600 * 1000).toISOString(), // ~6 months ago
          date: new Date(Date.now() - 190 * 24 * 3600 * 1000).toISOString().split('T')[0],
          completedAt: new Date(Date.now() - 190 * 24 * 3600 * 1000).toISOString(),
          beforePhoto: null,
          afterPhoto: null
        }
      ];
      setJobs(sampleJobs);
      localStorage.setItem('pevuno_jobs', JSON.stringify(sampleJobs));
    }

    if (savedExpenses) {
      try { setExpenses(JSON.parse(savedExpenses)); } catch (e) { console.error(e); }
    } else {
      const sampleExpenses = [
        { id: 'exp-1', title: 'Halı & Koltuk Şampuanı (20L)', amount: 850, category: 'Malzeme', date: new Date().toISOString().split('T')[0] },
        { id: 'exp-2', title: 'Saha Aracı Yakıt (Shell)', amount: 1200, category: 'Yakıt', date: new Date().toISOString().split('T')[0] }
      ];
      setExpenses(sampleExpenses);
      localStorage.setItem('pevuno_expenses', JSON.stringify(sampleExpenses));
    }

    if (savedServices) {
      try { setServices(JSON.parse(savedServices)); } catch (e) { console.error(e); }
    }
  }, []);

  // Save changes to LocalStorage
  const saveJobsToStorage = (updatedJobs) => {
    setJobs(updatedJobs);
    localStorage.setItem('pevuno_jobs', JSON.stringify(updatedJobs));
  };

  const saveExpensesToStorage = (updatedExpenses) => {
    setExpenses(updatedExpenses);
    localStorage.setItem('pevuno_expenses', JSON.stringify(updatedExpenses));
  };

  const saveServicesToStorage = (updatedServices) => {
    setServices(updatedServices);
    localStorage.setItem('pevuno_services', JSON.stringify(updatedServices));
  };

  // --- CALCULATIONS & DERIVED STATES ---
  const calculateJobTotal = (items) => items.reduce((acc, curr) => acc + (curr.total || 0), 0);

  const periodicReminders = useMemo(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return jobs.filter(j => {
      if (j.status !== 'İş Bitti / Tamamlandı' || !j.completedAt) return false;
      const compDate = new Date(j.completedAt);
      return compDate <= sixMonthsAgo;
    });
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchesSearch = j.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            j.phone.includes(searchTerm) || 
                            j.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchTerm, statusFilter]);

  // Financial Stats
  const financialStats = useMemo(() => {
    const totalRevenue = jobs.reduce((acc, j) => acc + (j.totalAmount || 0), 0);
    const collectedRevenue = jobs.reduce((acc, j) => {
      if (j.paymentStatus === 'Ödendi') return acc + (j.totalAmount || 0);
      return acc + (j.deposit || 0);
    }, 0);
    const pendingAmount = totalRevenue - collectedRevenue;
    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const netProfit = collectedRevenue - totalExpenses;

    return { totalRevenue, collectedRevenue, pendingAmount, totalExpenses, netProfit };
  }, [jobs, expenses]);

  // --- HANDLERS ---
  const handleAddServiceToForm = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    setFormData(prev => {
      const existingIndex = prev.selectedServices.findIndex(item => item.id === serviceId);
      if (existingIndex > -1) {
        const updated = [...prev.selectedServices];
        updated[existingIndex].quantity += 1;
        updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].price;
        return { ...prev, selectedServices: updated };
      } else {
        return {
          ...prev,
          selectedServices: [
            ...prev.selectedServices,
            { id: service.id, name: service.name, price: service.price, quantity: 1, total: service.price, unit: service.unit }
          ]
        };
      }
    });
  };

  const handleUpdateServiceQuantity = (serviceId, quantity) => {
    const qty = Math.max(1, parseFloat(quantity) || 1);
    setFormData(prev => {
      const updated = prev.selectedServices.map(item => {
        if (item.id === serviceId) {
          return { ...item, quantity: qty, total: qty * item.price };
        }
        return item;
      });
      return { ...prev, selectedServices: updated };
    });
  };

  const handleRemoveServiceFromForm = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.filter(item => item.id !== serviceId)
    }));
  };

  const handleSaveJob = (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.phone) {
      alert("Lütfen Müşteri Adı ve Telefon Numarasını giriniz.");
      return;
    }
    if (formData.selectedServices.length === 0) {
      alert("Lütfen en az bir hizmet seçiniz.");
      return;
    }

    const totalAmount = calculateJobTotal(formData.selectedServices);
    let paymentStatus = 'Bekliyor';
    if (formData.deposit >= totalAmount) paymentStatus = 'Ödendi';
    else if (formData.deposit > 0) paymentStatus = 'Kapora Alındı';

    const newJobObj = {
      id: editingJob ? editingJob.id : `job-${Date.now()}`,
      customerName: formData.customerName,
      phone: formData.phone,
      address: formData.address,
      note: formData.note,
      items: formData.selectedServices,
      totalAmount,
      deposit: parseFloat(formData.deposit) || 0,
      paymentStatus,
      status: formData.status,
      date: formData.date || new Date().toISOString().split('T')[0],
      createdAt: editingJob ? editingJob.createdAt : new Date().toISOString(),
      completedAt: formData.status === 'İş Bitti / Tamamlandı' ? (editingJob?.completedAt || new Date().toISOString()) : null,
      beforePhoto: editingJob ? editingJob.beforePhoto : null,
      afterPhoto: editingJob ? editingJob.afterPhoto : null,
    };

    if (editingJob) {
      const updated = jobs.map(j => j.id === editingJob.id ? newJobObj : j);
      saveJobsToStorage(updated);
      setEditingJob(null);
    } else {
      saveJobsToStorage([newJobObj, ...jobs]);
    }

    // Reset Form
    setFormData({
      customerName: '',
      phone: '',
      address: '',
      note: '',
      selectedServices: [],
      deposit: 0,
      status: 'Sırada / Randevu',
      date: new Date().toISOString().split('T')[0]
    });
    setActiveTab('jobs');
  };

  const handleStatusChange = (jobId, newStatus) => {
    const updated = jobs.map(job => {
      if (job.id === jobId) {
        const isCompleted = newStatus === 'İş Bitti / Tamamlandı';
        return {
          ...job,
          status: newStatus,
          completedAt: isCompleted ? new Date().toISOString() : job.completedAt
        };
      }
      return job;
    });
    saveJobsToStorage(updated);
  };

  const handleDeleteJob = (jobId) => {
    if (window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
      const updated = jobs.filter(j => j.id !== jobId);
      saveJobsToStorage(updated);
    }
  };

  const handlePhotoUpload = (e, jobId, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result;
      const updated = jobs.map(j => {
        if (j.id === jobId) {
          return {
            ...j,
            [type === 'before' ? 'beforePhoto' : 'afterPhoto']: base64Data
          };
        }
        return j;
      });
      saveJobsToStorage(updated);
      if (selectedJobForPhotos && selectedJobForPhotos.id === jobId) {
        setSelectedJobForPhotos(prev => ({
          ...prev,
          [type === 'before' ? 'beforePhoto' : 'afterPhoto']: base64Data
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const sendWhatsAppMessage = (job, isReminder = false) => {
    const cleanPhone = job.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone.replace(/^0/, '')}`;

    let message = '';
    if (isReminder) {
      message = `Merhaba Sayın *${job.customerName}*,\n\n` +
        `Pevuno Solution Profesyonel Temizlik Ekibi olarak sizleri tekrar selamlıyoruz! ✨\n\n` +
        `En son yaptığımız koltuk/temizlik hizmetimizin üzerinden 6 ay geçti. Sağlığınız ve hijyen standartlarınız için periyodik temizlik zamanınız geldi.\n\n` +
        `📢 *Size Özel Randevu Oluşturmak İçin Bize Buradan Dönüş Yapabilirsiniz.* \n\n` +
        `Saygılarımızla,\n*Pevuno Solution*`;
    } else {
      const itemsList = job.items.map(i => `• ${i.name} (${i.quantity} x ${i.price} TL) = ${i.total} TL`).join('\n');
      const kalan = job.totalAmount - (job.deposit || 0);

      message = `Merhaba Sayın *${job.customerName}*,\n\n` +
        `Pevuno Solution Hizmet Detaylarınız Aşağıdadır:\n\n` +
        `📋 *Yapılan Hizmetler:*\n${itemsList}\n\n` +
        `💰 *Toplam Tutar:* ${job.totalAmount} TL\n` +
        `💳 *Ödenen/Kapora:* ${job.deposit || 0} TL\n` +
        `📌 *Kalan Tutar:* ${kalan > 0 ? `${kalan} TL` : 'Ödendi'}\n\n` +
        `📝 *Not:* ${job.note || 'Özel not bulunmuyor.'}\n\n` +
        `Bizleri tercih ettiğiniz için teşekkür ederiz! Hizmetimizi değerlendirmek ve görüşlerinizi paylaşmak için Google Haritalar linkimiz:\n` +
        `⭐ ${GOOGLE_REVIEW_LINK}\n\n` +
        `İyi günler dileriz! 🌟\n*Pevuno Solution*`;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodedMessage}`, '_blank');
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;

    const expObj = {
      id: `exp-${Date.now()}`,
      title: newExpense.title,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      date: new Date().toISOString().split('T')[0]
    };

    saveExpensesToStorage([expObj, ...expenses]);
    setNewExpense({ title: '', amount: '', category: 'Malzeme' });
  };

  const handleDeleteExpense = (expId) => {
    saveExpensesToStorage(expenses.filter(e => e.id !== expId));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* --- TOP HEADER & ROLE TOGGLE --- */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-2 rounded-xl text-slate-900 font-bold shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide text-white leading-tight">PEVUNO SOLUTION</h1>
              <p className="text-xs text-emerald-400 font-medium">Profesyonel Temizlik CRM</p>
            </div>
          </div>

          {/* Role Switcher Toggle */}
          <div className="flex items-center bg-slate-800 p-1 rounded-full border border-slate-700">
            <button
              onClick={() => setRole('admin')}
              className={`flex items-center space-x-1 text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                role === 'admin' 
                  ? 'bg-blue-600 text-white font-semibold shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Yönetici</span>
            </button>
            <button
              onClick={() => {
                setRole('field');
                setActiveTab('jobs'); // Automatically switch to jobs tab on field mode
              }}
              className={`flex items-center space-x-1 text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                role === 'field' 
                  ? 'bg-emerald-600 text-white font-semibold shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Saha Ekibi</span>
            </button>
          </div>

        </div>
      </header>

      {/* --- MAIN NAVIGATION TABS --- */}
      <nav className="bg-white border-b border-slate-200 sticky top-[57px] z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-2 flex items-center overflow-x-auto no-scrollbar justify-around sm:justify-start sm:space-x-2">
          
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'jobs' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>İş Listesi</span>
            <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold ml-1">
              {jobs.length}
            </span>
          </button>

          {role === 'admin' && (
            <>
              <button
                onClick={() => {
                  setEditingJob(null);
                  setFormData({
                    customerName: '',
                    phone: '',
                    address: '',
                    note: '',
                    selectedServices: [],
                    deposit: 0,
                    status: 'Sırada / Randevu',
                    date: new Date().toISOString().split('T')[0]
                  });
                  setActiveTab('new_job');
                }}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'new_job' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Yeni Kayıt</span>
              </button>

              <button
                onClick={() => setActiveTab('reminders')}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'reminders' 
                    ? 'border-amber-500 text-amber-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>6 Ay Hatırlatıcı</span>
                {periodicReminders.length > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
                    {periodicReminders.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('finance')}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'finance' 
                    ? 'border-emerald-600 text-emerald-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Ciro & Rapor</span>
              </button>
            </>
          )}

        </div>
      </nav>

      {/* --- CONTENT CONTAINER --- */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">

        {/* ======================================================== */}
        {/* TAB 1: İŞ LİSTESİ (JOB LIST & SEARCH)                    */}
        {/* ======================================================== */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            
            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              
              {/* Search input */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Müşteri adı, telefon veya adres ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
                <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full md:w-auto"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="Sırada / Randevu">Sırada / Randevu</option>
                  <option value="Saha Ekibi Yolda">Saha Ekibi Yolda</option>
                  <option value="İşlem Yapılıyor">İşlem Yapılıyor</option>
                  <option value="İş Bitti / Tamamlandı">İş Bitti / Tamamlandı</option>
                </select>
              </div>

            </div>

            {/* Field Role Notice Banner */}
            {role === 'field' && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
                <UserCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span><strong>Saha Elemanı Modu Açık:</strong> Kolay navigasyon, müşteri arama, iş durumu güncelleme ve öncesi/sonrası fotoğraf yükleme modları aktiftir.</span>
              </div>
            )}

            {/* Jobs Cards Container */}
            {filteredJobs.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Kayıtlı iş bulunamadı.</p>
                <p className="text-xs text-slate-400 mt-1">Arama kriterlerinizi değiştirebilir veya yeni iş kaydı ekleyebilirsiniz.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredJobs.map((job) => {
                  const isDone = job.status === 'İş Bitti / Tamamlandı';
                  return (
                    <div 
                      key={job.id} 
                      className={`bg-white rounded-xl border transition-all duration-200 shadow-sm overflow-hidden ${
                        isDone ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Card Top Header */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base font-bold text-slate-900">{job.customerName}</h3>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                              job.paymentStatus === 'Ödendi' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : job.paymentStatus === 'Kapora Alındı'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {job.paymentStatus}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1">
                            <Calendar className="w-3 h-3 inline" />
                            <span>Tarih: {job.date}</span>
                          </p>
                        </div>

                        {/* Status Select / Badge */}
                        <div className="flex items-center space-x-2">
                          <select
                            value={job.status}
                            onChange={(e) => handleStatusChange(job.id, e.target.value)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border focus:outline-none transition-colors cursor-pointer ${
                              isDone 
                                ? 'bg-emerald-600 text-white border-emerald-600' 
                                : job.status === 'İşlem Yapılıyor'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : job.status === 'Saha Ekibi Yolda'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            <option value="Sırada / Randevu">⏳ Sırada / Randevu</option>
                            <option value="Saha Ekibi Yolda">🚗 Saha Ekibi Yolda</option>
                            <option value="İşlem Yapılıyor">🧼 İşlem Yapılıyor</option>
                            <option value="İş Bitti / Tamamlandı">✅ İş Bitti / Tamamlandı</option>
                          </select>
                        </div>
                      </div>

                      {/* Card Body Info */}
                      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Address & Quick Actions */}
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2 text-sm text-slate-600">
                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            <span className="leading-snug">{job.address}</span>
                          </div>

                          {/* Quick Navigation & Phone buttons */}
                          <div className="flex items-center space-x-2 pt-2">
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 font-medium transition-colors"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Haritada Aç</span>
                            </a>

                            <a
                              href={`tel:${job.phone}`}
                              className="inline-flex items-center space-x-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Ara ({job.phone})</span>
                            </a>
                          </div>

                          {/* Customer / Field Note */}
                          {job.note && (
                            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs text-amber-900 mt-2">
                              <strong>Müşteri / Saha Notu:</strong> {job.note}
                            </div>
                          )}
                        </div>

                        {/* Services List & Price Summary */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-between">
                          <div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                              Hizmet Kalemleri
                            </span>
                            <ul className="text-xs space-y-1 text-slate-700">
                              {job.items?.map((item, idx) => (
                                <li key={idx} className="flex justify-between border-b border-slate-200/50 pb-1">
                                  <span>{item.name} x{item.quantity}</span>
                                  <span className="font-semibold">{item.total} TL</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Total Breakdown */}
                          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                            <span className="text-slate-500">Kapora: <strong className="text-slate-700">{job.deposit || 0} TL</strong></span>
                            <span className="text-sm font-bold text-slate-900">
                              Toplam: <span className="text-emerald-600">{job.totalAmount} TL</span>
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Card Footer Actions */}
                      <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        
                        {/* Photos Action */}
                        <button
                          onClick={() => setSelectedJobForPhotos(job)}
                          className="inline-flex items-center space-x-1.5 text-xs bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          <Camera className="w-3.5 h-3.5 text-slate-500" />
                          <span>Öncesi / Sonrası Fotoğraf ({job.beforePhoto ? '1' : '0'}/1)</span>
                        </button>

                        <div className="flex items-center space-x-2">
                          
                          {/* Send WhatsApp Button */}
                          <button
                            onClick={() => sendWhatsAppMessage(job)}
                            className="inline-flex items-center space-x-1.5 text-xs bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg shadow-sm font-medium transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp Bilgi</span>
                          </button>

                          {/* Receipt Modal Open */}
                          <button
                            onClick={() => setSelectedJobForReceipt(job)}
                            className="inline-flex items-center space-x-1.5 text-xs bg-slate-800 text-white hover:bg-slate-900 px-3 py-1.5 rounded-lg shadow-sm font-medium transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Servis Fişi</span>
                          </button>

                          {/* Admin Only Delete/Edit */}
                          {role === 'admin' && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingJob(job);
                                  setFormData({
                                    customerName: job.customerName,
                                    phone: job.phone,
                                    address: job.address,
                                    note: job.note,
                                    selectedServices: job.items,
                                    deposit: job.deposit,
                                    status: job.status,
                                    date: job.date
                                  });
                                  setActiveTab('new_job');
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-200 transition-colors"
                                title="Düzenle"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200 transition-colors"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: YENİ İŞ / MÜŞTERİ KAYDI (ADMIN ONLY)            */}
        {/* ======================================================== */}
        {activeTab === 'new_job' && role === 'admin' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 max-w-3xl mx-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              <span>{editingJob ? 'İş Kaydını Düzenle' : 'Yeni Müşteri & İş Kaydı Oluştur'}</span>
            </h2>

            <form onSubmit={handleSaveJob} className="space-y-5">
              
              {/* Customer Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Müşteri Adı Soyadı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Mehmet Öz"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telefon Numarası *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Örn: 05321234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Açık Adres</label>
                <textarea
                  rows={2}
                  placeholder="İlçe, Mahalle, Cadde, Sokak, Bina No, Daire..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Service Selection Catalog Picker */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Hizmet Kataloğundan Seçin
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {services.map(s => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => handleAddServiceToForm(s.id)}
                      className="text-left bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 p-2.5 rounded-lg text-xs transition-colors shadow-sm"
                    >
                      <div className="font-semibold text-slate-800">{s.name}</div>
                      <div className="text-emerald-600 font-bold mt-0.5">{s.price} TL / {s.unit}</div>
                    </button>
                  ))}
                </div>

                {/* Selected Services Table */}
                <span className="block text-xs font-semibold text-slate-700 mb-2">Seçilen Hizmetler:</span>
                {formData.selectedServices.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Henüz hizmet seçilmedi.</p>
                ) : (
                  <div className="space-y-2">
                    {formData.selectedServices.map(item => (
                      <div key={item.id} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 w-1/3">{item.name}</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateServiceQuantity(item.id, e.target.value)}
                            className="w-16 p-1 border border-slate-300 rounded text-center text-xs"
                          />
                          <span className="text-slate-500">{item.unit}</span>
                        </div>
                        <span className="font-bold text-slate-900 w-20 text-right">{item.total} TL</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveServiceFromForm(item.id)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment & Job Status Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kapora / Ödenen (TL)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Başlangıç Durumu</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Sırada / Randevu">Sırada / Randevu</option>
                    <option value="Saha Ekibi Yolda">Saha Ekibi Yolda</option>
                    <option value="İşlem Yapılıyor">İşlem Yapılıyor</option>
                    <option value="İş Bitti / Tamamlandı">İş Bitti / Tamamlandı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Randevu Tarihi</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Field Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Saha Notu / Müşteri İsteği</label>
                <input
                  type="text"
                  placeholder="Örn: Koltuklarda özel leke var, hassas şampuan kullanılacak"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Total Calculation Display */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Hesaplanan Toplam Tutar</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {calculateJobTotal(formData.selectedServices)} TL
                  </span>
                </div>
                <div className="text-right text-xs text-slate-300">
                  Kalan Alacak: <span className="font-bold text-white">{calculateJobTotal(formData.selectedServices) - (formData.deposit || 0)} TL</span>
                </div>
              </div>

              {/* Action Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('jobs')}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md transition-colors"
                >
                  {editingJob ? 'Güncelle' : 'Kaydet ve Listeye Ekle'}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: 6 AY PERİYODİK HATIRLATICI (ADMIN ONLY)          */}
        {/* ======================================================== */}
        {activeTab === 'reminders' && role === 'admin' && (
          <div className="space-y-4">
            
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start space-x-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">Periyodik Temizlik Hatırlatıcı Akıllı Algoritması</h3>
                <p className="text-xs text-amber-800 mt-1">
                  Temizliği tamamlanmasının üzerinden 6 ay geçen müşterileriniz otomatik olarak burada listelenir.
                  Tek tıkla "Hatırlatma Mesajı Gönder" butonuna basarak tekrar müşteri kazanımı sağlayabilirsiniz.
                </p>
              </div>
            </div>

            {periodicReminders.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <p className="text-slate-700 font-medium text-sm">Harika! Şu an hatırlatma yapılması gereken periyodu dolmuş müşteri bulunmuyor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {periodicReminders.map(job => (
                  <div key={job.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900">{job.customerName}</h4>
                        <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-semibold">
                          6+ Ay Geçti
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-1"><MapPin className="w-3 h-3 inline mr-1" />{job.address}</p>
                      <p className="text-xs text-slate-500 mb-3"><Phone className="w-3 h-3 inline mr-1" />{job.phone}</p>
                      
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700 mb-3">
                        <strong>Son Yaptırdığı Hizmetler:</strong>
                        <ul className="mt-1 list-disc list-inside space-y-0.5">
                          {job.items.map((i, idx) => <li key={idx}>{i.name}</li>)}
                        </ul>
                      </div>
                    </div>

                    <button
                      onClick={() => sendWhatsAppMessage(job, true)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Hatırlatma Mesajı Gönder (WhatsApp)</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: CİRO & GELİR / GİDER RAPORU (ADMIN ONLY)        */}
        {/* ======================================================== */}
        {activeTab === 'finance' && role === 'admin' && (
          <div className="space-y-6">
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-medium block">Toplam Ciro (Tüm İşler)</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">{financialStats.totalRevenue} TL</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs text-emerald-600 font-medium block">Tahsil Edilen (Kasa)</span>
                <span className="text-xl font-bold text-emerald-600 mt-1 block">{financialStats.collectedRevenue} TL</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs text-amber-600 font-medium block">Toplam Giderler</span>
                <span className="text-xl font-bold text-amber-600 mt-1 block">{financialStats.totalExpenses} TL</span>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl shadow-md text-white">
                <span className="text-xs text-emerald-400 font-medium block">Net Kâr</span>
                <span className="text-xl font-bold text-white mt-1 block">{financialStats.netProfit} TL</span>
              </div>

            </div>

            {/* Expenses Management Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Add Expense Form */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
                <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Yeni Gider Ekle</span>
                </h3>

                <form onSubmit={handleAddExpense} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gider Açıklaması</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: 20L Şampuan"
                      value={newExpense.title}
                      onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tutar (TL)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Örn: 850"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                    <select
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Malzeme">Temizlik Malzemesi</option>
                      <option value="Yakıt">Arac Yakıtı</option>
                      <option value="Personel">Personel Gideri</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors mt-2"
                  >
                    Gideri Kaydet
                  </button>
                </form>
              </div>

              {/* Expense List Table */}
              <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
                  Gider Geçmişi
                </h3>

                {expenses.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">Kayıtlı gider bulunmuyor.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Açıklama</th>
                          <th className="p-2">Kategori</th>
                          <th className="p-2">Tarih</th>
                          <th className="p-2 text-right">Tutar</th>
                          <th className="p-2 text-center">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {expenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-slate-50">
                            <td className="p-2 font-medium text-slate-800">{exp.title}</td>
                            <td className="p-2 text-slate-500">{exp.category}</td>
                            <td className="p-2 text-slate-400">{exp.date}</td>
                            <td className="p-2 font-bold text-red-600 text-right">{exp.amount} TL</td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="text-slate-400 hover:text-red-500 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL 1: BEFORE / AFTER PHOTOS MODAL                     */}
      {/* ======================================================== */}
      {selectedJobForPhotos && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl relative space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <span>Temizlik Öncesi & Sonrası Fotoğraflar</span>
              </h3>
              <button
                onClick={() => setSelectedJobForPhotos(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">Müşteri: <strong>{selectedJobForPhotos.customerName}</strong></p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Before Photo Box */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">Temizlik ÖNCESİ</span>
                {selectedJobForPhotos.beforePhoto ? (
                  <div className="relative group rounded-lg overflow-hidden border border-slate-200 h-36 bg-slate-100">
                    <img
                      src={selectedJobForPhotos.beforePhoto}
                      alt="Öncesi"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors p-2 text-center">
                    <Camera className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-500">Fotoğraf Çek / Yükle</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, selectedJobForPhotos.id, 'before')}
                    />
                  </label>
                )}
              </div>

              {/* After Photo Box */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">Temizlik SONRASI</span>
                {selectedJobForPhotos.afterPhoto ? (
                  <div className="relative group rounded-lg overflow-hidden border border-slate-200 h-36 bg-slate-100">
                    <img
                      src={selectedJobForPhotos.afterPhoto}
                      alt="Sonrası"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors p-2 text-center">
                    <Camera className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-500">Fotoğraf Çek / Yükle</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, selectedJobForPhotos.id, 'after')}
                    />
                  </label>
                )}
              </div>

            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedJobForPhotos(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: PRINTABLE DIGITAL SERVICE RECEIPT (DİJİTAL FİŞ) */}
      {/* ======================================================== */}
      {selectedJobForReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
            
            {/* Header controls (not printed) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Resmi Dijital Servis Fişi
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır / PDF İndir</span>
                </button>
                <button
                  onClick={() => setSelectedJobForReceipt(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE RECEIPT CONTAINER */}
            <div className="p-4 border border-slate-200 rounded-xl space-y-4 text-slate-800 bg-white" id="printable-receipt">
              
              {/* Receipt Header Banner */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-wider">PEVUNO SOLUTION</h2>
                  <p className="text-xs font-semibold text-emerald-600">PROFESYONEL TEMİZLİK HİZMETLERİ</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Tel: 0532 000 00 00 | Web: www.pevunosolution.com</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold bg-slate-100 px-2.5 py-1 rounded border border-slate-200 block">
                    FİŞ NO: #{selectedJobForReceipt.id.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Tarih: {selectedJobForReceipt.date}</span>
                </div>
              </div>

              {/* Customer Info Box */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Müşteri Bilgileri</span>
                  <span className="font-bold text-slate-900 block">{selectedJobForReceipt.customerName}</span>
                  <span className="text-slate-600 block">{selectedJobForReceipt.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Hizmet Adresi</span>
                  <span className="text-slate-700 block leading-tight">{selectedJobForReceipt.address}</span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="p-2 rounded-l">Hizmet / Ürün</th>
                      <th className="p-2 text-center">Miktar</th>
                      <th className="p-2 text-right">Birim Fiyat</th>
                      <th className="p-2 text-right rounded-r">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedJobForReceipt.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium text-slate-800">{item.name}</td>
                        <td className="p-2 text-center">{item.quantity} {item.unit}</td>
                        <td className="p-2 text-right">{item.price} TL</td>
                        <td className="p-2 text-right font-bold">{item.total} TL</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Receipt Summary Breakdown */}
              <div className="border-t border-slate-200 pt-3 flex justify-between items-end text-xs">
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-500">Ödeme Durumu: <strong className="text-slate-800">{selectedJobForReceipt.paymentStatus}</strong></p>
                  {selectedJobForReceipt.note && (
                    <p className="text-[10px] text-slate-500 bg-amber-50 p-1.5 rounded border border-amber-100">
                      Not: {selectedJobForReceipt.note}
                    </p>
                  )}
                </div>

                <div className="text-right space-y-1">
                  <div className="text-slate-500">Genel Toplam: <span className="font-bold text-slate-900">{selectedJobForReceipt.totalAmount} TL</span></div>
                  <div className="text-slate-500">Ödenen / Kapora: <span className="font-bold text-emerald-600">{selectedJobForReceipt.deposit || 0} TL</span></div>
                  <div className="text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                    Kalan Bakiye: {selectedJobForReceipt.totalAmount - (selectedJobForReceipt.deposit || 0)} TL
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-4 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-400 space-y-1">
                <p>Pevuno Solution Hijyen Garantisi ile Yıkanmıştır.</p>
                <p className="font-medium text-slate-500">Görüşleriniz Bizim İçin Değerlidir: {GOOGLE_REVIEW_LINK}</p>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
