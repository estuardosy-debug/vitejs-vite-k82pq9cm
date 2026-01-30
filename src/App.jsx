import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
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
  Camera, 
  MapPin, 
  QrCode, 
  User, 
  LogOut, 
  FileSpreadsheet, 
  Users, 
  CheckCircle,
  AlertCircle,
  Lock,
  RefreshCw,
  BookOpen,
  Plus,
  Trash2,
  UserPlus,
  Settings,
  ShieldAlert,
  Check,
  X,
  UserX
} from 'lucide-react';

// --- CONFIGURACIÓN FIREBASE ---
// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAv2qf4LX-1ZWogHmlh2K8mPsz6jZzd0G8",
  authDomain: "asistenciaqr-pro.firebaseapp.com",
  projectId: "asistenciaqr-pro",
  storageBucket: "asistenciaqr-pro.firebasestorage.app",
  messagingSenderId: "807077573027",
  appId: "1:807077573027:web:d469bf687224298a4aaa16"
};

// Initialize Firebase
const appId = 'asistencia-clase-2026';
const MASTER_KEY = "LULY2639"; 

const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "TU_API_KEY_AQUI";

let app, auth, db;
if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Error inicializando Firebase:", e);
  }
}

// --- COMPONENTES UI ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon, title = '' }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-green-600 text-white hover:bg-green-700",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
  };
  return (
    <button 
      onClick={onClick} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled}
      title={title}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Input = ({ label, type = "text", value, onChange, placeholder, required = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
      placeholder={placeholder}
      required={required}
    />
  </div>
);

const Select = ({ label, value, onChange, options, placeholder, required = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white text-gray-900"
        required={required}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.name}>
            {opt.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden ${className}`}>
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

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Falta Configuración</h2>
          <p className="text-gray-600 mb-6">Pegar credenciales en <code>App.jsx</code></p>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try { await signInAnonymously(auth); } 
      catch (error) { console.error("Auth error:", error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    setCurrentUserData(null);
    setAdminUser(null);
    setView('landing');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg"><QrCode size={20} className="text-white" /></div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">AsistenciaQR</h1>
          </div>
          {view !== 'landing' && (
            <div className="flex items-center gap-4">
              {adminUser && <span className="text-sm font-medium hidden md:block text-gray-600">Hola, {adminUser.name}</span>}
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"><LogOut size={16} /> Salir</button>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 md:p-6">
        {view === 'landing' && <LandingScreen setView={setView} />}
        {view === 'admin-login' && <AdminLogin setView={setView} setAdminUser={setAdminUser} appId={appId} />}
        {view === 'admin-register' && <AdminRegister setView={setView} appId={appId} />}
        {view === 'student-login' && <StudentLogin setView={setView} setCurrentUserData={setCurrentUserData} user={user} appId={appId} />}
        {view === 'student-register' && <StudentRegister setView={setView} setCurrentUserData={setCurrentUserData} user={user} appId={appId} />}
        {view === 'admin-dash' && <AdminDashboard user={user} adminUser={adminUser} appId={appId} />}
        {view === 'student-dash' && <StudentDashboard userData={currentUserData} user={user} appId={appId} />}
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
      <Card className="hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer group" >
        <div className="p-8 flex flex-col items-center text-center h-full" onClick={() => setView('student-login')}>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><User size={32} className="text-blue-600" /></div>
          <h3 className="text-xl font-bold mb-2">Soy Estudiante</h3>
          <p className="text-sm text-gray-500 mb-6">Registra tu asistencia escaneando el QR.</p>
          <Button className="w-full mt-auto">Acceder como Estudiante</Button>
        </div>
      </Card>
      <Card className="hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer group">
        <div className="p-8 flex flex-col items-center text-center h-full" onClick={() => setView('admin-login')}>
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Lock size={32} className="text-indigo-600" /></div>
          <h3 className="text-xl font-bold mb-2">Soy Docente</h3>
          <p className="text-sm text-gray-500 mb-6">Gestiona cursos y genera QR.</p>
          <Button variant="secondary" className="w-full mt-auto">Acceso Administrativo</Button>
        </div>
      </Card>
    </div>
  </div>
);

const AdminLogin = ({ setView, setAdminUser, appId }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const adminsRef = collection(db, 'artifacts', appId, 'public', 'data', 'qr_admins');
      const q = query(adminsRef, where("email", "==", email), where("password", "==", password));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const adminData = snapshot.docs[0].data();
        if (adminData.status === 'pending') { setError('Cuenta pendiente de aprobación.'); setLoading(false); return; }
        if (adminData.status === 'rejected') { setError('Solicitud rechazada.'); setLoading(false); return; }
        setAdminUser({ ...adminData, id: snapshot.docs[0].id });
        setView('admin-dash');
      } else { setError('Credenciales incorrectas.'); }
    } catch (err) { console.error(err); setError('Error de conexión.'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Acceso Docente</h2>
        <form onSubmit={handleLogin}>
          <Input label="Correo / Usuario" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <Button className="w-full" type="submit" disabled={loading}>{loading ? 'Verificando...' : 'Iniciar Sesión'}</Button>
          <div className="mt-6 pt-4 border-t text-center">
            <Button variant="secondary" className="w-full" onClick={() => setView('admin-register')} icon={UserPlus}>Solicitar Registro</Button>
          </div>
          <div className="mt-4 text-center"><button type="button" onClick={() => setView('landing')} className="text-sm text-gray-500 hover:underline">Volver</button></div>
        </form>
      </Card>
    </div>
  );
};

const AdminRegister = ({ setView, appId }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', secretCode: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const adminsRef = collection(db, 'artifacts', appId, 'public', 'data', 'qr_admins');
      const q = query(adminsRef, where("email", "==", formData.email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) { setError('Este correo ya está registrado.'); setLoading(false); return; }

      const isSuperAdmin = formData.secretCode === MASTER_KEY;
      await addDoc(adminsRef, {
        name: formData.name, email: formData.email, password: formData.password,
        role: isSuperAdmin ? 'superadmin' : 'docente',
        status: isSuperAdmin ? 'approved' : 'pending',
        createdAt: serverTimestamp()
      });
      alert(isSuperAdmin ? "¡Cuenta SUPER ADMIN creada!" : "Solicitud enviada. Espera aprobación.");
      setView('admin-login');
    } catch (err) { setError('Error al crear cuenta.'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Registro Docente</h2>
        <form onSubmit={handleRegister}>
          <Input label="Nombre" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          <Input label="Contraseña" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
          <div className="pt-2 border-t mt-4 mb-4">
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código Invitación (Opcional)</label>
             <input type="text" value={formData.secretCode} onChange={(e) => setFormData({...formData, secretCode: e.target.value})} className="w-full px-4 py-2 border rounded bg-gray-50 text-sm" placeholder="Solo administradores" />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <Button className="w-full" type="submit" disabled={loading}>Enviar Solicitud</Button>
          <div className="mt-4 text-center"><button type="button" onClick={() => setView('admin-login')} className="text-sm text-gray-500 hover:underline">Ya tengo cuenta</button></div>
        </form>
      </Card>
    </div>
  );
};

const StudentLogin = ({ setView, setCurrentUserData, user, appId }) => {
  const [carne, setCarne] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_courses'), orderBy('name'));
    const unsub = onSnapshot(q, (snap) => setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user, appId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedCourse) { setError('Selecciona el curso.'); return; }
    setLoading(true); setError('');
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_users'), where("carne", "==", carne));
      const snap = await getDocs(q);
      if (snap.empty) { setError('Carné no encontrado.'); } 
      else {
        const data = snap.docs[0].data();
        localStorage.setItem('qr_app_device_link', data.carne);
        setCurrentUserData({ ...data, currentCourse: selectedCourse });
        setView('student-dash');
      }
    } catch (err) { setError('Error de conexión.'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-2 text-center">Bienvenido</h2>
        <form onSubmit={handleLogin}>
          <Select label="Curso" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} options={courses} placeholder="-- Elige curso --" required />
          <Input label="Carné / ID" value={carne} onChange={(e) => setCarne(e.target.value)} required />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <Button className="w-full mb-3" type="submit" disabled={loading || courses.length === 0}>{loading ? 'Ingresando...' : 'Ingresar'}</Button>
          <div className="text-center pt-2 border-t"><Button variant="secondary" className="w-full" onClick={() => setView('student-register')}>Crear Cuenta</Button></div>
        </form>
      </Card>
    </div>
  );
};

const StudentRegister = ({ setView, user, appId }) => {
  const [formData, setFormData] = useState({ name: '', carne: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_users'), where("carne", "==", formData.carne));
      const snap = await getDocs(q);
      if (!snap.empty) { setError('Carné ya registrado.'); setLoading(false); return; }
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'qr_users'), { ...formData, createdAt: serverTimestamp(), deviceId: user.uid });
      alert("Registro exitoso."); setView('student-login');
    } catch (err) { setError('Error al registrar.'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Registro Estudiante</h2>
        <form onSubmit={handleRegister}>
          <Input label="Nombre" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          <Input label="Carné" value={formData.carne} onChange={(e) => setFormData({...formData, carne: e.target.value})} required />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <Button className="w-full" type="submit" disabled={loading}>Completar Registro</Button>
          <div className="mt-4 text-center"><button type="button" onClick={() => setView('student-login')} className="text-sm text-gray-500 hover:underline">Ya tengo cuenta</button></div>
        </form>
      </Card>
    </div>
  );
};

const AdminDashboard = ({ user, adminUser, appId }) => {
  const [sessionCode, setSessionCode] = useState(null);
  const [records, setRecords] = useState([]);
  const [courses, setCourses] = useState([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [approvedTeachers, setApprovedTeachers] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_attendance'), orderBy('timestamp', 'desc')), 
      (snap) => setRecords(snap.docs.map(d => ({ id: d.id, ...d.data(), dateStr: d.data().timestamp ? new Date(d.data().timestamp.seconds * 1000).toLocaleString() : '...' }))));
    return () => unsub();
  }, [user, appId]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_courses'), orderBy('name')), (snap) => setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user, appId]);

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

  const handleAddCourse = async (e) => { e.preventDefault(); if(newCourseName.trim()) { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'qr_courses'), { name: newCourseName.trim(), createdBy: adminUser.email, createdAt: serverTimestamp() }); setNewCourseName(''); }};
  const handleDeleteCourse = async (id) => { if(confirm('¿Eliminar?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qr_courses', id)); };
  const handleApprove = async (id) => await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qr_admins', id), { status: 'approved' });
  const handleReject = async (id) => { if(confirm('¿Rechazar?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qr_admins', id)); };
  
  const generateNewSession = () => setSessionCode(`SESION-${Date.now()}-${Math.floor(Math.random()*1000)}`);
  
  const exportToCSV = () => {
    const csv = ["Fecha,Curso,Nombre,Carné,Lat,Lng,Sesión", ...records.map(r => `"${r.dateStr}","${r.courseName}","${r.studentName}","${r.studentCarne}",${r.location?.lat},${r.location?.lng},${r.sessionCode}`)].join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'})); link.download = "asistencia.csv"; link.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border p-4 rounded-lg flex justify-between items-center">
        <div><h2 className="text-lg font-bold text-blue-800">Panel Docente</h2><span className="text-sm text-blue-600">Usuario: <strong>{adminUser?.name}</strong></span></div>
        {adminUser?.role === 'superadmin' && <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded border">SUPER ADMIN</span>}
      </div>

      {adminUser?.role === 'superadmin' && (
        <div className="space-y-4">
          {pendingTeachers.length > 0 && (
            <Card className="p-6 bg-orange-50 border-l-4 border-orange-500">
              <h3 className="font-bold text-orange-800 mb-2">Solicitudes Pendientes</h3>
              {pendingTeachers.map(t => (
                <div key={t.id} className="flex justify-between items-center bg-white p-3 rounded mb-2 shadow-sm">
                  <div><p className="font-bold">{t.name}</p><p className="text-xs">{t.email}</p></div>
                  <div className="flex gap-2"><button onClick={() => handleApprove(t.id)} className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">Aprobar</button><button onClick={() => handleReject(t.id)} className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">Rechazar</button></div>
                </div>
              ))}
            </Card>
          )}
          <Card className="p-6">
            <h3 className="font-bold mb-2">Docentes Activos</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {approvedTeachers.map(t => (
                <div key={t.id} className="flex justify-between p-2 border rounded hover:bg-gray-50">
                  <div><p className="font-medium">{t.name}</p><p className="text-xs text-gray-500">{t.email}</p></div>
                  <button onClick={() => handleReject(t.id)} className="text-red-400 hover:text-red-600"><UserX size={18} /></button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 p-6 h-[400px] flex flex-col">
          <h3 className="font-bold mb-4">Cursos</h3>
          <form onSubmit={handleAddCourse} className="flex gap-2 mb-4"><input value={newCourseName} onChange={e=>setNewCourseName(e.target.value)} className="flex-1 border rounded px-2 text-sm" placeholder="Nuevo..." /><button className="bg-indigo-600 text-white p-2 rounded"><Plus size={16}/></button></form>
          <div className="flex-1 overflow-auto">{courses.map(c=><div key={c.id} className="flex justify-between p-2 hover:bg-gray-50 text-sm"><span>{c.name}</span><button onClick={()=>handleDeleteCourse(c.id)} className="text-red-400"><Trash2 size={14}/></button></div>)}</div>
        </Card>
        <Card className="md:col-span-1 p-6 text-center">
          <h3 className="font-bold mb-4">Código QR</h3>
          {sessionCode ? <div className="flex flex-col items-center"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sessionCode)}`} className="w-40 h-40 mb-2" /><p className="text-xs font-mono">{sessionCode}</p><Button variant="danger" onClick={()=>setSessionCode(null)} className="w-full mt-2">Finalizar</Button></div> : <div className="h-40 flex flex-col justify-center"><Button onClick={generateNewSession}>Generar QR</Button></div>}
        </Card>
        <Card className="md:col-span-3 p-6 h-[500px] flex flex-col">
          <div className="flex justify-between mb-2"><h3 className="font-bold">Asistencia</h3><Button variant="secondary" onClick={exportToCSV} icon={FileSpreadsheet}>CSV</Button></div>
          <div className="flex-1 overflow-auto border rounded"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-xs uppercase"><tr><th className="p-2">Hora</th><th className="p-2">Curso</th><th className="p-2">Alumno</th><th className="p-2">ID</th></tr></thead><tbody>{records.map(r=><tr key={r.id} className="border-b"><td className="p-2">{r.dateStr}</td><td className="p-2 text-blue-700">{r.courseName}</td><td className="p-2">{r.studentName}</td><td className="p-2">{r.studentCarne}</td></tr>)}</tbody></table></div>
        </Card>
      </div>
    </div>
  );
};

