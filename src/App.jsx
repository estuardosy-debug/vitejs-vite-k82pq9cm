import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc
} from 'firebase/firestore';
import { 
  QrCode, User, LogOut, FileSpreadsheet, Users, CheckCircle, 
  AlertCircle, Lock, RefreshCw, BookOpen, Plus, Trash2, 
  UserPlus, Settings, ShieldAlert, Check, X, UserX, 
  BarChart3, Share2, PieChart as PieChartIcon, ExternalLink, Calendar,
  Eraser, AlertTriangle, Download, FileText, Smartphone, MapPin, Search
} from 'lucide-react';

// Librería de gráficos
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAv2qf4LX-1ZWogHmlh2K8mPsz6jZzd0G8",
  authDomain: "asistenciaqr-pro.firebaseapp.com",
  projectId: "asistenciaqr-pro",
  storageBucket: "asistenciaqr-pro.firebasestorage.app",
  messagingSenderId: "807077573027",
  appId: "1:807077573027:web:d469bf687224298a4aaa16"
};

const appId = 'asistencia-clase-2026';
const MASTER_KEY = "LULY2639"; 

const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "TU_API_KEY_AQUI";

let app, auth, db;
if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) { console.error("Error Firebase:", e); }
}

// --- COMPONENTES UI ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon, title = '' }) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const vars = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-green-600 text-white hover:bg-green-700",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
  };
  return <button onClick={onClick} className={`${base} ${vars[variant]} ${className}`} disabled={disabled} title={title}>{Icon && <Icon size={18} />}{children}</button>;
};

const Input = ({ label, type = "text", value, onChange, placeholder, required = false, disabled = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input 
      type={type} value={value} onChange={onChange} disabled={disabled}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white text-black'}`}
      placeholder={placeholder} required={required} 
      style={!disabled ? { backgroundColor: '#ffffff', color: '#000000' } : {}} 
    />
  </div>
);

const Select = ({ label, value, onChange, options, placeholder, required = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select 
      value={value} onChange={onChange} 
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-white text-black"
      required={required} style={{ backgroundColor: '#ffffff', color: '#000000' }}
    >
      <option value="" disabled className="text-gray-400">{placeholder}</option>
      {options.map((opt) => <option key={opt.id} value={opt.name} className="text-black">{opt.name}</option>)}
    </select>
  </div>
);

const Card = ({ children, className = "", ...props }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

// --- APP PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing'); 
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState(null); 
  const [adminUser, setAdminUser] = useState(null); 
  const [publicCourseId, setPublicCourseId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const course = params.get('course');
    const teacher = params.get('teacher');
    
    if (mode === 'public' && course && teacher) {
      setPublicCourseId({ courseName: course, teacherEmail: teacher });
      setView('public-report');
      setLoading(false);
    }
  }, []);

  if (!isConfigured) return <div className="p-10 text-center">Configura Firebase en el código.</div>;

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => { 
        if (!auth.currentUser) {
            try { await signInAnonymously(auth); } catch (e) {} 
        }
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => {
      if(!publicCourseId) {
        setUser(u);
        setLoading(false);
      }
    });
  }, [publicCourseId]);

  const handleLogout = () => {
    setCurrentUserData(null);
    setAdminUser(null);
    setView('landing');
    window.history.pushState({}, '', window.location.pathname);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => !publicCourseId && setView('landing')}>
            <div className="bg-blue-600 p-2 rounded-lg"><QrCode size={20} className="text-white" /></div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">AsistenciaQR Pro</h1>
          </div>
          {view !== 'landing' && view !== 'public-report' && (
            <div className="flex items-center gap-4">
              {adminUser && <span className="text-sm font-medium hidden md:block text-gray-600">Hola, {adminUser.name}</span>}
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1"><LogOut size={16} /> Salir</button>
            </div>
          )}
          {view === 'public-report' && (
             <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">Vista Pública</span>
          )}
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {view === 'landing' && <LandingScreen setView={setView} />}
        {view === 'admin-login' && <AdminLogin setView={setView} setAdminUser={setAdminUser} appId={appId} />}
        {view === 'admin-register' && <AdminRegister setView={setView} appId={appId} />}
        {view === 'student-login' && <StudentLogin setView={setView} setCurrentUserData={setCurrentUserData} user={user} appId={appId} />}
        {view === 'student-register' && <StudentRegister setView={setView} setCurrentUserData={setCurrentUserData} user={user} appId={appId} />}
        {view === 'admin-dash' && <AdminDashboard user={user} adminUser={adminUser} appId={appId} />}
        {view === 'student-dash' && <StudentDashboard userData={currentUserData} user={user} appId={appId} />}
        {view === 'public-report' && <PublicReportView publicData={publicCourseId} appId={appId} />}
      </main>
    </div>
  );
}

