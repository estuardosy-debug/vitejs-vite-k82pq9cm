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
const MASTER_KEY = "LULY2639"; // 🔑 CÓDIGO SECRETO (No visible en pantalla)

// Validación para evitar pantalla negra si falta la config
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

// --- COMPONENTES UI REUTILIZABLES ---
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

  // Verificar configuración antes de cargar
  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Falta Configuración</h2>
          <p className="text-gray-600 mb-6">
            Para que la App funcione, necesitas pegar tus credenciales de Firebase en el archivo <code>App.jsx</code> (Líneas 40-48).
          </p>
          <div className="bg-gray-50 p-3 rounded text-left text-xs font-mono text-gray-500 border overflow-x-auto">
            const firebaseConfig = &#123;<br/>
            &nbsp;&nbsp;apiKey: "TU_API_KEY",<br/>
            &nbsp;&nbsp;...<br/>
            &#125;;
          </div>
        </Card>
      </div>
    );
  }

  // Autenticación inicial
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth error:", error);
      }
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800">
      {/* Header Global */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <QrCode size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
              AsistenciaQR
            </h1>
          </div>
          {view !== 'landing' && (
            <div className="flex items-center gap-4">
              {adminUser && <span className="text-sm font-medium hidden md:block text-gray-600">Hola, {adminUser.name}</span>}
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors">
                <LogOut size={16} /> Salir
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6">
        {view === 'landing' && <LandingScreen setView={setView} />}
        
        {view === 'admin-login' && <AdminLogin setView={setView} setAdminUser={setAdminUser} appId={appId} />}
        {view === 'admin-register' && <AdminRegister setView={setView} appId={appId} />}
        
        {view === 'student-login' && (
          <StudentLogin 
            setView={setView} 
            setCurrentUserData={setCurrentUserData} 
            user={user} 
            appId={appId} 
          />
        )}
        
        {view === 'student-register' && (
          <StudentRegister 
            setView={setView} 
            setCurrentUserData={setCurrentUserData} 
            user={user} 
            appId={appId} 
          />
        )}
        
        {view === 'admin-dash' && <AdminDashboard user={user} adminUser={adminUser} appId={appId} />}
        
        {view === 'student-dash' && (
          <StudentDashboard 
            userData={currentUserData} 
            user={user} 
            appId={appId} 
          />
        )}
      </main>
    </div>
  );
}

// --- PANTALLAS ---

// 1. Landing Screen
const LandingScreen = ({ setView }) => (
  <div className="flex flex-col items-center justify-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="text-center mb-10 max-w-lg">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Registro de Asistencia Inteligente</h2>
      <p className="text-gray-600">
        Plataforma segura para el control de asistencia en el aula mediante geolocalización y códigos QR dinámicos.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">
      <Card className="hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer group" >
        <div className="p-8 flex flex-col items-center text-center h-full" onClick={() => setView('student-login')}>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <User size={32} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Soy Estudiante</h3>
          <p className="text-sm text-gray-500 mb-6">Elige tu curso y registra tu asistencia escaneando el QR.</p>
          <Button className="w-full mt-auto">Acceder como Estudiante</Button>
        </div>
      </Card>

      <Card className="hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer group">
        <div className="p-8 flex flex-col items-center text-center h-full" onClick={() => setView('admin-login')}>
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Lock size={32} className="text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Soy Docente</h3>
          <p className="text-sm text-gray-500 mb-6">Gestiona cursos, genera QR y descarga reportes.</p>
          <Button variant="secondary" className="w-full mt-auto">Acceso Administrativo</Button>
        </div>
      </Card>
    </div>
  </div>
);

// 2. Admin Login (ACTUALIZADO: Verificación de Estado)
const AdminLogin = ({ setView, setAdminUser, appId }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const adminsRef = collection(db, 'artifacts', appId, 'public', 'data', 'qr_admins');
      const q = query(adminsRef, where("email", "==", email), where("password", "==", password));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const adminData = snapshot.docs[0].data();
        
        // 🛡️ VERIFICACIÓN DE ESTADO
        if (adminData.status === 'pending') {
          setError('Tu cuenta está pendiente de aprobación por un administrador.');
          setLoading(false);
          return;
        }

        if (adminData.status === 'rejected') {
          setError('Tu solicitud de registro ha sido rechazada.');
          setLoading(false);
          return;
        }

        // Si es aprobado o superadmin, entra
        setAdminUser({ ...adminData, id: snapshot.docs[0].id });
        setView('admin-dash');
      } else {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Acceso Docente</h2>
        <form onSubmit={handleLogin}>
          <Input 
            label="Correo Electrónico / Usuario" 
            type="text" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="correo@ejemplo.com"
            required
          />
          <Input 
            label="Contraseña" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Tu contraseña personal"
            required
          />
          
          {error && <p className="text-red-500 text-sm mb-4 flex items-center gap-1"><AlertCircle size={14}/> {error}</p>}
          
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </Button>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-3">¿Eres un nuevo docente?</p>
            <Button variant="secondary" className="w-full" onClick={() => setView('admin-register')} icon={UserPlus}>
              Solicitar Registro
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <button type="button" onClick={() => setView('landing')} className="text-sm text-gray-500 hover:underline">Volver al Inicio</button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// 2.1 Admin Register (ACTUALIZADO: Código Maestro Oculto)
const AdminRegister = ({ setView, appId }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', secretCode: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verificar si ya existe
      const adminsRef = collection(db, 'artifacts', appId, 'public', 'data', 'qr_admins');
      const q = query(adminsRef, where("email", "==", formData.email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setError('Este correo ya está registrado.');
        setLoading(false);
        return;
      }

      // Determinar rol y estado basado en código secreto
      const isSuperAdmin = formData.secretCode === MASTER_KEY;
      const role = isSuperAdmin ? 'superadmin' : 'docente';
      const status = isSuperAdmin ? 'approved' : 'pending';

      await addDoc(adminsRef, {
        name: formData.name,
        email: formData.email,
        password: formData.password, // Nota: En prod usar hashing
        role: role,
        status: status,
        createdAt: serverTimestamp()
      });

      if (isSuperAdmin) {
        alert("¡Cuenta de SUPER ADMINISTRADOR creada! Puedes ingresar inmediatamente.");
      } else {
        alert("Solicitud enviada. Un administrador deberá aprobar tu cuenta antes de que puedas ingresar.");
      }
      setView('admin-login');

    } catch (err) {
      console.error(err);
      setError('Error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Solicitud de Registro</h2>
        <form onSubmit={handleRegister}>
          <Input 
            label="Nombre Completo" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            placeholder="Prof. Juan Pérez"
            required
          />
          <Input 
            label="Correo Electrónico" 
            type="email"
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            placeholder="juan@escuela.edu"
            required
          />
          <Input 
            label="Contraseña Personal" 
            type="password"
            value={formData.password} 
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
            placeholder="Crea una contraseña segura"
            required
          />
          
          <div className="pt-2 border-t mt-4 mb-4">
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
               Código de Invitación (Opcional)
             </label>
             <input
               type="text"
               value={formData.secretCode}
               onChange={(e) => setFormData({...formData, secretCode: e.target.value})}
               className="w-full px-4 py-2 border border-gray-200 rounded bg-gray-50 text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors"
               placeholder="Solo para Administradores"
             />
             <p className="text-xs text-gray-400 mt-1">Si tienes el código maestro, ingresalo aquí para obtener acceso inmediato.</p>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? 'Procesando...' : 'Enviar Solicitud'}
          </Button>
          <div className="mt-4 text-center">
            <button type="button" onClick={() => setView('admin-login')} className="text-sm text-gray-500 hover:underline">Ya tengo cuenta</button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// 3. Student Login (Sin Cambios)
const StudentLogin = ({ setView, setCurrentUserData, user, appId }) => {
  const [carne, setCarne] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const coursesRef = collection(db, 'artifacts', appId, 'public', 'data', 'qr_courses');
    const q = query(coursesRef, orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const courseList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(courseList);
    });
    return () => unsubscribe();
  }, [user, appId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedCourse) { setError('Por favor selecciona el curso.'); return; }
    setLoading(true);
    setError('');
    try {
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'qr_users');
      const q = query(usersRef, where("carne", "==", carne));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setError('Número de carné no encontrado.');
      } else {
        const docData = querySnapshot.docs[0].data();
        localStorage.setItem('qr_app_device_link', docData.carne);
        setCurrentUserData({ ...docData, currentCourse: selectedCourse });
        setView('student-dash');
      }
    } catch (err) { console.error(err); setError('Error de conexión.'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-2 text-center">Bienvenido Estudiante</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">Selecciona tu curso e ingresa tu ID</p>
        <form onSubmit={handleLogin}>
          <Select label="Seleccionar Curso" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} options={courses} placeholder="-- Elige un curso --" required />
          <Input label="Número de Carné / ID" value={carne} onChange={(e) => setCarne(e.target.value)} placeholder="Ej. 2024-001" required />
          {courses.length === 0 && <div className="mb-4 text-sm text-yellow-600 bg-yellow-50 p-3 rounded">No hay cursos activos.</div>}
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <Button className="w-full mb-3" type="submit" disabled={loading || courses.length === 0}>{loading ? 'Ingresando...' : 'Ingresar'}</Button>
          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-600 mb-2">¿Primera vez?</p>
            <Button variant="secondary" className="w-full" onClick={() => setView('student-register')}>Crear Cuenta Nueva</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// 4. Student Register (Sin Cambios)
const StudentRegister = ({ setView, setCurrentUserData, user, appId }) => {
  const [formData, setFormData] = useState({ name: '', carne: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'qr_users');
      const q = query(usersRef, where("carne", "==", formData.carne));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) { setError('Este carné ya está registrado.'); setLoading(false); return; }
      const newUser = { ...formData, createdAt: serverTimestamp(), deviceId: user.uid };
      await addDoc(usersRef, newUser);
      alert("Registro exitoso.");
      setView('student-login');
    } catch (err) { console.error(err); setError('Error al registrar.'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Registro de Estudiante</h2>
        <form onSubmit={handleRegister}>
          <Input label="Nombre Completo" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          <Input label="Número de Carné / ID" value={formData.carne} onChange={(e) => setFormData({...formData, carne: e.target.value})} required />
          <Input label="Correo Electrónico" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <Button className="w-full" type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Completar Registro'}</Button>
          <div className="mt-4 text-center"><button type="button" onClick={() => setView('student-login')} className="text-sm text-gray-500 hover:underline">Ya tengo cuenta</button></div>
        </form>
      </Card>
    </div>
  );
};

// 5. Admin Dashboard (ACTUALIZADO: Baja de Docentes)
const AdminDashboard = ({ user, adminUser, appId }) => {
  const [sessionCode, setSessionCode] = useState(null);
  const [records, setRecords] = useState([]);
  const [courses, setCourses] = useState([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [approvedTeachers, setApprovedTeachers] = useState([]); // Nuevo estado para docentes activos
  
  useEffect(() => {
    if (!user) return;
    const attendanceRef = collection(db, 'artifacts', appId, 'public', 'data', 'qr_attendance');
    const q = query(attendanceRef, orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateStr: doc.data().timestamp ? new Date(doc.data().timestamp.seconds * 1000).toLocaleString() : 'Pendiente...'
      }));
      setRecords(data);
    });
    return () => unsubscribe();
  }, [user, appId]);

  useEffect(() => {
    if (!user) return;
    const coursesRef = collection(db, 'artifacts', appId, 'public', 'data', 'qr_courses');
    const q = query(coursesRef, orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user, appId]);

  // Escuchar Pendientes (Super Admin)
  useEffect(() => {
    if (!user || adminUser?.role !== 'superadmin') return;
    const adminsRef = collection(db, 'artifacts', appId, 'public', 'data', 'qr_admins');
    const q = query(adminsRef, where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pending = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingTeachers(pending);
    });
    return () => unsubscribe();
  }, [user, adminUser, appId]);

  // 👑 Escuchar Docentes Activos (Nuevo para Super Admin)
  useEffect(() => {
    if (!user || adminUser?.role !== 'superadmin') return;
    const adminsRef = collection(db, 'artifacts', appId, 'public', 'data', 'qr_admins');
    // Traemos todos los aprobados
    const q = query(adminsRef, where("status", "==", "approved"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Filtramos para no mostrarnos a nosotros mismos en la lista
      const approved = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(doc => doc.id !== adminUser.id);
      setApprovedTeachers(approved);
    });
    return () => unsubscribe();
  }, [user, adminUser, appId]);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'qr_courses'), {
      name: newCourseName.trim(),
      createdBy: adminUser?.email || 'unknown',
      createdAt: serverTimestamp()
    });
    setNewCourseName('');
  };

  const handleDeleteCourse = async (id) => {
    if(confirm('¿Eliminar curso?')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qr_courses', id));
    }
  };

  const handleApproveTeacher = async (id, name) => {
    if(confirm(`¿Autorizar acceso al docente ${name}?`)) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qr_admins', id), {
        status: 'approved'
      });
    }
  };

  const handleRejectTeacher = async (id) => {
    if(confirm('¿Rechazar y eliminar esta solicitud?')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qr_admins', id));
    }
  };

  // 👑 Manejo de Baja de Docente Activo
  const handleDeleteActiveTeacher = async (id, name) => {
    if(confirm(`⚠️ ¿ATENCIÓN: Estás seguro de dar de baja a ${name}? \n\nEl docente perderá el acceso inmediatamente.`)) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qr_admins', id));
    }
  };

  const generateNewSession = () => {
    const newCode = `SESION-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setSessionCode(newCode);
  };

  const exportToCSV = () => {
    const headers = ["Fecha/Hora", "Curso", "Nombre", "Carné", "Email", "Latitud", "Longitud", "Código Sesión"];
    const csvContent = [
      headers.join(","),
      ...records.map(r => [
        `"${r.dateStr}"`, `"${r.courseName || 'N/A'}"`, `"${r.studentName}"`, `"${r.studentCarne}"`, `"${r.studentEmail}"`, r.location?.lat || 0, r.location?.lng || 0, r.sessionCode
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "asistencia.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-blue-800">Panel de Control Docente</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-600">Sesión: <strong>{adminUser?.name}</strong></span>
            {adminUser?.role === 'superadmin' && (
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold border border-indigo-200">SUPER ADMIN</span>
            )}
          </div>
        </div>
      </div>

      {/* Sección de Notificaciones y Gestión de Usuarios (Solo Super Admin) */}
      {adminUser?.role === 'superadmin' && (
        <div className="space-y-4">
          
          {/* Solicitudes Pendientes */}
          {pendingTeachers.length > 0 && (
            <Card className="p-6 border-l-4 border-l-orange-500 bg-orange-50">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-orange-800">
                <ShieldAlert size={20} /> Solicitudes de Registro Pendientes
              </h3>
              <div className="space-y-3">
                {pendingTeachers.map(teacher => (
                  <div key={teacher.id} className="flex flex-col md:flex-row justify-between items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="mb-2 md:mb-0">
                      <p className="font-bold text-gray-800">{teacher.name}</p>
                      <p className="text-sm text-gray-500">{teacher.email}</p>
                      <p className="text-xs text-orange-600 font-medium">Esperando aprobación</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApproveTeacher(teacher.id, teacher.name)}
                        className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded hover:bg-green-200 font-medium text-sm transition-colors"
                      >
                        <Check size={16} /> Aprobar
                      </button>
                      <button 
                        onClick={() => handleRejectTeacher(teacher.id)}
                        className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1.5 rounded hover:bg-red-200 font-medium text-sm transition-colors"
                      >
                        <X size={16} /> Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Directorio de Docentes Activos (NUEVO) */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
              <Users size={20} className="text-indigo-600" /> Directorio de Docentes Activos
            </h3>
            {approvedTeachers.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No hay otros docentes registrados aún.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {approvedTeachers.map(teacher => (
                  <div key={teacher.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 group">
                    <div>
                      <p className="font-medium text-gray-900">{teacher.name}</p>
                      <p className="text-xs text-gray-500">{teacher.email}</p>
                      {teacher.role === 'superadmin' && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 rounded">ADMIN</span>}
                    </div>
                    <button 
                      onClick={() => handleDeleteActiveTeacher(teacher.id, teacher.name)}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition-all opacity-0 group-hover:opacity-100"
                      title="Dar de baja / Eliminar acceso"
                    >
                      <UserX size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        
        <Card className="md:col-span-1 p-6 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-600" /> Cursos Disponibles
          </h3>
          
          <form onSubmit={handleAddCourse} className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              placeholder="Nuevo curso..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white text-gray-900"
            />
            <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700">
              <Plus size={18} />
            </button>
          </form>

          <div className="flex-1 overflow-y-auto space-y-2 border-t pt-2">
            {courses.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No hay cursos registrados.</p>
            ) : (
              courses.map(c => (
                <div key={c.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg group">
                  <span className="font-medium text-sm text-gray-700">{c.name}</span>
                  <button onClick={() => handleDeleteCourse(c.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="md:col-span-1 p-6 flex flex-col items-center text-center">
          <h3 className="text-lg font-bold mb-4">Código QR de Sesión</h3>
          
          {sessionCode ? (
            <div className="space-y-4 w-full flex flex-col items-center animate-in zoom-in duration-300">
              <div className="p-4 bg-white border-4 border-gray-900 rounded-xl shadow-inner bg-white">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sessionCode)}`} 
                  alt="Código QR de sesión" 
                  className="w-48 h-48 object-contain"
                />
              </div>
              <p className="text-xs text-gray-500 font-mono break-all">{sessionCode}</p>
              <div className="w-full bg-green-50 text-green-700 p-2 rounded text-sm font-medium">
                Sesión Activa
              </div>
              <Button variant="danger" onClick={() => setSessionCode(null)} className="w-full">
                Finalizar Sesión
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <QrCode size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4 text-sm">Genera un QR para proyectar en clase</p>
              <Button onClick={generateNewSession}>Generar QR Nuevo</Button>
            </div>
          )}
        </Card>

        <Card className="md:col-span-3 p-6 overflow-hidden flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Users size={20} className="text-blue-600" /> Asistencia en Tiempo Real
            </h3>
            <Button variant="secondary" onClick={exportToCSV} disabled={records.length === 0} icon={FileSpreadsheet}>
              Exportar CSV
            </Button>
          </div>
          
          <div className="flex-1 overflow-auto border rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">Hora</th>
                  <th className="px-4 py-3 bg-blue-50 text-blue-800">Curso</th> 
                  <th className="px-4 py-3">Estudiante</th>
                  <th className="px-4 py-3">ID / Carné</th>
                  <th className="px-4 py-3">Ubicación</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? (
                  records.map((record) => (
                    <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-gray-500">{record.dateStr}</td>
                      <td className="px-4 py-3 font-medium text-blue-700">{record.courseName}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{record.studentName}</td>
                      <td className="px-4 py-3 text-gray-700">{record.studentCarne}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {record.location ? (
                          <span className="flex items-center gap-1" title={`${record.location.lat}, ${record.location.lng}`}>
                            <MapPin size={12} /> GPS OK
                          </span>
                        ) : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-400">
                      No hay registros de asistencia aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

// 6. Student Dashboard (SIN CAMBIOS)
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
                  Simular Escaneo
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