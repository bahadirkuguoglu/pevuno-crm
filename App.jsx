import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, ShoppingBag, PlusCircle, Calendar, RefreshCw, 
  TrendingUp, CheckCircle2, Clock, MapPin, Phone, 
  MessageSquare, DollarSign, Edit3, Trash2, Search, Download,
  FileText, Star, Settings, Percent, Tag, LogOut, ChevronRight, Lock, ShieldCheck, UserPlus, Cloud, BookOpen, Send, UserCheck, LayoutDashboard, UserCheck2, Navigation, Building2, ArrowUp, ArrowDown, RotateCcw, Image, ExternalLink
} from 'lucide-react';

const SUPABASE_URL = "https://esmmpztgmkeuyhzubbaf.supabase.co";
const SUPABASE_KEY = "sb_publishable_506jwPoEvILEUO7Xad7zEA_ywR6FixZ";
const CORPORATE_WHATSAPP = "905402281201";

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
    const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/app_data?key=eq.${key}&t=${Date.now()}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    if (!res.ok) throw new Error(`HTTP hata! Durum: ${res.status}`);
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
    const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=key`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify({ key, value })
    });
    if (!res.ok) {
      const patchRes = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/app_data?key=eq.${key}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ value })
      });
      const patchData = await patchRes.json();
      if (!patchData || patchData.length === 0) {
        await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/app_data`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ key, value })
        });
      }
    }
    return true;
  } catch (err) {
    console.error("Supabase kaydetme hatası:", err);
    return false;
  }
}

const DEFAULT_CATEGORIES = [
  'Çocuk Yatak Odası',
  'Salon / Oturma Odası',
  'Yatak Odası',
  'Mutfak / Yemek Alanı',
  'Banyo / Hijyen',
  'Genel Alanlar'
];

const DEFAULT_SERVICES = [
  { id: '1', category: 'Çocuk Yatak Odası', name: 'Essential | Tek Kişilik Yatak Yıkama', price: 750, unit: 'adet', durationMinutes: 30 },
  { id: '2', category: 'Çocuk Yatak Odası', name: 'Comfort | Tek Kişilik Yatak Yıkama', price: 1000, unit: 'adet', durationMinutes: 35 },
  { id: '3', category: 'Genel Alanlar', name: 'Premium | Tek Kişilik Yatak Yıkama', price: 1250, unit: 'adet', durationMinutes: 40 },
];

const DEFAULT_PORTAL_BANNER = "https://i.ibb.co/wZnLyNBT/PVN-FL-10-11-2026.png";

const DEFAULT_KVKK_TEMPLATE = `Merhaba *[Müşteri Adı]* (ID: *[Müşteri No]*),
Evinizde/iş yerinizde hijyeni her zaman üst düzeyde tutabilmeniz için, son profesyonel temizliğinizin üzerinden geçecek olan *6 aylık periyotlarda size özel hatırlatma yapmamızı ve randevu oluşturmamızı ister misiniz?* 🧼✨
Periyodik hatırlatmaların yapılabilmesi ve KVKK kapsamındaki bilgilendirmeyi kabul ediyorsanız, bu mesaja hemen *"ONAYLIYORUM"* yazarak yanıt verebilirsiniz.
Sağlıklı ve hijyenik günler dileriz.
Pevuno Solution`;

const DEFAULT_REMINDER_TEMPLATE = `Merhaba *[Müşteri Adı]* (ID: *[Müşteri No]*),
Pevuno Solution ailesi olarak son profesyonel temizlik hizmetimizin üzerinden yaklaşık 6 ay geçtiğini fark ettik. Evinizde/iş yerinizde hijyeni tazelemek ve periyodik bakım randevusu oluşturmak ister misiniz? 🧼✨
Sağlıklı günler dileriz!`;

const DEFAULT_APPOINTMENT_TEMPLATE = `Merhaba *[Müşteri Adı]*,\n\n✨ *PEVUNO SOLUTION* profesyonel temizlik randevunuz başarıyla oluşturulmuştur! 🧼\n📋 *İş No:* [İş No]\n📅 *Tarih / Saat:* [Tarih] - [Saat]\n📍 *Adres:* [Adres]\n👷 *Görevli Ekip:* [Ekip]\n\n[İndirim Detayı]💳 *Toplam Tutar:* [Tutar] TL\n\nBelirtilen saatte görüşmek üzere iyi günler dileriz! 🌿`;

const DEFAULT_ON_THE_WAY_TEMPLATE = `Merhaba *[Müşteri Adı]*,\n\n🚗 *PEVUNO SOLUTION* ekibimiz (*[Ekip]*) adresinize doğru yola çıkmıştır.\n📋 *İş No:* [İş No]\n📍 *Adres:* [Adres]\n\nGörüşmek üzere! 🧼✨`;

const DEFAULT_COMPLETION_TEMPLATE = `Merhaba *[Müşteri Adı]*,\n\n✨ *PEVUNO SOLUTION* profesyonel temizlik hizmetimiz ve ödeme işleminiz tamamlanmıştır.\n📋 *İş No:* [İş No]\n👷 Ekibimiz: *[Ekip]*\n[İndirim Detayı]💳 *Tahsil Edilen Tutar:* [Tutar] TL ([Ödeme Türü])\n\nBizi tercih ettiğiniz için teşekkür ederiz! 🧼🚿`;

const DEFAULT_WORKER_ASSIGN_TEMPLATE = `Merhaba *[Personel Adı]*,\n\nYeni bir iş ataması yapılmıştır! 🧼\n📋 *İş No:* [İş No]\n👤 *Müşteri:* [Müşteri Adı] ([Telefon])\n📍 *Adres:* [Adres]\n📅 *Tarih/Saat:* [Tarih] - [Saat]\n🛠️ *Hizmetler:* [Hizmetler]\n💵 *Hakedişiniz:* [Hakediş] TL\n\nİyi çalışmalar!`;

const formatDateTR = (dateStr) => {
  if (!dateStr) return '--.--.----';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
};