// --- PANTALLAS ---
const LandingScreen = ({ setView }) => (
  <div className="flex flex-col items-center justify-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="text-center mb-10 max-w-lg">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Registro de Asistencia Inteligente</h2>
      <p className="text-gray-600">Plataforma segura para el control de asistencia en el aula.</p>
    </div>
    <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">
      <Card className="hover:ring-2 hover:ring-blue-500 cursor-pointer group p-8 flex flex-col items-center text-center h-full" onClick={() => setView('student-login')}>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><User size={32} className="text-blue-600" /></div>
          <h3 className="text-xl font-bold mb-2">Soy Estudiante</h3>
          <Button className="w-full mt-auto">Acceder</Button>
      </Card>
      <Card className="hover:ring-2 hover:ring-indigo-500 cursor-pointer group p-8 flex flex-col items-center text-center h-full" onClick={() => setView('admin-login')}>
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Lock size={32} className="text-indigo-600" /></div>
          <h3 className="text-xl font-bold mb-2">Soy Docente</h3>
          <Button variant="secondary" className="w-full mt-auto">Administración</Button>
      </Card>
    </div>
  </div>
);

// --- ACCESO DOCENTE ---
const AdminLogin = ({ setView, setAdminUser, appId }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleManualLogin = async (e) => {
    e.preventDefault();
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_admins'), where("email", "==", email), where("password", "==", password));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0].data();
        if (d.status !== 'approved' && d.role !== 'superadmin') return alert("Cuenta no aprobada");
        setAdminUser({ ...d, id: snap.docs[0].id });
        setView('admin-dash');
      } else alert("Credenciales incorrectas");
    } catch (e) { console.error(e); }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const gUser = result.user;
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_admins'), where("email", "==", gUser.email));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            const d = snap.docs[0].data();
            if (d.status !== 'approved' && d.role !== 'superadmin') return alert("Cuenta no aprobada");
            setAdminUser({ ...d, id: snap.docs[0].id });
            setView('admin-dash');
        } else {
            alert("No tienes una cuenta de docente con este correo de Google. Por favor, regístrate primero.");
            setView('admin-register');
        }
    } catch (error) {
        console.error(error);
        if(error.code !== 'auth/popup-closed-by-user') alert("Error con Google. Intenta el ingreso manual.");
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Acceso Docente</h2>
        
        <Button onClick={handleGoogleLogin} className="w-full mb-6 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 flex justify-center gap-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="none" d="M1 1h22v22H1z"/></svg>
            Ingresar con Google
        </Button>
        
        <div className="flex items-center gap-4 mb-6">
            <hr className="flex-1 border-gray-200" /><span className="text-xs text-gray-400">O INGRESA MANUALMENTE</span><hr className="flex-1 border-gray-200" />
        </div>

        <form onSubmit={handleManualLogin}>
            <Input label="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <Input label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            <Button className="w-full" type="submit">Entrar Manual</Button>
            <div className="mt-4 text-center"><a onClick={()=>setView('admin-register')} className="text-blue-600 cursor-pointer">Registrarse como Docente</a></div>
        </form>
      </Card>
    </div>
  );
};

const AdminRegister = ({ setView, appId }) => {
    const [f, setF] = useState({name:'', email:'', password:'', secretCode:''});
    const reg = async (e) => {
        e.preventDefault();
        const role = f.secretCode === MASTER_KEY ? 'superadmin' : 'docente';
        const status = role === 'superadmin' ? 'approved' : 'pending';
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'qr_admins'), {...f, role, status, createdAt: serverTimestamp()});
        alert("Solicitud enviada"); setView('admin-login');
    };
    return <div className="max-w-md mx-auto py-10"><Card className="p-8"><h2 className="text-2xl text-center mb-4">Registro Docente</h2><form onSubmit={reg}><Input label="Nombre" value={f.name} onChange={e=>setF({...f, name:e.target.value})} required/><Input label="Email" value={f.email} onChange={e=>setF({...f, email:e.target.value})} required/><Input label="Password" type="password" value={f.password} onChange={e=>setF({...f, password:e.target.value})} required/><Input label="Código (Solo SuperAdmin)" value={f.secretCode} onChange={e=>setF({...f, secretCode:e.target.value})} /><Button className="w-full" type="submit">Registrar</Button><div className="mt-4 text-center"><a onClick={()=>setView('admin-login')} className="text-gray-500 cursor-pointer text-sm">Volver al login</a></div></form></Card></div>
};

