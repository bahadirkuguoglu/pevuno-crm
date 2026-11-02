import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, ShoppingBag, PlusCircle, Calendar, RefreshCw, 
  TrendingUp, CheckCircle2, Clock, MapPin, Phone, 
  MessageSquare, DollarSign, Edit3, Trash2, Search, Download,
  FileText, Star, Settings, Percent, Tag, LogOut, ChevronRight, Lock, ShieldCheck, UserPlus, Cloud, BookOpen, Send, UserCheck, LayoutDashboard, UserCheck2, Navigation, Building2
} from 'lucide-react';

const SUPABASE_URL = "https://esmmpztgmkeuyhzubbaf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0cmF0dXMtZXNtbXB6dGdta2V1eWh6dWJiYWYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc5MzA4MTYyNiwiZXhwIjoyMTA4NjU3NjI2fQ.G_GvzaWPl7i4DR9Yo-j3Kuk2ykq5_h5hGDROmB7zBNc";

const fetchWithTimeout = async (url, options = {}, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (error) {
    clearTimeout(timer);
    if (error.name === 'AbortError') {
      throw new Error('Bağlantı zaman aşımına uğradı. Lütfen internetinizi kontrol edin.');
    }
    throw error;
  }
};

async function fetchSupabaseData(key, defaultVal) {
  try {
    const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/app_data?key=eq.${key}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Cache-Control': 'no-cache'
      }
    });
    const data = await res.json();
    if (data && data.length > 0 && data[0].value !== undefined) return data[0].value;
    return defaultVal;
  } catch (err) {
    console.error("Supabase okuma hatası:", err);
    return defaultVal;
  }
}

