import React, { useState, useEffect } from 'react';
import { 
  Users, ShoppingBag, PlusCircle, Calendar, RefreshCw, 
  TrendingUp, CheckCircle2, Clock, MapPin, Phone, 
  MessageSquare, DollarSign, Edit3, Trash2, 
  FileText, Star, Settings, Percent, Tag, LogOut, ChevronRight, Lock, ShieldCheck, UserPlus, Cloud, BookOpen, Send, UserCheck, LayoutDashboard, UserCheck2
} from 'lucide-react';

const SUPABASE_URL = "https://esmmpztgmkeuyhzubbaf.supabase.co";
const SUPABASE_KEY = "sb_publishable_506jwPoEvILEU07Xad7zEA_ywR6FixZ";

async function fetchSupabaseData(key, defaultVal) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_data?key=eq.${key}`, {
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
    await fetch(`${SUPABASE_URL}/rest/v1/app_data?key=eq.${key}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    await fetch(`${SUPABASE_URL}/rest/v1/app_data`, {
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

_(Yasal Bilgilendirme: 6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca, veri sorumlusu sıfatıyla kimlik, iletişim ve hizmet lokasyonu verileriniz yalnızca randevu operasyonlarının yürütülmesi ve periyodik bakım hatırlatmalarının yapılabilmesi amacıyla işlenmektedir. Detaylı Aydınlatma Metnimize dilediğiniz zaman ulaşabilir; kişisel verilerinizle ilgili her türlü hak ve talebinizi bizimle her zaman paylaşabilirsiniz.)_

Sağlıklı ve hijyenik günler dileriz.
Pevuno Solution`;

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('pevuno_logged_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [loginPin, setLoginPin] = useState('');
  const [loginType, setLoginType] = useState('admin');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [isSynced, setIsSynced] = useState(false);

  // Yerel Hafıza (LocalStorage) Destekli State Yönetimi (Asla kaybolma/geri gelme olmaz)
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

  // İlk Açılışta Buluttan Veri Çekme (Sadece eksikse veya ilk yüklemede)
  useEffect(() => {
    async function initCloudData() {
      const cloudServices = await fetchSupabaseData('services', null);
      if (cloudServices && cloudServices.length > 0) {
        setServices(cloudServices);
        localStorage.setItem('pevuno_services', JSON.stringify(cloudServices));
      }

      const cloudWorkers = await fetchSupabaseData('workers', null);
      if (cloudWorkers) {
        setWorkers(cloudWorkers);
        localStorage.setItem('pevuno_workers', JSON.stringify(cloudWorkers));
      }

      const cloudJobs = await fetchSupabaseData('jobs', null);
      if (cloudJobs) {
        setJobs(cloudJobs);
        localStorage.setItem('pevuno_jobs', JSON.stringify(cloudJobs));
      }

      const cloudCustomers = await fetchSupabaseData('customers', null);
      if (cloudCustomers) {
        setCustomers(cloudCustomers);
        localStorage.setItem('pevuno_customers', JSON.stringify(cloudCustomers));
      }

      const cloudKvkk = await fetchSupabaseData('kvkk_template', null);
      if (cloudKvkk) {
        setKvkkTemplate(cloudKvkk);
        setTempKvkkInput(cloudKvkk);
        localStorage.setItem('pevuno_kvkk', cloudKvkk);
      }

      setIsSynced(true);
    }
    initCloudData();
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
  const [workerHakedis, setWorkerHakedis] = useState(300);

  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPin, setNewWorkerPin] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');

  const [newService, setNewService] = useState({ name: '', price: '', unit: 'adet' });
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [selectedJobForReceipt, setSelectedJobForReceipt] = useState(null);

  useEffect(() => { localStorage.setItem('pevuno_logged_user', JSON.stringify(currentUser)); }, [currentUser]);

  // Anında Yerel Kayıt + Bulut Senkronizasyonu
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
      if (loginPin === '1453' || loginPin === 'admin') {
        setCurrentUser({ role: 'admin', name: 'Bahadır (Yönetici)' });
        setActiveTab('dashboard');
      } else {
        alert('Hatalı Yönetici Şifresi! (Şifre: 1453)');
      }
    } else {
      const worker = workers.find(w => w.id === selectedWorkerId);
      if (worker && loginPin === worker.pin) {
        setCurrentUser({ role: 'worker', name: worker.name });
        setActiveTab('jobs');
      } else {
        alert('Hatalı Personel Şifresi (PIN)!');
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

  const handleSelectCustomerFromDropdown = (custId) => {
    setSelectedExistingCustomer(custId);
    if (!custId) {
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCompany('');
      return;
    }
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      setNewCustomerName(cust.name);
      setNewCustomerPhone(cust.phone);
      setNewCompany(cust.company || '');
      setKvkkChecked(cust.kvkk || false);
      if (cust.addresses && cust.addresses.length > 0) {
        setNewAddress(cust.addresses[0]);
      }
    }
  };

  const handleCreateJob = (e) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone || selectedItems.length === 0 || !newAddress) {
      alert('Lütfen müşteri adı, telefon, adres ve en az 1 hizmet seçiniz.');
      return;
    }

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
      workerHakedis: Number(workerHakedis) || 300,
      kvkkApproved: kvkkChecked,
      paymentMethod: 'Elden (Saha)',
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
    alert('İş tamamlandı ve yöneticiye bildirildi!');
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
    const reviewLink = "https://g.page/r/pevuno-solution/review";
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
    msg += `\n💵 *Ödenen:* ${job.paidAmount} TL`;
    msg += `\n📌 *Kalan Bakiye:* ${remaining > 0 ? `${remaining} TL` : 'Ödendi ✅'}\n\n`;
    msg += `Hizmetimizden memnun kaldıysanız Google üzerinden yorum bırakarak destek olabilirsiniz:\n⭐ ${reviewLink}\n\n`;
    msg += `Teşekkür ederiz! 🧼🚿`;

    const encoded = encodeURIComponent(msg);
    const cleanPhone = job.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `9${cleanPhone}` : cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
  };

  const sendSixMonthReminder = (cust) => {
    let msg = `Merhaba *${cust.name}*,\n\n`;
    msg += `🌿 *PEVUNO SOLUTION* ailesi olarak sağlıklı günler dileriz.\n`;
    msg += `Son profesyonel koltuk/halı temizliğinizin üzerinden yaklaşık 6 ay geçti. Periyodik koltuk yıkama zamanınız yaklaşmıştır.\n\n`;
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="bg-emerald-500 w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-slate-950 text-2xl font-black shadow-lg">✨</div>
            <h1 className="text-2xl font-black text-slate-900">PEVUNO SOLUTION</h1>
            <p className="text-xs text-slate-500">Bulut Senkronize Saha Yönetimi</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button type="button" onClick={() => setLoginType('admin')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${loginType === 'admin' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}>👑 Yönetici Girişi</button>
              <button type="button" onClick={() => setLoginType('worker')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${loginType === 'worker' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}>👷 Saha Personeli</button>
            </div>

            {loginType === 'worker' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Personel Seçiniz</label>
                <select value={selectedWorkerId} onChange={(e) => setSelectedWorkerId(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-slate-50">
                  <option value="">Personel Seçin...</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">{loginType === 'admin' ? 'Yönetici Şifresi (1453)' : 'Personel Şifresi (PIN)'}</label>
              <input type="password" required placeholder="Şifrenizi girin..." value={loginPin} onChange={(e) => setLoginPin(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500" />
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
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-2 rounded-xl text-slate-950 font-bold">✨</div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight flex items-center gap-2">
                PEVUNO SOLUTION 
                {isSynced ? <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center"><Cloud className="w-3 h-3 mr-1"/> Hazır</span> : <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Yükleniyor...</span>}
              </h1>
              <p className="text-xs text-slate-400">Aktif Kullanıcı: <strong className="text-emerald-400">{currentUser.name}</strong></p>
            </div>
          </div>

          <button onClick={() => setCurrentUser(null)} className="bg-slate-800 hover:bg-rose-900/40 text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center space-x-1.5 transition">
            <LogOut className="w-4 h-4" />
            <span>Çıkış Yap</span>
          </button>
        </div>

        <div className="bg-slate-800 border-t border-slate-700 w-full overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 flex justify-start sm:justify-center space-x-2 text-sm py-1">
            {currentUser.role === 'admin' && (
              <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'dashboard' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            )}

            <button onClick={() => setActiveTab('jobs')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'jobs' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
              <ShoppingBag className="w-4 h-4" />
              <span>İş Listesi ({currentUser.role === 'worker' ? jobs.filter(j => j.assignedWorkers?.includes(currentUser.name)).length : jobs.length})</span>
            </button>

            {currentUser.role === 'admin' && (
              <>
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
                <h2 className="text-2xl font-black">Hoş Geldiniz, Bahadır Bey 👋</h2>
                <p className="text-xs text-slate-300 mt-1">Pevuno Solution Saha Operasyonu Genel Özet Tablosu</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Yaklaşan Son İşler</span>
                </h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {jobs.slice(0, 4).map(j => (
                    <div key={j.id} className="py-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800">{j.customerName}</span>
                        <p className="text-[11px] text-slate-400">{j.date} | {j.time || '10:00'}</p>
                      </div>
                      <span className="bg-slate-100 px-2 py-1 rounded font-semibold text-slate-700">{j.totalAmount} TL</span>
                    </div>
                  ))}
                  {jobs.length === 0 && <p className="text-slate-400 py-2">Henüz iş kaydı bulunmuyor.</p>}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Aktif Saha Ekibi ({workers.length})</span>
                </h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {workers.map(w => (
                    <div key={w.id} className="py-2.5 flex justify-between items-center">
                      <span className="font-bold text-slate-800">{w.name}</span>
                      <span className="text-slate-400 font-mono">Tel: {w.phone || 'Girilmedi'}</span>
                    </div>
                  ))}
                  {workers.length === 0 && <p className="text-slate-400 py-2">Henüz eklene personel yok.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{currentUser.role === 'admin' ? 'Tüm Saha İşleri ve Randevular' : 'Bana Atanan İşler'}</h2>
              {currentUser.role === 'admin' && (
                <button onClick={() => setActiveTab('new-job')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 shadow">
                  <PlusCircle className="w-4 h-4" />
                  <span>Yeni İş Ekle</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs
                .filter(j => currentUser.role === 'admin' || j.assignedWorkers?.includes(currentUser.name))
                .map((job) => (
                <div key={job.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">{job.id}</span>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200">
                          📅 {job.date} | ⏰ {job.time || '10:00'}
                        </span>
                        {job.kvkkApproved && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200 flex items-center">
                            <ShieldCheck className="w-3 h-3 mr-1" /> KVKK
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
                        <button onClick={() => handleDeleteJob(job.id)} className="text-slate-400 hover:text-rose-600 p-1" title="İşi Sil">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2 text-slate-700">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{job.address}</span>
                      </div>
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`} target="_blank" rel="noreferrer" className="bg-white border border-slate-200 text-xs font-semibold px-2.5 py-1 rounded-lg text-slate-700 hover:bg-slate-100 shrink-0 shadow-sm">
                        Yol Tarifi
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

                    {job.note && (
                      <div className="mt-1 text-xs bg-amber-50 border border-amber-200 text-amber-900 p-2 rounded-lg">
                        📌 <strong>Not:</strong> {job.note}
                      </div>
                    )}
                  </div>

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
                    <div className="pt-1">
                      <button onClick={() => sendWhatsAppNotificationToWorker(job)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow transition mb-2">
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
              ))}
            </div>
          </div>
        )}

        {activeTab === 'new-job' && currentUser.role === 'admin' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <PlusCircle className="w-6 h-6 text-emerald-600" />
              <span>Yeni Müşteri & İş Randevusu Oluştur</span>
            </h2>

            <form onSubmit={handleCreateJob} className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Kayıtlı Müşterilerden Seç (Opsiyonel)</label>
                <select
                  value={selectedExistingCustomer}
                  onChange={(e) => handleSelectCustomerFromDropdown(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white"
                >
                  <option value="">-- Yeni Müşteri Ekle veya Kayıtlı Seç --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone}) {c.company ? `- ${c.company}` : ''}</option>
                  ))}
                </select>
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
                  <label className="block text-xs font-bold text-slate-600 mb-1">Gidecek Personeller (Çoklu Seçim) *</label>
                  <div className="border border-slate-300 rounded-xl p-2.5 bg-white space-y-1.5 max-h-36 overflow-y-auto">
                    {workers.map(w => (
                      <label key={w.id} className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedWorkers.includes(w.name)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedWorkers([...selectedWorkers, w.name]);
                            else setSelectedWorkers(selectedWorkers.filter(name => name !== w.name));
                          }}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span>{w.name}</span>
                      </label>
                    ))}
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
              {customers.map((cust) => (
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
                    <span className="text-slate-400">Son İşlem: {cust.lastJobDate || 'Yeni'}</span>
                    <button onClick={() => sendSixMonthReminder(cust)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg shadow">
                      6 Ay Hatırlatması Gönder 📲
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'workers' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-6 h-6 text-emerald-600" />
                <span>Saha Personeli & Şifre Yönetimi</span>
              </h2>

              <form onSubmit={handleAddWorker} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input type="text" required placeholder="Personel Adı" value={newWorkerName} onChange={(e) => setNewWorkerName(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
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
                {workers.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">Henüz personel eklenmedi.</div>
                )}
              </div>
            </div>
          </div>
        )}

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

        {/* HATIRLATICILAR VE KVKK ŞABLON YÖNETİMİ */}
        {activeTab === 'reminders' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <span>WhatsApp KVKK & Onay Mesajı Şablonu Düzenle</span>
              </h2>
              <p className="text-xs text-slate-500">Müşterilere gönderilen onay mesajını buradan dilediğin zaman değiştirebilirsin. ([Müşteri Adı] yazan yer otomatik olarak müşterinin adıyla değiştirilir).</p>

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
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <RefreshCw className="w-6 h-6 text-emerald-600" />
                <span>6 Aylık Periyodik Temizlik Hatırlatıcıları</span>
              </h2>

              <div className="space-y-2">
                {customers.filter(c => c.kvkk).map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                    <div>
                      <span className="font-bold text-slate-900">{c.name}</span>
                      <span className="text-xs text-slate-500 ml-2">({c.phone})</span>
                    </div>
                    <button onClick={() => sendSixMonthReminder(c)} className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow">
                      6 Ay Hatırlatması Gönder 📲
                    </button>
                  </div>
                ))}
                {customers.filter(c => c.kvkk).length === 0 && (
                  <p className="text-xs text-slate-400 py-2">Henüz KVKK onaylı müşteri bulunmuyor.</p>
                )}
              </div>
            </div>
          </div>
        )}

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

      {/* SERVİS FİŞİ POPUP */}
      {selectedJobForReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="border-b border-slate-200 pb-4 text-center space-y-1">
              <h2 className="text-2xl font-extrabold text-slate-900">PEVUNO SOLUTION</h2>
              <p className="text-xs text-slate-500">Profesyonel Temizlik & Hijyen Servis Fişi</p>
              <p className="text-xs font-medium text-emerald-700 mt-1">Saha Ekibi: {formatWorkerNameMasked(selectedJobForReceipt.assignedWorkers)}</p>
            </div>

            <div className="text-xs space-y-1 text-slate-600">
              <p><strong>Müşteri:</strong> {selectedJobForReceipt.customerName}</p>
              <p><strong>Telefon:</strong> {selectedJobForReceipt.phone}</p>
              <p><strong>Adres:</strong> {selectedJobForReceipt.address}</p>
              <p><strong>Randevu:</strong> {selectedJobForReceipt.date} - {selectedJobForReceipt.time}</p>
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
