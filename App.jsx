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
  { id: '1', name: 'Koltuk Yıkama (Standart)', price: 1200, unit: 'adet' },
  { id: '2', name: 'L Koltuk Yıkama', price: 1500, unit: 'adet' },
  { id: '3', name: 'Yatak Yıkama (Çift Kişilik)', price: 900, unit: 'adet' },
  { id: '4', name: 'Halı Yıkama', price: 120, unit: 'm²' },
  { id: '5', name: 'Stor Perde Yıkama', price: 150, unit: 'm²' },
  { id: '6', name: 'Sandalye Yıkama', price: 150, unit: 'adet' },
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
  
  const [loginPin, setLoginPin] = useState('');
  const [loginWorkerInput, setLoginWorkerInput] = useState('');
  const [loginType, setLoginType] = useState('admin');
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [isSynced, setIsSynced] = useState(false);

  const receiptRef = useRef(null);

  const [adminPassword, setAdminPassword] = useState(() => {
    const saved = localStorage.getItem('pevuno_admin_pass');
    return saved || '1453';
  });
  const [newAdminPassInput, setNewAdminPassInput] = useState('');

  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem('pevuno_services');
    return saved ? JSON.parse(saved) : DEFAULT_SERVICES;
  });
  const [workers, setWorkers] = useState(() => {
    const saved = localStorage.getItem('pevuno_workers');
    return saved ? JSON.parse(saved) : [];
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
      const cloudAdminPass = await fetchSupabaseData('admin_password', null);
      if (cloudAdminPass) {
        setAdminPassword(cloudAdminPass);
        localStorage.setItem('pevuno_admin_pass', cloudAdminPass);
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
  const [workerHakedisMap, setWorkerHakedisMap] = useState({});

  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPin, setNewWorkerPin] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newService, setNewService] = useState({ name: '', price: '', unit: 'adet' });
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

  const handleSaveAdminPassword = async (e) => {
    e.preventDefault();
    if (!newAdminPassInput || newAdminPassInput.length < 4) {
      alert('Lütfen en az 4 haneli yeni bir şifre belirleyin.');
      return;
    }
    setAdminPassword(newAdminPassInput);
    localStorage.setItem('pevuno_admin_pass', newAdminPassInput);
    await saveSupabaseData('admin_password', newAdminPassInput);
    setNewAdminPassInput('');
    alert('Yönetici şifreniz başarıyla değiştirildi ve buluta kaydedildi!');
  };

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
  const calculateDiscount = () => {
    if (discountType === 'amount') return Number(discountValue) || 0;
    if (discountType === 'percent') return (subtotal * (Number(discountValue) || 0)) / 100;
    return 0;
  };
  const calculatedDiscount = calculateDiscount();
  const finalTotal = Math.max(0, subtotal - calculatedDiscount);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginType === 'admin') {
      if (loginPin === adminPassword) {
        setCurrentUser({ role: 'admin', name: 'Bahadır (Yönetici)' });
        setActiveTab('dashboard');
      } else {
        alert('Hatalı Yönetici Şifresi!');
      }
    } else {
      const trimmedInput = loginWorkerInput.trim().toLowerCase();
      const worker = workers.find(w => w.name.trim().toLowerCase() === trimmedInput && w.pin === loginPin);
      if (worker) {
        setCurrentUser({ role: 'worker', name: worker.name });
        setActiveTab('worker-dashboard');
      } else {
        alert('Hatalı Kullanıcı Adı veya PIN Şifresi!');
      }
    }
  };

  const handleAddWorker = (e) => {
    e.preventDefault();
    if (!newWorkerName || !newWorkerPin) {
      alert('Lütfen personel adı ve şifresi (PIN) giriniz.');
      return;
    }
    const newWObj = {
      id: `w-${Date.now()}`,
      name: newWorkerName,
      pin: newWorkerPin,
      phone: newWorkerPhone
    };
    updateWorkers([...workers, newWObj]);
    setNewWorkerName('');
    setNewWorkerPin('');
    setNewWorkerPhone('');
    alert('Yeni personel başarıyla eklendi!');
  };

  const handleDeleteWorker = (workerId) => {
    if (confirm('Bu personeli silmek istediğinize emin misiniz?')) {
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

    const workerHakedisDetails = selectedWorkers.map(wName => ({
      workerName: wName,
      amount: Number(workerHakedisMap[wName]) || 300
    }));
    const totalWorkerHakedis = workerHakedisDetails.reduce((acc, curr) => acc + curr.amount, 0);

    const newJobObj = {
      id: `JOB-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: newCustomerName,
      companyName: newCompany,
      phone: newCustomerPhone,
      address: newAddress,
      note: newNote,
      items: selectedItems,
      subtotal,
      discountType,
      discountValue: Number(discountValue) || 0,
      totalAmount: finalTotal,
      paidAmount: Number(paidAmount) || 0,
      status: 'Sırada / Randevu',
      date: jobDate,
      time: jobTime,
      assignedWorkers: selectedWorkers.length > 0 ? selectedWorkers : (workers[0] ? [workers[0].name] : ['Saha Ekibi']),
      workerHakedisDetails: workerHakedisDetails,
      workerHakedis: totalWorkerHakedis,
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
      const newCustObj = {
        id: `CUST-${Date.now()}`,
        name: newCustomerName,
        phone: newCustomerPhone,
        company: newCompany,
        addresses: [newAddress],
        kvkk: kvkkChecked,
        lastJobDate: jobDate
      };
      updatedCusts.push(newCustObj);
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
    alert('İş tamamlandı, ödeme yöntemi kaydedildi ve yöneticiye bildirildi!');
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
    msg += `👷 *Görevli Ekip:* ${assignedText}\n\n`;
    msg += `📋 *Hizmet Detayı:*\n`;
    job.items.forEach(i => {
      msg += `• ${i.serviceName} x${i.qty}\n`;
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
    if (editingServiceId) {
      updateServices(services.map(s => s.id === editingServiceId ? { ...s, name: newService.name, price: Number(newService.price), unit: newService.unit } : s));
      setEditingServiceId(null);
    } else {
      updateServices([...services, { id: Date.now().toString(), name: newService.name, price: Number(newService.price), unit: newService.unit }]);
    }
    setNewService({ name: '', price: '', unit: 'adet' });
  };

  const totalRevenue = jobs.reduce((acc, j) => acc + j.totalAmount, 0);
  const totalCollected = jobs.reduce((acc, j) => acc + j.paidAmount, 0);
  const totalHakedis = jobs.reduce((acc, j) => acc + (j.workerHakedis || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalCollected - totalExpenses - totalHakedis;

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
            <p className="text-xs text-slate-500 font-medium">Professional Field Services CRM</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button type="button" onClick={() => setLoginType('admin')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${loginType === 'admin' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}>👑 Yönetici Girişi</button>
              <button type="button" onClick={() => setLoginType('worker')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${loginType === 'worker' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}>👷 Saha Personeli</button>
            </div>
            {loginType === 'worker' ? (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Personel Adı Soyadı</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Örn: Ahmet Yılmaz" 
                  value={loginWorkerInput} 
                  onChange={(e) => setLoginWorkerInput(e.target.value)} 
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 bg-slate-50" 
                />
              </div>
            ) : null}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {loginType === 'admin' ? 'Yönetici Şifresi' : 'Personel Şifresi (PIN)'}
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
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition">Sisteme Giriş Yap 🚀</button>
          </form>
        </div>
      </div>
    );
  }

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
              <p className="text-[11px] text-slate-400">Aktif Kullanıcı: <strong className="text-emerald-400">{currentUser.name}</strong></p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button 
              onClick={syncWithCloud} 
              className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-1.5 rounded-xl font-medium flex items-center space-x-1 hover:bg-emerald-500/30 transition whitespace-nowrap"
              title="Bulut ile Senkronize Et"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>{isSynced ? '🔄 Eşitle' : '⏳ Bekleyin'}</span>
            </button>
            <button onClick={() => setCurrentUser(null)} className="bg-slate-800 hover:bg-rose-900/40 text-slate-300 text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-1 transition">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>

        {/* MENÜ / SEKMELER */}
        <div className="bg-slate-800 border-t border-slate-700 w-full overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 flex justify-start sm:justify-center space-x-2 text-sm py-1">
            
            {/* YÖNETİCİ SEKMELERİ */}
            {currentUser.role === 'admin' && (
              <>
                <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'dashboard' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard & Rota</span>
                </button>
                <button onClick={() => setActiveTab('jobs')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'jobs' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <ShoppingBag className="w-4 h-4" />
                  <span>İş Listesi ({jobs.length})</span>
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
                  <span>Personel</span>
                </button>
                <button onClick={() => setActiveTab('catalog')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'catalog' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <Settings className="w-4 h-4" />
                  <span>Fiyatlar</span>
                </button>
                <button onClick={() => setActiveTab('reminders')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'reminders' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <RefreshCw className="w-4 h-4" />
                  <span>Hatırlatıcılar</span>
                </button>
                <button onClick={() => setActiveTab('finance')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'finance' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <TrendingUp className="w-4 h-4" />
                  <span>Kasa</span>
                </button>
                <button onClick={() => setActiveTab('security')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'security' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <Lock className="w-4 h-4" />
                  <span>Şifre Değiştir</span>
                </button>
              </>
            )}

            {/* SAHA PERSONELİ 3 SAYFA YAPISI */}
            {currentUser.role === 'worker' && (
              <>
                <button onClick={() => setActiveTab('worker-dashboard')} className={`px-4 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'worker-dashboard' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <TrendingUp className="w-4 h-4" />
                  <span>📊 1. Özet & Hakediş</span>
                </button>
                <button onClick={() => setActiveTab('jobs')} className={`px-4 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'jobs' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <ShoppingBag className="w-4 h-4" />
                  <span>🚗 2. Aktif İşler ({sortedJobsForUser.filter(j => currentUser.role === 'admin' || (j.assignedWorkers?.includes(currentUser.name) && j.status !== 'Tamamlandı')).length})</span>
                </button>
                <button onClick={() => setActiveTab('worker-completed')} className={`px-4 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'worker-completed' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✅ 3. Tamamlanan İşler ({jobs.filter(j => j.assignedWorkers?.includes(currentUser.name) && j.status === 'Tamamlandı').length})</span>
                </button>
              </>
            )}

          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        
        {/* YÖNETİCİ DASHBOARD & ROTA TAKİBİ */}
        {activeTab === 'dashboard' && currentUser.role === 'admin' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-lg">
              <div>
                <h2 className="text-2xl font-black">Hoş Geldiniz, Bahadır Bey 👋</h2>
                <p className="text-xs text-slate-300 mt-1">Pevuno Solution Canlı Saha Operasyon ve Rota Merkezi</p>
              </div>
              <button onClick={() => setActiveTab('new-job')} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg transition text-xs flex items-center space-x-1">
                <PlusCircle className="w-4 h-4" />
                <span>Hızlı İş Kaydı</span>
              </button>
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
                <span className="text-xs font-bold text-slate-400 uppercase">Toplam Ciro</span>
                <div className="text-2xl font-black text-blue-600">{totalRevenue} TL</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Müşteri Sayısı</span>
                <div className="text-2xl font-black text-purple-600">{customers.length} Kişi</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-emerald-600" />
                <span>🧭 Canlı Saha Rota ve Zamanlama Takibi (Kim Nereye, Ne Zaman?)</span>
              </h3>
              <p className="text-xs text-slate-500">Yönetici olarak ekibin aktif olarak yürüteceği işlerin kronolojik sıra takibi:</p>
              <div className="space-y-2">
                {sortedJobsForUser.filter(j => j.status !== 'Tamamlandı').map((job, idx) => (
                  <div key={job.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-mono bg-slate-900 text-emerald-400 px-2 py-0.5 rounded font-bold">Sıra: #{idx + 1}</span>
                        <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">📅 {job.date} - ⏰ {job.time || '10:00'}</span>
                      </div>
                      <strong className="text-sm text-slate-900">{job.customerName}</strong>
                      <p className="text-slate-600 mt-0.5">📍 {job.address}</p>
                    </div>
                    <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                      <span className="text-slate-500 block">Görevli Ekip</span>
                      <strong className="text-emerald-700 font-bold">{job.assignedWorkers?.join(', ') || 'Atanmadı'}</strong>
                    </div>
                  </div>
                ))}
                {sortedJobsForUser.filter(j => j.status !== 'Tamamlandı').length === 0 && (
                  <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                    Aktif sırada bekleyen iş bulunmuyor.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* SAHA PERSONELİ 1. SAYFA: DASHBOARD & HAKEDİŞ */}
        {activeTab === 'worker-dashboard' && currentUser.role === 'worker' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-lg space-y-2">
              <h2 className="text-2xl font-black">Merhaba, {currentUser.name} 👷</h2>
              <p className="text-xs text-slate-300">Pevuno Solution Saha Performans ve Hakediş Özet Paneli</p>
            </div>

            {(() => {
              const myAllJobs = jobs.filter(j => j.assignedWorkers?.includes(currentUser.name));
              const myCompletedJobs = myAllJobs.filter(j => j.status === 'Tamamlandı');
              const myActiveJobs = myAllJobs.filter(j => j.status !== 'Tamamlandı');
              
              const myTotalEarnings = myCompletedJobs.reduce((acc, j) => {
                const detail = j.workerHakedisDetails?.find(w => w.workerName === currentUser.name);
                return acc + (detail ? Number(detail.amount) : 0);
              }, 0);

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase">Toplam Hakediş (Kazanç)</span>
                    <div className="text-2xl font-black text-emerald-600">{myTotalEarnings} TL</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase">Tamamlanan İşler</span>
                    <div className="text-2xl font-black text-blue-600">{myCompletedJobs.length} İş</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase">Aktif Bekleyen İşler</span>
                    <div className="text-2xl font-black text-amber-600">{myActiveJobs.length} İş</div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3 text-center">
              <h3 className="font-bold text-slate-800 text-sm">Hızlı İşlem Yönlendirmesi</h3>
              <p className="text-xs text-slate-500">Sıradaki işlerinizi görmek ve rota takibi yapmak için "Aktif İşler" sekmesine geçebilirsiniz.</p>
              <button onClick={() => setActiveTab('jobs')} className="bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow">
                🚗 Aktif İşlerime Git
              </button>
            </div>
          </div>
        )}

        {/* SAHA PERSONELİ 2. SAYFA: AKTİF İŞLER & ROTA AKIŞI */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow">
              <div>
                <h2 className="text-lg font-bold flex items-center space-x-2">
                  <Navigation className="w-5 h-5 text-emerald-400" />
                  <span>{currentUser.role === 'admin' ? 'Tüm Saha İş Akışı & Sıralı Rota' : 'Günün Aktif Görev Akışı & Rotam'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Henüz tamamlanmamış aktif işler kronolojik sırayla listelenmiştir.</p>
              </div>
              {currentUser.role === 'admin' && (
                <button onClick={() => setActiveTab('new-job')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow">
                  <PlusCircle className="w-4 h-4" />
                  <span>Yeni İş</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedJobsForUser
                .filter(job => currentUser.role === 'admin' || job.status !== 'Tamamlandı')
                .map((job, index) => {
                  const myHakedisObj = job.workerHakedisDetails?.find(w => w.workerName === currentUser.name);
                  const jobDateObj = new Date(job.date);
                  const todayObj = new Date(todayStr);
                  const isToday = job.date === todayStr;
                  const isPast = jobDateObj < todayObj && job.status !== 'Tamamlandı';

                  return (
                    <div key={job.id} className={`bg-white rounded-2xl p-5 shadow-sm border space-y-4 hover:shadow-md transition relative overflow-hidden ${
                      isToday ? 'border-emerald-500 ring-2 ring-emerald-500/20' : isPast ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                    }`}>
                      
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-2">
                          <span className="bg-slate-900 text-emerald-400 font-extrabold text-xs px-2.5 py-1 rounded-lg">
                            📍 SIRA: #{index + 1}
                          </span>
                          {isToday && <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded">BUGÜN</span>}
                          {isPast && <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded">GÜNÜ GEÇTİ</span>}
                          {job.kvkkApproved && (
                            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200 flex items-center">
                              <ShieldCheck className="w-3 h-3 mr-1" /> KVKK
                            </span>
                          )}
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
                            <button onClick={() => handleDeleteJob(job.id)} className="text-slate-400 hover:text-rose-600 p-1" title="İşi Sil">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-extrabold text-lg text-slate-900">{job.customerName}</h3>
                            {job.companyName && <p className="text-xs text-slate-500 font-medium">🏢 {job.companyName}</p>}
                          </div>
                          <span className="text-xs bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg font-bold border border-blue-200">
                            📅 {job.date} | ⏰ {job.time || '10:00'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 text-slate-700">
                            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{job.address}</span>
                          </div>
                          <a href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`} target="_blank" rel="noreferrer" className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 hover:bg-emerald-700 shrink-0 shadow">
                            <Navigation className="w-3 h-3" />
                            <span>Yol Tarifi</span>
                          </a>
                        </div>
                        <div className="flex items-center justify-between pt-1 text-xs text-slate-600">
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <a href={`tel:${job.phone}`} className="hover:underline font-mono">{job.phone}</a>
                          </div>
                          <div className="bg-slate-200/70 px-2 py-0.5 rounded font-medium">
                            👷 Ekip: <strong>{formatWorkerNameMasked(job.assignedWorkers)}</strong>
                          </div>
                        </div>

                        {currentUser.role === 'admin' && job.workerHakedisDetails && job.workerHakedisDetails.length > 0 && (
                          <div className="text-[11px] bg-blue-50 border border-blue-200 text-blue-900 p-2 rounded-lg space-y-0.5">
                            <span className="font-bold">💰 Personel Hakedişleri:</span>
                            {job.workerHakedisDetails.map((wh, wIdx) => (
                              <div key={wIdx} className="flex justify-between">
                                <span>• {wh.workerName}:</span>
                                <span className="font-bold">{wh.amount} TL</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {currentUser.role === 'worker' && myHakedisObj && (
                          <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 p-2 rounded-lg font-bold flex justify-between">
                            <span>💰 Bu İşten Alacağın Hakediş:</span>
                            <span className="text-emerald-700 text-sm">{myHakedisObj.amount} TL</span>
                          </div>
                        )}
                      </div>

                      <div className="divide-y divide-slate-100 text-sm">
                        {job.items.map((item, idx) => (
                          <div key={idx} className="py-1 flex justify-between">
                            <span className="text-slate-700">{item.serviceName} x{item.qty}</span>
                            <span className="font-medium text-slate-900">{item.qty * item.unitPrice} TL</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm">
                        <div>
                          <span className="text-slate-500 text-xs">Toplam Tutar: </span>
                          <span className="font-extrabold text-base text-slate-900">{job.totalAmount} TL</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs block text-slate-500">Ödeme Durumu</span>
                          <span className="text-xs font-bold text-emerald-600">
                            {job.paidAmount >= job.totalAmount ? `Ödendi (${job.paymentMethod})` : 'Bekliyor'}
                          </span>
                        </div>
                      </div>

                      {currentUser.role === 'worker' && job.status !== 'Tamamlandı' && (
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-2">
                          <p className="text-xs font-bold text-emerald-900">İş bitti mi? Ödemeyi nasıl aldınız?</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleWorkerCompleteJob(job.id, 'Elden (Saha)')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow">💵 Elden Aldım</button>
                            <button onClick={() => handleWorkerCompleteJob(job.id, 'IBAN (Yönetici)')} className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-lg shadow">🏦 IBAN'a Atıldı</button>
                          </div>
                        </div>
                      )}

                      {currentUser.role === 'admin' && (
                        <div className="space-y-1.5 pt-1">
                          <button onClick={() => sendWhatsAppAppointmentConfirmation(job)} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow transition">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>📅 Müşteriye Randevu Onay Mesajı Gönder (WP)</span>
                          </button>
                          <button onClick={() => sendWhatsAppNotificationToWorker(job)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow transition">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>👷 Çalışana WP ile İş Detayını Gönder</span>
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button onClick={() => sendWhatsAppOnTheWay(job)} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] py-2 px-1 rounded-xl flex items-center justify-center space-x-1 shadow transition">
                          <Send className="w-3 h-3" />
                          <span>Yola Çıkıldı</span>
                        </button>
                        <button onClick={() => sendWhatsAppCompletion(job)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] py-2 px-1 rounded-xl flex items-center justify-center space-x-1 shadow transition">
                          <MessageSquare className="w-3 h-3" />
                          <span>Servis Bitti</span>
                        </button>
                        <button onClick={() => setSelectedJobForReceipt(job)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] py-2 px-1 rounded-xl flex items-center justify-center space-x-1 border border-slate-200 transition">
                          <FileText className="w-3 h-3" />
                          <span>Servis Fişi</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

              {sortedJobsForUser.filter(job => currentUser.role === 'admin' || job.status !== 'Tamamlandı').length === 0 && (
                <div className="col-span-2 p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
                  Aktif sırada bekleyen iş bulunmuyor.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SAHA PERSONELİ 3. SAYFA: TAMAMLANAN İŞLER ARŞİVİ */}
        {activeTab === 'worker-completed' && currentUser.role === 'worker' && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow">
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Tamamlanan İşler Arşivi</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Bugüne kadar başarıyla tamamladığınız tüm servislerin geçmiş kayıtları.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs
                .filter(job => job.assignedWorkers?.includes(currentUser.name) && job.status === 'Tamamlandı')
                .map((job) => {
                  const myHakedisObj = job.workerHakedisDetails?.find(w => w.workerName === currentUser.name);

                  return (
                    <div key={job.id} className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-200 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-lg">
                          ✅ TAMAMLANDI
                        </span>
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">📅 {job.date}</span>
                      </div>

                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{job.customerName}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">📍 {job.address}</p>
                      </div>

                      {myHakedisObj && (
                        <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 p-2.5 rounded-xl font-bold flex justify-between">
                          <span>💰 Alınan Hakediş:</span>
                          <span className="text-emerald-700 text-sm">{myHakedisObj.amount} TL</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                        <span className="text-slate-500">Ödeme: <strong>{job.paymentMethod}</strong></span>
                        <button onClick={() => setSelectedJobForReceipt(job)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-200">
                          Servis Fişini Gör
                        </button>
                      </div>
                    </div>
                  );
                })}

              {jobs.filter(job => job.assignedWorkers?.includes(currentUser.name) && job.status === 'Tamamlandı').length === 0 && (
                <div className="col-span-2 p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                  Henüz tamamlanmış bir işiniz bulunmuyor.
                </div>
              )}
            </div>
          </div>
        )}

        {/* YENİ İŞ KAYDI */}
        {activeTab === 'new-job' && currentUser.role === 'admin' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <PlusCircle className="w-6 h-6 text-emerald-600" />
              <span>Yeni Müşteri & İş Randevusu Oluştur</span>
            </h2>
            <form onSubmit={handleCreateJob} className="space-y-6">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Kayıtlı Müşteri Ara ve Seç</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Müşteri adı, telefon veya firma yazın..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>

                {customerSearchQuery && (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 bg-white rounded-xl divide-y divide-slate-100 shadow-sm">
                    {filteredCustomersForJob.map(cust => (
                      <div 
                        key={cust.id} 
                        onClick={() => {
                          handleSelectCustomerFromDropdown(cust);
                          setCustomerSearchQuery('');
                        }}
                        className="p-2.5 hover:bg-emerald-50 cursor-pointer flex justify-between items-center text-xs transition"
                      >
                        <div>
                          <strong className="text-slate-900">{cust.name}</strong>
                          {cust.company && <span className="text-slate-500 font-normal ml-1">({cust.company})</span>}
                        </div>
                        <span className="font-mono text-emerald-600">{cust.phone}</span>
                      </div>
                    ))}
                    {filteredCustomersForJob.length === 0 && (
                      <div className="p-3 text-xs text-slate-400 text-center">Eşleşen müşteri bulunamadı.</div>
                    )}
                  </div>
                )}
                {selectedExistingCustomer && (
                  <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-2.5 rounded-lg">
                    <span>Seçilen Müşteri: <strong>{newCustomerName}</strong> ({newCustomerPhone})</span>
                    <button type="button" onClick={() => handleSelectCustomerFromDropdown(null)} className="text-rose-600 font-bold hover:underline">Temizle</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Müşteri Adı Soyadı *</label>
                  <input type="text" required placeholder="Örn: Mehmet Öz" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Firma / Kurum Adı (Opsiyonel)</label>
                  <input type="text" placeholder="Örn: Öz İnşaat A.Ş." value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Telefon Numarası *</label>
                  <input type="text" required placeholder="Örn: 05321234567" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Gidecek Personeller ve Hakedişleri *</label>
                  <div className="border border-slate-300 rounded-xl p-3 bg-white space-y-2 max-h-44 overflow-y-auto">
                    {workers.map(w => {
                      const isChecked = selectedWorkers.includes(w.name);
                      return (
                        <div key={w.id} className="space-y-1 border-b border-slate-100 pb-2">
                          <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedWorkers([...selectedWorkers, w.name]);
                                else setSelectedWorkers(selectedWorkers.filter(name => name !== w.name));
                              }}
                              className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <span>{w.name}</span>
                          </label>
                          {isChecked && (
                            <div className="pl-6 flex items-center space-x-2">
                              <span className="text-[11px] text-slate-500">Hakediş (TL):</span>
                              <input 
                                type="number" 
                                placeholder="Örn: 1000"
                                value={workerHakedisMap[w.name] !== undefined ? workerHakedisMap[w.name] : 300}
                                onChange={(e) => setWorkerHakedisMap({ ...workerHakedisMap, [w.name]: e.target.value })}
                                className="border border-slate-300 rounded-lg px-2 py-1 text-xs w-28 bg-slate-50 font-bold text-emerald-700"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Açık Adres *</label>
                  <textarea rows={2} required placeholder="İlçe, Mahalle, Cadde, Sokak, Bina No, Daire..." value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
                </div>
              </div>

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

              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

              <div className="space-y-3">
                <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <input type="checkbox" id="kvkkCheck" checked={kvkkChecked} onChange={(e) => setKvkkChecked(e.target.checked)} className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer" />
                  <label htmlFor="kvkkCheck" className="text-xs text-slate-700 cursor-pointer">
                    Müşteri KVKK Aydınlatma Metnini onayladı.
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Randevu Tarihi</label>
                    <input type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Randevu Saati</label>
                    <input type="time" value={jobTime} onChange={(e) => setJobTime(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Özel Saha Notu</label>
                    <input type="text" placeholder="Örn: Evde kedi var..." value={newNote} onChange={(e) => setNewNote(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition">İş Randevusunu Oluştur ve Kaydet 🚀</button>
            </form>
          </div>
        )}

        {/* MÜŞTERİLER SEKMESİ */}
        {activeTab === 'customers' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <UserCheck2 className="w-5 h-5 text-emerald-600" />
                <span>Müşteri Sayfasından Yeni Müşteri Ekle</span>
              </h2>
              <form onSubmit={handleAddDirectCustomer} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input type="text" required placeholder="Müşteri Adı Soyadı *" value={directCustName} onChange={(e) => setDirectCustName(e.target.value)} className="border border-slate-300 rounded-xl px-3.5 py-2 text-sm bg-white" />
                <input type="text" required placeholder="Telefon (0532...) *" value={directCustPhone} onChange={(e) => setDirectCustPhone(e.target.value)} className="border border-slate-300 rounded-xl px-3.5 py-2 text-sm bg-white" />
                <input type="text" placeholder="Firma Adı (Opsiyonel)" value={directCustCompany} onChange={(e) => setDirectCustCompany(e.target.value)} className="border border-slate-300 rounded-xl px-3.5 py-2 text-sm bg-white" />
                <input type="text" placeholder="Varsayılan Adres (Opsiyonel)" value={directCustAddress} onChange={(e) => setDirectCustAddress(e.target.value)} className="border border-slate-300 rounded-xl px-3.5 py-2 text-sm bg-white" />
                <div className="sm:col-span-2">
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm shadow transition">
                    Müşteriyi Kaydet 👤
                  </button>
                </div>
              </form>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-2">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-6 h-6 text-emerald-600" />
                <span>Kayıtlı Müşteri Veri Tabanı ({customers.length})</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {customers.map((cust) => {
                const daysPassed = getDaysSinceLastJob(cust.lastJobDate);
                return (
                  <div key={cust.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-base text-slate-900">{cust.name} {cust.company && <span className="text-xs text-slate-500">({cust.company})</span>}</h3>
                        <p className="text-xs text-emerald-600 font-mono mt-0.5">📞 {cust.phone}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => toggleCustomerKvkkStatus(cust.id)} 
                          className={`text-[11px] font-bold px-3 py-1.5 rounded-lg shadow border transition flex items-center space-x-1 ${
                            cust.kvkk ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-emerald-50'
                          }`}
                        >
                          <span>{cust.kvkk ? '🛡️ KVKK Onaylı (İptal Et)' : '☑️ KVKK Onayı İşaretle'}</span>
                        </button>
                        {!cust.kvkk && (
                          <button onClick={() => sendKvkkApprovalRequest(cust)} className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow">
                            🛡️ KVKK Onay İste (WP)
                          </button>
                        )}
                        <button onClick={() => handleDeleteCustomer(cust.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition" title="Müşteriyi Sil">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kayıtlı Adresler ({cust.addresses?.length || 0}):</p>
                      {cust.addresses?.map((addr, idx) => (
                        <p key={idx} className="text-xs text-slate-700 flex items-start space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{addr}</span>
                        </p>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium">
                        Son İşlem: {cust.lastJobDate || 'Yeni'} {daysPassed ? `(${daysPassed} gün önce)` : ''}
                      </span>
                      <button onClick={() => sendSixMonthReminder(cust)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg shadow">
                        6 Ay Hatırlatması Gönder 📲
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FİYATLAR SEKMESİ */}
        {activeTab === 'catalog' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Settings className="w-6 h-6 text-emerald-600" />
                <span>Hizmet & Fiyat Listesi Yönetimi</span>
              </h2>
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
                      <button onClick={() => updateServices(services.filter(s => s.id !== srv.id))} className="p-2 text-slate-500 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <span>WhatsApp KVKK & Onay Mesajı Şablonu Düzenle</span>
              </h2>
              <form onSubmit={handleSaveKvkkTemplate} className="space-y-3">
                <textarea 
                  rows={8}
                  value={tempKvkkInput}
                  onChange={(e) => setTempKvkkInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3.5 text-xs font-mono bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow transition">
                  KVKK Şablonunu Kaydet 💾
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <RefreshCw className="w-6 h-6 text-emerald-600" />
                  <span>6 Aylık (180+ Gün) Temizlik Hatırlatıcıları</span>
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  {reminderEligibleCustomers.length} Müşteri Ulaştı
                </span>
              </div>
              
              <div className="space-y-2">
                {reminderEligibleCustomers.map(c => {
                  const daysPassed = getDaysSinceLastJob(c.lastJobDate);
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 text-sm">
                      <div>
                        <span className="font-bold text-slate-900">{c.name}</span>
                        <span className="text-xs text-slate-500 ml-2">({c.phone})</span>
                        <span className="block text-xs font-semibold text-amber-800 mt-0.5">
                          ⏳ Son Temizlik: {c.lastJobDate} ({daysPassed} gün geçti)
                        </span>
                      </div>
                      <button onClick={() => sendSixMonthReminder(c)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow flex items-center space-x-1">
                        <span>Hatırlatma Gönder 📲</span>
                      </button>
                    </div>
                  );
                })}
                
                {reminderEligibleCustomers.length === 0 && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                    Şu an için son hizmetinin üzerinden 180 gün (6 ay) geçmiş KVKK onaylı müşteri bulunmuyor.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PERSONEL SEKMESİ */}
        {activeTab === 'workers' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-6 h-6 text-emerald-600" />
                <span>Saha Personeli & Şifre Yönetimi</span>
              </h2>
              <form onSubmit={handleAddWorker} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input type="text" required placeholder="Personel Adı Soyadı" value={newWorkerName} onChange={(e) => setNewWorkerName(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="text" required placeholder="Giriş PIN" value={newWorkerPin} onChange={(e) => setNewWorkerPin(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <input type="text" placeholder="Telefon (0532...)" value={newWorkerPhone} onChange={(e) => setNewWorkerPhone(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm shadow flex items-center justify-center space-x-1">
                  <UserPlus className="w-4 h-4 mr-1" />
                  <span>Personel Ekle</span>
                </button>
              </form>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {workers.map((w) => (
                  <div key={w.id} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{w.name}</h4>
                      <span className="text-xs text-slate-400 font-mono">Giriş PIN: {w.pin} | Tel: {w.phone || 'Girilmedi'}</span>
                    </div>
                    <button onClick={() => handleDeleteWorker(w.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition" title="Sil">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KASA SEKMESİ */}
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

        {/* YÖNETİCİ ŞİFRE DEĞİŞTİRME SEKMESİ */}
        {activeTab === 'security' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Lock className="w-6 h-6 text-emerald-600" />
                <span>Yönetici Şifresini Değiştir</span>
              </h2>
              <p className="text-xs text-slate-500">Mevcut şifreniz bulutta güvenle saklanır. Buradan yeni bir şifre belirleyebilirsiniz.</p>
              <form onSubmit={handleSaveAdminPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Yeni Yönetici Şifresi</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="Yeni şifrenizi girin..." 
                    value={newAdminPassInput} 
                    onChange={(e) => setNewAdminPassInput(e.target.value)} 
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow transition">
                  Şifreyi Güncelle ve Buluta Kaydet 🔒
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* SERVİS FİŞİ POPUP & FOTOĞRAF OLARAK İNDİRME */}
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
              <button 
                onClick={downloadReceiptAsImage} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow flex items-center justify-center space-x-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>📸 Fiş Görselini İndir (JPEG - WP İçin)</span>
              </button>

              <div className="flex space-x-2">
                <button onClick={() => window.print()} className="flex-1 bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs shadow">
                  Yazdır / PDF
                </button>
                <button onClick={() => setSelectedJobForReceipt(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs border border-slate-200">
                  Kapat
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
