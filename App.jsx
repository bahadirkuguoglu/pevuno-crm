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

const DEFAULT_KVKK_TEMPLATE = `Merhaba *[Müşteri Adı]*,
Evinizde/iş yerinizde hijyeni her zaman en üst düzeyde tutabilmeniz için, son profesyonel temizliğinizin üzerinden geçecek olan *6 aylık periyotlarda size özel hatırlatma yapmamızı ve randevu oluşturmamızı ister misiniz?* 🧼✨
Periyodik hatırlatmaların yapılabilmesi ve KVKK kapsamındaki bilgilendirmeyi kabul ediyorsanız, bu mesaja hemen *"ONAYLIYORUM"* yazarak yanıt verebilirsiniz.
Sağlıklı ve hijyenik günler dileriz.
Pevuno Solution`;

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
  const [kvkkTemplate, setKvkkTemplate] = useState(() => {
    const saved = localStorage.getItem('pevuno_kvkk');
    return saved ? saved : DEFAULT_KVKK_TEMPLATE;
  });
  const [tempKvkkInput, setTempKvkkInput] = useState(kvkkTemplate);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  const syncWithCloud = async () => {
    setIsSynced(false);
    try {
      const cloudServices = await fetchSupabaseData('services', null);
      if (cloudServices && Array.isArray(cloudServices)) {
        setServices(cloudServices);
        localStorage.setItem('pevuno_services', JSON.stringify(cloudServices));
      }
      const cloudWorkers = await fetchSupabaseData('workers', null);
      if (cloudWorkers && Array.isArray(cloudWorkers)) {
        setWorkers(cloudWorkers);
        localStorage.setItem('pevuno_workers', JSON.stringify(cloudWorkers));
      }
      const cloudJobs = await fetchSupabaseData('jobs', null);
      if (cloudJobs && Array.isArray(cloudJobs)) {
        setJobs(cloudJobs);
        localStorage.setItem('pevuno_jobs', JSON.stringify(cloudJobs));
      }
      const cloudCustomers = await fetchSupabaseData('customers', null);
      if (cloudCustomers && Array.isArray(cloudCustomers)) {
        setCustomers(cloudCustomers);
        localStorage.setItem('pevuno_customers', JSON.stringify(cloudCustomers));
      }
      const cloudCompanies = await fetchSupabaseData('companies', null);
      if (cloudCompanies && Array.isArray(cloudCompanies)) {
        setCompanies(cloudCompanies);
        localStorage.setItem('pevuno_companies', JSON.stringify(cloudCompanies));
      }
      const cloudKvkk = await fetchSupabaseData('kvkk_template', null);
      if (cloudKvkk) {
        setKvkkTemplate(cloudKvkk);
        setTempKvkkInput(cloudKvkk);
        localStorage.setItem('pevuno_kvkk', cloudKvkk);
      }
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

  // Firma Formu
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyPhone, setNewCompanyPhone] = useState('');
  const [newCompanyTaxOffice, setNewCompanyTaxOffice] = useState('');
  const [newCompanyTaxNumber, setNewCompanyTaxNumber] = useState('');
  const [newCompanyAddress, setNewCompanyAddress] = useState('');

  const [selectedItems, setSelectedItems] = useState([]);
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
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

  const handleSaveKvkkTemplate = async (e) => {
    e.preventDefault();
    setKvkkTemplate(tempKvkkInput);
    localStorage.setItem('pevuno_kvkk', tempKvkkInput);
    await saveSupabaseData('kvkk_template', tempKvkkInput);
    alert('KVKK Mesaj Şablonu başarıyla güncellendi!');
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
    if (!lastJobDate || lastJobDate === 'Yeni' || lastJobDate === 'Yeni Eklenen') return null;
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

    const newWObj = {
      id: `usr-${Date.now()}`,
      username: cleanUser,
      name: cleanName,
      pin: newWorkerPin,
      role: newWorkerRole,
      phone: newWorkerPhone
    };
    updateWorkers([...workers, newWObj]);
    setNewWorkerUsername('');
    setNewWorkerName('');
    setNewWorkerPin('');
    setNewWorkerPhone('');
    setNewWorkerRole('worker');
    alert('Kullanıcı başarıyla eklendi!');
  };

  const handleDeleteWorker = (workerId) => {
    if (workers.length <= 1) {
      alert('Sistemdeki tek kullanıcıyı silemezsiniz.');
      return;
    }
    if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      const updatedList = workers.filter(w => w.id !== workerId);
      updateWorkers(updatedList);
    }
  };

  const handleAddDirectCustomer = (e) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone || !newAddress) {
      alert('Müşteri adı, telefon ve açık adres zorunludur.');
      return;
    }
    const newCustObj = {
      id: `CUST-${Date.now()}`,
      name: newCustomerName,
      phone: newCustomerPhone,
      address: newAddress,
      addressType: newAddressType,
      kvkk: false,
      lastJobDate: 'Yeni Eklenen'
    };
    const updated = [...customers, newCustObj];
    updateCustomers(updated);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewAddress('');
    setNewAddressType('ev');
    alert('Müşteri başarıyla kaydedildi!');
  };

  const handleDeleteCustomer = (custId) => {
    if (confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) {
      const updatedList = customers.filter(c => c.id !== custId);
      updateCustomers(updatedList);
    }
  };

  const handleAddCompany = (e) => {
    e.preventDefault();
    if (!newCompanyName || !newCompanyPhone || !newCompanyTaxOffice || !newCompanyTaxNumber) {
      alert('Firma adı, telefon, vergi dairesi ve vergi numarası zorunludur.');
      return;
    }
    const newCompObj = {
      id: `COMP-${Date.now()}`,
      name: newCompanyName,
      phone: newCompanyPhone,
      taxOffice: newCompanyTaxOffice,
      taxNumber: newCompanyTaxNumber,
      address: newCompanyAddress,
      lastJobDate: 'Yeni Eklenen'
    };
    const updated = [...companies, newCompObj];
    updateCompanies(updated);
    setNewCompanyName('');
    setNewCompanyPhone('');
    setNewCompanyTaxOffice('');
    setNewCompanyTaxNumber('');
    setNewCompanyAddress('');
    alert('Kurumsal firma başarıyla kaydedildi!');
  };

  const handleDeleteCompany = (compId) => {
    if (confirm('Bu firmayı silmek istediğinize emin misiniz?')) {
      const updatedList = companies.filter(c => c.id !== compId);
      updateCompanies(updatedList);
    }
  };

  const handleAddOrUpdateService = (e) => {
    e.preventDefault();
    if (!newService.name || !newService.price) return;
    const duration = Number(newService.durationMinutes) || 30;

    if (editingServiceId) {
      updateServices(services.map(s => s.id === editingServiceId ? { 
        ...s, 
        name: newService.name, 
        price: Number(newService.price), 
        unit: newService.unit,
        durationMinutes: duration 
      } : s));
      setEditingServiceId(null);
    } else {
      updateServices([...services, { 
        id: Date.now().toString(), 
        name: newService.name, 
        price: Number(newService.price), 
        unit: newService.unit,
        durationMinutes: duration 
      }]);
    }
    setNewService({ name: '', price: '', unit: 'adet', durationMinutes: 30 });
  };

  const handleCreateJob = (e) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone || selectedItems.length === 0 || !newAddress) {
      alert('Lütfen müşteri adı, telefon, adres ve en az 1 hizmet seçiniz.');
      return;
    }

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
      status: 'Sırada / Randevu',
      date: jobDate,
      time: jobTime,
      assignedWorkers: selectedWorkers.length > 0 ? selectedWorkers : (workers[0] ? [workers[0].name] : ['Saha Ekibi']),
      workerHakedisDetails: workerHakedisDetails,
      workerHakedis: Math.round(totalWorkerPool * 100) / 100,
      kvkkApproved: kvkkChecked,
      paymentMethod: 'Bekliyor',
      completedByWorker: false
    };

    updateJobs([newJobObj, ...jobs]);
    const existingCustIndex = customers.findIndex(c => c.phone === newCustomerPhone);
    let updatedCusts = [...customers];
    if (existingCustIndex > -1) {
      const cust = customers[existingCustIndex];
      updatedCusts[existingCustIndex] = { ...cust, address: newAddress, addressType: newAddressType, lastJobDate: jobDate, kvkk: kvkkChecked };
    } else {
      updatedCusts.push({
        id: `CUST-${Date.now()}`,
        name: newCustomerName,
        phone: newCustomerPhone,
        address: newAddress,
        addressType: newAddressType,
        kvkk: kvkkChecked,
        lastJobDate: jobDate
      });
    }
    updateCustomers(updatedCusts);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewAddress('');
    setNewAddressType('ev');
    setNewNote('');
    setKvkkChecked(false);
    setSelectedItems([]);
    setDiscountType('none');
    setDiscountValue(0);
    setPaidAmount(0);
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
    alert('İş tamamlandı, ödeme yöntemi kaydedildi!');
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

  const sendWhatsAppAppointmentConfirmation = (job) => {
    const assignedText = formatWorkerNameMasked(job.assignedWorkers);
    let msg = `Merhaba *${job.customerName}*,\n\n`;
    msg += `✨ *PEVUNO SOLUTION* profesyonel temizlik randevunuz başarıyla oluşturulmuştur! 🧼\n\n`;
    msg += `📅 *Tarih / Saat:* ${job.date} - ${job.time || '10:00'}\n`;
    msg += `📍 *Adres:* ${job.address}\n`;
    msg += `👷 *Görevli Ekip:* ${assignedText}\n`;
    if (job.estimatedDurationMinutes) {
      msg += `⏱️ *Tahmini İşlem Süresi:* ~${job.estimatedDurationMinutes} Dakika\n`;
    }
    msg += `\n📋 *Hizmet Detayı:*\n`;
    job.items.forEach(i => {
      msg += `• ${i.serviceName} x${i.qty} (${i.durationMinutes || 30} dk/adet)\n`;
    });
    msg += `\n💳 *Toplam Tutar:* ${job.totalAmount} TL\n\n`;
    msg += `Belirtilen saatte görüşmek üzere iyi günler dileriz! 🌿`;

    const encoded = encodeURIComponent(msg);
    const cleanPhone = job.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `9${cleanPhone}` : cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
  };

  const sendKvkkApprovalRequest = (cust) => {
    const formattedMsg = kvkkTemplate.replace(/\[Müşteri Adı\]/g, cust.name);
    const encoded = encodeURIComponent(formattedMsg);
    const cleanPhone = cust.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `9${cleanPhone}` : cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
  };

  const sendWhatsAppOnTheWay = (job) => {
    const assignedText = formatWorkerNameMasked(job.assignedWorkers);
    let msg = `Merhaba *${job.customerName}*,\n\n`;
    msg += `🚗 *PEVUNO SOLUTION* ekibimiz (*${assignedText}*) adresinize doğru yola çıkmıştır.\n`;
    msg += `📍 *Adres:* ${job.address}\n`;
    msg += `⏰ *Planlanan Saat:* ${job.time || 'Belirtilmedi'}\n\n`;
    msg += `Görüşmek üzere! 🧼✨`;
    const encoded = encodeURIComponent(msg);
    const cleanPhone = job.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `9${cleanPhone}` : cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
  };

  const sendWhatsAppCompletion = (job) => {
    const remaining = job.totalAmount - job.paidAmount;
    const assignedText = formatWorkerNameMasked(job.assignedWorkers);
    
    let msg = `Merhaba *${job.customerName}*,\n\n`;
    msg += `✨ *PEVUNO SOLUTION* profesyonel temizlik hizmetimiz tamamlanmıştır.\n`;
    msg += `👷 Hizmet veren ekibimiz: *${assignedText}*\n\n`;
    msg += `📋 *Yapılan İşlemler:*\n`;
    job.items.forEach(i => {
      msg += `• ${i.serviceName} (${i.qty} ${services.find(s=>s.id===i.serviceId)?.unit || 'adet'})\n`;
    });
    
    if (job.discountValue > 0) {
      msg += `\n💰 Ara Toplam: ${job.subtotal} TL`;
      msg += `\n🏷️ İndirim: -${job.subtotal - job.totalAmount} TL`;
    }
    msg += `\n💳 *Toplam Tutar:* ${job.totalAmount} TL`;
    msg += `\n💵 *Ödenen:* ${job.paidAmount} TL (${job.paymentMethod})`;
    msg += `\n📌 *Kalan Bakiye:* ${remaining > 0 ? `${remaining} TL` : 'Ödendi ✅'}\n\n`;
    msg += `Teşekkür ederiz! 🧼🚿`;

    const encoded = encodeURIComponent(msg);
    const cleanPhone = job.phone.replace(/\D/g, '');
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

  const reminderEligibleCustomers = customers.filter(c => {
    if (!c.kvkk) return false;
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
              <input 
                type="text" 
                required 
                placeholder="Örn: bahadir" 
                value={loginUsername} 
                onChange={(e) => setLoginUsername(e.target.value)} 
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Şifre</label>
              <input 
                type="password" 
                required 
                placeholder="Şifrenizi girin..." 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" 
              />
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
                  <span>Hatırlatıcılar</span>
                </button>
              </>
            )}

            {currentUser.role === 'worker' && (
              <>
                <button onClick={() => setActiveTab('worker-dashboard')} className={`px-4 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'worker-dashboard' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <TrendingUp className="w-4 h-4" />
                  <span>📊 Özet & Hakediş</span>
                </button>
                <button onClick={() => setActiveTab('jobs')} className={`px-4 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'jobs' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <ShoppingBag className="w-4 h-4" />
                  <span>🚗 Aktif İşler</span>
                </button>
                <button onClick={() => setActiveTab('worker-completed')} className={`px-4 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'worker-completed' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✅ Tamamlanan İşler</span>
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Bugünün Randevuları</span>
                <div className="text-2xl font-black text-slate-900">{todayJobsCount} İş</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Tamamlanan İşler</span>
                <div className="text-2xl font-black text-emerald-600">{completedJobsList.length} İş</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Müşteri Sayısı</span>
                <div className="text-2xl font-black text-purple-600">{customers.length} Kişi</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Aktif İşler</span>
                <div className="text-2xl font-black text-amber-600">{activeJobsList.length} İş</div>
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
                <span>{currentUser.role === 'admin' ? 'Aktif Saha İşleri & Rota Listesi' : 'Aktif Görev Akışı & Rotam'}</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedJobsForUser.filter(job => !isCompletedStatus(job.status)).map((job, index) => (
                <div key={job.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="bg-slate-900 text-emerald-400 font-extrabold text-xs px-2.5 py-1 rounded-lg">📍 SIRA: #{index + 1}</span>
                    <select value={job.status} onChange={(e) => updateJobStatus(job.id, e.target.value)} className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-slate-100 text-slate-700 cursor-pointer">
                      <option value="Sırada / Randevu">⏳ Sırada</option>
                      <option value="Yolda / Adreste">🚗 Yolda</option>
                      <option value="İşlem Yapılıyor">🧼 Temizlikte</option>
                      <option value="Tamamlandı">✅ Bitti</option>
                    </select>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900">{job.customerName}</h3>
                    <p className="text-slate-600 text-xs mt-1">📍 {job.address}</p>
                    {job.estimatedDurationMinutes && (
                      <p className="text-xs text-purple-700 font-bold mt-1">⏱️ Tahmini Süre: ~{job.estimatedDurationMinutes} dk</p>
                    )}
                  </div>
                  {currentUser.role === 'admin' && (
                    <button onClick={() => sendWhatsAppAppointmentConfirmation(job)} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow transition">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>📅 Müşteriye Randevu & Süre Mesajı Gönder (WP)</span>
                    </button>
                  )}
                  {currentUser.role === 'worker' && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-700">Ödemeyi Nasıl Aldınız?</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleWorkerCompleteJob(job.id, 'Elden (Saha)')} className="bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg">💵 Elden Aldım</button>
                        <button onClick={() => handleWorkerCompleteJob(job.id, 'IBAN (Yönetici)')} className="bg-slate-800 text-white text-xs font-bold py-2 rounded-lg">🏦 IBAN</button>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button onClick={() => sendWhatsAppOnTheWay(job)} className="bg-amber-600 text-white text-[11px] py-1.5 rounded-lg">Yola Çıkıldı</button>
                    <button onClick={() => sendWhatsAppCompletion(job)} className="bg-emerald-600 text-white text-[11px] py-1.5 rounded-lg">Bitti Mesajı</button>
                    <button onClick={() => setSelectedJobForReceipt(job)} className="bg-slate-100 border text-slate-700 text-[11px] py-1.5 rounded-lg">Servis Fişi</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAMAMLANAN İŞLER SEKMESİ */}
        {activeTab === 'admin-completed' && currentUser.role === 'admin' && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Tamamlanan İşler Arşivi ({completedJobsList.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Geçmişte yapılmış ve tamamlanmış tüm işlerin kayıtları.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedJobsList.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-200 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-lg">✅ TAMAMLANDI</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">📅 {job.date || 'Tarihsiz'}</span>
                      <button onClick={() => handleDeleteJob(job.id)} className="text-slate-400 hover:text-rose-600 p-1" title="İşi Sil">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{job.customerName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">📍 {job.address}</p>
                    <p className="text-xs text-emerald-700 font-medium mt-1">👷 Ekip: {formatWorkerNameMasked(job.assignedWorkers)}</p>
                  </div>
                  {job.items && job.items.length > 0 && (
                    <div className="divide-y divide-slate-100 text-sm">
                      {job.items.map((item, idx) => (
                        <div key={idx} className="py-1 flex justify-between">
                          <span className="text-slate-700">{item.serviceName} x{item.qty}</span>
                          <span className="font-medium text-slate-900">{item.qty * item.unitPrice} TL</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-500">Tutar: <strong>{job.totalAmount} TL</strong></span>
                    </div>
                    <button onClick={() => setSelectedJobForReceipt(job)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border">
                      Servis Fişi
                    </button>
                  </div>
                </div>
              ))}
              {completedJobsList.length === 0 && (
                <div className="col-span-2 p-12 bg-white rounded-2xl border text-center text-slate-400">
                  Henüz tamamlanmış bir iş bulunmuyor.
                </div>
              )}
            </div>
          </div>
        )}

        {/* YENİ İŞ KAYDI SEKMESİ */}
        {activeTab === 'new-job' && currentUser.role === 'admin' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Yeni İş Randevusu Oluştur</h2>
            <form onSubmit={handleCreateJob} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Müşteri Adı Soyadı *</label>
                  <input type="text" required placeholder="Örn: Mehmet Öz" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Telefon Numarası *</label>
                  <input type="text" required placeholder="Örn: 05321234567" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Gidecek Personeller *</label>
                  <div className="border border-slate-300 rounded-xl p-3 bg-white space-y-2">
                    {workers.map(w => (
                      <label key={w.id} className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                        <input type="checkbox" checked={selectedWorkers.includes(w.name)} onChange={(e) => {
                          if (e.target.checked) setSelectedWorkers([...selectedWorkers, w.name]);
                          else setSelectedWorkers(selectedWorkers.filter(name => name !== w.name));
                        }} className="w-4 h-4 text-emerald-600 rounded" />
                        <span>{w.name} ({w.role === 'admin' ? 'Yönetici' : 'Saha'})</span>
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
                        ⏱️ Toplam Tahmini Süre: ~{totalDuration} Dakika
                      </span>
                    </div>
                    {selectedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-xl border text-sm">
                        <span>{item.serviceName} x{item.qty} ({item.durationMinutes || 30} dk)</span>
                        <span className="font-bold">{item.qty * item.unitPrice} TL</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} className="border rounded-xl px-3.5 py-2.5 text-sm" />
                <input type="time" value={jobTime} onChange={(e) => setJobTime(e.target.value)} className="border rounded-xl px-3.5 py-2.5 text-sm" />
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg">İş Randevusunu Oluştur ve Kaydet 🚀</button>
            </form>
          </div>
        )}

        {/* MÜŞTERİLER & FİRMALAR SEKMESİ */}
        {activeTab === 'customers' && currentUser.role === 'admin' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Bireysel Müşteri Ekle</span>
              </h2>
              <form onSubmit={handleAddDirectCustomer} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input type="text" required placeholder="Müşteri Adı Soyadı" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="text" required placeholder="Telefon (0532...)" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input type="text" required placeholder="Açık Adres" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white sm:col-span-2" />
                  <select value={newAddressType} onChange={(e) => setNewAddressType(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-bold">
                    <option value="ev">🏠 Ev</option>
                    <option value="işyeri">🏢 İşyeri</option>
                    <option value="diğer">📍 Diğer</option>
                  </select>
                </div>
                <div className="sm:col-span-2 text-right">
                  <button type="submit" className="bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl text-sm shadow">Müşteriyi Kaydet</button>
                </div>
              </form>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden mt-4">
                {customers.map((cust) => (
                  <div key={cust.id} className="p-4 flex items-center justify-between bg-white">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{cust.name} ({cust.phone})</h4>
                      <p className="text-xs text-slate-500 mt-0.5">📍 {cust.address} <span className="font-bold text-emerald-700">({cust.addressType?.toUpperCase() || 'EV'})</span></p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => sendKvkkApprovalRequest(cust)} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg text-xs font-bold">KVKK Onay İste (WP)</button>
                      <button onClick={() => handleDeleteCustomer(cust.id)} className="text-rose-500 p-1" title="Sil"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {customers.length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-xs">Henüz kayıtlı bireysel müşteri yok.</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>Kurumsal Firma Ekle (Vergi Detaylı)</span>
              </h2>
              <form onSubmit={handleAddCompany} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input type="text" required placeholder="Firma Adı" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="text" required placeholder="Firma Telefonu" value={newCompanyPhone} onChange={(e) => setNewCompanyPhone(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="text" required placeholder="Vergi Dairesi" value={newCompanyTaxOffice} onChange={(e) => setNewCompanyTaxOffice(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="text" required placeholder="Vergi Numarası" value={newCompanyTaxNumber} onChange={(e) => setNewCompanyTaxNumber(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="text" placeholder="Firma Açık Adresi" value={newCompanyAddress} onChange={(e) => setNewCompanyAddress(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white sm:col-span-2" />
                <div className="sm:col-span-2 text-right">
                  <button type="submit" className="bg-blue-600 text-white font-bold px-6 py-2 rounded-xl text-sm shadow">Firmayı Kaydet</button>
                </div>
              </form>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden mt-4">
                {companies.map((comp) => (
                  <div key={comp.id} className="p-4 flex items-center justify-between bg-white">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{comp.name} ({comp.phone})</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Vergi Dairesi: <strong className="text-slate-700">{comp.taxOffice}</strong> | Vergi No: <strong className="text-slate-700">{comp.taxNumber}</strong>
                      </p>
                      {comp.address && <p className="text-xs text-slate-400 mt-0.5">📍 {comp.address}</p>}
                    </div>
                    <button onClick={() => handleDeleteCompany(comp.id)} className="text-rose-500 p-1" title="Sil"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {companies.length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-xs">Henüz kayıtlı kurumsal firma yok.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* KULLANICILAR VE ŞİFRELER SEKMESİ */}
        {activeTab === 'workers' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Kullanıcı Adı, Rol ve Şifre Yönetimi</h2>
              <form onSubmit={handleAddWorker} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input type="text" required placeholder="Kullanıcı Adı" value={newWorkerUsername} onChange={(e) => setNewWorkerUsername(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="text" required placeholder="Ad Soyad" value={newWorkerName} onChange={(e) => setNewWorkerName(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="text" required placeholder="Şifre" value={newWorkerPin} onChange={(e) => setNewWorkerPin(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <select value={newWorkerRole} onChange={(e) => setNewWorkerRole(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-bold">
                  <option value="worker">👷 Saha</option>
                  <option value="admin">👑 Yönetici</option>
                </select>
                <button type="submit" className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-sm shadow">Kullanıcı Ekle</button>
              </form>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {workers.map((w) => (
                  <div key={w.id} className="p-4 flex items-center justify-between bg-white">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{getCleanDisplayName(w.name)} ({w.role === 'admin' ? 'Yönetici' : 'Saha'})</h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Kullanıcı Adı: <strong className="text-slate-800">{w.username || '-'}</strong> | Şifre / PIN: <strong className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">{w.pin}</strong>
                      </p>
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
              <form onSubmit={handleAddOrUpdateService} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input type="text" required placeholder="Hizmet Adı" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="number" required placeholder="Fiyat (TL)" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="number" required placeholder="Süre (Dakika)" value={newService.durationMinutes} onChange={(e) => setNewService({ ...newService, durationMinutes: e.target.value })} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <button type="submit" className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-sm shadow">
                  {editingServiceId ? 'Hizmeti Güncelle' : 'Hizmet Ekle'}
                </button>
              </form>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {services.map((srv) => (
                  <div key={srv.id} className="p-4 flex items-center justify-between bg-white">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{srv.name}</h4>
                      <span className="text-xs text-purple-700 font-semibold">⏱️ Süre: {srv.durationMinutes || 30} Dakika | Birim: {srv.unit}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-extrabold text-slate-900">{srv.price} TL</span>
                      <button onClick={() => {
                        setEditingServiceId(srv.id);
                        setNewService({ name: srv.name, price: srv.price, unit: srv.unit || 'adet', durationMinutes: srv.durationMinutes || 30 });
                      }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Düzenle">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => updateServices(services.filter(s => s.id !== srv.id))} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded" title="Sil">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HATIRLATICILAR SEKMESİ */}
        {activeTab === 'reminders' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-950">WhatsApp KVKK & Onay Mesajı Şablonu Düzenle</h2>
              <form onSubmit={handleSaveKvkkTemplate} className="space-y-3">
                <textarea rows={8} value={tempKvkkInput} onChange={(e) => setTempKvkkInput(e.target.value)} className="w-full border rounded-xl p-3.5 text-xs font-mono bg-slate-50" />
                <button type="submit" className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow">KVKK Şablonunu Kaydet 💾</button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* SERVİS FİŞİ MODALI */}
      {selectedJobForReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 my-8">
            <div ref={receiptRef} className="bg-white p-4 border border-slate-100 rounded-2xl space-y-4">
              <div className="border-b border-slate-200 pb-4 text-center space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-wider">PEVUNO SOLUTION</h2>
                <p className="text-xs text-slate-500 font-semibold">Profesyonel Temizlik & Hijyen Servis Fişi</p>
                <p className="text-xs font-bold text-emerald-700 mt-1">Saha Ekip: {formatWorkerNameMasked(selectedJobForReceipt.assignedWorkers)}</p>
              </div>
              <div className="text-xs space-y-1.5 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p><strong>Müşteri:</strong> {selectedJobForReceipt.customerName}</p>
                <p><strong>Telefon:</strong> {selectedJobForReceipt.phone}</p>
                <p><strong>Adres:</strong> {selectedJobForReceipt.address}</p>
                <p><strong>Randevu Tarihi:</strong> {selectedJobForReceipt.date} - {selectedJobForReceipt.time}</p>
                <p><strong>Ödeme Şekli:</strong> {selectedJobForReceipt.paymentMethod}</p>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left divide-y divide-slate-200">
                  <thead className="bg-slate-100 font-bold text-slate-800">
                    <tr>
                      <th className="p-2.5">Hizmet</th>
                      <th className="p-2.5 text-center">Adet</th>
                      <th className="p-2.5 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedJobForReceipt.items.map((i, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium">{i.serviceName}</td>
                        <td className="p-2.5 text-center">{i.qty}</td>
                        <td className="p-2.5 text-right font-bold">{i.qty * i.unitPrice} TL</td>
                      </tr>
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
              <button onClick={downloadReceiptAsImage} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow flex items-center justify-center space-x-2 transition">
                <Download className="w-4 h-4" />
                <span>📸 Fiş Görselini İndir (JPEG - WP İçin)</span>
              </button>
              <div className="flex space-x-2">
                <button onClick={() => window.print()} className="flex-1 bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs shadow">Yazdır / PDF</button>
                <button onClick={() => setSelectedJobForReceipt(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs border border-slate-200">Kapat</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