// --- ESCANER MANUAL (Sin Librerías) ---
const StudentDashboard = ({ userData, user, appId }) => {
  const [scanning, setScanning] = useState(false);
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('idle');
  const [msg, setMsg] = useState('');
  const videoRef = useRef(null);

  const startScan = async () => {
    setScanning(true);
    setStatus('locating');
    setMsg('Obteniendo tu ubicación GPS...');

    if (!navigator.geolocation) {
      setStatus('error');
      setMsg('Tu navegador no soporta geolocalización.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setStatus('scanning');
        setMsg('Apunta tu cámara al código QR del docente.');
        initCamera();
      },
      (err) => {
        console.error(err);
        setStatus('error');
        setMsg('Necesitamos acceso a tu ubicación para verificar la asistencia.');
        setScanning(false);
      }
    );
  };

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable", err);
      setMsg("No pudimos acceder a la cámara. Usa el modo manual.");
    }
  };

  const processAttendance = async (code) => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    
    setStatus('saving');
    setMsg('Registrando asistencia...');

    try {
      const attendanceRef = collection(db, 'artifacts', appId, 'public', 'data', 'qr_attendance');
      
      await addDoc(attendanceRef, {
        sessionCode: code,
        courseName: userData.currentCourse, 
        studentId: user.uid,
        studentName: userData.name,
        studentCarne: userData.carne,
        studentEmail: userData.email,
        timestamp: serverTimestamp(),
        location: location || { lat: 0, lng: 0 }
      });

      setStatus('success');
      setMsg(`¡Asistencia registrada para ${userData.currentCourse}!`);
      setScanning(false);

    } catch (err) {
      console.error(err);
      setStatus('error');
      setMsg('Error al guardar en la base de datos.');
    }
  };

  const simulateScan = () => {
    const code = prompt("Simulación: Ingresa el código que ves en la pantalla del docente:");
    if (code) processAttendance(code);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
            {userData.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{userData.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-blue-200">
                {userData.currentCourse}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">{userData.carne}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          {!scanning && status !== 'success' && (
            <div className="text-center">
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Estás a punto de registrar asistencia para <strong>{userData.currentCourse}</strong>.
                </p>
                <div className="flex justify-center gap-4 text-sm text-gray-500 mb-8">
                  <span className="flex items-center gap-1"><MapPin size={16}/> GPS Requerido</span>
                  <span className="flex items-center gap-1"><QrCode size={16}/> Cámara Requerida</span>
                </div>
              </div>
              <Button onClick={startScan} className="w-full py-4 text-lg shadow-blue-200 shadow-xl">
                <QrCode size={24} /> Escanear QR de Asistencia
              </Button>
            </div>
          )}

          {scanning && (
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-80" muted playsInline />
                <div className="absolute inset-0 border-2 border-blue-500/50 z-10 animate-pulse"></div>
                <div className="absolute z-20 text-white bg-black/50 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                  {msg}
                </div>
              </div>
              
              <div className="flex gap-2 w-full">
                 <Button variant="danger" onClick={() => { setScanning(false); setStatus('idle'); }} className="flex-1">
                  Cancelar
                </Button>
                 <Button variant="secondary" onClick={simulateScan} className="flex-1">
                  Ingresar Código Manual
                </Button>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Registrado!</h3>
              <p className="text-gray-600 mb-6">{msg}</p>
              <Button variant="secondary" onClick={() => setStatus('idle')} icon={RefreshCw}>
                Registrar otra
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};