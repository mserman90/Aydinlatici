/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

import { 
  BookOpen, BrainCircuit, Activity, Calculator, FlaskConical, 
  Globe2, PenTool, LayoutDashboard, ShieldCheck, HelpCircle, 
  
  Trophy, Medal, Flame, Star, Award, MessageSquare, Settings, ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { cn } from './lib/utils';
import { callHuggingFaceAI, AVAILABLE_MODELS } from './lib/pollinations';

// --- ROZET (BADGE) TANIMLAMALARI ---
const BADGE_DEFINITIONS: Record<string, { name: string, desc: string, icon: any, color: string, bg: string }> = {
  first_blood: { name: 'İlk Adım', desc: 'Platforma ilk giriş', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
  diagnostic_done: { name: 'Kaşif', desc: 'Teşhis testini tamamladı', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
  curious_mind: { name: 'Soru Avcısı', desc: 'Sisteme 5 soru sordu', icon: BrainCircuit, color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-200' },
  streak_3: { name: 'Ateşli Öğrenci', desc: '3 gün kesintisiz giriş', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
  good_feedback: { name: 'Katılımcı', desc: '3 kez geri bildirim verdi', icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200' },
};

// --- YAPAY ZEKA SİSTEM İSTEMLERİ ---
const SYSTEM_PROMPTS: Record<string, string> = {
  diagnostic: `Sen elit bir eğitim platformunun teşhis motorusun. Öğrencinin seviyesini belirlemek için zorluk derecesi değişen 5 soruluk bir test yapacaksın. Bir soru sor, cevabı bekle, ardından diğerine geç. Öğrencinin eksikliklerini belirle.
  
ÖNEMLİ: Her soruyu MUTLAKA aşağıdaki formatta (bozmadan) sor:
[SORU]
Soru metni buraya yazılacak. Gerekli açıklamalar burada olabilir.
[SECENEKLER]
A) Seçenek 1
B) Seçenek 2
C) Seçenek 3
D) Seçenek 4
[/SORU]

Düzeltmelerini veya değerlendirmelerini [SORU] formatından önce yapabilirsin. Test bittiğinde genel değerlendirmeni yap ve öğrencinin çalışması gereken ALT KONULARI (Zayıf Yönleri) virgülle ayırarak MUTLAKA şu özel formatın içine yaz (Örnek: [WEAKNESSES]Kesirler, Cümlede Anlam, İnkılap Tarihi[/WEAKNESSES]). Başka da bir yapı ekleme.`,
  
  practiceTest: `Sen bir "Eksik Giderme Sınavı" (Practice Test) motorusun. Sana sağlanan zayıf olduğu konulara odaklanan, çoktan seçmeli 5 soruluk bir sınav hazırlaman gerekiyor. 
ÖNEMLİ: Her soruyu MUTLAKA aşağıdaki formatta sor:
[SORU]
Soru metni buraya...
[SECENEKLER]
A) Seçenek 1
B) Seçenek 2
C) Seçenek 3
D) Seçenek 4
[/SORU]
Kullanıcı yanıtladıktan sonra doğrusunu açıkla ve bir sonraki soruya geç.`,

  homeworkHelper: `Sen saatliği 100 dolar olan elit bir özel öğretmensin. KESİNLİKLE DOĞRUDAN CEVAP VERME. Sokratik yöntemi kullanarak yönlendirilmiş keşif yaptır. Soruyu daha basit kelimelerle yeniden ifade et ve öğrenciyi çözüme götürecek sorular sor. Eğer kullanıcı ipucu seviyesi belirtirse şunlara uy:
  - İpucu 1: Sadece doğru yöne bakmasını sağlayacak küçük bir dürtme.
  - İpucu 2: Problemin bir sonraki adımını gösteren daha büyük bir itme.
  - İpucu 3: Soruyu öğrenciyle birlikte adım adım, soru sorarak çözme.`,

  math: `Sen bir Matematik Motorusun. Konuları daima "NEDEN" var olduklarıyla ve gerçek hayatta nerede kullanıldıklarıyla (para, pizza dilimleri, video oyunları hesaplamaları vb.) açıklamaya başla. Formülleri doğrudan verme, mantığını anlat. Problemleri görsel betimlemelerle anlat ve ASLA adım atlama. Adım adım, nedenleriyle çöz.`,

  science: `Sen bir Bilim Motorusun. Karmaşık bilimsel süreçleri çocukların zaten anladığı ve bildiği kavramlara benzet (örneğin: atomlar legolara benzer, hücre zarı bir kalenin kapısındaki güvenlik görevlisidir). Mutlaka evdeki basit malzemelerle 10 dakikada yapılabilecek güvenli pratik deneyler öner.`,

  history: `Sen bir Tarih Motorusun. Tarihi asla ezberlenecek tarihler ve isimler listesi olarak anlatma. Olayları zaman yolculuğu hissi veren olay yeri betimlemeleriyle anlat. Tarihi figürleri gerçek, duyguları olan karakterler gibi sun ve olayların merkezindeki ana çatışma üzerinden dramatik bir hikaye olarak kurgula.`,

  writing: `Sen bir Yazım ve Makale Koçusun. Öğrenciye asla doğrudan metin yazma. Onun yerine:
  1. "Tez İfadesi Oluşturucu" olarak davran: Öğrencinin ana fikrini tek bir güçlü cümleye dönüştürmesine yardım et.
  2. "Taslak Şablonu" sun: Boş sayfa sendromunu engellemek için, giriş-gelişme-sonuç mantığında doldurulabilir yapı iskeletleri ver.`,

  examPrep: `Sen bir Sınav Hazırlık ve Strateji modülüsün. Öğrenciye notları tekrar okumayı değil "Aktif Hatırlama" (Active Recall) yöntemini uygulat. Çoktan seçmeli sınavlarda öğretmenlerin çeldirici şıkları nasıl kurguladığını öğret. Öğrenci stresli ise 60 saniyelik odaklanma ve nefes egzersizleri (kutu nefesi) yaptır.`
};

type ViewId = 'dashboard' | 'diagnostic' | 'homework' | 'math' | 'science' | 'history' | 'writing' | 'examPrep' | 'parent' | 'profile' | 'practiceTest';

type AuthView = 'login' | 'register' | 'forgot_password';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [unlockedBadgeNotify, setUnlockedBadgeNotify] = useState<string | null>(null);

  // AI Chat Durumları
  const [messages, setMessages] = useState<Array<{ id: string, role: 'user' | 'model', text: string, feedback?: 'positive' | 'negative' }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Diagnostic (Teşhis) Ekstra Durumları
  const [diagnosticSelection, setDiagnosticSelection] = useState<string | null>(null);
  const [diagnosticDifficulty, setDiagnosticDifficulty] = useState<string | null>(null);

  // Use LocalStorage as a fallback since Firebase provisioning failed
  useEffect(() => {
    const loggedInUser = localStorage.getItem('elite-tutor-active-user');
    if (loggedInUser) {
      setIsAuthenticated(true);
    }
    
    // Yalnızca giriş yapıldıktan sonra verileri yükle veya başlat
    if (loggedInUser || isAuthenticated) {
      const data = localStorage.getItem('elite-tutor-profile');
      let currentUserData = null;
      if (data) {
        currentUserData = JSON.parse(data);
        // Geriye dönük uyumluluk (badges ve stats ekle)
        if (!currentUserData.badges) currentUserData.badges = [];
        if (!currentUserData.stats) currentUserData.stats = { messageCount: 0, feedbackCount: 0, loginStreak: 1, lastLoginStr: new Date().toDateString() };
        if (!currentUserData.name) currentUserData.name = 'Öğrenci';
        if (!currentUserData.preferredModel) currentUserData.preferredModel = 'gemini-2.5-flash';
        if (!currentUserData.topicPerformance) currentUserData.topicPerformance = [
          { subject: 'Matematik', score: 75, fullMark: 100 },
          { subject: 'Fen Bil.', score: 85, fullMark: 100 },
          { subject: 'Tarih', score: 65, fullMark: 100 },
          { subject: 'Yazım/Dil', score: 90, fullMark: 100 },
          { subject: 'Mantık', score: 70, fullMark: 100 }
        ];
        
        // Streak hesaplama
        const today = new Date().toDateString();
        if (currentUserData.stats.lastLoginStr !== today) {
           // Son giriş dünkü ise streak artır, yoksa 1 yap
           const yesterday = new Date();
           yesterday.setDate(yesterday.getDate() - 1);
           if (currentUserData.stats.lastLoginStr === yesterday.toDateString()) {
             currentUserData.stats.loginStreak += 1;
           } else {
             currentUserData.stats.loginStreak = 1;
           }
           currentUserData.stats.lastLoginStr = today;
        }
        
        setUserData(currentUserData);
        localStorage.setItem('elite-tutor-profile', JSON.stringify(currentUserData));
      } else {
        currentUserData = {
          name: 'Öğrenci',
          level: 'Belirlenmedi',
          weaknesses: [],
          lastActive: new Date().toISOString(),
          roadmap: 'Tanışma seviyesindesiniz. Yol haritası oluşturmak için seviye tespitine girin.',
          avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=student',
          badges: ['first_blood'],
          stats: { messageCount: 0, feedbackCount: 0, loginStreak: 1, lastLoginStr: new Date().toDateString() },
          preferredModel: 'gemini-2.5-flash',
          topicPerformance: [
            { subject: 'Matematik', score: 60, fullMark: 100 },
            { subject: 'Fen Bil.', score: 60, fullMark: 100 },
            { subject: 'Tarih', score: 60, fullMark: 100 },
            { subject: 'Yazım/Dil', score: 60, fullMark: 100 },
            { subject: 'Mantık', score: 60, fullMark: 100 }
          ]
        };
        localStorage.setItem('elite-tutor-profile', JSON.stringify(currentUserData));
        setUserData(currentUserData);
        setUnlockedBadgeNotify('first_blood'); // İlk girişte First Blood ver
      }
      
      // Check streak badge on load
      if (currentUserData && currentUserData.stats.loginStreak >= 3 && !currentUserData.badges.includes('streak_3')) {
        awardBadge('streak_3', currentUserData);
      }
    }
  }, [isAuthenticated]);

  const awardBadge = (badgeId: string, currentData: any = userData) => {
    if (!currentData || currentData.badges.includes(badgeId)) return;
    
    const updated = { ...currentData, badges: [...currentData.badges, badgeId] };
    setUserData(updated);
    localStorage.setItem('elite-tutor-profile', JSON.stringify(updated));
    setUnlockedBadgeNotify(badgeId);
    
    // Bildirimi 4 saniye sonra kapat
    setTimeout(() => {
      setUnlockedBadgeNotify(prev => prev === badgeId ? null : prev);
    }, 4000);
  };

  const updateStats = (statKey: string, incrementValue: number = 1) => {
    setUserData((prev: any) => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.stats[statKey] += incrementValue;
      localStorage.setItem('elite-tutor-profile', JSON.stringify(updated));
      
      // Soru sınırı kontrol (Soru Avcısı Rozeti)
      if (statKey === 'messageCount' && updated.stats.messageCount >= 5 && !updated.badges.includes('curious_mind')) {
        setTimeout(() => awardBadge('curious_mind', updated), 500);
      }
      // Geri bildirim rozeti
      if (statKey === 'feedbackCount' && updated.stats.feedbackCount >= 3 && !updated.badges.includes('good_feedback')) {
        setTimeout(() => awardBadge('good_feedback', updated), 500);
      }
      return updated;
    });
  };

    // Yeni görünüme geçerken chat'i temizle ve karşılama mesajını al
    useEffect(() => {
    setMessages([]);
    if (['diagnostic', 'homework', 'math', 'science', 'history', 'writing', 'examPrep', 'practiceTest'].includes(activeView)) {
      handleInitialAIWelcome(activeView);
    }
  }, [activeView]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Zayıf yönleri parse etme
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (activeView === 'diagnostic' && lastMsg.role === 'model') {
        const weakMatch = lastMsg.text.match(/\[WEAKNESSES\]([\s\S]*?)\[\/WEAKNESSES\]/);
        if (weakMatch) {
          const weaknessesList = weakMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
          if (weaknessesList.length > 0) {
             setUserData((prev: any) => {
               if (!prev) return prev;
               
               // Ayrıca bazı genel konu puanlarını düşürelim ki grafik dinamik gözüksün (simülasyon)
               let newTopicPerformance = prev.topicPerformance ? [...prev.topicPerformance] : [
                  { subject: 'Matematik', score: 75, fullMark: 100 },
                  { subject: 'Fen Bil.', score: 85, fullMark: 100 },
                  { subject: 'Tarih', score: 65, fullMark: 100 },
                  { subject: 'Yazım/Dil', score: 90, fullMark: 100 },
                  { subject: 'Mantık', score: 70, fullMark: 100 }
               ];
               
               const lowerScore = (subjectFilter: string) => {
                 const idx = newTopicPerformance.findIndex(t => t.subject === subjectFilter);
                 if (idx !== -1) {
                   newTopicPerformance[idx].score = Math.max(20, newTopicPerformance[idx].score - 15);
                 }
               };

               const wLower = weakMatch[1].toLowerCase();
               if(wLower.includes('matematik') || wLower.includes('denklem') || wLower.includes('kesir') || wLower.includes('sayı') || wLower.includes('hesap')) lowerScore('Matematik');
               if(wLower.includes('fen') || wLower.includes('hücre') || wLower.includes('fizik') || wLower.includes('kimya')) lowerScore('Fen Bil.');
               if(wLower.includes('tarih') || wLower.includes('inkılap') || wLower.includes('osmanlı') || wLower.includes('savaş')) lowerScore('Tarih');
               if(wLower.includes('yazım') || wLower.includes('paragraf') || wLower.includes('dil') || wLower.includes('cümle') || wLower.includes('anlam')) lowerScore('Yazım/Dil');
               if(wLower.includes('mantık') || wLower.includes('problem') || wLower.includes('analiz') || wLower.includes('muhakeme')) lowerScore('Mantık');

               const updated = { ...prev, weaknesses: weaknessesList, topicPerformance: newTopicPerformance };
               localStorage.setItem('elite-tutor-profile', JSON.stringify(updated));
               return updated;
             });
          }
        }
      }
    }
  }, [messages, activeView]);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  // Gemini API Initialize
  const getAIClient = () => {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  };

  const handleInitialAIWelcome = async (viewId: ViewId) => {
    setIsLoading(true);
    let prompt = "Merhaba! Eğitime başlamaya hazır mısın? Lütfen kendini tanıt ve süreci başlat.";
    let systemPrompt = SYSTEM_PROMPTS.homeworkHelper;

    switch(viewId) {
      case 'diagnostic':
        prompt = "Öğrenci sisteme giriş yaptı. Lütfen Seviye Kontrolü ve Boşluk Bulucu sürecini başlat. İlk teşhis sorunu sor.";
        systemPrompt = SYSTEM_PROMPTS.diagnostic;
        break;
      case 'practiceTest':
        if (userData?.weaknesses?.length > 0) {
          prompt = `Pratik Sınavı modülüne girdim. Zayıf olduğum konular şunlar: ${userData.weaknesses.join(', ')}. Lütfen sadece bu konulara odaklanan 5 soruluk interaktif bir deneme sınavı başlat. İlk soruyu sor.`;
        } else {
          prompt = `Eksik Giderme Sınavı modülüne girdim ancak sistemde henüz kayıtlı bir zayıf noktam görünmüyor. Bana seviye tespitine (Teşhis) girmemi önerebilir misin?`;
        }
        systemPrompt = SYSTEM_PROMPTS.practiceTest;
        break;
      case 'math':
        prompt = "Merhaba Öğretmenim. Matematik çalışmak istiyorum. Beni nasıl yönlendireceksin?";
        systemPrompt = SYSTEM_PROMPTS.math;
        break;
      case 'science':
        prompt = "Fen bilimleri dünyasına girmeye hazırım. Bugün ne keşfediyoruz?";
        systemPrompt = SYSTEM_PROMPTS.science;
        break;
      case 'history':
        prompt = "Zaman yolculuğuna hazırım. Hangi döneme gidiyoruz?";
        systemPrompt = SYSTEM_PROMPTS.history;
        break;
    }

    const aiClient = getAIClient();

    try {
      const response = await aiClient.models.generateContent({
        model: userData?.preferredModel || "gemini-2.5-flash",
        contents: prompt,
        config: { systemInstruction: systemPrompt }
      });
      setMessages([{ id: Date.now().toString(), role: 'model', text: response.text || "Merhaba, nasıl yardımcı olabilirim?" }]);
    } catch (error) {
      console.error(error);
      setMessages([{ id: Date.now().toString(), role: 'model', text: "Yapay Zeka modülüne bağlanılamadı. Lütfen tekrar deneyin." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e?: React.FormEvent, textOverride: string | null = null, isHint = false, hintLevel = 0) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || inputMessage;
    if (!textToSend.trim() && !isHint) return;

    if (!isHint) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: textToSend }]);
      setInputMessage('');
      updateStats('messageCount');
    }

    // Teşhis state'lerini eğer teşhis veya pratik testi ise temizleyelim
    if ((activeView === 'diagnostic' || activeView === 'practiceTest') && !isHint) {
      setDiagnosticSelection(null);
      setDiagnosticDifficulty(null);
    }

    setIsLoading(true);
    try {
      let systemPrompt = SYSTEM_PROMPTS.homeworkHelper;
      if (activeView === 'diagnostic') systemPrompt = SYSTEM_PROMPTS.diagnostic;
      if (activeView === 'practiceTest') systemPrompt = SYSTEM_PROMPTS.practiceTest;
      if (activeView === 'math') systemPrompt = SYSTEM_PROMPTS.math;
      if (activeView === 'science') systemPrompt = SYSTEM_PROMPTS.science;
      if (activeView === 'history') systemPrompt = SYSTEM_PROMPTS.history;
      if (activeView === 'writing') systemPrompt = SYSTEM_PROMPTS.writing;
      if (activeView === 'examPrep') systemPrompt = SYSTEM_PROMPTS.examPrep;

      let prompt = textToSend;
      if (isHint) {
         prompt = `Öğrenci yardım istiyor. Lütfen İpucu Seviyesi ${hintLevel} stratejini uygula. (Seviye 1: Küçük dürtme, Seviye 2: Büyük itme, Seviye 3: Birlikte adım adım çözme). Sadece ipucunu ver, asla cevabı direkt söyleme.`;
      }

      const aiClient = getAIClient();

      const response = await aiClient.models.generateContent({
        model: userData?.preferredModel || "gemini-2.5-flash",
        contents: prompt,
        config: { systemInstruction: systemPrompt }
      });
      
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response.text || "Bunu biraz daha açar mısın?" }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Hata oluştu. Sistem aşırı yüklü veya API ayarları yapılandırılmadı." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        if (!msg.feedback) updateStats('feedbackCount'); // Yalnızca ilk defa verildiyse artır
        return { ...msg, feedback };
      }
      return msg;
    }));
  };

  const SidebarButton = ({ id, icon: Icon, label }: { id: ViewId, icon: React.ElementType, label: string }) => (
    <button 
      onClick={() => {
        setActiveView(id);
        closeMenu();
      }}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none group",
        activeView === id 
        ? "bg-slate-100 text-slate-900" 
        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
      )}
    >
      <Icon className={cn("w-5 h-5", activeView === id ? "text-slate-900" : "text-slate-400 group-hover:text-slate-500")} strokeWidth={2} />
      <span>{label}</span>
      {activeView === id && (
        <motion.div layoutId="active-nav" className="ml-auto w-1 h-4 bg-slate-900 rounded-full" />
      )}
    </button>
  );

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (authView === 'login') {
      const existingAccountsRaw = localStorage.getItem('elite-tutor-accounts');
      if (existingAccountsRaw) {
        const accounts = JSON.parse(existingAccountsRaw);
        if (accounts[authEmail] && accounts[authEmail] === authPassword) {
          localStorage.setItem('elite-tutor-active-user', authEmail);
          setIsAuthenticated(true);
        } else {
          setAuthError('E-posta veya şifre hatalı.');
        }
      } else {
        setAuthError('Hesap bulunamadı.');
      }
    } else if (authView === 'register') {
      const existingAccountsRaw = localStorage.getItem('elite-tutor-accounts');
      const accounts = existingAccountsRaw ? JSON.parse(existingAccountsRaw) : {};
      
      if (accounts[authEmail]) {
        setAuthError('Bu e-posta zaten kayıtlı.');
      } else {
        accounts[authEmail] = authPassword;
        localStorage.setItem('elite-tutor-accounts', JSON.stringify(accounts));
        localStorage.setItem('elite-tutor-active-user', authEmail);
        setIsAuthenticated(true);
      }
    } else if (authView === 'forgot_password') {
      const existingAccountsRaw = localStorage.getItem('elite-tutor-accounts');
      const accounts = existingAccountsRaw ? JSON.parse(existingAccountsRaw) : {};
      
      if (accounts[authEmail]) {
        // Mock password simple recovery
        setAuthError(`Şifreniz: ${accounts[authEmail]} (Demo olduğu için şifreniz doğrudan gösterilmektedir)`);
      } else {
        setAuthError('Hesap bulunamadı.');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('elite-tutor-active-user');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC] items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-slate-900 p-8 text-white text-center">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
              <div className="w-5 h-5 bg-white rounded-sm"></div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Lumière</h1>
            <p className="text-slate-400 mt-2 text-sm">{
              authView === 'login' ? 'Akıllı eğitim asistanına tekrar hoş geldin.' :
              authView === 'register' ? 'Sana özel eğitim deneyimine katıl.' :
              'Şifreni güvenle sıfırla.'
            }</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleAuthSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">E-posta Adresi</label>
                <input 
                  type="email" 
                  required
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="isim@adres.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors"
                />
              </div>
              
              {authView !== 'forgot_password' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Şifre</label>
                  <input 
                    type="password" 
                    required
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors"
                  />
                </div>
              )}

              {authError && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium text-center border border-rose-100">
                  {authError}
                </div>
              )}

              <button type="submit" className="w-full bg-slate-900 text-white rounded-xl py-3.5 font-bold hover:bg-slate-800 transition-colors">
                {authView === 'login' ? 'Giriş Yap' : authView === 'register' ? 'Ücretsiz Kayıt Ol' : 'Şifremi Hatırlat'}
              </button>
            </form>

            <div className="mt-8 text-center space-y-3">
              {authView === 'login' ? (
                <>
                  <p className="text-sm text-slate-500">
                    Hesabın yok mu? <button type="button" onClick={() => {setAuthView('register'); setAuthError('');}} className="text-slate-900 font-bold hover:underline">Hemen Oluştur</button>
                  </p>
                  <p className="text-sm text-slate-500">
                    <button type="button" onClick={() => {setAuthView('forgot_password'); setAuthError('');}} className="text-slate-500 font-medium hover:text-slate-900 hover:underline">Şifremi Unuttum</button>
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  Zaten bir hesabın var mı? <button type="button" onClick={() => {setAuthView('login'); setAuthError('');}} className="text-slate-900 font-bold hover:underline">Giriş Yap</button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
            className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR NAVIGATION */}
      <motion.nav 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-xl lg:shadow-none flex flex-col p-4 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 mb-8 px-2 mt-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          <span className="font-bold text-xl tracking-tight">Lumière</span>
          <button onClick={closeMenu} className="lg:hidden ml-auto p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 scrollbar-hide">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">Ana Modüller</p>
            <SidebarButton id="dashboard" icon={LayoutDashboard} label="Kontrol Paneli" />
            <SidebarButton id="diagnostic" icon={Activity} label="Seviye Teşhisi" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">Öğrenme</p>
            <SidebarButton id="homework" icon={HelpCircle} label="Ödev Yardımcısı" />
            <SidebarButton id="math" icon={Calculator} label="Matematik" />
            <SidebarButton id="science" icon={FlaskConical} label="Fen Bilimleri" />
            <SidebarButton id="history" icon={Globe2} label="Tarih" />
            <SidebarButton id="writing" icon={PenTool} label="Yazım & Makale" />
            <SidebarButton id="practiceTest" icon={ClipboardList} label="Eksik Giderme Sınavı" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">Takip & Ayarlar</p>
            <SidebarButton id="examPrep" icon={Target} label="Sınav Stratejisi" />
            <SidebarButton id="parent" icon={ShieldCheck} label="Veli Paneli" />
            <SidebarButton id="profile" icon={Settings} label="Profil Ayarları" />
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100">
          <div 
            onClick={() => { setActiveView('profile'); closeMenu(); }}
            className={cn(
              "flex items-center gap-3 px-3 py-2 cursor-pointer border rounded-lg transition-colors",
              activeView === 'profile' ? "bg-slate-100 border-slate-200" : "bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200"
            )}
          >
            {userData?.avatar ? (
              <img src={userData.avatar} alt="User Avatar" className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200" />
            ) : (
              <UserCircle className="w-9 h-9 text-slate-400" />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 leading-tight">{userData?.name || 'Öğrenci Profili'}</span>
              <span className="text-[11px] font-medium text-slate-500 leading-tight truncate w-32">{userData?.level || 'Belirlenmedi'}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); logout(); }} className="ml-auto p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="Çıkış Yap">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* MAIN LAYOUT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* TOP MOBILE HEADER */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center">
            <button onClick={toggleMenu} className="p-2 text-slate-500 hover:text-slate-900 mr-2 -ml-2 rounded-lg transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="font-bold text-slate-900 tracking-tight text-lg">Lumière</div>
          </div>
          
          <div className="shrink-0 cursor-pointer" onClick={() => setActiveView('profile')}>
             {userData?.avatar ? (
              <img src={userData.avatar} alt="User Avatar" className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200" />
            ) : (
              <UserCircle className="w-8 h-8 text-slate-400" />
            )}
          </div>
        </header>

        {/* CONTENT TRANSITIONS */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col pt-8 lg:pt-0"
            >
              {/* KONTROL PANELİ */}
              {activeView === 'dashboard' && (
                <div className="p-8 flex-1 overflow-y-auto">
                  <header className="flex justify-between items-end mb-8">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Hoş Geldin!</h1>
                      <p className="text-slate-500">Senin için özel olarak hazırlanmış öğrenme yol haritası.</p>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div whileHover={{ y: -2 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-500 text-sm font-medium">Mevcut Seviye</span>
                        <span className="bg-indigo-50 text-indigo-600 text-xs px-2 py-1 rounded-md font-bold flex items-center">
                          <Activity className="w-3 h-3 mr-1" />
                          Durum
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">
                        {userData?.level || 'Belirlenmedi'}
                      </p>
                      <button 
                        onClick={() => setActiveView('diagnostic')}
                        className="mt-4 text-xs text-slate-500 font-medium hover:text-slate-900 flex items-center group transition-colors"
                      >
                        Seviye Tespitine Gir <ChevronRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>

                    <motion.div whileHover={{ y: -2 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-slate-500 text-sm font-medium">Yol Haritası & Analiz</span>
                            <span className="bg-rose-50 text-rose-600 text-xs px-2 py-1 rounded-md font-bold flex items-center">
                              <Target className="w-3 h-3 mr-1" />
                              Hedef
                            </span>
                          </div>
                          <p className="text-slate-700 text-sm leading-relaxed mb-4">{userData?.roadmap}</p>
                          
                          <div className="mt-4 border-t border-slate-100 pt-4">
                            <span className="text-sm font-bold text-slate-700 block mb-3">Zayıf Yönler:</span>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {userData?.weaknesses?.length > 0 ? (
                                userData.weaknesses.map((w: string, i: number) => (
                                  <span key={i} className="bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold leading-none">{w}</span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-500 font-medium">Test sonucu bekleniyor...</span>
                              )}
                            </div>
                            
                            {userData?.weaknesses?.length > 0 ? (
                              <button 
                                onClick={() => setActiveView('practiceTest')}
                                className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors inline-flex items-center"
                              >
                                <ClipboardList className="w-4 h-4 mr-2" />
                                Eksik Giderme Sınavı Başlat
                              </button>
                            ) : (
                              <button 
                                onClick={() => setActiveView('diagnostic')}
                                className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors inline-flex items-center"
                              >
                                <Activity className="w-4 h-4 mr-2" />
                                Kök Neden Teşhisi Başlat
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Radar Chart Bölümü */}
                        {userData?.topicPerformance && (
                          <div className="w-full md:w-64 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 w-full text-center">Yetenek Dağılımı</span>
                            <div className="w-full h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={userData.topicPerformance}>
                                  <PolarGrid stroke="#e2e8f0" />
                                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                  <Radar name="Öğrenci" dataKey="score" stroke="#4f46e5" strokeWidth={2} fill="#6366f1" fillOpacity={0.2} />
                                  <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                                  />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  <div className="mb-10">
                    <div className="flex items-center justify-between mb-4 px-1">
                      <h2 className="text-lg font-bold text-slate-800 flex items-center">
                        <Award className="w-5 h-5 text-amber-500 mr-2" /> 
                        Kazanılan Rozetler
                      </h2>
                      <span className="text-sm font-medium text-slate-500">
                        {userData?.badges?.length || 0} Rozet
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {userData?.badges && userData.badges.map((badgeId: string) => {
                        const badgeDef = BADGE_DEFINITIONS[badgeId];
                        if (!badgeDef) return null;
                        return (
                          <motion.div 
                            key={badgeId} 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={cn("flex items-center p-3 rounded-xl border shadow-sm bg-white", badgeDef.bg)}
                          >
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-white shadow-sm", badgeDef.color)}>
                              <badgeDef.icon className="w-5 h-5" strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col pr-4">
                              <span className="text-sm font-bold text-slate-900 leading-tight mb-0.5">{badgeDef.name}</span>
                              <span className="text-[11px] font-medium text-slate-500 leading-tight">{badgeDef.desc}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                      
                      {(!userData?.badges || userData.badges.length === 0) && (
                        <div className="w-full py-8 text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                          <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-500 text-sm font-medium">Henüz rozet kazanılmadı. Öğrenmeye başla!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Önerilen Modüller</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-8">
                     {[
                       { id: 'math', title: 'Matematik', desc: 'Neden sonuç ilişkisiyle öğren.', icon: Calculator, color: 'text-blue-500', bg: 'bg-blue-50' },
                       { id: 'science', title: 'Fen Bilimleri', desc: 'Evdeki laboratuvar serüveni.', icon: FlaskConical, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                       { id: 'history', title: 'Tarih', desc: 'Olayların merkezinde ol.', icon: Globe2, color: 'text-amber-500', bg: 'bg-amber-50' },
                       { id: 'writing', title: 'Yazım', desc: 'Tez oluşturucu araçlar.', icon: PenTool, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                     ].map((mod) => (
                       <motion.div 
                         whileHover={{ y: -2 }}
                         key={mod.id} 
                         onClick={() => setActiveView(mod.id as ViewId)} 
                         className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition-all group flex flex-col items-start"
                       >
                         <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-105", mod.bg, mod.color)}>
                           <mod.icon className="w-5 h-5" strokeWidth={2} />
                         </div>
                         <h3 className="font-bold text-slate-800 mb-1">{mod.title}</h3>
                         <p className="text-xs text-slate-500 font-medium leading-relaxed">{mod.desc}</p>
                       </motion.div>
                     ))}
                  </div>
                </div>
              )}

              {/* VELİ PANELİ */}
              {activeView === 'parent' && (
                <div className="p-8 flex-1 overflow-y-auto">
                  <header className="flex justify-between items-end mb-8">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Veli Kontrol Paneli</h1>
                      <p className="text-slate-500 text-sm">Öğrenciye görevleri vermek yerine nasıl rehberlik edeceğinizi görün.</p>
                    </div>
                  </header>
                  
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                    <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center">
                      <div className="p-2 bg-indigo-50 rounded-lg justify-center mr-3">
                        <Activity className="w-4 h-4 text-indigo-600" />
                      </div>
                      Öğrenci İlerleme Raporu
                    </h3>
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-3">
                      <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-slate-500 font-medium text-xs">Veriler toplanıyor. Çocuğunuzun önce görevleri tamamlaması gerekmektedir.</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center">
                      <div className="p-2 bg-rose-50 rounded-lg justify-center mr-3">
                        <HelpCircle className="w-4 h-4 text-rose-600" />
                      </div>
                      Rehberlik Tavsiyesi: Sokratik Yaklaşım
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                      Çocuğunuz zorlandığında cevabı doğrudan vermek yerine şu geliştirici soruları sormayı deneyin:
                    </p>
                    <ul className="space-y-3">
                      {[
                        "Burada anlamadığın kısmı kendi kelimelerinle anlatır mısın?",
                        "Buna benzer daha önce çözdüğün bir problem hatırlıyor musun?",
                        "Sence ilk adımımız ne olmalı?"
                      ].map((q, idx) => (
                        <li key={idx} className="flex items-start">
                          <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs mr-3 shrink-0">{idx + 1}</div>
                          <span className="text-slate-700 text-sm font-medium pt-0.5">{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* PROFİL VE AYARLAR PANELİ */}
              {activeView === 'profile' && (
                <div className="p-8 flex-1 overflow-y-auto">
                  <header className="flex justify-between items-end mb-8">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Profil Ayarları</h1>
                      <p className="text-slate-500 text-sm">Avatarını ve hesap bilgilerini buradan yönetebilirsin.</p>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* AVATAR BÖLÜMÜ */}
                    <div className="lg:col-span-1 space-y-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <div className="mb-4">
                           {userData?.avatar ? (
                            <img src={userData.avatar} alt="Avatar" className="w-24 h-24 mx-auto rounded-full bg-slate-100 border-4 border-white shadow-sm" />
                          ) : (
                            <UserCircle className="w-24 h-24 mx-auto text-slate-300" />
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">{userData?.name || 'Öğrenci'}</h3>
                        <p className="text-sm font-medium text-indigo-600 bg-indigo-50 inline-block px-3 py-1 rounded-full">{userData?.level || 'Seviye Belirlenmedi'}</p>
                      </div>

                      {/* İSTATİSTİKLER */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-4">Genel İstatistikler</h4>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-sm flex items-center"><MessageSquare className="w-4 h-4 mr-2" /> Toplam Mesaj</span>
                          <span className="font-bold text-slate-900">{userData?.stats?.messageCount || 0}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-sm flex items-center"><Flame className="w-4 h-4 mr-2 text-orange-500" /> Giriş Serisi</span>
                          <span className="font-bold text-slate-900">{userData?.stats?.loginStreak || 0} Gün</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-sm flex items-center"><Star className="w-4 h-4 mr-2 text-emerald-500" /> Verilen Geri Bildirim</span>
                          <span className="font-bold text-slate-900">{userData?.stats?.feedbackCount || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* DÜZENLEME FORMU */}
                    <div className="lg:col-span-2">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                          <div className="p-2 bg-slate-100 rounded-lg mr-3">
                            <Settings className="w-4 h-4 text-slate-600" />
                          </div>
                          Profili Düzenle
                        </h3>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Görünüm Adı</label>
                            <input 
                              type="text" 
                              value={userData?.name || ''}
                              onChange={(e) => {
                                const newName = e.target.value;
                                const updated = { ...userData, name: newName };
                                setUserData(updated);
                                localStorage.setItem('elite-tutor-profile', JSON.stringify(updated));
                              }}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors shadow-inner"
                              placeholder="Adını gir..."
                            />
                          </div>

                          <div className="pt-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Avatar Kelimesi (Seed) veya URL</label>
                            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                              Rastgele bir karakter oluşturmak için aşağıya isminizi veya herhangi bir kelime yazabilirsiniz (İngilizce harflerle). Eğer isterseniz, direkt geçerli bir resim kopyalayıp (http://...) yapıştırabilirsiniz.
                            </p>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newAvatar = val.startsWith('http') ? val : `https://api.dicebear.com/7.x/notionists/svg?seed=${val || 'student'}`;
                                  const updated = { ...userData, avatar: newAvatar };
                                  setUserData(updated);
                                  localStorage.setItem('elite-tutor-profile', JSON.stringify(updated));
                                }}
                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors shadow-inner"
                                placeholder="Örn: ali, ayse, kitap, star..."
                              />
                            </div>
                            
                            <div className="mt-4">
                              <span className="text-xs font-semibold text-slate-400 uppercase mr-3">Hızlı Şablonlar:</span>
                              <div className="inline-flex gap-2 flex-wrap mt-2 sm:mt-0">
                                {['student', 'explorer', 'genius', 'hero', 'dreamer'].map(seed => (
                                  <button 
                                    key={seed}
                                    onClick={() => {
                                      const newAvatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`;
                                      const updated = { ...userData, avatar: newAvatar };
                                      setUserData(updated);
                                      localStorage.setItem('elite-tutor-profile', JSON.stringify(updated));
                                    }}
                                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-all capitalize hover:shadow-sm"
                                  >
                                    {seed}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Tercih Edilen Yapay Zeka Modeli</label>
                            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                              Sistemdeki ücretsiz yapay zeka modelleri arasından eğitim stilinize en uygun olanı seçebilirsiniz.
                            </p>
                            <select 
                              value={userData?.preferredModel || 'gemini-2.5-flash'}
                              onChange={(e) => {
                                const updated = { ...userData, preferredModel: e.target.value };
                                setUserData(updated);
                                localStorage.setItem('elite-tutor-profile', JSON.stringify(updated));
                              }}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors shadow-inner"
                            >
                              <option value="gemini-2.5-flash">Gemini 2.5 Flash (En Hızlı & Varsayılan)</option>
                              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Derin Mantık & Analiz)</option>
                              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Düşük Gecikme)</option>
                              <option value="gemini-2.0-flash">Gemini 2.0 Flash (Deneysel)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI CHAT ARAYÜZÜ (Ödev, Branşlar, Teşhis) */}
              {['diagnostic', 'homework', 'math', 'science', 'history', 'writing', 'examPrep'].includes(activeView) && (
                <div className="flex flex-col h-full bg-[#F8FAFC] relative flex-1 overflow-hidden">
                  
                  {/* Chat Başlığı */}
                  <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                        {activeView === 'homework' && <HelpCircle className="w-4 h-4" />}
                        {activeView === 'math' && <Calculator className="w-4 h-4" />}
                        {activeView === 'science' && <FlaskConical className="w-4 h-4" />}
                        {activeView === 'history' && <Globe2 className="w-4 h-4" />}
                        {activeView === 'writing' && <PenTool className="w-4 h-4" />}
                        {activeView === 'examPrep' && <Target className="w-4 h-4" />}
                        {activeView === 'diagnostic' && <Activity className="w-4 h-4" />}
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-800 text-sm tracking-tight leading-tight">
                          {activeView === 'homework' ? 'Ödev Yardımcısı' :
                           activeView === 'math' ? 'Matematik Motoru' :
                           activeView === 'science' ? 'Fen Bilimleri Motoru' :
                           activeView === 'history' ? 'Tarih Motoru' :
                           activeView === 'writing' ? 'Yazım & Makale Koçu' :
                           activeView === 'examPrep' ? 'Sınav & Strateji' :
                           'Teşhis Motoru'}
                        </h2>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {activeView === 'diagnostic' ? 'Eksikleri tespit ediyoruz.' : 'Cevapları değil, öğrenmeyi öğretiyoruz.'}
                        </p>
                      </div>
                    </div>
                    
                    {/* İpucu Sistemi */}
                    {activeView !== 'diagnostic' && activeView !== 'examPrep' && (
                      <div className="hidden sm:flex space-x-2">
                        <button onClick={() => sendMessage(undefined, null, true, 1)} disabled={isLoading} className="text-xs text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50">
                          İpucu 1
                        </button>
                        <button onClick={() => sendMessage(undefined, null, true, 2)} disabled={isLoading} className="text-xs text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50">
                          İpucu 2
                        </button>
                      </div>
                    )}
                  </header>

                  {/* Mesaj Alanı */}
                  <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-6 bg-transparent scrollbar-hide">
                    {messages.length === 0 && !isLoading && (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                           <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-300 mx-auto mb-4">
                             <BrainCircuit className="w-6 h-6" />
                           </div>
                           <p className="text-slate-500 text-sm font-medium">Yapay Zeka hazırlanıyor, lütfen bekleyin...</p>
                        </div>
                      </div>
                    )}
                    
                    {messages.map((msg, idx) => {
                      // Özel Test (Teşhis veya Pratik) Gösterimi
                      if ((activeView === 'diagnostic' || activeView === 'practiceTest') && msg.role === 'model') {
                        const soruMatch = msg.text.match(/\[SORU\]([\s\S]*?)\[SECENEKLER\]([\s\S]*?)\[\/SORU\]/);
                        if (soruMatch) {
                          let prefix = msg.text.substring(0, msg.text.indexOf('[SORU]')).trim();
                          prefix = prefix.replace(/\[WEAKNESSES\][\s\S]*?\[\/WEAKNESSES\]/, '').trim(); // Temizlik
                          const question = soruMatch[1].trim();
                          const optionsRaw = soruMatch[2].trim();
                          const options = optionsRaw.split('\n').map(o => o.trim()).filter(o => o.length > 0);
                          const isLast = idx === messages.length - 1;

                          return (
                            <div key={idx} className="flex justify-start">
                              <div className="max-w-[90%] w-[500px] rounded-2xl px-6 py-5 shadow-sm text-sm leading-relaxed border bg-white text-slate-700 border-slate-200 rounded-bl-sm">
                                {prefix && <p className="mb-4 text-slate-600">{prefix}</p>}
                                <div className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">{question}</div>
                                <div className="space-y-2">
                                  {options.map((opt, i) => (
                                    <button 
                                      key={i}
                                      disabled={!isLast}
                                      onClick={() => isLast && setDiagnosticSelection(opt)}
                                      className={cn(
                                        "w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm",
                                        !isLast ? "bg-slate-50 border-slate-200 text-slate-500 cursor-default" :
                                        diagnosticSelection === opt 
                                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold shadow-sm" 
                                          : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 cursor-pointer"
                                      )}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>

                                {isLast && diagnosticSelection && (
                                  <div className="pt-4 mt-4 border-t border-slate-100">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bu soru sana nasıl geldi?</p>
                                    <div className="flex gap-2">
                                      {['Çok Kolay', 'Normal', 'Zorlandım'].map(diff => (
                                        <button 
                                          key={diff}
                                          onClick={() => setDiagnosticDifficulty(diff)}
                                          className={cn(
                                            "flex-1 py-2 text-xs font-bold rounded-lg border transition-colors",
                                            diagnosticDifficulty === diff 
                                              ? "bg-slate-800 text-white border-slate-800" 
                                              : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                          )}
                                        >
                                          {diff}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {isLast && diagnosticSelection && diagnosticDifficulty && (
                                  <div className="pt-4 mt-2">
                                    <button 
                                      onClick={() => {
                                        sendMessage(undefined, `Cevabım: "${diagnosticSelection}". Bu soru benim için '${diagnosticDifficulty}' zorluğundaydı.`);
                                        if (activeView === 'diagnostic' && userData?.badges && !userData.badges.includes('diagnostic_done')) {
                                          setTimeout(() => awardBadge('diagnostic_done'), 1000);
                                        }
                                      }}
                                      className="w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center py-3 rounded-xl font-bold transition-colors text-sm"
                                    >
                                      Cevabı Onayla <Send className="w-4 h-4 ml-2" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                      }

                      // Normal Mesaj Gösterimi
                      const cleanText = msg.text.replace(/\[WEAKNESSES\][\s\S]*?\[\/WEAKNESSES\]/, '').trim();
                      if (!cleanText) return null;
                      
                      return (
                        <div key={idx} className={`flex flex-col group ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={cn("max-w-[85%] rounded-2xl px-5 py-4 shadow-sm text-sm leading-relaxed border relative", 
                            msg.role === 'user' 
                            ? 'bg-slate-900 text-white border-slate-800 rounded-br-sm' 
                            : 'bg-white text-slate-700 border-slate-200 rounded-bl-sm space-y-3'
                          )}>
                            {cleanText.split('\n').map((line, i) => (
                              <p key={i} dangerouslySetInnerHTML={{
                                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
                              }} />
                            ))}
                          </div>
                          
                          {msg.role === 'model' && activeView !== 'diagnostic' && (
                            <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: msg.feedback ? 1 : undefined }}>
                              <button 
                                onClick={() => handleFeedback(msg.id, 'positive')}
                                className={cn("p-1 rounded hover:bg-slate-100 transition-colors", msg.feedback === 'positive' ? "text-emerald-600" : "text-slate-400")}
                                title="Faydalı"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleFeedback(msg.id, 'negative')}
                                className={cn("p-1 rounded hover:bg-slate-100 transition-colors", msg.feedback === 'negative' ? "text-rose-600" : "text-slate-400")}
                                title="Faydalı Değil"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm flex items-center space-x-1.5 h-12">
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} className="h-4" />
                  </div>

                  {/* Input Alanı */}
                  <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                    <form 
                      onSubmit={(e) => sendMessage(e)}
                      className="flex flex-col mx-auto max-w-4xl w-full"
                    >
                      <div className="relative flex items-center bg-white border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-slate-100 focus-within:border-slate-400 transition-all shadow-sm">
                        <input 
                          type="text" 
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          placeholder="Sorunu veya anlamadığın yeri buraya yaz..."
                          className="flex-1 bg-transparent px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                          disabled={isLoading}
                        />
                        <div className="pr-2 shrink-0 flex items-center space-x-2">
                          {isMobileMenuOpen || activeView === 'diagnostic' ? null : (
                            <button type="button" onClick={() => sendMessage(undefined, null, true, 3)} disabled={isLoading} className="sm:hidden text-xs text-slate-500 font-medium py-1.5 px-2 hover:bg-slate-100 rounded-lg transition-colors">
                              İpucu
                            </button>
                          )}
                          <button 
                            type="submit" 
                            disabled={isLoading || !inputMessage.trim()}
                            className={cn("p-2 rounded-lg transition-colors active:scale-95 disabled:pointer-events-none",
                              inputMessage.trim() ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-100 text-slate-400"
                            )}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path></svg>
                          </button>
                        </div>
                      </div>
                      <div className="text-center mt-2 text-[10px] font-medium text-slate-400">
                        Sistem doğrudan cevap vermez, kendi başınıza öğrenmeniz için rehberlik eder.
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* TOAST NOTIFICATION FOR BADGES */}
      <AnimatePresence>
        {unlockedBadgeNotify && BADGE_DEFINITIONS[unlockedBadgeNotify] && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 pointer-events-none"
          >
            <div className={cn("flex items-center gap-4 p-4 pr-6 rounded-2xl border shadow-2xl bg-white", BADGE_DEFINITIONS[unlockedBadgeNotify].bg)}>
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-100", BADGE_DEFINITIONS[unlockedBadgeNotify].color)}>
                {React.createElement(BADGE_DEFINITIONS[unlockedBadgeNotify].icon, { className: "w-6 h-6", strokeWidth: 2.5 })}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Yeni Rozet Kilidi Açıldı!</span>
                <span className="text-sm font-bold text-slate-900 leading-tight mb-0.5">{BADGE_DEFINITIONS[unlockedBadgeNotify].name}</span>
                <span className="text-[11px] font-medium text-slate-600 leading-tight">{BADGE_DEFINITIONS[unlockedBadgeNotify].desc}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