// --- ACCESO ESTUDIANTE ---
const StudentLogin = ({ setView, setCurrentUserData, user, appId }) => {
    const [c, setC] = useState([]); 
    const [sel, setSel] = useState(''); 
    const [id, setId] = useState('');
    
    useEffect(() => { 
        if(user) onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_courses'), orderBy('name')), 
        s=>setC(s.docs.map(d=>({ id: d.id, ...d.data() })))) 
    }, [user]);

    const handleGoogleLogin = async () => {
        if (!sel) return alert("Por favor, selecciona tu curso primero.");
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const gUser = result.user;
            
            const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_users'), where("deviceId", "==", gUser.uid));
            const s = await getDocs(q);
            
            if (!s.empty) {
                setCurrentUserData({...s.docs[0].data(), currentCourse: sel}); 
                setView('student-dash');
            } else {
                alert("Cuenta de Google nueva. Completa tu registro agregando tu carné.");
                setCurrentUserData({ googleUid: gUser.uid, tempName: gUser.displayName, tempEmail: gUser.email });
                setView('student-register');
            }
        } catch (error) {
            console.error(error);
            if(error.code !== 'auth/popup-closed-by-user') alert("Error con Google Auth. Intenta el acceso manual.");
        }
    };

    const handleManualLogin = async (e) => { 
      e.preventDefault(); 
      if (!sel) return alert("Selecciona un curso.");
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_users'), where("carne", "==", id));
      const s = await getDocs(q); 
      
      if(!s.empty){ 
        const userData = s.docs[0].data();
        
        if (userData.deviceId && userData.deviceId !== user.uid) {
           alert("⛔ ACCESO DENEGADO\n\nEste carné está vinculado a otra cuenta o dispositivo.\nSi lo registraste con Google, usa el botón 'Ingresar con Google'.");
           return;
        }

        setCurrentUserData({...userData, currentCourse: sel}); 
        setView('student-dash'); 
      } else {
        alert("Carné no encontrado"); 
      }
    };
    
    return (
      <div className="max-w-md mx-auto py-10">
        <Card className="p-8">
            <h2 className="text-2xl text-center font-bold mb-6">Acceso Estudiante</h2>
            <Select label="1. Selecciona tu Curso" value={sel} onChange={e=>setSel(e.target.value)} options={c} placeholder="Elige..." required />
            
            <Button onClick={handleGoogleLogin} className="w-full mb-6 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 flex justify-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="none" d="M1 1h22v22H1z"/></svg>
                Ingresar con Google (Recomendado)
            </Button>
            
            <div className="flex items-center gap-4 mb-6">
                <hr className="flex-1 border-gray-200" /><span className="text-xs text-gray-400">O INGRESO MANUAL</span><hr className="flex-1 border-gray-200" />
            </div>

            <form onSubmit={handleManualLogin}>
                <Input label="2. Tu Carné" value={id} onChange={e=>setId(e.target.value)} />
                <Button className="w-full" type="submit">Entrar Manual</Button>
                <div className="mt-4 text-center"><a onClick={()=>setView('student-register')} className="text-blue-600 cursor-pointer">Crear cuenta manual</a></div>
            </form>
        </Card>
      </div>
    );
};

const StudentRegister = ({ setView, user, appId, setCurrentUserData }) => {
    const isGoogle = user && auth.currentUser && auth.currentUser.providerData.some(p => p.providerId === 'google.com');
    const [f, setF] = useState({
        name: auth.currentUser?.displayName || '', 
        carne: '', 
        email: auth.currentUser?.email || ''
    });

    const reg = async (e) => { 
      e.preventDefault(); 
      const secureId = auth.currentUser ? auth.currentUser.uid : user.uid;
      
      const qCheck = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_users'), where("carne", "==", f.carne));
      const s = await getDocs(qCheck);
      if(!s.empty) {
          alert("⚠️ Ese carné ya está registrado por otro estudiante.");
          return;
      }

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'qr_users'), {...f, deviceId: secureId}); 
      alert(isGoogle ? "✅ Cuenta de Google enlazada exitosamente a tu carné." : "✅ Cuenta Creada. Dispositivo vinculado."); 
      setView('student-login'); 
    };

    return (
      <div className="max-w-md mx-auto py-10">
        <Card className="p-8">
            <h2 className="text-2xl text-center mb-4">Registro Estudiante</h2>
            {isGoogle ? (
                <div className="bg-blue-50 p-3 rounded mb-4 text-sm text-blue-800">
                    Completando registro para: <strong>{f.email}</strong>. Solo falta tu carné.
                </div>
            ) : (
                <div className="bg-yellow-50 p-3 rounded mb-4 text-sm text-yellow-800 flex gap-2">
                    <Smartphone size={16} className="shrink-0 mt-1"/>
                    <span>Tu cuenta quedará vinculada al navegador de este teléfono si no usas Google.</span>
                </div>
            )}
            <form onSubmit={reg}>
                <Input label="Nombre Completo" value={f.name} onChange={e=>setF({...f, name:e.target.value})} disabled={isGoogle} required />
                <Input label="Email" value={f.email} onChange={e=>setF({...f, email:e.target.value})} disabled={isGoogle} required />
                <Input label="Número de Carné" value={f.carne} onChange={e=>setF({...f, carne:e.target.value})} required />
                <Button className="w-full" type="submit">Completar Registro</Button>
                {!isGoogle && <div className="mt-4 text-center"><a onClick={()=>setView('student-login')} className="text-gray-500 cursor-pointer text-sm">Cancelar</a></div>}
            </form>
        </Card>
      </div>
    );
};