const getJobFinancialBreakdown = (job) => {
  if (!job) {
    return { subtotal: 0, discountAmount: 0, discountLabel: '', kdvAmount: 0, totalAmount: 0 };
  }
  const itemsTotal = Array.isArray(job.items)
    ? job.items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.unitPrice) || 0)), 0)
    : 0;
  const totalAmount = Number(job.totalAmount) || 0;
  const subtotal = Number(job.subtotal) || itemsTotal || totalAmount;
  const explicitDiscount = Number(job.discountAmount) || 0;
  const kdvAmount = job.includeKdv ? (Number(job.kdvAmount) || 0) : 0;

  let discountAmount = explicitDiscount;
  if (discountAmount <= 0 && !job.includeKdv && subtotal > totalAmount) {
    discountAmount = subtotal - totalAmount;
  }

  let discountLabel = '';
  if (discountAmount > 0) {
    if (job.discountType === 'percent' && Number(job.discountValue) > 0) {
      discountLabel = `%${Number(job.discountValue)}`;
    } else if (subtotal > 0) {
      const approxPercent = Math.round((discountAmount / subtotal) * 100);
      if (approxPercent > 0 && Math.abs((subtotal * approxPercent) / 100 - discountAmount) < 1) {
        discountLabel = `%${approxPercent}`;
      }
    }
  }

  return {
    subtotal,
    discountAmount,
    discountLabel,
    kdvAmount,
    totalAmount
  };
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('pevuno_logged_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [showPortalDirectly, setShowPortalDirectly] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const receiptRef = useRef(null);
  const isMutatingRef = useRef(false);
  const lastMutationTimeRef = useRef(0);

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('pevuno_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem('pevuno_services');
    return saved ? JSON.parse(saved) : DEFAULT_SERVICES;
  });
  const [portalBannerUrl, setPortalBannerUrl] = useState(() => {
    return localStorage.getItem('pevuno_portal_banner') || DEFAULT_PORTAL_BANNER;
  });
  const [tempBannerInput, setTempBannerInput] = useState(portalBannerUrl);
  const [workers, setWorkers] = useState(() => {
    const saved = localStorage.getItem('pevuno_workers');
    return saved ? JSON.parse(saved) : [
      { id: 'admin-1', username: 'bahadirkuguoglu', name: 'Bahadır Kuğuoğlu', pin: '1201', role: 'admin', phone: '5402281201' }
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
  const [nextCustIdNum, setNextCustIdNum] = useState(() => Number(localStorage.getItem('pevuno_next_cust_id')) || 1234);
  const [nextJobIdNum, setNextJobIdNum] = useState(() => Number(localStorage.getItem('pevuno_next_job_id')) || 2345);
  
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
  const [workerAssignTemplate, setWorkerAssignTemplate] = useState(() => localStorage.getItem('pevuno_assign_template') || DEFAULT_WORKER_ASSIGN_TEMPLATE);
  
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [completedJobsSearchQuery, setCompletedJobsSearchQuery] = useState('');
  const [clientSelectedItems, setClientSelectedItems] = useState({});
  const [clientCustomerName, setClientCustomerName] = useState('');
  const [clientCustomerPhone, setClientCustomerPhone] = useState('');
  const [clientCustomerAddress, setClientCustomerAddress] = useState('');
  
  const [clientSelectedVariants, setClientSelectedVariants] = useState({});
  const [adminSelectedVariants, setAdminSelectedVariants] = useState({});
  const [adminSelectedItems, setAdminSelectedItems] = useState({});
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const syncWithCloud = useCallback(async (force = false) => {
    if (!force && (isMutatingRef.current || (Date.now() - lastMutationTimeRef.current < 4000))) {
      return;
    }
    setIsSynced(false);
    const syncStartTime = Date.now();
    try {
      const [
        cloudCats,
        cloudServices,
        cloudBanner,
        cloudWorkers,
        cloudJobs,
        cloudCustomers,
        cloudCustId,
        cloudJobId,
        cloudKvkk,
        cloudRem,
        cloudApp,
        cloudOTW,
        cloudComp
      ] = await Promise.all([
        fetchSupabaseData('categories', null),
        fetchSupabaseData('services', null),
        fetchSupabaseData('portal_banner', null),
        fetchSupabaseData('workers', null),
        fetchSupabaseData('jobs', null),
        fetchSupabaseData('customers', null),
        fetchSupabaseData('next_cust_id', null),
        fetchSupabaseData('next_job_id', null),
        fetchSupabaseData('kvkk_template', null),
        fetchSupabaseData('reminder_template', null),
        fetchSupabaseData('appointment_template', null),
        fetchSupabaseData('ontheway_template', null),
        fetchSupabaseData('completion_template', null)
      ]);

      if (!force && (isMutatingRef.current || lastMutationTimeRef.current > syncStartTime)) {
        setIsSynced(true);
        return;
      }

      if (cloudCats && Array.isArray(cloudCats)) { setCategories(cloudCats); localStorage.setItem('pevuno_categories', JSON.stringify(cloudCats)); }
      if (cloudServices && Array.isArray(cloudServices)) { setServices(cloudServices); localStorage.setItem('pevuno_services', JSON.stringify(cloudServices)); }
      if (cloudBanner) { setPortalBannerUrl(cloudBanner); setTempBannerInput(cloudBanner); localStorage.setItem('pevuno_portal_banner', cloudBanner); }
      
      if (cloudWorkers && Array.isArray(cloudWorkers)) { 
        setWorkers(prevWorkers => {
          const merged = [...cloudWorkers];
          prevWorkers.forEach(pw => {
            if (!merged.some(mw => mw.username?.toLowerCase() === pw.username?.toLowerCase())) {
              merged.push(pw);
            }
          });
          localStorage.setItem('pevuno_workers', JSON.stringify(merged));
          return merged;
        });
      }

      if (cloudJobs && Array.isArray(cloudJobs)) { 
        setJobs(cloudJobs); 
        localStorage.setItem('pevuno_jobs', JSON.stringify(cloudJobs)); 
      }
      if (cloudCustomers && Array.isArray(cloudCustomers)) { 
        setCustomers(cloudCustomers); 
        localStorage.setItem('pevuno_customers', JSON.stringify(cloudCustomers)); 
      }
      
      if (cloudCustId) { setNextCustIdNum(Number(cloudCustId)); localStorage.setItem('pevuno_next_cust_id', cloudCustId); }
      if (cloudJobId) { setNextJobIdNum(Number(cloudJobId)); localStorage.setItem('pevuno_next_job_id', cloudJobId); }
      if (cloudKvkk) { setKvkkTemplate(cloudKvkk); setTempKvkkInput(cloudKvkk); localStorage.setItem('pevuno_kvkk', cloudKvkk); }
      if (cloudRem) { setReminderTemplate(cloudRem); setTempReminderInput(cloudRem); localStorage.setItem('pevuno_reminder_template', cloudRem); }
      if (cloudApp) { setAppointmentTemplate(cloudApp); setTempAppointmentInput(cloudApp); localStorage.setItem('pevuno_app_template', cloudApp); }
      if (cloudOTW) { setOnTheWayTemplate(cloudOTW); setTempOnTheWayInput(cloudOTW); localStorage.setItem('pevuno_ontheway_template', cloudOTW); }
      if (cloudComp) { setCompletionTemplate(cloudComp); setTempCompletionInput(cloudComp); localStorage.setItem('pevuno_completion_template', cloudComp); }
    } catch (err) {
      console.error("Senkronizasyon hatası:", err);
    }
    setIsSynced(true);
  }, []);

  useEffect(() => {
    syncWithCloud(true);
    const interval = setInterval(() => { syncWithCloud(false); }, 5000);
    const handleFocus = () => syncWithCloud(false);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncWithCloud(false);
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncWithCloud]);

  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNote, setNewNote] = useState('');
  const [hiddenWorkerNote, setHiddenWorkerNote] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  const [customerType, setCustomerType] = useState('bireysel');
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickAddress, setQuickAddress] = useState('');
  const [quickTaxOffice, setQuickTaxOffice] = useState('');
  const [quickTaxNumber, setQuickTaxNumber] = useState('');
  
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [includeKdv, setIncludeKdv] = useState(false);
  const [jobDate, setJobDate] = useState(new Date().toISOString().split('T')[0]);
  const [jobTime, setJobTime] = useState('10:00');
  const [selectedWorkerDetails, setSelectedWorkerDetails] = useState([]);
  
  const [newWorkerUsername, setNewWorkerUsername] = useState('');
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPin, setNewWorkerPin] = useState('');
  const [newWorkerRole, setNewWorkerRole] = useState('worker');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [editingWorkerId, setEditingWorkerId] = useState(null);

  const [newCategoryCustomInput, setNewCategoryCustomInput] = useState('');
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [newService, setNewService] = useState({ category: DEFAULT_CATEGORIES[0], name: '', price: '', unit: 'adet', durationMinutes: 30 });
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [selectedJobForReceipt, setSelectedJobForReceipt] = useState(null);
  
  useEffect(() => { localStorage.setItem('pevuno_logged_user', JSON.stringify(currentUser)); }, [currentUser]);
  
  const commitChange = async (key, newValue, setter, storageKey) => {
    isMutatingRef.current = true;
    lastMutationTimeRef.current = Date.now();
    setter(newValue);
    localStorage.setItem(storageKey, JSON.stringify(newValue));
    try {
      await saveSupabaseData(key, newValue);
    } finally {
      lastMutationTimeRef.current = Date.now();
      isMutatingRef.current = false;
    }
  };

  const updateCategories = (newCats) => commitChange('categories', newCats, setCategories, 'pevuno_categories');
  const updateServices = (newServ) => commitChange('services', newServ, setServices, 'pevuno_services');
  const updateWorkers = (newWork) => commitChange('workers', newWork, setWorkers, 'pevuno_workers');
  const updateJobs = (newJbs) => commitChange('jobs', newJbs, setJobs, 'pevuno_jobs');
  const updateCustomers = (newCust) => commitChange('customers', newCust, setCustomers, 'pevuno_customers');
  const updateNextCustId = (newVal) => commitChange('next_cust_id', newVal, setNextCustIdNum, 'pevuno_next_cust_id');
  const updateNextJobId = (newVal) => commitChange('next_job_id', newVal, setNextJobIdNum, 'pevuno_next_job_id');

  const handleSaveTemplates = async (e, type) => {
    e.preventDefault();
    isMutatingRef.current = true;
    lastMutationTimeRef.current = Date.now();
    try {
      if (type === 'kvkk') { setKvkkTemplate(tempKvkkInput); localStorage.setItem('pevuno_kvkk', tempKvkkInput); await saveSupabaseData('kvkk_template', tempKvkkInput); }
      if (type === 'reminder') { setReminderTemplate(tempReminderInput); localStorage.setItem('pevuno_reminder_template', tempReminderInput); await saveSupabaseData('reminder_template', tempReminderInput); }
      if (type === 'appointment') { setAppointmentTemplate(tempAppointmentInput); localStorage.setItem('pevuno_app_template', tempAppointmentInput); await saveSupabaseData('appointment_template', tempAppointmentInput); }
      if (type === 'ontheway') { setOnTheWayTemplate(tempOnTheWayInput); localStorage.setItem('pevuno_ontheway_template', tempOnTheWayInput); await saveSupabaseData('ontheway_template', tempOnTheWayInput); }
      if (type === 'completion') { setCompletionTemplate(tempCompletionInput); localStorage.setItem('pevuno_completion_template', tempCompletionInput); await saveSupabaseData('completion_template', tempCompletionInput); }
      if (type === 'banner') { setPortalBannerUrl(tempBannerInput); localStorage.setItem('pevuno_portal_banner', tempBannerInput); await saveSupabaseData('portal_banner', tempBannerInput); }
      alert('Şablon ve ayarlar başarıyla güncellendi!');
    } finally {
      lastMutationTimeRef.current = Date.now();
      isMutatingRef.current = false;
    }
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

  const calculateEstimatedEndTime = (startTimeStr, durationMinutes) => {
    if (!startTimeStr) return '--:--';
    const [hours, mins] = startTimeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(mins)) return '--:--';
    const startDate = new Date();
    startDate.setHours(hours, mins, 0, 0);
    startDate.setMinutes(startDate.getMinutes() + (durationMinutes || 0));
    const endHours = String(startDate.getHours()).padStart(2, '0');
    const endMins = String(startDate.getMinutes()).padStart(2, '0');
    return `${endHours}:${endMins}`;
  };

  const groupedAdminServicesByBaseName = services.reduce((acc, srv) => {
    const cat = srv.category || 'Genel Alanlar';
    if (!acc[cat]) acc[cat] = {};
    const baseName = srv.name.replace(/^(Essential|Comfort|Premium|Ekonomik|Standart|Lüks)\s*\|\s*/i, '').trim();
    if (!acc[cat][baseName]) acc[cat][baseName] = [];
    acc[cat][baseName].push(srv);
    return acc;
  }, {});

  let adminSubtotal = 0;
  let adminTotalDuration = 0;
  const adminActiveSelectedList = [];

  Object.entries(adminSelectedItems).forEach(([baseKey, qty]) => {
    if (qty <= 0) return;
    const [catName, baseName] = baseKey.split('__');
    const variants = groupedAdminServicesByBaseName[catName]?.[baseName] || [];
    const chosenVariantName = adminSelectedVariants[baseKey] || variants[0]?.name;
    const selectedSrv = variants.find(v => v.name === chosenVariantName) || variants[0];
    if (selectedSrv) {
      adminSubtotal += selectedSrv.price * qty;
      adminTotalDuration += (selectedSrv.durationMinutes || 30) * qty;
      adminActiveSelectedList.push({
        baseKey,
        serviceId: selectedSrv.id,
        serviceName: selectedSrv.name,
        qty,
        unitPrice: selectedSrv.price,
        durationMinutes: selectedSrv.durationMinutes || 30
      });
    }
  });

  const calculateAdminDiscount = () => {
    if (discountType === 'amount') return Number(discountValue) || 0;
    if (discountType === 'percent') return (adminSubtotal * (Number(discountValue) || 0)) / 100;
    return 0;
  };
  const adminCalculatedDiscount = calculateAdminDiscount();
  const adminAmountAfterDiscount = Math.max(0, adminSubtotal - adminCalculatedDiscount);
  const adminKdvAmount = includeKdv ? adminAmountAfterDiscount * 0.20 : 0;
  const adminFinalTotal = adminAmountAfterDiscount + adminKdvAmount;

  const handleLogin = (e) => {
    e.preventDefault();
    const inputUser = loginUsername.trim().toLowerCase();
    const inputPass = loginPassword.trim();
    if ((inputUser === 'bahadirkuguoglu' || inputUser === 'bahadır kuğuoğlu' || inputUser === 'bahadir') && inputPass === '1201') {
      setCurrentUser({ role: 'admin', name: 'Bahadır Kuğuoğlu', username: 'bahadirkuguoglu' });
      setActiveTab('dashboard');
      setShowPortalDirectly(false);
      return;
    }
    const matchedUser = workers.find(w => 
      (w.username && w.username.trim().toLowerCase() === inputUser) ||
      (w.name && w.name.trim().toLowerCase() === inputUser)
    );
    if (matchedUser && matchedUser.pin === inputPass) {
      const cleanName = matchedUser.name.replace(/\s*\(Yönetici\)/gi, '').replace(/\s*\(Personel\)/gi, '').trim();
      setCurrentUser({ role: matchedUser.role || 'worker', name: cleanName, username: matchedUser.username });
      setActiveTab(matchedUser.role === 'admin' ? 'dashboard' : 'jobs');
      setShowPortalDirectly(false);
    } else {
      alert('Hatalı Kullanıcı Adı veya Şifre!');
    }
  };

  const handleAddOrUpdateWorker = async (e) => {
    e.preventDefault();
    if (!newWorkerName || !newWorkerPin || !newWorkerUsername || !newWorkerPhone) {
      alert('Lütfen tüm bilgileri doldurunuz.');
      return;
    }
    const cleanUser = newWorkerUsername.trim().toLowerCase();
    const cleanName = newWorkerName.replace(/\s*\(Yönetici\)/gi, '').replace(/\s*\(Personel\)/gi, '').trim();
    if (editingWorkerId) {
      await updateWorkers(workers.map(w => w.id === editingWorkerId ? { ...w, username: cleanUser, name: cleanName, pin: newWorkerPin, role: newWorkerRole, phone: newWorkerPhone } : w));
      setEditingWorkerId(null);
      alert('Kullanıcı bilgileri güncellendi!');
    } else {
      if (workers.some(w => w.username?.toLowerCase() === cleanUser)) {
        alert('Bu kullanıcı adı zaten kullanılıyor!');
        return;
      }
      const newWObj = { id: `usr-${Date.now()}`, username: cleanUser, name: cleanName, pin: newWorkerPin, role: newWorkerRole, phone: newWorkerPhone };
      await updateWorkers([...workers, newWObj]);
      alert('Kullanıcı başarıyla eklendi!');
    }
    setNewWorkerUsername(''); setNewWorkerName(''); setNewWorkerPin(''); setNewWorkerPhone(''); setNewWorkerRole('worker');
  };

  const handleDeleteWorker = async (workerId) => {
    if (workers.length <= 1) { alert('Sistemdeki tek kullanıcıyı silemezsiniz.'); return; }
    if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      await updateWorkers(workers.filter(w => w.id !== workerId));
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!quickName || !quickPhone) { alert('İsim ve telefon zorunludur.'); return; }
    
    const assignedId = `CUST-${nextCustIdNum}`;
    const nextNum = nextCustIdNum + 1;
    const newCustObj = {
      id: assignedId,
      name: quickName,
      phone: quickPhone,
      address: quickAddress || 'Belirtilmedi',
      customerType,
      taxOffice: customerType === 'kurumsal' ? quickTaxOffice : '',
      taxNumber: customerType === 'kurumsal' ? quickTaxNumber : '',
      kvkk: false,
      lastJobDate: 'Yeni Eklenen'
    };

    isMutatingRef.current = true;
    lastMutationTimeRef.current = Date.now();
    try {
      const updatedCusts = [...customers, newCustObj];
      setCustomers(updatedCusts);
      localStorage.setItem('pevuno_customers', JSON.stringify(updatedCusts));
      setNextCustIdNum(nextNum);
      localStorage.setItem('pevuno_next_cust_id', nextNum);

      await Promise.all([
        saveSupabaseData('customers', updatedCusts),
        saveSupabaseData('next_cust_id', nextNum)
      ]);
      alert('Müşteri başarıyla eklendi!');
    } finally {
      lastMutationTimeRef.current = Date.now();
      isMutatingRef.current = false;
    }

    setQuickName(''); setQuickPhone(''); setQuickAddress(''); setQuickTaxOffice(''); setQuickTaxNumber('');
  };

  const handleDeleteCustomer = async (custId) => {
    if (confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) {
      await updateCustomers(customers.filter(c => c.id !== custId));
    }
  };

  const toggleCustomerKvkk = async (custId) => {
    await updateCustomers(customers.map(c => c.id === custId ? { ...c, kvkk: !c.kvkk } : c));
  };

  const markReminderSent = async (custId) => {
    await updateCustomers(customers.map(c => c.id === custId ? { ...c, reminderSent: true } : c));
  };

  const handleAddOrUpdateService = async (e) => {
    e.preventDefault();
    if (!newService.name || !newService.price) return;
    
    let targetCat = newService.category;
    if (showCustomCategoryInput && newCategoryCustomInput.trim()) {
      targetCat = newCategoryCustomInput.trim();
      if (!categories.includes(targetCat)) {
        await updateCategories([...categories, targetCat]);
      }
    }

    const duration = Number(newService.durationMinutes) || 30;
    if (editingServiceId) {
      await updateServices(services.map(s => s.id === editingServiceId ? { ...s, category: targetCat, name: newService.name, price: Number(newService.price), unit: newService.unit, durationMinutes: duration } : s));
      setEditingServiceId(null);
    } else {
      await updateServices([...services, { id: Date.now().toString(), category: targetCat || 'Genel Alanlar', name: newService.name, price: Number(newService.price), unit: newService.unit, durationMinutes: duration }]);
    }
    setNewService({ category: categories[0] || 'Genel Alanlar', name: '', price: '', unit: 'adet', durationMinutes: 30 });
    setShowCustomCategoryInput(false);
    setNewCategoryCustomInput('');
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone || adminActiveSelectedList.length === 0 || !newAddress) {
      alert('Lütfen müşteri adı, telefon, adres ve en az 1 hizmet seçiniz.');
      return;
    }

    isMutatingRef.current = true;
    lastMutationTimeRef.current = Date.now();
    try {
      const matchedCust = customers.find(c => c.phone === newCustomerPhone);
      let customerId = matchedCust ? matchedCust.id : `CUST-${nextCustIdNum}`;
      const nextCustNumToSave = !matchedCust ? nextCustIdNum + 1 : nextCustIdNum;

      const assignedJobId = `JOB-${nextJobIdNum}`;
      const nextJobNumToSave = nextJobIdNum + 1;

      const workerNames = selectedWorkerDetails.map(w => w.workerName);
      const totalWorkerHakedis = selectedWorkerDetails.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
      
      const newJobObj = {
        id: assignedJobId,
        customerId,
        customerName: newCustomerName,
        phone: newCustomerPhone,
        address: newAddress,
        note: newNote,
        hiddenWorkerNote: hiddenWorkerNote,
        items: adminActiveSelectedList,
        subtotal: adminSubtotal,
        estimatedDurationMinutes: adminTotalDuration,
        discountType,
        discountValue: Number(discountValue) || 0,
        discountAmount: adminCalculatedDiscount,
        includeKdv,
        kdvAmount: adminKdvAmount,
        totalAmount: adminFinalTotal,
        paidAmount: 0,
        paymentDetails: [],
        isPaymentReceived: false,
        status: 'Sırada / Randevu',
        date: jobDate,
        time: jobTime,
        assignedWorkers: workerNames.length > 0 ? workerNames : ['Saha Ekibi'],
        workerHakedisDetails: selectedWorkerDetails,
        totalWorkerHakedis: totalWorkerHakedis,
        completedByWorker: false
      };

      let updatedJobsList = [];
      setJobs(prevJobs => {
        updatedJobsList = [newJobObj, ...prevJobs];
        localStorage.setItem('pevuno_jobs', JSON.stringify(updatedJobsList));
        return updatedJobsList;
      });

      let updatedCustsList = [];
      setCustomers(prevCusts => {
        const existingCustIndex = prevCusts.findIndex(c => c.phone === newCustomerPhone);
        updatedCustsList = [...prevCusts];
        if (existingCustIndex > -1) {
          updatedCustsList[existingCustIndex] = { ...updatedCustsList[existingCustIndex], address: newAddress, lastJobDate: jobDate };
        } else {
          updatedCustsList.push({ 
            id: customerId, 
            name: newCustomerName, 
            phone: newCustomerPhone, 
            address: newAddress, 
            customerType: 'bireysel',
            taxOffice: '',
            taxNumber: '',
            kvkk: false, 
            lastJobDate: jobDate 
          });
        }
        localStorage.setItem('pevuno_customers', JSON.stringify(updatedCustsList));
        return updatedCustsList;
      });

      setNextCustIdNum(nextCustNumToSave);
      localStorage.setItem('pevuno_next_cust_id', nextCustNumToSave);
      setNextJobIdNum(nextJobNumToSave);
      localStorage.setItem('pevuno_next_job_id', nextJobNumToSave);

      await Promise.all([
        saveSupabaseData('jobs', updatedJobsList),
        saveSupabaseData('customers', updatedCustsList),
        saveSupabaseData('next_cust_id', nextCustNumToSave),
        saveSupabaseData('next_job_id', nextJobNumToSave)
      ]);

      setNewCustomerName(''); setNewCustomerPhone(''); setNewAddress(''); setNewNote(''); setHiddenWorkerNote(''); setAdminSelectedItems({}); setDiscountType('none'); setDiscountValue(0); setIncludeKdv(false); setSelectedWorkerDetails([]);
      setActiveTab('jobs');
    } finally {
      lastMutationTimeRef.current = Date.now();
      isMutatingRef.current = false;
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (confirm('Bu iş kaydını silmek istediğinize emin misiniz?')) {
      isMutatingRef.current = true;
      lastMutationTimeRef.current = Date.now();
      try {
        let updatedJobsList = [];
        setJobs(prevJobs => {
          updatedJobsList = prevJobs.filter(j => j.id !== jobId);
          localStorage.setItem('pevuno_jobs', JSON.stringify(updatedJobsList));
          return updatedJobsList;
        });
        await saveSupabaseData('jobs', updatedJobsList);
      } finally {
        lastMutationTimeRef.current = Date.now();
        isMutatingRef.current = false;
      }
    }
  };

  const handleSaveJobPaymentAndComplete = async (jobId, paymentDetailsArray, isCompleted) => {
    isMutatingRef.current = true;
    lastMutationTimeRef.current = Date.now();
    
    try {
      const totalPaid = paymentDetailsArray.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      let updatedJobsList = [];
      
      setJobs(prevJobs => {
        updatedJobsList = prevJobs.map(j => {
          if (j.id === jobId) {
            return {
              ...j,
              paymentDetails: paymentDetailsArray,
              paidAmount: totalPaid,
              isPaymentReceived: totalPaid > 0,
              status: isCompleted ? 'Tamamlandı' : j.status,
              completedByWorker: isCompleted ? true : j.completedByWorker
            };
          }
          return j;
        });
        localStorage.setItem('pevuno_jobs', JSON.stringify(updatedJobsList));
        return updatedJobsList;
      });

      await saveSupabaseData('jobs', updatedJobsList);
      if (isCompleted) {
        alert('İş başarıyla tamamlandı ve arşivlendi!');
      } else {
        alert('Ödeme bilgileri kaydedildi!');
      }
    } finally {
      lastMutationTimeRef.current = Date.now();
      isMutatingRef.current = false;
    }
  };

  const handleRevertJobToActive = async (jobId) => {
    if (confirm('Bu işi tekrar Aktif İşler listesine almak istediğinize emin misiniz?')) {
      isMutatingRef.current = true;
      lastMutationTimeRef.current = Date.now();
      try {
        let updatedJobsList = [];
        setJobs(prevJobs => {
          updatedJobsList = prevJobs.map(j => j.id === jobId ? { ...j, status: 'Sırada / Randevu', completedByWorker: false } : j);
          localStorage.setItem('pevuno_jobs', JSON.stringify(updatedJobsList));
          return updatedJobsList;
        });
        await saveSupabaseData('jobs', updatedJobsList);
      } finally {
        lastMutationTimeRef.current = Date.now();
        isMutatingRef.current = false;
      }
    }
  };

  const isCompletedStatus = (status) => {
    if (!status) return false;
    const s = status.toString().trim().toLowerCase();
    return s === 'tamamlandı' || s === 'tamamlandi' || s === 'bitti' || s.includes('tamamlan');
  };

  const completedJobsList = jobs.filter(j => isCompletedStatus(j.status));
  const activeJobsList = jobs.filter(j => !isCompletedStatus(j.status));
  
  const workerCompletedJobs = jobs.filter(j => isCompletedStatus(j.status) && j.assignedWorkers?.includes(currentUser?.name));
  const workerTotalCompletedJobsCount = workerCompletedJobs.length;
  
  const workerThisMonthCiro = workerCompletedJobs.filter(j => {
    if (!j.date) return false;
    const d = new Date(j.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  }).reduce((acc, j) => {
    const wDetail = j.workerHakedisDetails?.find(w => w.workerName === currentUser?.name);
    return acc + (wDetail ? Number(wDetail.amount) || 0 : 0);
  }, 0);

  const workerLastMonthCiro = workerCompletedJobs.filter(j => {
    if (!j.date) return false;
    const d = new Date(j.date);
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    return d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth();
  }).reduce((acc, j) => {
    const wDetail = j.workerHakedisDetails?.find(w => w.workerName === currentUser?.name);
    return acc + (wDetail ? Number(wDetail.amount) || 0 : 0);
  }, 0);

  const workerThisYearCiro = workerCompletedJobs.filter(j => {
    if (!j.date) return false;
    const d = new Date(j.date);
    return d.getFullYear() === currentYear;
  }).reduce((acc, j) => {
    const wDetail = j.workerHakedisDetails?.find(w => w.workerName === currentUser?.name);
    return acc + (wDetail ? Number(wDetail.amount) || 0 : 0);
  }, 0);

  const workerTotalEarned = workerCompletedJobs.reduce((acc, j) => {
    const wDetail = j.workerHakedisDetails?.find(w => w.workerName === currentUser?.name);
    return acc + (wDetail ? Number(wDetail.amount) || 0 : 0);
  }, 0);

  const downloadReceiptAsImage = () => {
    if (!receiptRef.current) return;
    
    const executeCapture = () => {
      window.html2canvas(receiptRef.current, { scale: 2, useCORS: true, logging: false }).then(canvas => {
        const image = canvas.toDataURL('image/jpeg', 0.95);
        
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>Pevuno Servis Fişi</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { margin: 0; background: #0f172a; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 100vh; font-family: sans-serif; color: white; padding: 20px; text-align: center; }
                  img { max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); margin-bottom: 20px; }
                  .hint { background: #10b981; color: white; padding: 12px 20px; border-radius: 12px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 12px rgba(16,185,129,0.3); margin-bottom: 15px; }
                  .back-btn { background: #3b82f6; color: white; border: none; padding: 14px 24px; border-radius: 12px; font-weight: bold; font-size: 16px; cursor: pointer; box-shadow: 0 4px 12px rgba(59,130,246,0.4); text-decoration: none; display: inline-block; margin-bottom: 30px; }
                </style>
              </head>
              <body>
                <button class="back-btn" onclick="window.close()">⬅️ CRM Paneline Geri Dön</button>
                <div class="hint">👇 Fişi kaydetmek için resme parmağınızla basılı tutun ve "Fotoğraflara Ekle" seçin!</div>
                <img src="${image}" alt="Servis Fişi" />
              </body>
            </html>
          `);
        } else {
          const link = document.createElement('a');
          link.href = image;
          link.download = `Pevuno_Servis_Fisi_${selectedJobForReceipt?.customerName?.replace(/\s+/g, '_')}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }).catch(err => {
        console.error("html2canvas hatası:", err);
        alert("Görsel oluşturulurken bir hata oluştu.");
      });
    };

    if (!window.html2canvas) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = () => executeCapture();
      document.body.appendChild(script);
    } else {
      executeCapture();
    }
  };

  const sendWhatsAppMessage = (type, data, targetWorkerName = null) => {
    let msg = '';
    const assignedText = formatWorkerNameMasked(data.assignedWorkers || ['Ekip']);
    const custId = data.customerId || 'CUST-0000';
    const jobId = data.id || 'JOB-0000';
    const dateFormatted = formatDateTR(data.date);
    const fin = getJobFinancialBreakdown(data);
    const discountDetailLine = fin.discountAmount > 0
      ? `💰 *Ara Toplam:* ${fin.subtotal} TL\n🏷️ *Uygulanan İndirim${fin.discountLabel ? ` (${fin.discountLabel})` : ''}:* -${fin.discountAmount} TL\n`
      : '';

    if (type === 'appointment') {
      let tpl = appointmentTemplate;
      if (fin.discountAmount > 0 && !tpl.includes('[İndirim Detayı]') && !tpl.includes('[İndirim]')) {
        tpl = tpl.replace(/💳 \*Toplam Tutar:\*/g, `[İndirim Detayı]💳 *Toplam Tutar:*`);
      }
      msg = tpl
        .replace(/\[Müşteri Adı\]/g, data.customerName)
        .replace(/\[Müşteri No\]/g, custId)
        .replace(/\[İş No\]/g, jobId)
        .replace(/\[Tarih\]/g, dateFormatted)
        .replace(/\[Saat\]/g, data.time || '10:00')
        .replace(/\[Adres\]/g, data.address)
        .replace(/\[Ekip\]/g, assignedText)
        .replace(/\[Ara Toplam\]/g, fin.subtotal)
        .replace(/\[İndirim\]/g, fin.discountAmount)
        .replace(/\[İndirim Detayı\]/g, discountDetailLine)
        .replace(/\[Tutar\]/g, data.totalAmount);
    } else if (type === 'ontheway') {
      msg = onTheWayTemplate
        .replace(/\[Müşteri Adı\]/g, data.customerName)
        .replace(/\[Müşteri No\]/g, custId)
        .replace(/\[İş No\]/g, jobId)
        .replace(/\[Adres\]/g, data.address)
        .replace(/\[Ekip\]/g, assignedText);
    } else if (type === 'completion') {
      const paySummary = data.paymentDetails && data.paymentDetails.length > 0 
        ? data.paymentDetails.map(p => `${p.amount} TL (${p.method})`).join(', ') 
        : `${data.paidAmount || data.totalAmount} TL`;
      let tpl = completionTemplate;
      if (fin.discountAmount > 0 && !tpl.includes('[İndirim Detayı]') && !tpl.includes('[İndirim]')) {
        tpl = tpl.replace(/💳 \*Tahsil Edilen Tutar:\*/g, `[İndirim Detayı]💳 *Tahsil Edilen Tutar:*`);
      }
      msg = tpl
        .replace(/\[Müşteri Adı\]/g, data.customerName)
        .replace(/\[Müşteri No\]/g, custId)
        .replace(/\[İş No\]/g, jobId)
        .replace(/\[Ekip\]/g, assignedText)
        .replace(/\[Ara Toplam\]/g, fin.subtotal)
        .replace(/\[İndirim\]/g, fin.discountAmount)
        .replace(/\[İndirim Detayı\]/g, discountDetailLine)
        .replace(/\[Tutar\]/g, data.totalAmount)
        .replace(/\[Ödeme Türü\]/g, paySummary);
    } else if (type === 'kvkk') {
      msg = kvkkTemplate
        .replace(/\[Müşteri Adı\]/g, data.name)
        .replace(/\[Müşteri No\]/g, data.id || 'CUST-0000');
    } else if (type === 'reminder') {
      msg = reminderTemplate
        .replace(/\[Müşteri Adı\]/g, data.name)
        .replace(/\[Müşteri No\]/g, data.id || 'CUST-0000');
    } else if (type === 'worker_assign') {
      const itemsText = data.items?.map(i => `${i.serviceName} (${i.qty} adet)`).join(', ') || 'Temizlik Hizmeti';
      const wDetail = data.workerHakedisDetails?.find(w => w.workerName === targetWorkerName);
      const hakedisVal = wDetail ? wDetail.amount : 0;
      
      msg = workerAssignTemplate
        .replace(/\[Personel Adı\]/g, targetWorkerName || 'Personel')
        .replace(/\[İş No\]/g, jobId)
        .replace(/\[Müşteri Adı\]/g, data.customerName)
        .replace(/\[Telefon\]/g, data.phone)
        .replace(/\[Adres\]/g, data.address)
        .replace(/\[Tarih\]/g, dateFormatted)
        .replace(/\[Saat\]/g, data.time || '10:00')
        .replace(/\[Hizmetler\]/g, itemsText)
        .replace(/\[Ara Toplam\]/g, fin.subtotal)
        .replace(/\[İndirim\]/g, fin.discountAmount)
        .replace(/\[Tutar\]/g, data.totalAmount)
        .replace(/\[Hakediş\]/g, hakedisVal);
        
      const targetWorkerObj = workers.find(w => w.name === targetWorkerName);
      const workerPhone = targetWorkerObj?.phone || '';
      const cleanPhone = workerPhone.replace(/\D/g, '');
      if (cleanPhone) {
        const formattedPhone = cleanPhone.startsWith('0') ? `9${cleanPhone}` : cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone}`;
        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
        return;
      }
    }

    const encoded = encodeURIComponent(msg);
    const cleanPhone = (data.phone || '').replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `9${cleanPhone}` : cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
  };

  const totalCollected = jobs.reduce((acc, j) => acc + (Number(j.paidAmount) || 0), 0);
  const totalCompletedJobsCount = completedJobsList.length;
  
  let paymentTypeBreakdown = { IBAN: 0, Elden: 0, 'Kredi Kartı': 0 };
  jobs.forEach(j => {
    if (j.paymentDetails && Array.isArray(j.paymentDetails)) {
      j.paymentDetails.forEach(p => {
        if (paymentTypeBreakdown[p.method] !== undefined) {
          paymentTypeBreakdown[p.method] += Number(p.amount) || 0;
        } else {
          paymentTypeBreakdown[p.method] = Number(p.amount) || 0;
        }
      });
    }
  });

  const totalWorkerHakedisSum = jobs.reduce((acc, j) => {
    if (j.totalWorkerHakedis !== undefined) return acc + Number(j.totalWorkerHakedis);
    return acc + (j.workerHakedis || (j.totalAmount * 0.80));
  }, 0);
  const netProfit = totalCollected - totalWorkerHakedisSum;
  
  const thisMonthCiro = jobs.filter(j => {
    if (!j.date) return false;
    const d = new Date(j.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth && isCompletedStatus(j.status);
  }).reduce((acc, j) => acc + j.totalAmount, 0);

  const lastMonthCiro = jobs.filter(j => {
    if (!j.date) return false;
    const d = new Date(j.date);
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    return d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth() && isCompletedStatus(j.status);
  }).reduce((acc, j) => acc + j.totalAmount, 0);

  const thisYearCiro = jobs.filter(j => {
    if (!j.date) return false;
    const d = new Date(j.date);
    return d.getFullYear() === currentYear && isCompletedStatus(j.status);
  }).reduce((acc, j) => acc + j.totalAmount, 0);

  const reminderEligibleCustomers = customers.filter(c => {
    if (!c.kvkk || c.reminderSent) return false; 
    const days = getDaysSinceLastJob(c.lastJobDate);
    return days !== null && days >= 180;
  });

  const sortedCustomersAlphabetical = [...customers].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  
  const sortedJobsForUser = [...jobs]
    .filter(j => currentUser?.role === 'admin' || j.assignedWorkers?.includes(currentUser?.name))
    .sort((a, b) => new Date(`${a.date}T${a.time || '10:00'}`) - new Date(`${b.date}T${b.time || '10:00'}`));

  const getCleanDisplayName = (name) => {
    if (!name) return 'Kullanıcı';
    return name.replace(/\s*\(Yönetici\)/gi, '').replace(/\s*\(Personel\)/gi, '').trim();
  };

  const getCleanServiceName = (fullName) => {
    if (!fullName) return '';
    return fullName.replace(/^(Essential|Comfort|Premium|Ekonomik|Standart|Lüks)\s*\|\s*/i, '').trim();
  };

  if (showPortalDirectly || activeTab === 'client-portal') {
    const groupedServicesByBaseName = services.reduce((acc, srv) => {
      const cat = srv.category || 'Genel Alanlar';
      if (!acc[cat]) acc[cat] = {};
      
      const baseName = getCleanServiceName(srv.name);
      if (!acc[cat][baseName]) {
        acc[cat][baseName] = [];
      }
      acc[cat][baseName].push(srv);
      return acc;
    }, {});

    let calcSubTotal = 0;
    let calcTotalDuration = 0;
    const activeSelectedList = [];

    Object.entries(clientSelectedItems).forEach(([baseKey, qty]) => {
      if (qty <= 0) return;
      const [catName, baseName] = baseKey.split('__');
      const variants = groupedServicesByBaseName[catName]?.[baseName] || [];
      const chosenVariantName = clientSelectedVariants[baseKey] || variants[0]?.name;
      const selectedSrv = variants.find(v => v.name === chosenVariantName) || variants[0];
      if (selectedSrv) {
        calcSubTotal += selectedSrv.price * qty;
        calcTotalDuration += (selectedSrv.durationMinutes || 30) * qty;
        activeSelectedList.push({
          baseKey,
          serviceId: selectedSrv.id,
          serviceName: selectedSrv.name,
          qty,
          unitPrice: selectedSrv.price,
          durationMinutes: selectedSrv.durationMinutes || 30
        });
      }
    });

    return (
      <div className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans">
        <div className="max-w-2xl mx-auto space-y-6 bg-white p-6 sm:p-8 rounded-3xl shadow-xl border">
          
          {portalBannerUrl && (
            <div className="w-full overflow-hidden rounded-2xl shadow-sm border border-slate-200">
              <img src={portalBannerUrl} alt="Pevuno Banner" className="w-full h-auto object-cover max-h-56" />
            </div>
          )}

          <div className="text-center space-y-2 border-b pb-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-wider">PEVUNO SOLUTION</h2>
            <p className="text-xs text-slate-500 font-medium">Hızlı Fiyat Hesaplama & Canlı Teklif Ekranı</p>
            <button 
              type="button"
              onClick={() => { setShowPortalDirectly(false); setActiveTab(currentUser ? 'dashboard' : null); }} 
              className="text-xs font-bold text-emerald-600 hover:underline pt-1 inline-block"
            >
              🔐 Yönetici / Saha Giriş Ekranına Dön
            </button>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">TEMİZLİK ALANLARI VE ÜRÜN SEÇİMİ</h3>
            
            {Object.entries(groupedServicesByBaseName).map(([categoryName, baseServicesMap]) => (
              <div key={categoryName} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                <h4 className="font-extrabold text-sm text-slate-900 border-b pb-2 flex items-center space-x-2">
                  <span>🏠 {categoryName}</span>
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {Object.entries(baseServicesMap).map(([baseName, variants]) => {
                    const baseKey = `${categoryName}__${baseName}`;
                    const qty = clientSelectedItems[baseKey] || 0;
                    const currentVariantName = clientSelectedVariants[baseKey] || variants[0]?.name;
                    const activeVariant = variants.find(v => v.name === currentVariantName) || variants[0];

                    return (
                      <div key={baseKey} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-xs text-slate-900">{baseName}</div>
                            <div className="text-xs text-emerald-600 font-extrabold mt-0.5">
                              {activeVariant?.price} TL / {activeVariant?.unit || 'adet'}
                            </div>
                            <div className="text-[11px] text-purple-700 font-bold mt-0.5">
                              ⏱️ Tahmini Süre: {activeVariant?.durationMinutes || 30} dk
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              type="button" 
                              onClick={() => {
                                const newQty = Math.max(0, qty - 1);
                                setClientSelectedItems({ ...clientSelectedItems, [baseKey]: newQty });
                              }}
                              className="w-7 h-7 bg-slate-200 hover:bg-slate-300 font-bold rounded-lg text-xs"
                            >-</button>
                            <span className="text-xs font-black w-5 text-center">{qty}</span>
                            <button 
                              type="button" 
                              onClick={() => {
                                const newQty = qty + 1;
                                setClientSelectedItems({ ...clientSelectedItems, [baseKey]: newQty });
                              }}
                              className="w-7 h-7 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                            >+</button>
                          </div>
                        </div>

                        {variants.length > 1 && (
                          <div className="pt-2 border-t flex flex-wrap gap-1.5 items-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Paket:</span>
                            {variants.map(v => {
                              const isSelected = currentVariantName === v.name;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => {
                                    setClientSelectedVariants({ ...clientSelectedVariants, [baseKey]: v.name });
                                  }}
                                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                                    isSelected 
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                  }`}
                                >
                                  {v.name.split('|')[0].trim()} ({v.price} TL)
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {activeSelectedList.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl space-y-2">
              <h4 className="text-xs font-black text-purple-900 uppercase tracking-wide">📋 Sepet / Seçim Özetiniz</h4>
              <div className="space-y-1 divide-y divide-purple-100 text-xs">
                {activeSelectedList.map((item, idx) => (
                  <div key={idx} className="pt-1.5 flex justify-between items-center text-slate-800 font-medium">
                    <span>• {item.serviceName} (x{item.qty})</span>
                    <span className="font-bold text-purple-700">{item.qty * item.unitPrice} TL</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2 border-t">
            <h3 className="text-xs font-bold text-slate-700 uppercase">İletişim Bilgileriniz</h3>
            <input type="text" placeholder="Adınız Soyadınız *" value={clientCustomerName} onChange={(e) => setClientCustomerName(e.target.value)} className="w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white" />
            <input type="text" placeholder="Telefon Numaranız *" value={clientCustomerPhone} onChange={(e) => setClientCustomerPhone(e.target.value)} className="w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white" />
            <textarea rows={3} placeholder="Açık Adresiniz (İlçe, Mahalle, Sokak)..." value={clientCustomerAddress} onChange={(e) => setClientCustomerAddress(e.target.value)} className="w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white" />
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-600 font-bold block">Pevuno Solution Profesyonel Hizmet</span>
              <span className="text-sm font-black text-slate-900">Toplam Ücret ve Süre</span>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-emerald-700">{calcSubTotal} TL</div>
              <div className="text-xs font-bold text-purple-700">⏱️ ~{calcTotalDuration} dk</div>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => {
              if (!clientCustomerName || !clientCustomerPhone) {
                alert('Lütfen ad soyad ve telefon numaranızı giriniz.');
                return;
              }
              const chosenDetails = activeSelectedList.map(item => `${item.serviceName} x${item.qty}`).join(', ');
              const msg = `Merhaba Pevuno Solution, web sitenizden fiyat hesapladım.\n\n👤 Ad Soyad: ${clientCustomerName}\n📞 Telefon: ${clientCustomerPhone}\n📍 Adres: ${clientCustomerAddress || 'Belirtilmedi'}\n🛠️ Seçilenler: ${chosenDetails || 'Seçilmedi'}\n💳 Toplam Tutar: ${calcSubTotal} TL\n⏱️ Tahmini Süre: ~${calcTotalDuration} dk\n\nRandevu oluşturmak istiyorum.`;
              window.open(`https://wa.me/${CORPORATE_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg text-sm flex items-center justify-center space-x-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp ile Teklifi Gönder 🚀</span>
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-wider">PEVUNO SOLUTION</h1>
            <p className="text-xs text-slate-500 font-medium">Saha & Yönetici Giriş Paneli</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Kullanıcı Adı</label>
              <input type="text" required placeholder="" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Şifre</label>
              <input type="password" required placeholder="" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition">Sisteme Giriş Yap 🚀</button>
          </form>
          
          <div className="pt-2">
            <button 
              type="button"
              onClick={() => setShowPortalDirectly(true)} 
              className="w-full bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-500 text-emerald-800 font-extrabold py-3.5 px-4 rounded-2xl shadow transition flex items-center justify-center space-x-2 text-sm"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>👉 Müşteri Fiyat Hesaplama Paneli (Şifresiz)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cleanCurrentUserName = getCleanDisplayName(currentUser.name);
  const roleDisplay = currentUser.role === 'admin' ? 'Yönetici' : 'Personel';

  const groupedServicesMap = services.reduce((acc, srv) => {
    const cat = srv.category || 'Genel Alanlar';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(srv);
    return acc;
  }, {});

  const receiptBreakdown = selectedJobForReceipt ? getJobFinancialBreakdown(selectedJobForReceipt) : null;

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
            <button type="button" onClick={() => syncWithCloud(true)} className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-1.5 rounded-xl font-medium flex items-center space-x-1 hover:bg-emerald-500/30 transition whitespace-nowrap">
              <Cloud className="w-3.5 h-3.5" />
              <span>{isSynced ? '🔄 Eşitle' : '⏳ Eşitleniyor'}</span>
            </button>
            <button type="button" onClick={() => setCurrentUser(null)} className="bg-slate-800 hover:bg-rose-900/40 text-slate-300 text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-1 transition">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-800 border-t border-slate-700 w-full overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 flex justify-start sm:justify-center space-x-2 text-sm py-1">
            {currentUser.role === 'admin' && (
              <>
                <button type="button" onClick={() => setActiveTab('dashboard')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'dashboard' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard & Ciro</span>
                </button>
                <button type="button" onClick={() => setActiveTab('jobs')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'jobs' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Aktif İşler ({activeJobsList.length})</span>
                </button>
                <button type="button" onClick={() => setActiveTab('admin-completed')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'admin-completed' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tamamlanan İşler ({completedJobsList.length})</span>
                </button>
                <button type="button" onClick={() => setActiveTab('new-job')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'new-job' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <PlusCircle className="w-4 h-4" />
                  <span>Yeni İş Kaydı</span>
                </button>
                <button type="button" onClick={() => setActiveTab('customers')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'customers' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <BookOpen className="w-4 h-4" />
                  <span>Müşteriler & Firmalar</span>
                </button>
                <button type="button" onClick={() => setActiveTab('workers')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'workers' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <Users className="w-4 h-4" />
                  <span>Kullanıcılar & Şifreler</span>
                </button>
                <button type="button" onClick={() => setActiveTab('catalog')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'catalog' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <Settings className="w-4 h-4" />
                  <span>Fiyatlar & Süreler</span>
                </button>
                <button type="button" onClick={() => setActiveTab('reminders')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'reminders' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <RefreshCw className="w-4 h-4" />
                  <span>Hatırlatıcılar & Şablonlar ({reminderEligibleCustomers.length})</span>
                </button>
                <button type="button" onClick={() => setShowPortalDirectly(true)} className="px-3 py-2.5 flex items-center space-x-1.5 border-b-2 border-transparent text-emerald-400 hover:text-emerald-300 font-bold whitespace-nowrap text-xs">
                  <MessageSquare className="w-4 h-4" />
                  <span>Müşteri Paneli Önizleme</span>
                </button>
              </>
            )}
            {currentUser.role === 'worker' && (
              <button type="button" onClick={() => setActiveTab('jobs')} className={`px-3 py-2.5 flex items-center space-x-1.5 border-b-2 font-medium whitespace-nowrap text-xs transition ${activeTab === 'jobs' ? 'border-emerald-400 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                <ShoppingBag className="w-4 h-4" />
                <span>Atanan İşlerim ({sortedJobsForUser.filter(j => !isCompletedStatus(j.status)).length})</span>
              </button>
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
                <p className="text-xs text-slate-300 mt-1">Pevuno Solution Finansal Ciro, Ödeme Dağılımı ve Saha Operasyon Paneli</p>
              </div>
              <button type="button" onClick={() => setActiveTab('new-job')} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg transition text-xs flex items-center space-x-1">
                <PlusCircle className="w-4 h-4" />
                <span>Hızlı İş Kaydı</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Toplam İş</span>
                <div className="text-lg font-black text-slate-900">{totalCompletedJobsCount} Adet</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Bu Ay Ciro</span>
                <div className="text-lg font-black text-emerald-600">{thisMonthCiro} TL</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Geçen Ay Ciro</span>
                <div className="text-lg font-black text-blue-600">{lastMonthCiro} TL</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Bu Yıl Ciro</span>
                <div className="text-lg font-black text-purple-600">{thisYearCiro} TL</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Tahsil Edilen</span>
                <div className="text-lg font-black text-teal-600">{totalCollected} TL</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Personel Hakediş</span>
                <div className="text-lg font-black text-indigo-600">{totalWorkerHakedisSum} TL</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Net İşletme Kârı</span>
                <div className={`text-lg font-black ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{netProfit} TL</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Ödeme Tipi Dağılımı ve Tahsilat Analizi</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">🏦 IBAN Tahsilat</span>
                  <span className="text-sm font-black text-emerald-700">{paymentTypeBreakdown['IBAN'] || 0} TL</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">💵 Elden Tahsilat</span>
                  <span className="text-sm font-black text-blue-700">{paymentTypeBreakdown['Elden'] || 0} TL</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">💳 Kredi Kartı Tahsilat</span>
                  <span className="text-sm font-black text-purple-700">{paymentTypeBreakdown['Kredi Kartı'] || 0} TL</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span>Sıradaki Aktive Edilmiş İşler ({activeJobsList.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeJobsList.slice(0, 4).map((job) => {
                  const fin = getJobFinancialBreakdown(job);
                  return (
                    <div key={job.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>#{job.id} - {job.customerName}</span>
                        <span className="text-emerald-700">{formatDateTR(job.date)} | {job.time}</span>
                      </div>
                      <p className="text-slate-600">📍 {job.address}</p>
                      <p className="text-purple-700 font-bold">
                        👷 Ekip: {formatWorkerNameMasked(job.assignedWorkers)} | Tutar: {job.totalAmount} TL
                        {fin.discountAmount > 0 && (
                          <span className="text-rose-600 ml-1.5">(İndirim: -{fin.discountAmount} TL)</span>
                        )}
                      </p>
                    </div>
                  );
                })}
                {activeJobsList.length === 0 && (
                  <p className="text-xs text-slate-400">Şu an sırada bekleyen aktif iş bulunmuyor.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && currentUser.role === 'worker' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-lg space-y-2">
              <h2 className="text-2xl font-black">Hoş Geldin, {cleanCurrentUserName} 👷</h2>
              <p className="text-xs text-slate-300">Saha Personeli Performans, Tamamlanan İş Sayısı ve Kazanç Paneli</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Tamamladığım İş</span>
                <div className="text-lg font-black text-slate-900">{workerTotalCompletedJobsCount} Adet</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Bu Ay Kazancım</span>
                <div className="text-lg font-black text-emerald-600">{workerThisMonthCiro} TL</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Geçen Ay Kazancım</span>
                <div className="text-lg font-black text-blue-600">{workerLastMonthCiro} TL</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Bu Yıl Kazancım</span>
                <div className="text-lg font-black text-purple-600">{workerThisYearCiro} TL</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Toplam Kazanç</span>
                <div className="text-lg font-black text-teal-600">{workerTotalEarned} TL</div>
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow">
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-emerald-400" />
                <span>Atanan Aktif İşlerim ve Saha Adımları</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedJobsForUser.filter(job => !isCompletedStatus(job.status)).map((job, index) => {
                const estEndTime = calculateEstimatedEndTime(job.time, job.estimatedDurationMinutes);
                const myHakedisDetail = job.workerHakedisDetails?.find(w => w.workerName === currentUser.name);

                return (
                  <ChronologicalJobCardItem 
                    key={job.id} 
                    job={job} 
                    index={index} 
                    estEndTime={estEndTime} 
                    myHakedisDetail={myHakedisDetail}
                    currentUser={currentUser}
                    handleSaveJobPaymentAndComplete={handleSaveJobPaymentAndComplete}
                    sendWhatsAppMessage={sendWhatsAppMessage}
                    setSelectedJobForReceipt={setSelectedJobForReceipt}
                  />
                );
              })}
              {sortedJobsForUser.filter(job => !isCompletedStatus(job.status)).length === 0 && (
                <div className="col-span-full bg-white p-8 rounded-2xl text-center text-slate-400 text-xs border">
                  Şu an üzerinize atanmış aktif iş bulunmuyor.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && currentUser.role === 'admin' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow">
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-emerald-400" />
                <span>Aktif İşler & Adım Adım Kronolojik Saha Akışı</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedJobsForUser.filter(job => !isCompletedStatus(job.status)).map((job, index) => {
                const estEndTime = calculateEstimatedEndTime(job.time, job.estimatedDurationMinutes);
                const myHakedisDetail = job.workerHakedisDetails?.find(w => w.workerName === currentUser.name);

                return (
                  <ChronologicalJobCardItem 
                    key={job.id} 
                    job={job} 
                    index={index} 
                    estEndTime={estEndTime} 
                    myHakedisDetail={myHakedisDetail}
                    currentUser={currentUser}
                    handleSaveJobPaymentAndComplete={handleSaveJobPaymentAndComplete}
                    sendWhatsAppMessage={sendWhatsAppMessage}
                    setSelectedJobForReceipt={setSelectedJobForReceipt}
                  />
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'admin-completed' && currentUser.role === 'admin' && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow flex flex-col sm:flex-row justify-between items-center gap-3">
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Tamamlanan İşler Arşivi ({completedJobsList.length})</span>
              </h2>
              <div className="w-full sm:w-72">
                <input 
                  type="text" 
                  placeholder="İsim, soyisim veya telefon ile ara..." 
                  value={completedJobsSearchQuery} 
                  onChange={(e) => setCompletedJobsSearchQuery(e.target.value)} 
                  className="w-full border rounded-xl px-3.5 py-2 text-xs bg-slate-800 text-white placeholder-slate-400 border-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedJobsList
                .filter(job => {
                  const q = completedJobsSearchQuery.toLowerCase();
                  return (
                    job.customerName?.toLowerCase().includes(q) ||
                    job.phone?.includes(q) ||
                    job.id?.toLowerCase().includes(q)
                  );
                })
                .map((job) => {
                  const fin = getJobFinancialBreakdown(job);
                  return (
                    <div key={job.id} className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-200 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-lg">#{job.id} | TAMAMLANDI</span>
                        <div className="flex items-center space-x-1">
                          <button type="button" onClick={() => handleRevertJobToActive(job.id)} className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1">
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Aktife Taşı</span>
                          </button>
                          <button type="button" onClick={() => handleDeleteJob(job.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{job.customerName}</h3>
                        <p className="text-xs text-blue-600 font-bold mt-0.5">📞 {job.phone}</p>
                        <p className="text-xs text-slate-500 mt-0.5">📍 {job.address}</p>
                        <p className="text-xs text-emerald-700 font-medium mt-1">👷 Ekip: {formatWorkerNameMasked(job.assignedWorkers)} | Tahsil Edilen: {job.paidAmount} TL</p>
                      </div>
                      <div className="pt-2 border-t flex justify-between items-center text-xs gap-2">
                        <div className="space-y-0.5">
                          {fin.discountAmount > 0 && (
                            <div className="text-[11px] text-rose-600 font-semibold">
                              Ara Toplam: {fin.subtotal} TL | İndirim{fin.discountLabel ? ` (${fin.discountLabel})` : ''}: -{fin.discountAmount} TL
                            </div>
                          )}
                          <span className="font-bold text-slate-700 block">Toplam Tutar: {job.totalAmount} TL</span>
                        </div>
                        <button type="button" onClick={() => setSelectedJobForReceipt(job)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border shrink-0">Servis Fişi</button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

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
                        <div key={cust.id} onClick={() => { setNewCustomerName(cust.name); setNewCustomerPhone(cust.phone); setNewAddress(cust.address || ''); setShowCustomerSuggestions(false); }} className="p-3 hover:bg-emerald-50 cursor-pointer border-b text-xs">
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
                  <label className="block text-xs font-bold text-slate-600 mb-1">Gidecek Personeller & Manuel Hakediş Tutarları *</label>
                  <div className="border border-slate-300 rounded-xl p-3 bg-white space-y-2">
                    {workers.map(w => {
                      const isSelected = selectedWorkerDetails.some(item => item.workerName === w.name);
                      const currentDetail = selectedWorkerDetails.find(item => item.workerName === w.name);
                      return (
                        <div key={w.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border">
                          <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedWorkerDetails([...selectedWorkerDetails, { workerName: w.name, amount: 0 }]);
                                } else {
                                  setSelectedWorkerDetails(selectedWorkerDetails.filter(item => item.workerName !== w.name));
                                }
                              }} 
                              className="w-4 h-4 text-emerald-600 rounded" 
                            />
                            <span>{w.name} ({w.role === 'admin' ? 'Yönetici' : 'Saha'})</span>
                          </label>
                          {isSelected && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs font-bold text-slate-500">Hakediş (TL):</span>
                              <input 
                                type="number" 
                                placeholder="TL" 
                                value={currentDetail?.amount || ''} 
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setSelectedWorkerDetails(selectedWorkerDetails.map(item => item.workerName === w.name ? { ...item, amount: val } : item));
                                }}
                                className="w-24 border rounded-lg px-2 py-1 text-xs font-bold bg-white text-emerald-700" 
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
                  <textarea rows={3} required placeholder="İlçe, Mahalle, Cadde, Bina No, Daire..." value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-indigo-700 mb-1">🔒 Gizli Saha Notu (Müşteriye WhatsApp mesajlarında GİTMEZ)</label>
                  <textarea rows={2} placeholder="Örn: Yerler ıslanmasın, evde kedi var, hassas kumaş..." value={hiddenWorkerNote} onChange={(e) => setHiddenWorkerNote(e.target.value)} className="w-full border border-indigo-200 bg-indigo-50/50 rounded-xl px-3.5 py-2 text-xs" />
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">TEMİZLİK ALANLARI VE ÜRÜN SEÇİMİ</label>
                
                {Object.entries(groupedAdminServicesByBaseName).map(([categoryName, baseServicesMap]) => (
                  <div key={categoryName} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                    <h4 className="font-extrabold text-sm text-slate-900 border-b pb-2 flex items-center space-x-2">
                      <span>🏠 {categoryName}</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-2.5">
                      {Object.entries(baseServicesMap).map(([baseName, variants]) => {
                        const baseKey = `${categoryName}__${baseName}`;
                        const qty = adminSelectedItems[baseKey] || 0;
                        const currentVariantName = adminSelectedVariants[baseKey] || variants[0]?.name;
                        const activeVariant = variants.find(v => v.name === currentVariantName) || variants[0];

                        return (
                          <div key={baseKey} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <div className="font-bold text-xs text-slate-900">{baseName}</div>
                                <div className="text-xs text-emerald-600 font-extrabold mt-0.5">
                                  {activeVariant?.price} TL / {activeVariant?.unit || 'adet'}
                                </div>
                                <div className="text-[11px] text-purple-700 font-bold mt-0.5">
                                  ⏱️ Tahmini Süre: {activeVariant?.durationMinutes || 30} dk
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const newQty = Math.max(0, qty - 1);
                                    setAdminSelectedItems({ ...adminSelectedItems, [baseKey]: newQty });
                                  }}
                                  className="w-7 h-7 bg-slate-200 hover:bg-slate-300 font-bold rounded-lg text-xs"
                                >-</button>
                                <span className="text-xs font-black w-5 text-center">{qty}</span>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const newQty = qty + 1;
                                    setAdminSelectedItems({ ...adminSelectedItems, [baseKey]: newQty });
                                  }}
                                  className="w-7 h-7 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                                >+</button>
                              </div>
                            </div>

                            {variants.length > 1 && (
                              <div className="pt-2 border-t flex flex-wrap gap-1.5 items-center">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Paket:</span>
                                {variants.map(v => {
                                  const isSelected = currentVariantName === v.name;
                                  return (
                                    <button
                                      key={v.id}
                                      type="button"
                                      onClick={() => {
                                        setAdminSelectedVariants({ ...adminSelectedVariants, [baseKey]: v.name });
                                      }}
                                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                                        isSelected 
                                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      {v.name.split('|')[0].trim()} ({v.price} TL)
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {adminActiveSelectedList.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-slate-600">Seçilen Kalemler ve Tutar:</p>
                      <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                        ⏱️ Toplam Süre: ~{adminTotalDuration} dk
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border flex flex-col sm:flex-row items-center gap-3">
                      <div className="w-full sm:w-auto">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">İndirim Türü</label>
                        <select 
                          value={discountType} 
                          onChange={(e) => { setDiscountType(e.target.value); if(e.target.value==='none') setDiscountValue(0); }}
                          className="border rounded-lg px-3 py-1.5 text-xs font-bold bg-slate-50 w-full"
                        >
                          <option value="none">İndirimsiz</option>
                          <option value="amount">Tutar İndirimi (TL)</option>
                          <option value="percent">Yüzde İndirimi (%)</option>
                        </select>
                      </div>
                      {discountType !== 'none' && (
                        <div className="w-full sm:w-auto flex-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            {discountType === 'amount' ? 'İndirim Tutarı (TL)' : 'İndirim Oranı (%)'}
                          </label>
                          <input 
                            type="number" 
                            min="0" 
                            value={discountValue} 
                            onChange={(e) => setDiscountValue(e.target.value)} 
                            className="border rounded-lg px-3 py-1.5 text-xs font-bold bg-slate-50 w-full text-rose-600"
                            placeholder="Değer giriniz"
                          />
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-xl border flex items-center justify-between">
                      <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={includeKdv} 
                          onChange={(e) => setIncludeKdv(e.target.checked)} 
                          className="w-4 h-4 text-emerald-600 rounded" 
                        />
                        <span>🧾 Fatura / KDV Ekle (+%20)</span>
                      </label>
                      <span className="text-[11px] text-slate-400">İşlerin %99'unda kapalıdır</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border text-right space-y-1">
                      <span className="text-xs text-slate-500 block">Ara Toplam: {adminSubtotal} TL</span>
                      {discountType !== 'none' && (
                        <span className="text-xs text-rose-500 block">
                          Uygulanan İndirim{discountType === 'percent' && Number(discountValue) > 0 ? ` (%${discountValue})` : ''}: -{adminCalculatedDiscount} TL
                        </span>
                      )}
                      {includeKdv && <span className="text-xs text-blue-600 block">KDV (%20): +{adminKdvAmount} TL</span>}
                      <span className="text-base font-black text-emerald-700 block pt-1 border-t">Ödenecek Net Tutar: {adminFinalTotal} TL</span>
                    </div>

                    {adminActiveSelectedList.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-xl border text-sm">
                        <span>{item.serviceName} x{item.qty}</span>
                        <span className="font-bold">{item.qty * item.unitPrice} TL</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tarih</label>
                  <input type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} className="w-full border rounded-xl px-3.5 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Saat</label>
                  <input type="time" value={jobTime} onChange={(e) => setJobTime(e.target.value)} className="w-full border rounded-xl px-3.5 py-2.5 text-sm" />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg">İş Randevusunu Oluştur ve Kaydet 🚀</button>
            </form>
          </div>
        )}

        {activeTab === 'customers' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
              <div className="border-b pb-3">
                <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>Müşteri & Kurumsal Firma Yönetimi</span>
                </h2>
              </div>

              <form onSubmit={handleAddCustomer} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Müşteri Tipi *</label>
                    <select value={customerType} onChange={(e) => setCustomerType(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm bg-white font-bold">
                      <option value="bireysel">👤 Bireysel Müşteri</option>
                      <option value="kurumsal">🏢 Kurumsal Firma</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Ad Soyad / Firma Adı *</label>
                    <input type="text" required placeholder="Müşteri / Firma Adı" value={quickName} onChange={(e) => setQuickName(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Telefon Numarası *</label>
                    <input type="text" required placeholder="0532..." value={quickPhone} onChange={(e) => setQuickPhone(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm bg-white" />
                  </div>
                </div>

                {customerType === 'kurumsal' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Vergi Dairesi</label>
                      <input type="text" placeholder="Örn: Pendik V.D." value={quickTaxOffice} onChange={(e) => setQuickTaxOffice(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Vergi Numarası</label>
                      <input type="text" placeholder="Örn: 1234567890" value={quickTaxNumber} onChange={(e) => setQuickTaxNumber(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm bg-white" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Açık Adres *</label>
                  <textarea rows={3} placeholder="İlçe, Mahalle, Cadde, Bina No, Daire..." value={quickAddress} onChange={(e) => setQuickAddress(e.target.value)} className="w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white" />
                </div>

                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm shadow">Müşteriyi Kaydet 🚀</button>
              </form>

              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="İsim, soyisim veya telefon numarası ile ara..." 
                  value={customerSearchQuery} 
                  onChange={(e) => setCustomerSearchQuery(e.target.value)} 
                  className="border rounded-xl px-3.5 py-2 text-xs bg-slate-50 w-full" 
                />
                <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden bg-white">
                  {sortedCustomersAlphabetical
                    .filter(c => {
                      const q = customerSearchQuery.toLowerCase();
                      return (
                        c.name?.toLowerCase().includes(q) ||
                        c.phone?.includes(q) ||
                        c.id?.toLowerCase().includes(q)
                      );
                    })
                    .map((cust) => (
                      <div key={cust.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-slate-800 text-sm">
                              {cust.name} ({cust.phone}) 
                              <span className="text-xs font-mono text-purple-700 ml-1">({cust.id})</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 ${cust.customerType === 'kurumsal' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>
                                {cust.customerType === 'kurumsal' ? '🏢 Kurumsal' : '👤 Bireysel'}
                              </span>
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">📍 {cust.address}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button type="button" onClick={() => toggleCustomerKvkk(cust.id)} className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${cust.kvkk ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {cust.kvkk ? '✅ KVKK Onaylı' : '❌ KVKK Onaysız'}
                          </button>
                          <button type="button" onClick={() => sendWhatsAppMessage('kvkk', cust)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 border px-3 py-1 rounded-lg text-xs font-bold">KVKK Mesajı (WP)</button>
                          <button type="button" onClick={() => handleDeleteCustomer(cust.id)} className="text-rose-500 p-1"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workers' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-950">Kullanıcı Adı, Rol, Şifre, Telefon & Güncelleme Yönetimi</h2>
              <form onSubmit={handleAddOrUpdateWorker} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border">
                <input type="text" required placeholder="Kullanıcı Adı" value={newWorkerUsername} onChange={(e) => setNewWorkerUsername(e.target.value)} className="border rounded-xl px-3.5 py-2 text-sm bg-white" />
                <input type="text" required placeholder="Ad Soyad" value={newWorkerName} onChange={(e) => setNewWorkerName(e.target.value)} className="border rounded-xl px-3.5 py-2 text-sm bg-white" />
                <input type="text" required placeholder="Şifre" value={newWorkerPin} onChange={(e) => setNewWorkerPin(e.target.value)} className="border rounded-xl px-3.5 py-2 text-sm bg-white" />
                <input type="text" required placeholder="Telefon (örn: 0532...)" value={newWorkerPhone} onChange={(e) => setNewWorkerPhone(e.target.value)} className="border rounded-xl px-3.5 py-2 text-sm bg-white" />
                <select value={newWorkerRole} onChange={(e) => setNewWorkerRole(e.target.value)} className="border rounded-xl px-3.5 py-2 text-sm bg-white font-bold">
                  <option value="worker">👷 Saha</option>
                  <option value="admin">👑 Yönetici</option>
                </select>
                <div className="sm:col-span-5 flex space-x-2">
                  <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm shadow">
                    {editingWorkerId ? 'Kullanıcıyı Güncelle 🔄' : 'Yeni Kullanıcıyı Kaydet 🚀'}
                  </button>
                  {editingWorkerId && (
                    <button type="button" onClick={() => { setEditingWorkerId(null); setNewWorkerUsername(''); setNewWorkerName(''); setNewWorkerPin(''); setNewWorkerPhone(''); }} className="bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold">İptal</button>
                  )}
                </div>
              </form>
              <div className="divide-y border rounded-xl overflow-hidden">
                {workers.map((w) => (
                  <div key={w.id} className="p-4 flex items-center justify-between bg-white">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{getCleanDisplayName(w.name)} ({w.role === 'admin' ? 'Yönetici' : 'Saha'})</h4>
                      <p className="text-xs text-slate-500 font-mono">Kullanıcı Adı: <strong>{w.username}</strong> | Şifre: <strong className="text-emerald-700">{w.pin}</strong> | Tel: <strong className="text-blue-600">{w.phone || 'Girilmedi'}</strong></p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button type="button" onClick={() => { setEditingWorkerId(w.id); setNewWorkerUsername(w.username || ''); setNewWorkerName(w.name || ''); setNewWorkerPin(w.pin || ''); setNewWorkerPhone(w.phone || ''); setNewWorkerRole(w.role || 'worker'); }} className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1">
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Düzenle</span>
                      </button>
                      <button type="button" onClick={() => handleDeleteWorker(w.id)} className="text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'catalog' && currentUser.role === 'admin' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
              <h2 className="text-xl font-bold text-slate-900">Hizmet, Kategori (Grup), Fiyat & Dakika Süre Yönetimi</h2>
              
              <form onSubmit={handleAddOrUpdateService} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Grup / Kategori Seçin *</label>
                  {!showCustomCategoryInput ? (
                    <select 
                      value={newService.category} 
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setShowCustomCategoryInput(true);
                        } else {
                          setNewService({ ...newService, category: e.target.value });
                        }
                      }} 
                      className="w-full border rounded-xl px-3 py-2 text-sm bg-white font-bold"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>🏠 {cat}</option>
                      ))}
                      <option value="__NEW__">➕ Yeni Grup Ekle...</option>
                    </select>
                  ) : (
                    <div className="flex gap-1">
                      <input 
                        type="text" 
                        required 
                        placeholder="Yeni Grup Adı (örn: Balkon)" 
                        value={newCategoryCustomInput} 
                        onChange={(e) => setNewCategoryCustomInput(e.target.value)} 
                        className="w-full border rounded-xl px-3 py-2 text-sm bg-white" 
                      />
                      <button type="button" onClick={() => setShowCustomCategoryInput(false)} className="bg-slate-200 text-slate-700 px-2.5 rounded-xl text-xs font-bold">✕</button>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Hizmet Adı *</label>
                  <input type="text" required placeholder="Örn: Essential | Tek Kişilik Yatak Yıkama" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} className="w-full border rounded-xl px-3.5 py-2 text-sm bg-white" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Fiyat (TL) *</label>
                  <input type="number" required placeholder="TL" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} className="w-full border rounded-xl px-3.5 py-2 text-sm bg-white" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Birim *</label>
                  <select value={newService.unit} onChange={(e) => setNewService({ ...newService, unit: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm bg-white font-bold">
                    <option value="adet">adet</option>
                    <option value="takım">takım</option>
                    <option value="m²">m²</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Süre (Dakika) *</label>
                  <input type="number" required placeholder="dk" value={newService.durationMinutes} onChange={(e) => setNewService({ ...newService, durationMinutes: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm bg-white" />
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 text-sm rounded-xl shadow">
                    {editingServiceId ? 'Hizmeti Güncelle 🔄' : 'Yeni Hizmet Ekle 🚀'}
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">MEVCUT HİZMET KATALOĞU (GRUPLANDIRILMIŞ)</h3>
                
                {Object.entries(groupedServicesMap).map(([catName, catSvcs]) => (
                  <div key={catName} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                    <h4 className="font-extrabold text-sm text-slate-900 border-b pb-2 flex items-center space-x-2">
                      <span>🏠 {catName}</span>
                      <span className="text-xs text-slate-400 font-normal">({catSvcs.length} Hizmet)</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {catSvcs.map((srv) => (
                        <div key={srv.id} className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
                          <div>
                            <div className="font-bold text-xs text-slate-900">{srv.name}</div>
                            <div className="text-xs text-emerald-600 font-extrabold mt-0.5">{srv.price} TL / {srv.unit}</div>
                            <div className="text-[11px] text-purple-700 font-bold mt-0.5">⏱️ Süre: {srv.durationMinutes || 30} dk</div>
                          </div>
                          <div className="flex items-center space-x-1 shrink-0">
                            <button 
                              type="button"
                              onClick={() => { 
                                setEditingServiceId(srv.id); 
                                setNewService({ category: srv.category || categories[0], name: srv.name, price: srv.price, unit: srv.unit || 'adet', durationMinutes: srv.durationMinutes || 30 }); 
                              }} 
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => updateServices(services.filter(s => s.id !== srv.id))} 
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg border border-rose-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reminders' && currentUser.role === 'admin' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Image className="w-4 h-4 text-emerald-600" />
                <span>Müşteri Paneli Banner / Görsel URL Yönetimi</span>
              </h3>
              <p className="text-xs text-slate-500">imgbb.com üzerinden aldığınız doğrudan PNG resim bağlantısını buraya yapıştırabilirsiniz.</p>
              <form onSubmit={(e) => handleSaveTemplates(e, 'banner')} className="flex gap-2">
                <input type="text" value={tempBannerInput} onChange={(e) => setTempBannerInput(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-xs bg-slate-50 flex-1" placeholder="https://..." />
                <button type="submit" className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow">Görsel URL Kaydet</button>
              </form>
            </div>

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
                <p className="text-[11px] text-slate-500">Kullanılabilir etiketler: [Müşteri Adı], [İş No], [Tarih], [Saat], [Adres], [Ekip], [İndirim Detayı], [Ara Toplam], [İndirim], [Tutar]</p>
                <form onSubmit={(e) => handleSaveTemplates(e, 'appointment')} className="space-y-2">
                  <textarea rows={4} value={tempAppointmentInput} onChange={(e) => setTempAppointmentInput(e.target.value)} className="w-full border rounded-xl p-3 text-xs font-mono bg-slate-50" />
                  <button type="submit" className="w-full bg-purple-600 text-white font-bold py-2 rounded-xl text-xs shadow">Randevu Şablonunu Kaydet</button>
                </form>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Yola Çıkıldı / Servis Bitti Şablonları</h3>
                <p className="text-[11px] text-slate-500">Servis Bitti etiketleri: [Müşteri Adı], [İş No], [Ekip], [İndirim Detayı], [Ara Toplam], [İndirim], [Tutar], [Ödeme Türü]</p>
                <form onSubmit={(e) => handleSaveTemplates(e, 'ontheway')} className="space-y-2">
                  <textarea rows={2} value={tempOnTheWayInput} onChange={(e) => setTempOnTheWayInput(e.target.value)} className="w-full border rounded-xl p-2.5 text-[11px] font-mono bg-slate-50" />
                  <textarea rows={2} value={tempCompletionInput} onChange={(e) => setTempCompletionInput(e.target.value)} className="w-full border rounded-xl p-2.5 text-[11px] font-mono bg-slate-50" />
                  <button type="submit" onClick={(e) => handleSaveTemplates(e, 'completion')} className="w-full bg-amber-600 text-white font-bold py-2 rounded-xl text-xs shadow">Servis Şablonlarını Kaydet</button>
                </form>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Periyodik Hatırlatıcı Bekleyen Müşteriler (180+ Gün & KVKK Onaylı)</h2>
              <div className="divide-y border rounded-xl overflow-hidden bg-slate-50">
                {reminderEligibleCustomers.map((cust) => {
                  const daysAgo = getDaysSinceLastJob(cust.lastJobDate);
                  return (
                    <div key={cust.id} className="p-4 flex items-center justify-between bg-white">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{cust.name} ({cust.phone}) <span className="text-xs font-mono text-purple-700">({cust.id})</span></h4>
                        <p className="text-xs text-slate-500">📍 {cust.address} | Son İşlem: <strong className="text-purple-700">{formatDateTR(cust.lastJobDate)} ({daysAgo} gün önce)</strong></p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button type="button" onClick={() => sendWhatsAppMessage('reminder', cust)} className="bg-emerald-600 text-white font-bold px-3 py-2 rounded-xl text-xs shadow flex items-center space-x-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Mesaj Gönder (WP)</span>
                        </button>
                        <button type="button" onClick={() => markReminderSent(cust.id)} className="bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Gönderildi ✔</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {reminderEligibleCustomers.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs bg-white">Şu an hatırlatılması gereken bekleyen müşteri bulunmuyor.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedJobForReceipt && receiptBreakdown && (
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
                <p><strong>Tarih / Saat:</strong> {formatDateTR(selectedJobForReceipt.date)} - {selectedJobForReceipt.time}</p>
                <p><strong>Ödeme Detayı:</strong> {selectedJobForReceipt.paymentDetails?.map(p => `${p.amount} TL (${p.method})`).join(', ') || 'Belirtilmedi'}</p>
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
              <div className="pt-2 border-t text-right space-y-1 text-xs">
                <p className="text-slate-500">Ara Toplam: <span className="font-bold text-slate-800">{receiptBreakdown.subtotal} TL</span></p>
                {receiptBreakdown.discountAmount > 0 && (
                  <p className="text-rose-600 font-semibold">
                    Uygulanan İndirim{receiptBreakdown.discountLabel ? ` (${receiptBreakdown.discountLabel})` : ''}: <span className="font-bold">-{receiptBreakdown.discountAmount} TL</span>
                  </p>
                )}
                {selectedJobForReceipt.includeKdv && receiptBreakdown.kdvAmount > 0 && (
                  <p className="text-blue-600">KDV (%20): <span className="font-bold">+{receiptBreakdown.kdvAmount} TL</span></p>
                )}
                <div className="pt-1 border-t">
                  <span className="text-slate-500 font-medium">Toplam Tutar</span>
                  <p className="text-xl font-black text-emerald-700">{receiptBreakdown.totalAmount} TL</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <button type="button" onClick={downloadReceiptAsImage} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow flex items-center justify-center space-x-2">
                <Download className="w-4 h-4" />
                <span>📸 Fiş Görselini Oluştur (Galeriye Kaydetmek İçin Dokun)</span>
              </button>
              <div className="flex space-x-2">
                <button type="button" onClick={() => sendWhatsAppMessage('completion', selectedJobForReceipt)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs">WP ile Gönder</button>
                <button type="button" onClick={() => setSelectedJobForReceipt(null)} className="bg-slate-100 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs border">Kapat</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChronologicalJobCardItem({ job, index, estEndTime, myHakedisDetail, currentUser, handleSaveJobPaymentAndComplete, sendWhatsAppMessage, setSelectedJobForReceipt }) {
  const [payRows, setPayRows] = useState(job.paymentDetails && job.paymentDetails.length > 0 ? job.paymentDetails : [{ method: 'IBAN', amount: job.totalAmount }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (job.paymentDetails && job.paymentDetails.length > 0) {
      setPayRows(job.paymentDetails);
    }
  }, [job.paymentDetails]);
  
  const addPayRow = () => {
    setPayRows([...payRows, { method: 'Elden', amount: 0 }]);
  };
  
  const removePayRow = (idx) => {
    setPayRows(payRows.filter((_, i) => i !== idx));
  };
  
  const updatePayRow = (idx, field, val) => {
    const updated = [...payRows];
    updated[idx][field] = field === 'amount' ? (Number(val) || 0) : val;
    setPayRows(updated);
  };
  
  const totalCollectedSoFar = payRows.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const formattedDate = formatDateTR(job.date);
  const encodedAddress = encodeURIComponent(job.address || '');
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const yandexMapsUrl = `https://yandex.com.tr/harita/?text=${encodedAddress}`;
  const fin = getJobFinancialBreakdown(job);

  const onSaveClick = async (isCompleted) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await handleSaveJobPaymentAndComplete(job.id, payRows, isCompleted);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
        <div>
          <span className="bg-slate-900 text-emerald-400 font-extrabold text-[11px] px-2.5 py-1 rounded-lg inline-block mb-1">
            #{job.id} | SIRA: #{index + 1}
          </span>
          <h3 className="font-extrabold text-lg text-slate-900">{job.customerName}</h3>
          <p className="text-xs text-blue-600 font-bold">📞 {job.phone} <span className="text-slate-400 font-normal">(ID: {job.customerId})</span></p>
        </div>
      </div>

      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1 font-bold">
        <div className="flex justify-between items-center">
          <span>📅 Tarih: {formattedDate}</span>
          <span>⏱️ Başlangıç: {job.time || '10:00'}</span>
        </div>
        <div className="text-purple-700">🏁 Tahmini Bitiş Saati: {estEndTime} (~{job.estimatedDurationMinutes || 30} dk)</div>
        <p className="text-slate-600 font-normal pt-1 border-t border-emerald-200">📍 Adres: {job.address}</p>
        
        <div className="pt-2 flex gap-2">
          <a 
            href={googleMapsUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Google Maps 🗺️</span>
          </a>
          <a 
            href={yandexMapsUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-center py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Yandex Maps 📍</span>
          </a>
        </div>
      </div>

      {job.hiddenWorkerNote && (
        <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-xs space-y-1">
          <span className="font-bold text-indigo-900 block">🔒 Gizli Saha Notu (Personel / Yöneticiye Özel):</span>
          <p className="text-indigo-950 font-medium">{job.hiddenWorkerNote}</p>
        </div>
      )}

      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
        <span className="font-bold text-slate-700 block border-b pb-1 uppercase">İşlem Yapılacak Ürünler</span>
        {job.items?.map((item, iIdx) => (
          <div key={iIdx} className="flex justify-between text-slate-700 py-0.5">
            <span>• {item.serviceName} x{item.qty}</span>
            <span className="font-semibold">{item.qty * item.unitPrice} TL</span>
          </div>
        ))}
        <div className="pt-1.5 mt-1 border-t border-slate-200 space-y-0.5 text-right">
          {fin.discountAmount > 0 && (
            <>
              <div className="text-slate-500">Ara Toplam: <span className="font-bold text-slate-700">{fin.subtotal} TL</span></div>
              <div className="text-rose-600 font-bold">
                Uygulanan İndirim{fin.discountLabel ? ` (${fin.discountLabel})` : ''}: -{fin.discountAmount} TL
              </div>
            </>
          )}
          {job.includeKdv && fin.kdvAmount > 0 && (
            <div className="text-blue-600">KDV (%20): <span className="font-bold">+{fin.kdvAmount} TL</span></div>
          )}
          <div className="text-emerald-700 font-black">Net Toplam: {fin.totalAmount} TL</div>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Saha Operasyon Adımları</span>
        
        {currentUser.role === 'admin' && (
          <button 
            type="button"
            onClick={() => sendWhatsAppMessage('appointment', job)} 
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 shadow"
          >
            <Calendar className="w-4 h-4" />
            <span>1. Adım: Müşteriye Randevu Bilgisi Gönder (WP)</span>
          </button>
        )}

        {currentUser.role === 'admin' && job.assignedWorkers && job.assignedWorkers.length > 0 && (
          <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 space-y-2">
            <span className="text-[11px] font-bold text-purple-900 block">2. Adım: Çalışanlara İş Detayını Gönder (WP)</span>
            <div className="flex flex-wrap gap-1.5">
              {job.assignedWorkers.map((wName, wIdx) => (
                <button 
                  key={wIdx} 
                  type="button"
                  onClick={() => sendWhatsAppMessage('worker_assign', job, wName)} 
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{wName}'a WP At</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentUser.role === 'admin' && (
          <button 
            type="button"
            onClick={() => sendWhatsAppMessage('ontheway', job)} 
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 shadow"
          >
            <Navigation className="w-4 h-4" />
            <span>3. Adım: Müşteriye Yola Çıkıldı Bilgisi Gönder (WP)</span>
          </button>
        )}

        <div className="bg-slate-100 p-3.5 rounded-xl text-xs space-y-2 border">
          <div className="flex justify-between items-center font-bold text-slate-800 border-b pb-1.5">
            <span>4. Adım: Saha Ödeme Girişi (Toplam: {job.totalAmount} TL)</span>
            <button type="button" onClick={addPayRow} className="text-emerald-700 hover:underline text-[11px]">+ Ödeme Ekle</button>
          </div>
          {payRows.map((row, pIdx) => (
            <div key={pIdx} className="flex items-center space-x-2">
              <select 
                value={row.method} 
                onChange={(e) => updatePayRow(pIdx, 'method', e.target.value)}
                className="border rounded-lg px-2 py-1 text-xs font-bold bg-white"
              >
                <option value="IBAN">🏦 IBAN</option>
                <option value="Elden">💵 Elden</option>
                <option value="Kredi Kartı">💳 Kredi Kartı</option>
              </select>
              <input 
                type="number" 
                placeholder="Tutar (TL)" 
                value={row.amount || ''} 
                onChange={(e) => updatePayRow(pIdx, 'amount', e.target.value)}
                className="border rounded-lg px-2.5 py-1 text-xs font-bold bg-white flex-1 text-emerald-700" 
              />
              {payRows.length > 1 && (
                <button type="button" onClick={() => removePayRow(pIdx)} className="text-rose-500 font-bold px-1">✕</button>
              )}
            </div>
          ))}
          <div className="flex justify-between pt-1 font-semibold text-slate-600">
            <span>Girilen: {totalCollectedSoFar} TL</span>
            <span className={totalCollectedSoFar >= job.totalAmount ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
              {totalCollectedSoFar >= job.totalAmount ? '✅ Tamamı Alındı' : `Eksik: ${job.totalAmount - totalCollectedSoFar} TL`}
            </span>
          </div>
          <button 
            type="button"
            disabled={isSubmitting}
            onClick={() => onSaveClick(false)} 
            className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs py-2 rounded-lg transition mt-1"
          >
            {isSubmitting ? '⏳ Kaydediliyor...' : '💾 Ödemeyi Kaydet'}
          </button>
        </div>

        {currentUser.role === 'worker' && myHakedisDetail && (
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 p-2.5 rounded-xl text-xs font-bold flex justify-between items-center">
            <span>💵 Bu İşten Hakedişiniz:</span>
            <span className="text-sm font-black">{myHakedisDetail.amount} TL</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button 
            type="button"
            onClick={() => setSelectedJobForReceipt(job)} 
            className="bg-slate-100 hover:bg-slate-200 border text-slate-800 text-xs py-2.5 rounded-xl font-bold flex items-center justify-center space-x-1"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>5. Fiş / JPEG İndir</span>
          </button>
          <button 
            type="button"
            onClick={() => sendWhatsAppMessage('completion', job)} 
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2.5 rounded-xl font-bold flex items-center justify-center space-x-1 shadow"
          >
            <MessageSquare className="w-4 h-4" />
            <span>5. Fiş / Bitti WP</span>
          </button>
        </div>

        <button 
          type="button"
          disabled={isSubmitting}
          onClick={() => onSaveClick(true)} 
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs py-3 rounded-xl shadow-lg flex items-center justify-center space-x-2 transition"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isSubmitting ? '⏳ İşlem Tamamlanıyor...' : '6. Adım: İşlemi Tamamla ve Arşive Gönder ✅'}</span>
        </button>
      </div>
    </div>
  );
}
