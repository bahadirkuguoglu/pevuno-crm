import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, ShoppingBag, PlusCircle, Calendar, RefreshCw, 
  TrendingUp, CheckCircle2, Clock, MapPin, Phone, 
  MessageSquare, DollarSign, Edit3, Trash2, Search, Download,
  FileText, Star, Settings, Percent, Tag, LogOut, ChevronRight, Lock, ShieldCheck, UserPlus, Cloud, BookOpen, Send, UserCheck, LayoutDashboard, UserCheck2, Navigation
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
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('pevuno_expenses');
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

  const [selectedExistingCustomer, setSelectedExistingCustomer] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNote, setNewNote] = useState('');
  const [kvkkChecked, setKvkkChecked] = useState(false);
  const [directCustName, setDirectCustName] = useState('');
  const [directCustPhone, setDirectCustPhone] = useState('');
  const [directCustCompany, setDirectCustCompany] = useState('');
  const [directCustAddress, setDirectCustAddress] = useState('');
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

  const handleSaveKvkkTemplate = async (e) => {
    e.preventDefault();
    setKvkkTemplate(tempKvkkInput);
    localStorage.setItem('pevuno_kvkk', tempKvkkInput);
    await saveSupabaseData('kvkk_template', tempKvkkInput);
    alert('KVKK Mesaj Şablonu başarıyla güncellendi!');
  };

  const toggleCustomerKvkkStatus = (custId) => {
    const updated = customers.map(c => c.id === custId ? { ...c, kvkk: !c.kvkk } : c);
    updateCustomers(updated);
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
      setCurrentUser({ role: matchedUser.role || 'worker', name: matchedUser.name, username: matchedUser.username });
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

    const newWObj = {
      id: `usr-${Date.now()}`,
      username: cleanUser,
      name: newWorkerName,
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
    if (!directCustName || !directCustPhone) {
      alert('Müşteri adı ve telefon numarası zorunludur.');
      return;
    }
    const newCustObj = {
      id: `CUST-${Date.now()}`,
      name: directCustName,
      phone: directCustPhone,
      company: directCustCompany,
      addresses: directCustAddress ? [directCustAddress] : [],
      kvkk: false,
      lastJobDate: 'Yeni Eklenen'
    };
    const updated = [...customers, newCustObj];
    updateCustomers(updated);
    setDirectCustName('');
    setDirectCustPhone('');
    setDirectCustCompany('');
    setDirectCustAddress('');
    alert('Müşteri başarıyla kaydedildi!');
  };

  const handleDeleteCustomer = (custId) => {
    if (confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) {
      const updatedList = customers.filter(c => c.id !== custId);
      updateCustomers(updatedList);
    }
  };

  const handleSelectCustomerFromDropdown = (cust) => {
    if (!cust) {
      setSelectedExistingCustomer('');
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCompany('');
      return;
    }
    setSelectedExistingCustomer(cust.id);
    setNewCustomerName(cust.name);
    setNewCustomerPhone(cust.phone);
    setNewCompany(cust.company || '');
    setKvkkChecked(cust.kvkk || false);
    if (cust.addresses && cust.addresses.length > 0) {
      setNewAddress(cust.addresses[0]);
    }
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
      companyName: newCompany,
      phone: newCustomerPhone,
      address: newAddress,
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
      const updatedAddresses = cust.addresses.includes(newAddress) ? cust.addresses : [...cust.addresses, newAddress];
      updatedCusts[existingCustIndex] = { ...cust, addresses: updatedAddresses, lastJobDate: jobDate, kvkk: kvkkChecked };
    } else {
      updatedCusts.push({
        id: `CUST-${Date.now()}`,
        name: newCustomerName,
        phone: newCustomerPhone,
        company: newCompany,
        addresses: [newAddress],
        kvkk: kvkkChecked,
        lastJobDate: jobDate
      });
    }
    updateCustomers(updatedCusts);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCompany('');
    setNewAddress('');
    setNewNote('');
    setKvkkChecked(false);
    setSelectedExistingCustomer('');
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

  const sendWhatsAppNotificationToWorker = (job) => {
    if (!job.assignedWorkers || job.assignedWorkers.length === 0) {
      alert('Bu işe henüz personel atanmamış!');
      return;
    }
    const workerName = job.assignedWorkers[0];
    const workerObj = workers.find(w => w.name === workerName);
    let targetPhone = workerObj?.phone || '';
    if (!targetPhone) {
      const manualPhone = prompt(`${workerName} için telefon numarası girin (Örn: 0532...):`);
      if (!manualPhone) return;
      targetPhone = manualPhone;
    }
    let msg = `🔔 *YENİ İŞ / RANDEVU ATAMASI*\n\n`;
    msg += `👤 *Müşteri:* ${job.customerName}\n`;
    msg += `📞 *Telefon:* ${job.phone}\n`;
    msg += `📍 *Adres:* ${job.address}\n`;
    msg += `📅 *Tarih / Saat:* ${job.date} - ${job.time || '10:00'}\n`;
    msg += `⏱️ *Tahmini Süre:* ~${job.estimatedDurationMinutes || 60} Dakika\n`;
    msg += `📋 *Hizmetler:*\n`;
    job.items.forEach(i => {
      msg += `• ${i.serviceName} x${i.qty}\n`;
    });
    if (job.note) msg += `📌 *Not:* ${job.note}\n`;
    msg += `\nİyi çalışmalar dileriz! 🚀`;
    const encoded = encodeURIComponent(msg);
    const cleanPhone = targetPhone.replace(/\D/g, '');
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

  const sendSixMonthReminder = (cust) => {
    const daysPassed = getDaysSinceLastJob(cust.lastJobDate);
    let msg = `Merhaba *${cust.name}*,\n\n`;
    msg += `🌿 *PEVUNO SOLUTION* ailesi olarak sağlıklı günler dileriz.\n`;
    if (daysPassed) {
      msg += `Son profesyonel koltuk/halı temizliğinizin üzerinden *${daysPassed} gün* geçti. Periyodik koltuk yıkama zamanınız gelmiştir.\n\n`;
    } else {
      msg += `Son profesyonel koltuk/halı temizliğinizin üzerinden yaklaşık 6 ay geçti. Periyodik koltuk yıkama zamanınız gelmiştir.\n\n`;
    }
    msg += `Randevu oluşturmamızı ister misiniz? 🧼✨`;
    const encoded = encodeURIComponent(msg);
    const cleanPhone = cust.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `9${cleanPhone}` : cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
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

  const totalRevenue = jobs.reduce((acc, j) => acc + j.totalAmount, 0);
  const totalCollected = jobs.reduce((acc, j) => acc + j.paidAmount, 0);
  const totalChemFund = jobs.reduce((acc, j) => acc + (j.chemFund || (j.totalAmount * 0.10)), 0);
  const totalAmortFund = jobs.reduce((acc, j) => acc + (j.amortFund || (j.totalAmount * 0.10)), 0);
  const totalHakedis = jobs.reduce((acc, j) => acc + (j.workerHakedis || (j.totalAmount * 0.80)), 0);
  const netProfit = totalCollected - totalChemFund - totalAmortFund - totalHakedis;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayJobsCount = jobs.filter(j => j.date === todayStr).length;
  const completedJobsCount = jobs.filter(j => j.status === 'Tamamlandı').length;

  const filteredCustomersForJob = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    c.phone.includes(customerSearchQuery) ||
    (c.company && c.company.toLowerCase().includes(customerSearchQuery.toLowerCase()))
  );

  const reminderEligibleCustomers = customers.filter(c => {
    if (!c.kvkk) return false;
    const days = getDaysSinceLastJob(c.lastJobDate);
    return days !== null && days >= 180;
  });

  const sortedJobsForUser = [...jobs]
    .filter(j => currentUser?.role === 'admin' || j.assignedWorkers?.includes(currentUser?.name))
    .sort((a, b) => new Date(`${a.date}T${a.time || '10:00'}`) - new Date(`${b.date}T${b.time || '10:00'}`));

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-black rounded-full border-2 border-white/20 mx-auto flex items-center justify-center shadow-lg overflow-hidden p-1">
              <svg viewBox="0 0 200 200" className="w-full h-full text-white">
                <circle cx="100" cy="100" r="90" fill="black" stroke="white" strokeWidth="6" />
                <path d="M60 45 L140 45 C165 45 175 60 165 85 C155 110 135 120 120 120 L95 120 L75 155 L55 155 L85 105 L115 105 C125 105 138 100 143 85 C148 70 140 60 125 60 L80 60 Z" fill="white" />
                <path d="M75 75 L105 135 L135 75 Z" fill="black" />
                <path d="M85 90 L105 120 L125 90 Z" fill="white" />
              </svg>
            </div>
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
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 bg-slate-50" 
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
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500" 
              />
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition">Sisteme Giriş Yap 🚀</button>
          </form>
        </div>
      </div>
    );
  }

  // Rol unvanını tekilleştirme (Çift (Yönetici) sorununu kökten çözer)
  const roleTitleText = currentUser.role === 'admin' ? 'Yönetici' : 'Personel';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black rounded-full border border-white/30 flex items-center justify-center shadow-md overflow-hidden shrink-0 p-0.5">
              <svg viewBox="0 0 200 200" className="w-full h-full text-white">
                <circle cx="100" cy="100" r="90" fill="black" stroke="white" strokeWidth="6" />
                <path d="M60 45 L140 45 C165 45 175 60 165 85 C155 110 135 120 120 120 L95 120 L75 155 L55 155 L85 105 L115 105 C125 105 138 100 143 85 C148 70 140 60 125 60 L80 60 Z" fill="white" />
                <path d="M75 75 L105 135 L135 75 Z" fill="black" />
                <path d="M85 90 L105 120 L125 90 Z" fill="white" />
              </svg>
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight leading-tight">PEVUNO SOLUTION</h1>
              <p className="text-[11px] text-slate-400">Aktif Kullanıcı: <strong className="text-emerald-400">{currentUser.name} ({roleTitleText})</strong></p>
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
                  <span>Aktif İşler ({jobs.filter(j => j.status !== 'Tamamlandı').length})</span>
                </button>
                <button onClick={() => setActiveTab('admin-completed')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'admin-completed' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tamamlanan İşler ({jobs.filter(j => j.status === 'Tamamlandı').length})</span>
                </button>
                <button onClick={() => setActiveTab('new-job')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'new-job' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <PlusCircle className="w-4 h-4" />
                  <span>Yeni İş Kaydı</span>
                </button>
                <button onClick={() => setActiveTab('customers')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'customers' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <BookOpen className="w-4 h-4" />
                  <span>Müşteriler</span>
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
                <h2 className="text-2xl font-black">Hoş Geldiniz, {currentUser.name} 👋</h2>
                <p className="text-xs text-slate-300 mt-1">Pevuno Solution Canlı Saha Operasyon ve Finansal Kasa Merkezi</p>
              </div>
              <button onClick={() => setActiveTab('new-job')} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg transition text-xs flex items-center space-x-1">
                <PlusCircle className="w-4 h-4" />
                <span>Hızlı İş Kaydı</span>
              </button>
            </div>

            {/* Finansal Kartlar: Mobilde Net Kâr tam boy tutularak bozulma engellendi */}
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
                <div className="text-2xl font-black text-emerald-600">{completedJobsCount} İş</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Müşteri Sayısı</span>
                <div className="text-2xl font-black text-purple-600">{customers.length} Kişi</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Aktif İşler</span>
                <div className="text-2xl font-black text-amber-600">{jobs.filter(j => j.status !== 'Tamamlandı').length} İş</div>
              </div>
            </div>
          </div>
        )}

        {/* KULLANICILAR & ŞİFRELER SEKMESİ (Şifreler artık açıkça listede görünür) */}
        {activeTab === 'workers' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Kullanıcı Adı, Rol ve Şifre Yönetimi</h2>
              <form onSubmit={handleAddWorker} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input type="text" required placeholder="Kullanıcı Adı" value={newWorkerUsername} onChange={(e) => setNewWorkerUsername(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="text" required placeholder="Ad Soyad" value={newWorkerName} onChange={(e) => setNewWorkerName(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="text" required placeholder="Şifre / PIN" value={newWorkerPin} onChange={(e) => setNewWorkerPin(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
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
                      <h4 className="font-bold text-slate-800 text-sm">{w.name} ({w.role === 'admin' ? 'Yönetici' : 'Saha'})</h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Kullanıcı Adı: <strong className="text-slate-800">{w.username || '-'}</strong> | Şifre: <strong className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{w.pin}</strong>
                      </p>
                    </div>
                    <button onClick={() => handleDeleteWorker(w.id)} className="text-rose-500 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DİĞER SEKMELER (Aktif İşler, Yeni İş, Fiyatlar vb.) */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow">
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-emerald-400" />
                <span>{currentUser.role === 'admin' ? 'Aktif Saha İşleri & Rota Listesi' : 'Aktif Görev Akışı & Rotam'}</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedJobsForUser.filter(job => job.status !== 'Tamamlandı').map((job, index) => (
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

        {activeTab === 'catalog' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Hizmet, Fiyat & Dakika Süre Yönetimi</h2>
              <form onSubmit={handleAddOrUpdateService} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input type="text" required placeholder="Hizmet Adı" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="number" required placeholder="Fiyat (TL)" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="number" required placeholder="Süre (Dakika)" value={newService.durationMinutes} onChange={(e) => setNewService({ ...newService, durationMinutes: e.target.value })} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <button type="submit" className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-sm shadow">Ekle</button>
              </form>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {services.map((srv) => (
                  <div key={srv.id} className="p-4 flex items-center justify-between bg-white">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{srv.name}</h4>
                      <span className="text-xs text-purple-700 font-semibold">⏱️ Süre: {srv.durationMinutes || 30} Dakika</span>
                    </div>
                    <span className="font-extrabold text-slate-900">{srv.price} TL</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
      </main>
    </div>
  );
}