async function saveSupabaseData(key, value) {
  try {
    await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/app_data?key=eq.${key}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/app_data`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ key, value })
    });
  } catch (err) {
    console.error("Supabase kaydetme hatası:", err);
  }
}

const DEFAULT_SERVICES = [
  { id: '1', name: 'Koltuk Yıkama (Standart)', price: 1200, unit: 'adet', durationMinutes: 45 },
  { id: '2', name: 'L Koltuk Yıkama', price: 1500, unit: 'adet', durationMinutes: 60 },
  { id: '3', name: 'Yatak Yıkama (Çift Kişilik)', price: 900, unit: 'adet', durationMinutes: 40 },
  { id: '4', name: 'Halı Yıkama', price: 120, unit: 'm²', durationMinutes: 30 },
  { id: '5', name: 'Stor Perde Yıkama', price: 150, unit: 'm²', durationMinutes: 20 },
  { id: '6', name: 'Sandalye Yıkama', price: 150, unit: 'adet', durationMinutes: 15 },
];

const DEFAULT_KVKK_TEMPLATE = `Merhaba *[Müşteri Adı]* (ID: *[Müşteri No]*),
Evinizde/iş yerinizde hijyeni her zaman en üst düzeyde tutabilmeniz için, son profesyonel temizliğinizin üzerinden geçecek olan *6 aylık periyotlarda size özel hatırlatma yapmamızı ve randevu oluşturmamızı ister misiniz?* 🧼✨
Periyodik hatırlatmaların yapılabilmesi ve KVKK kapsamındaki bilgilendirmeyi kabul ediyorsanız, bu mesaja hemen *"ONAYLIYORUM"* yazarak yanıt verebilirsiniz.
Sağlıklı ve hijyenik günler dileriz.
Pevuno Solution`;

const DEFAULT_REMINDER_TEMPLATE = `Merhaba *[Müşteri Adı]* (ID: *[Müşteri No]*),
Pevuno Solution ailesi olarak son profesyonel temizlik hizmetimizin üzerinden yaklaşık 6 ay geçtiğini fark ettik. Evinizde/iş yerinizde hijyeni tazelemek ve periyodik bakım randevusu oluşturmak ister misiniz? 🧼✨
Sağlıklı günler dileriz!`;

const DEFAULT_APPOINTMENT_TEMPLATE = `Merhaba *[Müşteri Adı]*,\n\n✨ *PEVUNO SOLUTION* profesyonel temizlik randevunuz başarıyla oluşturulmuştur! 🧼\n📋 *İş No:* [İş No]\n📅 *Tarih / Saat:* [Tarih] - [Saat]\n📍 *Adres:* [Adres]\n👷 *Görevli Ekip:* [Ekip]\n\n💳 *Toplam Tutar:* [Tutar] TL\n\nBelirtilen saatte görüşmek üzere iyi günler dileriz! 🌿`;

const DEFAULT_ON_THE_WAY_TEMPLATE = `Merhaba *[Müşteri Adı]*,\n\n🚗 *PEVUNO SOLUTION* ekibimiz (*[Ekip]*) adresinize doğru yola çıkmıştır.\n📋 *İş No:* [İş No]\n📍 *Adres:* [Adres]\n\nGörüşmek üzere! 🧼✨`;

const DEFAULT_COMPLETION_TEMPLATE = `Merhaba *[Müşteri Adı]*,\n\n✨ *PEVUNO SOLUTION* profesyonel temizlik hizmetimiz tamamlanmıştır.\n📋 *İş No:* [İş No]\n👷 Ekibimiz: *[Ekip]*\n💳 *Toplam Tutar:* [Tutar] TL\n💵 *Ödeme:* [Ödeme Türü]\n\nTeşekkür ederiz! 🧼🚿`;

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('pevuno_logged_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [isSynced, setIsSynced] = useState(false);
  const receiptRef = useRef(null);

  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem('pevuno_services');
    return saved ? JSON.parse(saved) : DEFAULT_SERVICES;
  });
  const [workers, setWorkers] = useState(() => {
    const saved = localStorage.getItem('pevuno_workers');
    return saved ? JSON.parse(saved) : [
      { id: 'admin-1', username: 'bahadir', name: 'Bahadır', pin: '1453', role: 'admin', phone: '' }
    ];
  });
  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem('pevuno_jobs');
    return saved ? JSON.parse(saved) : [];
  });
  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('pevuno_customers');
    return saved ? JSON.parse(saved) : [];
  });
  const [companies, setCompanies] = useState(() => {
    const saved = localStorage.getItem('pevuno_companies');
    return saved ? JSON.parse(saved) : [];
  });

  // Şablon State'leri
  const [kvkkTemplate, setKvkkTemplate] = useState(() => localStorage.getItem('pevuno_kvkk') || DEFAULT_KVKK_TEMPLATE);
  const [tempKvkkInput, setTempKvkkInput] = useState(kvkkTemplate);

  const [reminderTemplate, setReminderTemplate] = useState(() => localStorage.getItem('pevuno_reminder_template') || DEFAULT_REMINDER_TEMPLATE);
  const [tempReminderInput, setTempReminderInput] = useState(reminderTemplate);

  const [appointmentTemplate, setAppointmentTemplate] = useState(() => localStorage.getItem('pevuno_app_template') || DEFAULT_APPOINTMENT_TEMPLATE);
  const [tempAppointmentInput, setTempAppointmentInput] = useState(appointmentTemplate);

  const [onTheWayTemplate, setOnTheWayTemplate] = useState(() => localStorage.getItem('pevuno_ontheway_template') || DEFAULT_ON_THE_WAY_TEMPLATE);
  const [tempOnTheWayInput, setTempOnTheWayInput] = useState(onTheWayTemplate);

  const [completionTemplate, setCompletionTemplate] = useState(() => localStorage.getItem('pevuno_completion_template') || DEFAULT_COMPLETION_TEMPLATE);
  const [tempCompletionInput, setTempCompletionInput] = useState(completionTemplate);

  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  const syncWithCloud = async () => {
    setIsSynced(false);
    try {
      const cloudServices = await fetchSupabaseData('services', null);
      if (cloudServices && Array.isArray(cloudServices)) { setServices(cloudServices); localStorage.setItem('pevuno_services', JSON.stringify(cloudServices)); }
      const cloudWorkers = await fetchSupabaseData('workers', null);
      if (cloudWorkers && Array.isArray(cloudWorkers)) { setWorkers(cloudWorkers); localStorage.setItem('pevuno_workers', JSON.stringify(cloudWorkers)); }
      const cloudJobs = await fetchSupabaseData('jobs', null);
      if (cloudJobs && Array.isArray(cloudJobs)) { setJobs(cloudJobs); localStorage.setItem('pevuno_jobs', JSON.stringify(cloudJobs)); }
      const cloudCustomers = await fetchSupabaseData('customers', null);
      if (cloudCustomers && Array.isArray(cloudCustomers)) { setCustomers(cloudCustomers); localStorage.setItem('pevuno_customers', JSON.stringify(cloudCustomers)); }
      const cloudCompanies = await fetchSupabaseData('companies', null);
      if (cloudCompanies && Array.isArray(cloudCompanies)) { setCompanies(cloudCompanies); localStorage.setItem('pevuno_companies', JSON.stringify(cloudCompanies)); }
      
      const cloudKvkk = await fetchSupabaseData('kvkk_template', null);
      if (cloudKvkk) { setKvkkTemplate(cloudKvkk); setTempKvkkInput(cloudKvkk); localStorage.setItem('pevuno_kvkk', cloudKvkk); }
      const cloudRem = await fetchSupabaseData('reminder_template', null);
      if (cloudRem) { setReminderTemplate(cloudRem); setTempReminderInput(cloudRem); localStorage.setItem('pevuno_reminder_template', cloudRem); }
      const cloudApp = await fetchSupabaseData('appointment_template', null);
      if (cloudApp) { setAppointmentTemplate(cloudApp); setTempAppointmentInput(cloudApp); localStorage.setItem('pevuno_app_template', cloudApp); }
      const cloudOTW = await fetchSupabaseData('ontheway_template', null);
      if (cloudOTW) { setOnTheWayTemplate(cloudOTW); setTempOnTheWayInput(cloudOTW); localStorage.setItem('pevuno_ontheway_template', cloudOTW); }
      const cloudComp = await fetchSupabaseData('completion_template', null);
      if (cloudComp) { setCompletionTemplate(cloudComp); setTempCompletionInput(cloudComp); localStorage.setItem('pevuno_completion_template', cloudComp); }
    } catch (err) {
      console.error("Senkronizasyon hatası:", err);
    }
    setIsSynced(true);
  };

  useEffect(() => {
    syncWithCloud();
    window.addEventListener('focus', syncWithCloud);
    return () => window.removeEventListener('focus', syncWithCloud);
  }, []);

  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newAddressType, setNewAddressType] = useState('ev');
  const [newNote, setNewNote] = useState('');
  const [kvkkChecked, setKvkkChecked] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // Hızlı Ekleme Formu
  const [addMode, setAddMode] = useState('bireysel');
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickAddressOrTaxOffice, setQuickAddressOrTaxOffice] = useState('');
  const [quickExtraOrTaxNo, setQuickExtraOrTaxNo] = useState('');
  const [quickFullAddress, setQuickFullAddress] = useState('');

  const [selectedItems, setSelectedItems] = useState([]);
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Elden');
  const [jobDate, setJobDate] = useState(new Date().toISOString().split('T')[0]);
  const [jobTime, setJobTime] = useState('10:00');
  
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  
  const [newWorkerUsername, setNewWorkerUsername] = useState('');
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPin, setNewWorkerPin] = useState('');
  const [newWorkerRole, setNewWorkerRole] = useState('worker');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');

  const [newService, setNewService] = useState({ name: '', price: '', unit: 'adet', durationMinutes: 30 });
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [selectedJobForReceipt, setSelectedJobForReceipt] = useState(null);

  useEffect(() => { localStorage.setItem('pevuno_logged_user', JSON.stringify(currentUser)); }, [currentUser]);

  const commitChange = async (key, newValue, setter, storageKey) => {
    setter(newValue);
    localStorage.setItem(storageKey, JSON.stringify(newValue));
    await saveSupabaseData(key, newValue);
  };

  const updateServices = (newServ) => commitChange('services', newServ, setServices, 'pevuno_services');
  const updateWorkers = (newWork) => commitChange('workers', newWork, setWorkers, 'pevuno_workers');
  const updateJobs = (newJbs) => commitChange('jobs', newJbs, setJobs, 'pevuno_jobs');
  const updateCustomers = (newCust) => commitChange('customers', newCust, setCustomers, 'pevuno_customers');
  const updateCompanies = (newComp) => commitChange('companies', newComp, setCompanies, 'pevuno_companies');

  const handleSaveTemplates = async (e, type) => {
    e.preventDefault();
    if (type === 'kvkk') { setKvkkTemplate(tempKvkkInput); localStorage.setItem('pevuno_kvkk', tempKvkkInput); await saveSupabaseData('kvkk_template', tempKvkkInput); }
    if (type === 'reminder') { setReminderTemplate(tempReminderInput); localStorage.setItem('pevuno_reminder_template', tempReminderInput); await saveSupabaseData('reminder_template', tempReminderInput); }
    if (type === 'appointment') { setAppointmentTemplate(tempAppointmentInput); localStorage.setItem('pevuno_app_template', tempAppointmentInput); await saveSupabaseData('appointment_template', tempAppointmentInput); }
    if (type === 'ontheway') { setOnTheWayTemplate(tempOnTheWayInput); localStorage.setItem('pevuno_ontheway_template', tempOnTheWayInput); await saveSupabaseData('ontheway_template', tempOnTheWayInput); }
    if (type === 'completion') { setCompletionTemplate(tempCompletionInput); localStorage.setItem('pevuno_completion_template', tempCompletionInput); await saveSupabaseData('completion_template', tempCompletionInput); }
    alert('Şablon başarıyla güncellendi ve kaydedildi!');
  };

  const formatWorkerNameMasked = (workerList) => {
    if (!workerList || workerList.length === 0) return 'Ekip';
    return workerList.map(w => {
      const parts = w.trim().split(' ');
      if (parts.length < 2) return w;
      return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
    }).join(', ');
  };

  const getDaysSinceLastJob = (lastJobDate) => {
    if (!lastJobDate || lastJobDate === 'Yeni' || lastJobDate === 'Yeni Eklenen') return null; // Yeni eklenenler asla 180 günü doldurmuş sayılmaz
    const lastDate = new Date(lastJobDate);
    if (isNaN(lastDate.getTime())) return null;
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const subtotal = selectedItems.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
  const totalDuration = selectedItems.reduce((acc, item) => acc + (item.qty * (item.durationMinutes || 30)), 0);

  const calculateDiscount = () => {
    if (discountType === 'amount') return Number(discountValue) || 0;
    if (discountType === 'percent') return (subtotal * (Number(discountValue) || 0)) / 100;
    return 0;
  };
  const calculatedDiscount = calculateDiscount();
  const finalTotal = Math.max(0, subtotal - calculatedDiscount);

  const handleLogin = (e) => {
    e.preventDefault();
    const inputUser = loginUsername.trim().toLowerCase();
    const inputPass = loginPassword.trim();
    const matchedUser = workers.find(w => 
      (w.username && w.username.trim().toLowerCase() === inputUser) ||
      (w.name && w.name.trim().toLowerCase() === inputUser)
    );

    if (matchedUser && matchedUser.pin === inputPass) {
      const cleanName = matchedUser.name.replace(/\s*\(Yönetici\)/gi, '').replace(/\s*\(Personel\)/gi, '').trim();
      setCurrentUser({ role: matchedUser.role || 'worker', name: cleanName, username: matchedUser.username });
      setActiveTab(matchedUser.role === 'admin' ? 'dashboard' : 'worker-dashboard');
    } else {
      alert('Hatalı Kullanıcı Adı veya Şifre!');
    }
  };

  const handleAddWorker = (e) => {
    e.preventDefault();
    if (!newWorkerName || !newWorkerPin || !newWorkerUsername) {
      alert('Lütfen kullanıcı adı, ad soyad ve şifre giriniz.');
      return;
    }
    const cleanUser = newWorkerUsername.trim().toLowerCase();
    if (workers.some(w => w.username?.toLowerCase() === cleanUser)) {
      alert('Bu kullanıcı adı zaten kullanılıyor!');
      return;
    }
    const cleanName = newWorkerName.replace(/\s*\(Yönetici\)/gi, '').replace(/\s*\(Personel\)/gi, '').trim();
    const newWObj = { id: `usr-${Date.now()}`, username: cleanUser, name: cleanName, pin: newWorkerPin, role: newWorkerRole, phone: newWorkerPhone };
    updateWorkers([...workers, newWObj]);
    setNewWorkerUsername(''); setNewWorkerName(''); setNewWorkerPin(''); setNewWorkerPhone('');
    alert('Kullanıcı başarıyla eklendi!');
  };

  const handleDeleteWorker = (workerId) => {
    if (workers.length <= 1) { alert('Sistemdeki tek kullanıcıyı silemezsiniz.'); return; }
    if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      updateWorkers(workers.filter(w => w.id !== workerId));
    }
  };

  const handleQuickAddEntity = (e) => {
    e.preventDefault();
    if (!quickName || !quickPhone) { alert('İsim ve telefon zorunludur.'); return; }
    if (addMode === 'bireysel') {
      const newCustObj = {
        id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
        name: quickName,
        phone: quickPhone,
        address: quickAddressOrTaxOffice || 'Belirtilmedi',
        addressType: quickExtraOrTaxNo || 'ev',
        kvkk: false,
        lastJobDate: 'Yeni Eklenen'
      };
      updateCustomers([...customers, newCustObj]);
      alert('Bireysel müşteri başarıyla eklendi!');
    } else {
      const newCompObj = {
        id: `COMP-${Math.floor(100 + Math.random() * 900)}`,
        name: quickName,
        phone: quickPhone,
        taxOffice: quickAddressOrTaxOffice || '-',
        taxNumber: quickExtraOrTaxNo || '-',
        address: quickFullAddress || '',
        lastJobDate: 'Yeni Eklenen'
      };
      updateCompanies([...companies, newCompObj]);
      alert('Kurumsal firma başarıyla eklendi!');
    }
    setQuickName(''); setQuickPhone(''); setQuickAddressOrTaxOffice(''); setQuickExtraOrTaxNo(''); setQuickFullAddress('');
  };

  const handleDeleteCustomer = (custId) => {
    if (confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) {
      updateCustomers(customers.filter(c => c.id !== custId));
    }
  };

  const handleDeleteCompany = (compId) => {
    if (confirm('Bu firmayı silmek istediğinize emin misiniz?')) {
      updateCompanies(companies.filter(c => c.id !== compId));
    }
  };

  const handleAddOrUpdateService = (e) => {
    e.preventDefault();
    if (!newService.name || !newService.price) return;
    const duration = Number(newService.durationMinutes) || 30;
    if (editingServiceId) {
      updateServices(services.map(s => s.id === editingServiceId ? { ...s, name: newService.name, price: Number(newService.price), unit: newService.unit, durationMinutes: duration } : s));
      setEditingServiceId(null);
    } else {
      updateServices([...services, { id: Date.now().toString(), name: newService.name, price: Number(newService.price), unit: newService.unit, durationMinutes: duration }]);
    }
    setNewService({ name: '', price: '', unit: 'adet', durationMinutes: 30 });
  };

  const handleCreateJob = (e) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone || selectedItems.length === 0 || !newAddress) {
      alert('Lütfen müşteri adı, telefon, adres ve en az 1 hizmet seçiniz.');
      return;
    }

    const matchedCust = customers.find(c => c.phone === newCustomerPhone);
    const customerId = matchedCust ? matchedCust.id : `CUST-${Math.floor(100 + Math.random() * 900)}`;

    const chemFund = finalTotal * 0.10;
    const amortFund = finalTotal * 0.10;
    const totalWorkerPool = finalTotal * 0.80;
    const workerCount = selectedWorkers.length > 0 ? selectedWorkers.length : 1;
    const perWorkerShare = totalWorkerPool / workerCount;

    const workerHakedisDetails = (selectedWorkers.length > 0 ? selectedWorkers : (workers[0] ? [workers[0].name] : ['Saha Ekibi'])).map(wName => ({
      workerName: wName,
      amount: Math.round(perWorkerShare * 100) / 100
    }));

    const newJobObj = {
      id: `JOB-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId,
      customerName: newCustomerName,
      phone: newCustomerPhone,
      address: `${newAddress} (${newAddressType.toUpperCase()})`,
      note: newNote,
      items: selectedItems,
      subtotal,
      estimatedDurationMinutes: totalDuration,
      discountType,
      discountValue: Number(discountValue) || 0,
      totalAmount: finalTotal,
      chemFund: Math.round(chemFund * 100) / 100,
      amortFund: Math.round(amortFund * 100) / 100,
      paidAmount: Number(paidAmount) || 0,
      paymentMethod,
      status: 'Sırada / Randevu',
      date: jobDate,
      time: jobTime,
      assignedWorkers: selectedWorkers.length > 0 ? selectedWorkers : (workers[0] ? [workers[0].name] : ['Saha Ekibi']),
      workerHakedisDetails: workerHakedisDetails,
      workerHakedis: Math.round(totalWorkerPool * 100) / 100,
      kvkkApproved: kvkkChecked,
      completedByWorker: false
    };

    updateJobs([newJobObj, ...jobs]);
    const existingCustIndex = customers.findIndex(c => c.phone === newCustomerPhone);
    let updatedCusts = [...customers];
    if (existingCustIndex > -1) {
      updatedCusts[existingCustIndex] = { ...updatedCusts[existingCustIndex], address: newAddress, addressType: newAddressType, lastJobDate: jobDate };
    } else {
      updatedCusts.push({ id: customerId, name: newCustomerName, phone: newCustomerPhone, address: newAddress, addressType: newAddressType, kvkk: false, lastJobDate: jobDate });
    }
    updateCustomers(updatedCusts);

    setNewCustomerName(''); setNewCustomerPhone(''); setNewAddress(''); setNewNote(''); setSelectedItems([]); setDiscountType('none'); setDiscountValue(0); setPaidAmount(0);
    setActiveTab('jobs');
  };

  const handleDeleteJob = (jobId) => {
    if (confirm('Bu iş kaydını silmek istediğinize emin misiniz?')) {
      updateJobs(jobs.filter(j => j.id !== jobId));
    }
  };

  const updateJobStatus = (jobId, newStatus) => {
    updateJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
  };

  const handleWorkerCompleteJob = (jobId, payMethod) => {
    updateJobs(jobs.map(j => j.id === jobId ? { 
      ...j, 
      status: 'Tamamlandı', 
      completedByWorker: true, 
      paymentMethod: payMethod,
      paidAmount: j.totalAmount 
    } : j));
    alert('İş tamamlandı ve ödeme kaydedildi!');
  };

  const isCompletedStatus = (status) => {
    if (!status) return false;
    const s = status.toString().trim().toLowerCase();
    return s === 'tamamlandı' || s === 'tamamlandi' || s === 'bitti' || s.includes('tamamlan');
  };

  const completedJobsList = jobs.filter(j => isCompletedStatus(j.status));
  const activeJobsList = jobs.filter(j => !isCompletedStatus(j.status));

  const downloadReceiptAsImage = () => {
    if (!receiptRef.current) return;
    if (!window.html2canvas) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = () => captureAndDownload();
      document.body.appendChild(script);
    } else {
      captureAndDownload();
    }
    function captureAndDownload() {
      window.html2canvas(receiptRef.current, { scale: 2 }).then(canvas => {
        const image = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.href = image;
        link.download = `Servis_Fisi_${selectedJobForReceipt?.customerName?.replace(/\s+/g, '_')}.jpg`;
        link.click();
      });
    }
  };

  const sendWhatsAppMessage = (type, data) => {
    let msg = '';
    const assignedText = formatWorkerNameMasked(data.assignedWorkers || ['Ekip']);
    const custId = data.customerId || 'CUST-000';
    const jobId = data.id || 'JOB-000';

    if (type === 'appointment') {
      msg = appointmentTemplate
        .replace(/\[Müşteri Adı\]/g, data.customerName)
        .replace(/\[Müşteri No\]/g, custId)
        .replace(/\[İş No\]/g, jobId)
        .replace(/\[Tarih\]/g, data.date)
        .replace(/\[Saat\]/g, data.time || '10:00')
        .replace(/\[Adres\]/g, data.address)
        .replace(/\[Ekip\]/g, assignedText)
        .replace(/\[Tutar\]/g, data.totalAmount);
    } else if (type === 'ontheway') {
      msg = onTheWayTemplate
        .replace(/\[Müşteri Adı\]/g, data.customerName)
        .replace(/\[Müşteri No\]/g, custId)
        .replace(/\[İş No\]/g, jobId)
        .replace(/\[Adres\]/g, data.address)
        .replace(/\[Ekip\]/g, assignedText);
    } else if (type === 'completion') {
      msg = completionTemplate
        .replace(/\[Müşteri Adı\]/g, data.customerName)
        .replace(/\[Müşteri No\]/g, custId)
        .replace(/\[İş No\]/g, jobId)
        .replace(/\[Ekip\]/g, assignedText)
        .replace(/\[Tutar\]/g, data.totalAmount)
        .replace(/\[Ödeme Türü\]/g, data.paymentMethod || 'Elden');
    } else if (type === 'kvkk') {
      msg = kvkkTemplate
        .replace(/\[Müşteri Adı\]/g, data.name)
        .replace(/\[Müşteri No\]/g, data.id || 'CUST-000');
    } else if (type === 'reminder') {
      msg = reminderTemplate
        .replace(/\[Müşteri Adı\]/g, data.name)
        .replace(/\[Müşteri No\]/g, data.id || 'CUST-000');
    }

    const encoded = encodeURIComponent(msg);
    const cleanPhone = (data.phone || '').replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `9${cleanPhone}` : cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
  };

  const totalCollected = jobs.reduce((acc, j) => acc + (Number(j.paidAmount) || 0), 0);
  const totalChemFund = jobs.reduce((acc, j) => acc + (j.chemFund || (j.totalAmount * 0.10)), 0);
  const totalAmortFund = jobs.reduce((acc, j) => acc + (j.amortFund || (j.totalAmount * 0.10)), 0);
  const totalHakedis = jobs.reduce((acc, j) => acc + (j.workerHakedis || (j.totalAmount * 0.80)), 0);
  const netProfit = totalCollected - totalChemFund - totalAmortFund - totalHakedis;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayJobsCount = jobs.filter(j => j.date === todayStr).length;

  // 180 günü geçen müşteriler (sadece işlem geçmişi olanlar ve 180 günü aşanlar)
  const reminderEligibleCustomers = customers.filter(c => {
    const days = getDaysSinceLastJob(c.lastJobDate);
    return days !== null && days >= 180;
  });

  const sortedJobsForUser = [...jobs]
    .filter(j => currentUser?.role === 'admin' || j.assignedWorkers?.includes(currentUser?.name))
    .sort((a, b) => new Date(`${a.date}T${a.time || '10:00'}`) - new Date(`${b.date}T${b.time || '10:00'}`));

  const getCleanDisplayName = (name) => {
    if (!name) return 'Kullanıcı';
    return name.replace(/\s*\(Yönetici\)/gi, '').replace(/\s*\(Personel\)/gi, '').trim();
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-wider">PEVUNO SOLUTION</h1>
            <p className="text-xs text-slate-500 font-medium">Saha & Yönetici Giriş Paneli</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Kullanıcı Adı</label>
              <input type="text" required placeholder="Örn: bahadir" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Şifre</label>
              <input type="password" required placeholder="Şifrenizi girin..." value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition">Sisteme Giriş Yap 🚀</button>
          </form>
        </div>
      </div>
    );
  }

  const cleanCurrentUserName = getCleanDisplayName(currentUser.name);
  const roleDisplay = currentUser.role === 'admin' ? 'Yönetici' : 'Personel';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight leading-tight">PEVUNO SOLUTION</h1>
              <p className="text-[11px] text-slate-400">Aktif Kullanıcı: <strong className="text-emerald-400">{cleanCurrentUserName} ({roleDisplay})</strong></p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button onClick={syncWithCloud} className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-1.5 rounded-xl font-medium flex items-center space-x-1 hover:bg-emerald-500/30 transition whitespace-nowrap">
              <Cloud className="w-3.5 h-3.5" />
              <span>{isSynced ? '🔄 Eşitle' : '⏳ Bekleyin'}</span>
            </button>
            <button onClick={() => setCurrentUser(null)} className="bg-slate-800 hover:bg-rose-900/40 text-slate-300 text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-1 transition">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-800 border-t border-slate-700 w-full overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 flex justify-start sm:justify-center space-x-2 text-sm py-1">
            {currentUser.role === 'admin' && (
              <>
                <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'dashboard' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard & Kasa</span>
                </button>
                <button onClick={() => setActiveTab('jobs')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'jobs' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Aktif İşler ({activeJobsList.length})</span>
                </button>
                <button onClick={() => setActiveTab('admin-completed')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'admin-completed' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tamamlanan İşler ({completedJobsList.length})</span>
                </button>
                <button onClick={() => setActiveTab('new-job')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'new-job' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <PlusCircle className="w-4 h-4" />
                  <span>Yeni İş Kaydı</span>
                </button>
                <button onClick={() => setActiveTab('customers')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'customers' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <BookOpen className="w-4 h-4" />
                  <span>Müşteriler & Firmalar</span>
                </button>
                <button onClick={() => setActiveTab('workers')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'workers' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <Users className="w-4 h-4" />
                  <span>Kullanıcılar & Şifreler</span>
                </button>
                <button onClick={() => setActiveTab('catalog')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'catalog' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <Settings className="w-4 h-4" />
                  <span>Fiyatlar & Süreler</span>
                </button>
                <button onClick={() => setActiveTab('reminders')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'reminders' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <RefreshCw className="w-4 h-4" />
                  <span>Hatırlatıcılar & Şablonlar ({reminderEligibleCustomers.length})</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && currentUser.role === 'admin' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-lg">
              <div>
                <h2 className="text-2xl font-black">Hoş Geldiniz, {cleanCurrentUserName} 👋</h2>
                <p className="text-xs text-slate-300 mt-1">Pevuno Solution Canlı Saha Operasyon ve Finansal Kasa Merkezi</p>
              </div>
              <button onClick={() => setActiveTab('new-job')} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg transition text-xs flex items-center space-x-1">
                <PlusCircle className="w-4 h-4" />
                <span>Hızlı İş Kaydı</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Tahsil Edilen</span>
                <div className="text-lg font-black text-emerald-600">{totalCollected} TL</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Kimyasal (%10)</span>
                <div className="text-lg font-black text-blue-600">{Math.round(totalChemFund)} TL</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Amortisman (%10)</span>
                <div className="text-lg font-black text-amber-600">{Math.round(totalAmortFund)} TL</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Personel Hakediş</span>
                <div className="text-lg font-black text-indigo-600">{Math.round(totalHakedis)} TL</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Net İşletme Kârı</span>
                <div className={`text-lg font-black ${netProfit >= 0 ? 'text-purple-600' : 'text-rose-600'}`}>{Math.round(netProfit)} TL</div>
              </div>
            </div>

            {/* Dashboard Sıradaki Aktif İşler Paneli */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span>Sıradaki Aktive Edilmiş İşler ({activeJobsList.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeJobsList.slice(0, 4).map((job, idx) => (
                  <div key={job.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>#{job.id} - {job.customerName}</span>
                      <span className="text-emerald-700">{job.date} | {job.time}</span>
                    </div>
                    <p className="text-slate-600">📍 {job.address}</p>
                    <p className="text-purple-700 font-bold">👷 Ekip: {formatWorkerNameMasked(job.assignedWorkers)} | Tutar: {job.totalAmount} TL</p>
                  </div>
                ))}
                {activeJobsList.length === 0 && (
                  <p className="text-xs text-slate-400">Şu an sırada bekleyen aktif iş bulunmuyor.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AKTİF İŞLER SEKMESİ */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow">
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-emerald-400" />
                <span>Aktif İşler & Rota Listesi (Kronolojik)</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedJobsForUser.filter(job => !isCompletedStatus(job.status)).map((job, index) => (
                <div key={job.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="bg-slate-900 text-emerald-400 font-extrabold text-xs px-2.5 py-1 rounded-lg">#{job.id} | SIRA: #{index + 1}</span>
                    <select value={job.status} onChange={(e) => updateJobStatus(job.id, e.target.value)} className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-slate-100 text-slate-700 cursor-pointer">
                      <option value="Sırada / Randevu">⏳ Sırada</option>
                      <option value="Yolda / Adreste">🚗 Yolda</option>
                      <option value="İşlem Yapılıyor">🧼 Temizlikte</option>
                      <option value="Tamamlandı">✅ Bitti</option>
                    </select>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900">{job.customerName} <span className="text-xs font-normal text-slate-500">(Müşteri No: {job.customerId})</span></h3>
                    <p className="text-slate-600 text-xs mt-1">📍 {job.address}</p>
                    <p className="text-xs text-emerald-700 font-bold mt-1">📅 {job.date} - Saat: {job.time || '10:00'}</p>
                  </div>
                  
                  {currentUser.role === 'admin' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => sendWhatsAppMessage('appointment', job)} className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs py-2 px-2 rounded-xl flex items-center justify-center space-x-1 shadow">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Randevu WP</span>
                      </button>
                      <button onClick={() => sendWhatsAppMessage('ontheway', job)} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-2 px-2 rounded-xl flex items-center justify-center space-x-1 shadow">
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Yola Çıkıldı WP</span>
                      </button>
                    </div>
                  )}

                  {currentUser.role === 'worker' && (
                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border">
                      <p className="text-xs font-bold text-slate-700">Ödeme Yöntemi Seçin & İşi Bitir:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleWorkerCompleteJob(job.id, 'Elden')} className="bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg">💵 Elden Aldım</button>
                        <button onClick={() => handleWorkerCompleteJob(job.id, 'IBAN')} className="bg-slate-800 text-white text-xs font-bold py-2 rounded-lg">🏦 IBAN</button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button onClick={() => sendWhatsAppMessage('completion', job)} className="bg-blue-600 text-white text-xs py-2 rounded-lg font-bold">Bitti Mesajı (WP)</button>
                    <button onClick={() => setSelectedJobForReceipt(job)} className="bg-slate-100 border text-slate-700 text-xs py-2 rounded-lg font-bold">Servis Fişi Görseli</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAMAMLANAN İŞLER SEKMESİ */}
        {activeTab === 'admin-completed' && currentUser.role === 'admin' && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow">
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Tamamlanan İşler Arşivi ({completedJobsList.length})</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedJobsList.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-200 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-lg">#{job.id} | TAMAMLANDI</span>
                    <button onClick={() => handleDeleteJob(job.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{job.customerName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">📍 {job.address}</p>
                    <p className="text-xs text-emerald-700 font-medium mt-1">👷 Ekip: {formatWorkerNameMasked(job.assignedWorkers)} | Ödeme: {job.paymentMethod}</p>
                  </div>
                  <div className="pt-2 border-t flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Tutar: {job.totalAmount} TL</span>
                    <button onClick={() => setSelectedJobForReceipt(job)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border">Servis Fişi</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* YENİ İŞ KAYDI SEKMESİ (Personel Hakediş ve Ödeme Alanı Dahil) */}
        {activeTab === 'new-job' && currentUser.role === 'admin' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Yeni İş Randevusu Oluştur</h2>
            <form onSubmit={handleCreateJob} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Müşteri Adı Soyadı *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Örn: Mehmet Öz" 
                    value={newCustomerName} 
                    onChange={(e) => { setNewCustomerName(e.target.value); setShowCustomerSuggestions(true); }} 
                    onFocus={() => setShowCustomerSuggestions(true)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" 
                  />
                  {showCustomerSuggestions && newCustomerName.trim().length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {customers.filter(c => c.name.toLowerCase().includes(newCustomerName.toLowerCase()) || c.phone.includes(newCustomerName)).map(cust => (
                        <div key={cust.id} onClick={() => { setNewCustomerName(cust.name); setNewCustomerPhone(cust.phone); setNewAddress(cust.address || ''); if (cust.addressType) setNewAddressType(cust.addressType); setShowCustomerSuggestions(false); }} className="p-3 hover:bg-emerald-50 cursor-pointer border-b text-xs">
                          <div className="font-bold text-slate-900">{cust.name} ({cust.id})</div>
                          <div className="text-slate-500">{cust.phone} - {cust.address}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Telefon Numarası *</label>
                  <input type="text" required placeholder="Örn: 05321234567" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Gidecek Personeller & Hakediş Paylaşımı *</label>
                  <div className="border border-slate-300 rounded-xl p-3 bg-white space-y-2">
                    {workers.map(w => (
                      <label key={w.id} className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                        <input type="checkbox" checked={selectedWorkers.includes(w.name)} onChange={(e) => {
                          if (e.target.checked) setSelectedWorkers([...selectedWorkers, w.name]);
                          else setSelectedWorkers(selectedWorkers.filter(name => name !== w.name));
                        }} className="w-4 h-4 text-emerald-600 rounded" />
                        <span>{w.name} ({w.role === 'admin' ? 'Yönetici' : 'Saha'}) - Havuzdan (%80) Eşit Pay Alır</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Açık Adres *</label>
                  <textarea rows={2} required placeholder="İlçe, Mahalle, Cadde..." value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase">Hizmet Kataloğu & Dakika Seçimi</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {services.map((srv) => (
                    <button key={srv.id} type="button" onClick={() => {
                      const exists = selectedItems.find(i => i.serviceId === srv.id);
                      if (exists) {
                        setSelectedItems(selectedItems.map(i => i.serviceId === srv.id ? { ...i, qty: i.qty + 1 } : i));
                      } else {
                        setSelectedItems([...selectedItems, { serviceId: srv.id, serviceName: srv.name, qty: 1, unitPrice: srv.price, durationMinutes: srv.durationMinutes || 30 }]);
                      }
                    }} className="bg-white border hover:border-emerald-500 p-3 rounded-xl text-left shadow-sm">
                      <div className="font-semibold text-xs text-slate-800">{srv.name}</div>
                      <div className="text-emerald-600 font-extrabold text-sm mt-1">{srv.price} TL</div>
                      <div className="text-[11px] text-purple-700 font-bold mt-0.5">⏱️ {srv.durationMinutes || 30} dk</div>
                    </button>
                  ))}
                </div>
                {selectedItems.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-slate-600">Seçilen Kalemler:</p>
                      <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                        ⏱️ Toplam Süre: ~{totalDuration} dk | Tutar: {finalTotal} TL
                      </span>
                    </div>
                    {selectedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-xl border text-sm">
                        <span>{item.serviceName} x{item.qty}</span>
                        <span className="font-bold">{item.qty * item.unitPrice} TL</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} className="border rounded-xl px-3.5 py-2.5 text-sm" />
                <input type="time" value={jobTime} onChange={(e) => setJobTime(e.target.value)} className="border rounded-xl px-3.5 py-2.5 text-sm" />
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="border rounded-xl px-3.5 py-2.5 text-sm font-bold bg-white">
                  <option value="Elden">💵 Ödeme: Elden</option>
                  <option value="IBAN">🏦 Ödeme: IBAN</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg">İş Randevusunu Oluştur ve Kaydet 🚀</button>
            </form>
          </div>
        )}

        {/* MÜŞTERİLER & FİRMALAR SEKMESİ */}
        {activeTab === 'customers' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <span>Müşteri & Kurumsal Firma Yönetimi</span>
                  </h2>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setAddMode('bireysel')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${addMode === 'bireysel' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600'}`}>Bireysel</button>
                  <button type="button" onClick={() => setAddMode('kurumsal')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${addMode === 'kurumsal' ? 'bg-blue-600 text-white shadow' : 'text-slate-600'}`}>Kurumsal</button>
                </div>
              </div>

              <form onSubmit={handleQuickAddEntity} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                {addMode === 'bireysel' ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" required placeholder="Ad Soyad" value={quickName} onChange={(e) => setQuickName(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white flex-1" />
                    <input type="text" required placeholder="Telefon (0532...)" value={quickPhone} onChange={(e) => setQuickPhone(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white sm:w-40" />
                    <input type="text" required placeholder="Açık Adres" value={quickAddressOrTaxOffice} onChange={(e) => setQuickAddressOrTaxOffice(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white flex-2" />
                    <select value={quickExtraOrTaxNo} onChange={(e) => setQuickExtraOrTaxNo(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white font-bold sm:w-28">
                      <option value="ev">🏠 Ev</option>
                      <option value="işyeri">🏢 İşyeri</option>
                      <option value="diğer">📍 Diğer</option>
                    </select>
                    <button type="submit" className="bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl text-sm shadow">Kaydet</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input type="text" required placeholder="Firma Adı" value={quickName} onChange={(e) => setQuickName(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white" />
                      <input type="text" required placeholder="Telefon" value={quickPhone} onChange={(e) => setQuickPhone(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white" />
                      <input type="text" required placeholder="Vergi Dairesi" value={quickAddressOrTaxOffice} onChange={(e) => setQuickAddressOrTaxOffice(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white" />
                      <input type="text" required placeholder="Vergi No" value={quickExtraOrTaxNo} onChange={(e) => setQuickExtraOrTaxNo(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white" />
                    </div>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Firma Açık Adresi" value={quickFullAddress} onChange={(e) => setQuickFullAddress(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white flex-1" />
                      <button type="submit" className="bg-blue-600 text-white font-bold px-6 py-2 rounded-xl text-sm shadow">Firmayı Kaydet</button>
                    </div>
                  </div>
                )}
              </form>

              <div className="space-y-3">
                <input type="text" placeholder="Müşteri ara..." value={customerSearchQuery} onChange={(e) => setCustomerSearchQuery(e.target.value)} className="border rounded-xl px-3 py-1.5 text-xs bg-slate-50 w-full" />
                <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden bg-white">
                  {customers.filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || c.phone.includes(customerSearchQuery)).map((cust) => (
                    <div key={cust.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-800 text-sm">{cust.name} ({cust.phone}) <span className="text-xs font-mono text-purple-700">({cust.id})</span></h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">📍 {cust.address} ({cust.addressType?.toUpperCase()})</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => sendWhatsAppMessage('kvkk', cust)} className="bg-emerald-50 text-emerald-700 border px-3 py-1 rounded-lg text-xs font-bold">KVKK Onay (WP)</button>
                        <button onClick={() => handleDeleteCustomer(cust.id)} className="text-rose-500 p-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                  {companies.map((comp) => (
                    <div key={comp.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{comp.name} ({comp.phone}) <span className="text-xs font-mono text-blue-700">({comp.id})</span></h4>
                        <p className="text-xs text-slate-500">VD: {comp.taxOffice} | VN: {comp.taxNumber}</p>
                      </div>
                      <button onClick={() => handleDeleteCompany(comp.id)} className="text-rose-500 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KULLANICILAR VE ŞİFRELER SEKMESİ */}
        {activeTab === 'workers' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Kullanıcı Adı, Rol ve Şifre Yönetimi</h2>
              <form onSubmit={handleAddWorker} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border">
                <input type="text" required placeholder="Kullanıcı Adı" value={newWorkerUsername} onChange={(e) => setNewWorkerUsername(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="text" required placeholder="Ad Soyad" value={newWorkerName} onChange={(e) => setNewWorkerName(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="text" required placeholder="Şifre" value={newWorkerPin} onChange={(e) => setNewWorkerPin(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white" />
                <select value={newWorkerRole} onChange={(e) => setNewWorkerRole(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white font-bold">
                  <option value="worker">👷 Saha</option>
                  <option value="admin">👑 Yönetici</option>
                </select>
                <button type="submit" className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-sm shadow">Kullanıcı Ekle</button>
              </form>
              <div className="divide-y border rounded-xl overflow-hidden">
                {workers.map((w) => (
                  <div key={w.id} className="p-4 flex items-center justify-between bg-white">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{getCleanDisplayName(w.name)} ({w.role === 'admin' ? 'Yönetici' : 'Saha'})</h4>
                      <p className="text-xs text-slate-500 font-mono">Kullanıcı Adı: <strong>{w.username}</strong> | Şifre: <strong className="text-emerald-700">{w.pin}</strong></p>
                    </div>
                    <button onClick={() => handleDeleteWorker(w.id)} className="text-rose-500 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FİYATLAR & SÜRELER SEKMESİ */}
        {activeTab === 'catalog' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Hizmet, Fiyat & Dakika Süre Yönetimi</h2>
              <form onSubmit={handleAddOrUpdateService} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border">
                <input type="text" required placeholder="Hizmet Adı" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} className="border rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="number" required placeholder="Fiyat (TL)" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} className="border rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="number" required placeholder="Süre (Dakika)" value={newService.durationMinutes} onChange={(e) => setNewService({ ...newService, durationMinutes: e.target.value })} className="border rounded-xl px-3 py-2 text-sm bg-white" />
                <button type="submit" className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-sm shadow">{editingServiceId ? 'Güncelle' : 'Ekle'}</button>
              </form>
              <div className="divide-y border rounded-xl overflow-hidden">
                {services.map((srv) => (
                  <div key={srv.id} className="p-4 flex items-center justify-between bg-white">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{srv.name}</h4>
                      <span className="text-xs text-purple-700 font-semibold">⏱️ Süre: {srv.durationMinutes || 30} dk | Birim: {srv.unit}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-extrabold text-slate-900">{srv.price} TL</span>
                      <button onClick={() => { setEditingServiceId(srv.id); setNewService({ name: srv.name, price: srv.price, unit: srv.unit || 'adet', durationMinutes: srv.durationMinutes || 30 }); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => updateServices(services.filter(s => s.id !== srv.id))} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HATIRLATICILAR & TÜM ŞABLONLAR SEKMESİ */}
        {activeTab === 'reminders' && currentUser.role === 'admin' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Şablon Yönetimi Bölümleri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-3">
                <h3 className="text-sm font-bold text-slate-900">KVKK Onay Mesajı Şablonu</h3>
                <form onSubmit={(e) => handleSaveTemplates(e, 'kvkk')} className="space-y-2">
                  <textarea rows={4} value={tempKvkkInput} onChange={(e) => setTempKvkkInput(e.target.value)} className="w-full border rounded-xl p-3 text-xs font-mono bg-slate-50" />
                  <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs shadow">KVKK Şablonunu Kaydet</button>
                </form>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-3">
                <h3 className="text-sm font-bold text-slate-900">6 Ay Periyodik Hatırlatıcı Şablonu</h3>
                <form onSubmit={(e) => handleSaveTemplates(e, 'reminder')} className="space-y-2">
                  <textarea rows={4} value={tempReminderInput} onChange={(e) => setTempReminderInput(e.target.value)} className="w-full border rounded-xl p-3 text-xs font-mono bg-slate-50" />
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl text-xs shadow">Hatırlatıcı Şablonunu Kaydet</button>
                </form>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Randevu Onay Mesajı Şablonu</h3>
                <form onSubmit={(e) => handleSaveTemplates(e, 'appointment')} className="space-y-2">
                  <textarea rows={4} value={tempAppointmentInput} onChange={(e) => setTempAppointmentInput(e.target.value)} className="w-full border rounded-xl p-3 text-xs font-mono bg-slate-50" />
                  <button type="submit" className="w-full bg-purple-600 text-white font-bold py-2 rounded-xl text-xs shadow">Randevu Şablonunu Kaydet</button>
                </form>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Yola Çıkıldı / Servis Bitti Şablonları</h3>
                <form onSubmit={(e) => handleSaveTemplates(e, 'ontheway')} className="space-y-2">
                  <textarea rows={2} value={tempOnTheWayInput} onChange={(e) => setTempOnTheWayInput(e.target.value)} className="w-full border rounded-xl p-2.5 text-[11px] font-mono bg-slate-50" />
                  <textarea rows={2} value={tempCompletionInput} onChange={(e) => setTempCompletionInput(e.target.value)} className="w-full border rounded-xl p-2.5 text-[11px] font-mono bg-slate-50" />
                  <button type="submit" onClick={(e) => handleSaveTemplates(e, 'completion')} className="w-full bg-amber-600 text-white font-bold py-2 rounded-xl text-xs shadow">Servis Şablonlarını Kaydet</button>
                </form>
              </div>
            </div>

            {/* 180 Günü Geçen Müşteriler */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Periyodik Hatırlatıcı Bekleyen Müşteriler (180+ Gün Geçenler)</h2>
              <div className="divide-y border rounded-xl overflow-hidden bg-slate-50">
                {reminderEligibleCustomers.map((cust) => {
                  const daysAgo = getDaysSinceLastJob(cust.lastJobDate);
                  return (
                    <div key={cust.id} className="p-4 flex items-center justify-between bg-white">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{cust.name} ({cust.phone}) <span className="text-xs font-mono text-purple-700">({cust.id})</span></h4>
                        <p className="text-xs text-slate-500">📍 {cust.address} | Son İşlem: <strong className="text-purple-700">{cust.lastJobDate} ({daysAgo} gün önce)</strong></p>
                      </div>
                      <button onClick={() => sendWhatsAppMessage('reminder', cust)} className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Hatırlatma Gönder (WP)</span>
                      </button>
                    </div>
                  );
                })}
                {reminderEligibleCustomers.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs bg-white">Şu an 180 günü geçen geçmiş işleme sahip müşteri bulunmuyor.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SERVİS FİŞİ MODALI */}
      {selectedJobForReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 my-8">
            <div ref={receiptRef} className="bg-white p-4 border rounded-2xl space-y-4">
              <div className="border-b pb-4 text-center space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-wider">PEVUNO SOLUTION</h2>
                <p className="text-xs text-slate-500 font-semibold">Profesyonel Temizlik & Hijyen Servis Fişi</p>
                <p className="text-xs font-bold text-emerald-700 mt-1">İş No: #{selectedJobForReceipt.id} | Müşteri No: {selectedJobForReceipt.customerId}</p>
              </div>
              <div className="text-xs space-y-1.5 text-slate-700 bg-slate-50 p-3 rounded-xl border">
                <p><strong>Müşteri:</strong> {selectedJobForReceipt.customerName}</p>
                <p><strong>Telefon:</strong> {selectedJobForReceipt.phone}</p>
                <p><strong>Adres:</strong> {selectedJobForReceipt.address}</p>
                <p><strong>Tarih:</strong> {selectedJobForReceipt.date} - {selectedJobForReceipt.time}</p>
                <p><strong>Ödeme Türü:</strong> {selectedJobForReceipt.paymentMethod}</p>
              </div>
              <div className="border rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left divide-y">
                  <thead className="bg-slate-100 font-bold text-slate-800">
                    <tr><th className="p-2.5">Hizmet</th><th className="p-2.5 text-center">Adet</th><th className="p-2.5 text-right">Tutar</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedJobForReceipt.items.map((i, idx) => (
                      <tr key={idx}><td className="p-2.5 font-medium">{i.serviceName}</td><td className="p-2.5 text-center">{i.qty}</td><td className="p-2.5 text-right font-bold">{i.qty * i.unitPrice} TL</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pt-2 text-right">
                <p className="text-xs text-slate-500">Toplam Tutar</p>
                <p className="text-xl font-black text-emerald-700">{selectedJobForReceipt.totalAmount} TL</p>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <button onClick={downloadReceiptAsImage} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow flex items-center justify-center space-x-2">
                <Download className="w-4 h-4" />
                <span>📸 Fiş Görselini İndir (JPEG - WP İçin)</span>
              </button>
              <div className="flex space-x-2">
                <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs">Yazdır / PDF</button>
                <button onClick={() => setSelectedJobForReceipt(null)} className="bg-slate-100 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs border">Kapat</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