// --- COMPONENTE DE ESTADÍSTICAS AVANZADAS ---
const StatsView = ({ course, attendanceData, appId, adminEmail, onReset, startDate, setStartDate }) => {
  const filteredData = React.useMemo(() => {
    if (!startDate) return attendanceData;
    return attendanceData.filter(r => {
      if (!r.timestamp) return false;
      const recordDate = r.timestamp.toDate();
      const year = recordDate.getFullYear();
      const month = String(recordDate.getMonth() + 1).padStart(2, '0');
      const day = String(recordDate.getDate()).padStart(2, '0');
      const recordDateString = `${year}-${month}-${day}`;
      return recordDateString >= startDate;
    });
  }, [attendanceData, startDate]);

  const sessions = React.useMemo(() => {
    const uniqueSessions = new Set();
    filteredData.forEach(r => {
      if (r.sessionCode && r.sessionCode !== "null" && r.sessionCode !== "undefined" && r.sessionCode.trim() !== "") {
        uniqueSessions.add(r.sessionCode);
      }
    });
    return [...uniqueSessions];
  }, [filteredData]);
  
  const totalClasses = sessions.length; 

  const report = React.useMemo(() => {
    const studentStats = {};
    filteredData.forEach(r => {
      if (!studentStats[r.studentCarne]) {
        studentStats[r.studentCarne] = { name: r.studentName, count: 0, id: r.studentCarne };
      }
      studentStats[r.studentCarne].count += 1;
    });

    return Object.values(studentStats).map(s => {
      const percentage = totalClasses > 0 ? Math.round((s.count / totalClasses) * 100) : 0;
      return {
          ...s,
          percentage,
          status: percentage >= 80 ? 'Aprobado' : 'Riesgo'
      };
    });
  }, [filteredData, totalClasses]);

  const pieData = [
    { name: 'Aprobado (>80%)', value: report.filter(r => r.percentage >= 80).length, color: '#22c55e' },
    { name: 'Riesgo (<80%)', value: report.filter(r => r.percentage < 80).length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const generatePublicLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?mode=public&course=${encodeURIComponent(course.name)}&teacher=${encodeURIComponent(adminEmail)}`;
    navigator.clipboard.writeText(url);
    alert("🔗 Enlace público copiado al portapapeles.");
  };

  const downloadSummaryCSV = () => {
    const headers = ["Nombre", "Carnet", "Asistencias", "Total Clases", "Porcentaje", "Estado"];
    const rows = report.map(r => [ `"${r.name}"`, `"${r.id}"`, r.count, totalClasses, `${r.percentage}%`, r.status ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent); link.download = `consolidado_${course.name}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const downloadHistoryCSV = () => {
      const headers = ["Fecha", "Hora", "Curso", "Estudiante", "Carnet", "Codigo Sesion", "Latitud", "Longitud", "Mapa Link"];
      const rows = filteredData.map(r => {
          const dateObj = r.timestamp ? r.timestamp.toDate() : new Date();
          const lat = r.location?.lat || "0"; const lng = r.location?.lng || "0";
          const mapLink = r.location ? `https://www.google.com/maps?q=${lat},${lng}` : "Sin datos";
          return [ dateObj.toLocaleDateString(), dateObj.toLocaleTimeString(), `"${r.courseName}"`, `"${r.studentName}"`, `"${r.studentCarne}"`, `"${r.sessionCode}"`, lat, lng, mapLink ];
      });
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csvContent); link.download = `historial_ubicacion_${course.name}.csv`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-gray-50 border p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-600 flex items-center gap-2">
           <Calendar size={18} /><span>Analizando datos a partir de:</span>
        </div>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1 p-6 flex flex-col items-center">
          <h4 className="font-bold mb-4 text-gray-700">Estado General del Grupo</h4>
          {pieData.length > 0 && totalClasses > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-gray-400 py-10">Sin datos analizables</p>}
        </Card>

        <Card className="flex-1 p-6">
          <h4 className="font-bold mb-4 text-gray-700">Métricas Clave</h4>
          <div className="space-y-4">
            <div className="flex justify-between p-3 bg-blue-50 rounded">
              <span>Clases Impartidas {startDate && '(Filtrado)'}:</span><span className="font-bold text-blue-700">{totalClasses}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span>Alumnos (Periodo):</span><span className="font-bold">{report.length}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
                <Button variant="secondary" onClick={downloadSummaryCSV} title="Descargar lista"><Users size={16}/> Consolidado</Button>
                <Button variant="secondary" onClick={downloadHistoryCSV} title="Descargar registro a registro"><FileText size={16}/> Historial</Button>
            </div>
            <Button variant="outline" onClick={generatePublicLink} className="w-full" icon={Share2}>Compartir Reporte Público</Button>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 bg-gray-50 border-b font-bold flex justify-between">
            <span>Detalle por Estudiante</span><span className="text-xs text-gray-500 font-normal self-center">Base: {totalClasses} sesiones</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-500 border-b"><tr><th className="p-3">Estudiante</th><th className="p-3">Asistencias</th><th className="p-3">% Acumulado</th><th className="p-3">Estatus</th></tr></thead>
            <tbody>
              {report.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{r.name} <div className="text-xs text-gray-400">{r.id}</div></td>
                  <td className="p-3">{r.count} / {totalClasses}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${r.percentage}%`, backgroundColor: r.percentage >= 80 ? '#22c55e' : '#ef4444' }}></div>
                      </div>
                      {r.percentage}%
                    </div>
                  </td>
                  <td className="p-3">
                    {r.percentage >= 80 ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">OK</span> : <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">BAJA</span>}
                  </td>
                </tr>
              ))}
              {report.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-gray-400">No hay asistencias registradas.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Bitácora de Registros */}
      <Card className="overflow-hidden mt-6">
        <div className="p-4 bg-blue-50 border-b font-bold flex justify-between items-center"><span className="text-blue-800">Bitácora de Registros (Detalle de Ubicación)</span><span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">Más recientes</span></div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-500 border-b sticky top-0"><tr><th className="p-3">Fecha/Hora</th><th className="p-3">Estudiante</th><th className="p-3 text-center">Ubicación</th></tr></thead>
            <tbody>
              {filteredData.sort((a,b) => b.timestamp - a.timestamp).map((r, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-xs"><div className="font-bold">{r.timestamp?.toDate().toLocaleDateString()}</div><div className="text-gray-500">{r.timestamp?.toDate().toLocaleTimeString()}</div></td>
                  <td className="p-3"><div className="font-medium">{r.studentName}</div><div className="text-xs text-gray-400">{r.studentCarne}</div></td>
                  <td className="p-3 text-center">
                    {r.location?.lat ? ( <a href={`https://www.google.com/maps?q=${r.location.lat},${r.location.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors"><MapPin size={14} /> Ver Mapa</a> ) : ( <span className="text-gray-400 text-xs">Sin GPS</span> )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// 5. Admin Dashboard 
const AdminDashboard = ({ user, adminUser, appId }) => {
  const [tab, setTab] = useState('session'); // session | stats | manage
  const [sessionCode, setSessionCode] = useState(null);
  const [courses, setCourses] = useState([]);
  const [allRecords, setAllRecords] = useState([]); 
  const [newCourseName, setNewCourseName] = useState('');
  const [selectedStatCourse, setSelectedStatCourse] = useState(''); 
  const [startDate, setStartDate] = useState(''); 
  const [allStudents, setAllStudents] = useState([]); 

  // MANTENER LA SESIÓN ACTIVA EN PANTALLA
  useEffect(() => {
    if (!user || !adminUser) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_sessions'), where("createdBy", "==", adminUser.email), where("active", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setSessionCode(snap.docs[0].data().code);
      } else {
        setSessionCode(null);
      }
    });
    return () => unsub();
  }, [user, adminUser, appId]);

  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [approvedTeachers, setApprovedTeachers] = useState([]);

  useEffect(() => {
    if (!user || adminUser?.role !== 'superadmin') return;
    const unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_admins'), where("status", "==", "pending")), (snap) => setPendingTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user, adminUser, appId]);

  useEffect(() => {
    if (!user || adminUser?.role !== 'superadmin') return;
    const unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_admins'), where("status", "==", "approved")), 
    (snap) => setApprovedTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.id !== adminUser.id)));
    return () => unsub();
  }, [user, adminUser, appId]);

  const handleApprove = async (id) => await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qr_admins', id), { status: 'approved' });
  const handleReject = async (id) => { if(confirm('¿Rechazar?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qr_admins', id)); };

  useEffect(() => {
    if (!user || !adminUser) return;
    const qSimple = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_courses'), where("createdBy", "==", adminUser.email));
    return onSnapshot(qSimple, (snap) => setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user, adminUser, appId]);

  useEffect(() => {
    if (!user || courses.length === 0) return;
    const myCourseNames = courses.map(c => c.name);
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_attendance'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data(), dateStr: d.data().timestamp?.toDate().toLocaleString() }));
      setAllRecords(data.filter(r => myCourseNames.includes(r.courseName)));
    });
  }, [user, courses, appId]);

  useEffect(() => {
      if(!user) return;
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_users'), orderBy('name'));
      return onSnapshot(q, (snap) => setAllStudents(snap.docs.map(d => ({ docId: d.id, ...d.data() }))));
  }, [user, appId]);

  const handleAddCourse = async (e) => { 
    e.preventDefault(); 
    if(newCourseName.trim()) { 
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'qr_courses'), { name: newCourseName.trim(), createdBy: adminUser.email, createdAt: serverTimestamp() }); 
      setNewCourseName(''); 
    }
  };

  const handleResetCourse = async (courseName) => {
    if(confirm(`⚠️ ATENCIÓN: Se ELIMINARÁ todo el historial de asistencia del curso: "${courseName}".\n¿Continuar?`)) {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_attendance'), where("courseName", "==", courseName));
      try {
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
        alert(`Historial eliminado.`);
      } catch (error) { alert("Error borrando datos."); }
    }
  };

  const handleDeleteSession = async (sessionCodeDelete) => {
      if(confirm(`¿Borrar la sesión completa con el código: ${sessionCodeDelete}?`)){
          const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_attendance'), where("sessionCode", "==", sessionCodeDelete));
          const snapshot = await getDocs(q);
          const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
          await Promise.all(deletePromises);
          alert("Sesión borrada.");
      }
  };

  const handleDeleteStudent = async (docId, studentName) => {
      if(confirm(`⚠️ ¿ELIMINAR ALUMNO?\n\nSe borrará permanentemente la cuenta de ${studentName}. Tendrá que volver a registrarse.`)){
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qr_users', docId));
          alert("Estudiante eliminado del sistema.");
      }
  };

  // NUEVA GENERACIÓN Y CONTROL DE SESIÓN EN SERVIDOR
  const generateNewSession = async () => {
      try {
          // Desactivar sesiones anteriores del profe por si quedó alguna "abierta"
          const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_sessions'), where("createdBy", "==", adminUser.email), where("active", "==", true));
          const snap = await getDocs(q);
          const updates = snap.docs.map(d => updateDoc(d.ref, { active: false }));
          await Promise.all(updates);

          // Crear código impredecible de 5 dígitos
          const newCode = `SESION-${Math.floor(10000 + Math.random() * 90000)}`;
          
          // Guardar en servidor
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'qr_sessions'), {
              code: newCode, active: true, createdBy: adminUser.email, timestamp: serverTimestamp()
          });
      } catch (error) { console.error("Error generando QR", error); }
  };

  const endActiveSession = async () => {
      if (!sessionCode) return;
      try {
          const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_sessions'), where("code", "==", sessionCode));
          const snap = await getDocs(q);
          const updates = snap.docs.map(d => updateDoc(d.ref, { active: false }));
          await Promise.all(updates);
      } catch (error) { console.error("Error al terminar clase", error); }
  };

  const uniqueSessionsForManage = [...new Set(allRecords.map(r => r.sessionCode))].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="bg-white border p-4 rounded-xl flex flex-col md:flex-row justify-between items-center shadow-sm gap-4">
        <div><h2 className="text-xl font-bold text-gray-800">Panel Docente</h2><p className="text-sm text-gray-500">{adminUser.email}</p></div>
        <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto w-full md:w-auto">
          <button onClick={() => setTab('session')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'session' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Clase Activa</button>
          <button onClick={() => setTab('stats')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'stats' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Estadísticas</button>
          <button onClick={() => setTab('manage')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'manage' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Limpieza/Gestión</button>
        </div>
      </div>

      {tab === 'session' && (
        <div className="grid md:grid-cols-3 gap-6 animate-in fade-in">
          <Card className="md:col-span-1 p-6 h-[450px] flex flex-col">
            <h3 className="font-bold mb-4 flex items-center gap-2"><BookOpen size={18}/> Mis Cursos</h3>
            <form onSubmit={handleAddCourse} className="flex gap-2 mb-4">
              <input value={newCourseName} onChange={e=>setNewCourseName(e.target.value)} className="flex-1 border rounded px-3 text-sm" placeholder="Nuevo curso..." />
              <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={16}/></button>
            </form>
            <div className="flex-1 overflow-auto space-y-2">
              {courses.length === 0 && <p className="text-gray-400 text-center text-sm mt-10">Crea tu primer curso</p>}
              {courses.map(c => (
                <div key={c.id} className="flex justify-between items-center p-3 bg-gray-50 rounded group">
                  <span className="font-medium text-sm">{c.name}</span>
                  <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qr_courses', c.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="md:col-span-1 p-6 flex flex-col items-center justify-center text-center">
            {sessionCode ? (
              <div className="animate-in zoom-in">
                <div className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">Sesión Activa</div>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${sessionCode}`} className="mb-4 mix-blend-multiply mx-auto" />
                <p className="font-mono text-xl font-bold tracking-widest mb-4">{sessionCode}</p>
                <Button variant="danger" onClick={endActiveSession} className="w-full">Terminar Clase (Cerrar Sesión)</Button>
              </div>
            ) : (
              <div className="text-center">
                <QrCode size={64} className="text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 mb-6">Genera un código QR y abre la sesión para que tus alumnos fichen asistencia.</p>
                <Button onClick={generateNewSession} className="w-full">Iniciar Nueva Clase</Button>
              </div>
            )}
          </Card>

          <Card className="md:col-span-1 p-6 h-[450px] overflow-hidden flex flex-col">
            <h3 className="font-bold mb-4 flex items-center gap-2"><RefreshCw size={18}/> Actividad Reciente</h3>
            <div className="flex-1 overflow-auto space-y-3">
              {allRecords.slice(0, 20).map(r => (
                <div key={r.id} className="border-l-4 border-blue-500 pl-3 py-1">
                  <p className="font-bold text-sm text-gray-800">{r.studentName}</p>
                  <div className="flex justify-between text-xs text-gray-500"><span>{r.courseName}</span><span>{r.dateStr.split(',')[1]}</span></div>
                </div>
              ))}
              {allRecords.length === 0 && <p className="text-center text-gray-400 mt-10">Sin actividad hoy</p>}
            </div>
          </Card>
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
            <label className="font-bold text-gray-700">Analizar Curso:</label>
            <select value={selectedStatCourse} onChange={(e) => setSelectedStatCourse(e.target.value)} className="px-4 py-2 border rounded-lg bg-gray-50 min-w-[200px]">
              <option value="">-- Selecciona --</option>
              {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          {selectedStatCourse ? (
             <StatsView course={courses.find(c => c.name === selectedStatCourse)} attendanceData={allRecords.filter(r => r.courseName === selectedStatCourse)} appId={appId} adminEmail={adminUser.email} onReset={handleResetCourse} startDate={startDate} setStartDate={setStartDate} />
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Selecciona un curso arriba para ver el rendimiento académico.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'manage' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2"><Eraser size={20}/> Limpiar Sesiones de Prueba</h3>
                    <p className="text-sm text-gray-500 mb-4">Elimina sesiones específicas creadas por error o para pruebas. Afecta todos tus cursos.</p>
                    <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                        {uniqueSessionsForManage.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No hay sesiones registradas.</p>}
                        {uniqueSessionsForManage.map(session => (
                            <div key={session} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
                                <span className="font-mono text-sm font-bold">{session}</span>
                                <button onClick={() => handleDeleteSession(session)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded transition-colors" title="Borrar toda la asistencia de esta sesión"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2"><UserX size={20}/> Eliminar Usuarios de Prueba</h3>
                    <p className="text-sm text-gray-500 mb-4">Borra cuentas de estudiantes que se hayan registrado para probar el sistema.</p>
                    <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                         {allStudents.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No hay alumnos registrados.</p>}
                         {allStudents.map(student => (
                            <div key={student.docId} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
                                <div><p className="font-bold text-sm">{student.name}</p><p className="text-xs text-gray-500">Carné: {student.carne}</p></div>
                                <button onClick={() => handleDeleteStudent(student.docId, student.name)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded transition-colors" title="Eliminar estudiante"><Trash2 size={16}/></button>
                            </div>
                         ))}
                    </div>
                </Card>
             </div>
          </div>
      )}
    </div>
  );
};

// --- COMPONENTE PÚBLICO ---
const PublicReportView = ({ publicData, appId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(''); 

  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_attendance'), where("courseName", "==", publicData.courseName));
    return onSnapshot(q, (snap) => { setData(snap.docs.map(d => d.data())); setLoading(false); });
  }, [publicData, appId]);

  if(loading) return <div className="text-center p-10">Cargando reporte público...</div>;

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="bg-blue-600 text-white p-8 rounded-t-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Reporte de Asistencia Público</h1>
        <div className="flex gap-6 text-blue-100"><span className="flex items-center gap-2"><BookOpen size={18}/> Curso: {publicData.courseName}</span><span className="flex items-center gap-2"><User size={18}/> Docente: {publicData.teacherEmail}</span></div>
      </div>
      <div className="bg-white p-6 rounded-b-2xl shadow-lg border-x border-b">
         <StatsView course={{name: publicData.courseName}} attendanceData={data} appId={appId} adminEmail={publicData.teacherEmail} startDate={startDate} setStartDate={setStartDate} />
      </div>
    </div>
  );
};

// --- STUDENT DASHBOARD (ESCANER) ---
const StudentDashboard = ({ userData, user, appId }) => {
  const [scanning, setScanning] = useState(false);
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('idle');
  const [msg, setMsg] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const startScan = async () => {
    setStatus('locating'); setMsg('Buscando señal GPS para validar ubicación...');
    if (!navigator.geolocation) { setStatus('error'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setStatus('scanning'); setScanning(true); },
      (err) => { setStatus('error'); setMsg('Debes permitir el acceso al GPS de tu teléfono para registrar asistencia.'); }
    );
  };

  useEffect(() => { if (scanning) startVideo(); else stopVideo(); return () => stopVideo(); }, [scanning]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", true); 
        videoRef.current.play();
        animationRef.current = requestAnimationFrame(tick);
      }
    } catch (err) { setStatus('error'); setMsg("Debes permitir el acceso a la cámara. Si falla, usa el código manual."); }
  };
  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };
  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const cvs = canvasRef.current; const vid = videoRef.current;
      cvs.height = vid.videoHeight; cvs.width = vid.videoWidth;
      const ctx = cvs.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(vid, 0, 0, cvs.width, cvs.height);
      const img = ctx.getImageData(0, 0, cvs.width, cvs.height);
      const jsQR = window.jsQR;
      if (jsQR) {
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
        if (code) { new Audio('https://raw.githubusercontent.com/maykbrito/libs/main/scanner.mp3').play().catch(()=>{}); processAttendance(code.data); return; }
      }
    }
    animationRef.current = requestAnimationFrame(tick);
  };
  
  const processAttendance = async (code) => {
    setScanning(false); setStatus('saving'); setMsg('Validando sesión en el servidor...');

    try {
      // 1. VALIDACIÓN ESTRICTA DE SESIÓN (NUEVO BLINDAJE ANTIFRAUDE)
      const qSession = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_sessions'), where("code", "==", code), where("active", "==", true));
      const sessionDocs = await getDocs(qSession);

      if (sessionDocs.empty) {
        setStatus('error'); setMsg('⚠️ Código inválido o la clase ya ha terminado.'); return;
      }

      setMsg('Verificando registros previos...');

      // 2. VALIDACIÓN DE DUPLICADOS
      const qCheck = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_attendance'), where("sessionCode", "==", code), where("studentCarne", "==", userData.carne));
      const existingDocs = await getDocs(qCheck);

      if (!existingDocs.empty) {
        setStatus('error'); setMsg('⚠️ Ya registraste asistencia en esta sesión de clase.'); return;
      }

      // 3. GUARDADO EXITOSO
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'qr_attendance'), { 
        sessionCode: code, courseName: userData.currentCourse, studentId: user.uid, studentName: userData.name, 
        studentCarne: userData.carne, studentEmail: userData.email, timestamp: serverTimestamp(), location: location || { lat: 0, lng: 0 } 
      }); 
      
      setStatus('success'); setMsg(`¡Registrado correctamente!`); 
    } catch (e) { console.error(e); setStatus('error'); setMsg('Error de conexión.'); }
  };
  
  const manual = () => { const c = prompt("Ingresa el código que te dio el docente (Ej. SESION-12345):"); if(c) processAttendance(c); };

  return (
    <div className="max-w-xl mx-auto space-y-6"><Card className="p-6">
       <div className="flex items-center gap-4 mb-6"><div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">{userData.name[0]}</div><div><h2 className="text-xl font-bold">{userData.name}</h2><p className="text-gray-500">{userData.carne}</p></div></div>
       {!scanning && status !== 'success' && status !== 'error' && status !== 'locating' && <div className="text-center"><p className="mb-4">Clase: <strong>{userData.currentCourse}</strong></p><Button onClick={startScan} className="w-full py-4"><QrCode/> Escanear QR de Asistencia</Button></div>}
       {(status === 'locating') && <div className="text-center py-10 animate-pulse"><MapPin className="mx-auto mb-4 text-blue-500" size={48}/><p>{msg}</p></div>}
       {scanning && <div className="relative aspect-square bg-black rounded-lg overflow-hidden flex items-center justify-center"><video ref={videoRef} className="absolute w-full h-full object-cover" muted playsInline /><canvas ref={canvasRef} className="hidden"/><div className="border-2 border-blue-500 w-64 h-64 z-10 animate-pulse"></div><div className="absolute bottom-4 flex gap-2 w-full px-4"><Button variant="danger" onClick={()=>{setScanning(false); setStatus('idle')}} className="flex-1">Cancelar</Button><Button variant="secondary" onClick={manual} className="flex-1">Ingreso Manual</Button></div></div>}
       {status === 'success' && <div className="text-center py-8"><CheckCircle size={48} className="text-green-500 mx-auto mb-4"/><h3 className="text-2xl font-bold">¡Listo!</h3><p className="text-gray-600 mb-4">{msg}</p><Button variant="secondary" onClick={()=>setStatus('idle')} className="mt-4">Finalizar</Button></div>}
       {status === 'error' && <div className="text-center py-8"><AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4"/><h3 className="text-2xl font-bold">Atención</h3><p className="text-gray-600 mb-4">{msg}</p><Button variant="secondary" onClick={()=>setStatus('idle')} className="mt-4">Volver</Button></div>}
    </Card></div>
  );
};