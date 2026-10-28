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
    return saved ? JSON.parse(saved) : null;
  });
  
  const [loginPin, setLoginPin] = useState('');
  const [loginType, setLoginType] = useState('admin');
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
        paymentMethod: 'Elden (Saha)',
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

  // Yardımcı: Personel Adını Soyad Baş Harfiyle Yazma
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
      if (loginPin === '1453' || loginPin === 'admin') {
        setCurrentUser({ role: 'admin', name: 'Bahadır (Yönetici)' });
      } else {
        alert('Hatalı Yönetici Şifresi! (Şifre: 1453)');
      }
    } else {
      const worker = WORKERS.find(w => w.id === selectedWorkerId);
      if (worker && loginPin === worker.pin) {
        setCurrentUser({ role: 'worker', name: worker.name });
      } else {
        alert('Hatalı Personel Şifresi! (Şifre: 1234)');
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
      paidAmount: j.totalAmount 
    } : j));
    alert('İş başarıyla tamamlandı olarak işaretlendi ve yöneticiye bildirildi!');
  };

  // WhatsApp Mesajı
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

  // Finans
