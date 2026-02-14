import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
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
  Eraser, AlertTriangle, Download, FileText
} from 'lucide-react';

// Librería de gráficos
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// --- CONFIGURACIÓN FIREBASE ---
// ⚠️ REEMPLAZA CON TUS CREDENCIALES
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

// CORRECCIÓN VISUAL: Forzamos bg-white y text-black para evitar campos oscuros en móviles
const Input = ({ label, type = "text", value, onChange, placeholder, required = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input 
      type={type} 
      value={value} 
      onChange={onChange} 
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-black placeholder-gray-500"
      placeholder={placeholder} 
      required={required} 
      style={{ backgroundColor: '#ffffff', color: '#000000' }} // Estilo en línea para máxima prioridad
    />
  </div>
);

// CORRECCIÓN VISUAL: Igual que el input, forzamos estilos
const Select = ({ label, value, onChange, options, placeholder, required = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select 
      value={value} 
      onChange={onChange} 
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-white text-black"
      required={required}
      style={{ backgroundColor: '#ffffff', color: '#000000' }}
    >
      <option value="" disabled className="text-gray-400">{placeholder}</option>
      {options.map((opt) => <option key={opt.id} value={opt.name} className="text-black">{opt.name}</option>)}
    </select>
  </div>
);

const Card = ({ children, className = "", ...props }) => (
  <div 
    className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden ${className}`}
    {...props} 
  >
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
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (e) {} };
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

const AdminLogin = ({ setView, setAdminUser, appId }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleLogin = async (e) => {
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
  return (
    <div className="max-w-md mx-auto py-10"><Card className="p-8"><h2 className="text-2xl font-bold mb-6 text-center">Acceso Docente</h2><form onSubmit={handleLogin}><Input label="Email" value={email} onChange={e=>setEmail(e.target.value)} /><Input label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} /><Button className="w-full" type="submit">Entrar</Button><div className="mt-4 text-center"><a onClick={()=>setView('admin-register')} className="text-blue-600 cursor-pointer">Registrarse</a></div></form></Card></div>
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
    return <div className="max-w-md mx-auto py-10"><Card className="p-8"><h2 className="text-2xl text-center mb-4">Registro</h2><form onSubmit={reg}><Input label="Nombre" value={f.name} onChange={e=>setF({...f, name:e.target.value})} /><Input label="Email" value={f.email} onChange={e=>setF({...f, email:e.target.value})} /><Input label="Password" type="password" value={f.password} onChange={e=>setF({...f, password:e.target.value})} /><Input label="Código (Opcional)" value={f.secretCode} onChange={e=>setF({...f, secretCode:e.target.value})} /><Button className="w-full" type="submit">Registrar</Button></form></Card></div>
};
const StudentLogin = ({ setView, setCurrentUserData, user, appId }) => {
    const [c, setC] = useState([]); const [sel, setSel] = useState(''); const [id, setId] = useState('');
    useEffect(() => { 
        if(user) onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_courses'), orderBy('name')), 
        s=>setC(s.docs.map(d=>({ id: d.id, ...d.data() })))) 
    }, [user]);
    const log = async (e) => { e.preventDefault(); const s = await getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_users'), where("carne", "==", id))); if(!s.empty){ setCurrentUserData({...s.docs[0].data(), currentCourse: sel}); setView('student-dash'); } else alert("No encontrado"); };
    return <div className="max-w-md mx-auto py-10"><Card className="p-8"><h2 className="text-2xl text-center mb-4">Estudiante</h2><form onSubmit={log}><Select label="Curso" value={sel} onChange={e=>setSel(e.target.value)} options={c} placeholder="Elige..." /><Input label="ID" value={id} onChange={e=>setId(e.target.value)} /><Button className="w-full" type="submit">Entrar</Button><div className="mt-4 text-center"><a onClick={()=>setView('student-register')} className="text-blue-600 cursor-pointer">Crear cuenta</a></div></form></Card></div>
};
const StudentRegister = ({ setView, user, appId }) => {
    const [f, setF] = useState({name:'', carne:'', email:''});
    const reg = async (e) => { e.preventDefault(); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'qr_users'), {...f, deviceId: user.uid}); alert("Listo"); setView('student-login'); };
    return <div className="max-w-md mx-auto py-10"><Card className="p-8"><h2 className="text-2xl text-center mb-4">Registro Estudiante</h2><form onSubmit={reg}><Input label="Nombre" value={f.name} onChange={e=>setF({...f, name:e.target.value})} /><Input label="ID" value={f.carne} onChange={e=>setF({...f, carne:e.target.value})} /><Input label="Email" value={f.email} onChange={e=>setF({...f, email:e.target.value})} /><Button className="w-full" type="submit">Registrar</Button></form></Card></div>
};

// --- COMPONENTE DE ESTADÍSTICAS AVANZADAS ---
const StatsView = ({ course, attendanceData, appId, adminEmail, onReset, startDate, setStartDate }) => {
  // 1. Filtrar datos por fecha si existe (Con corrección de zona horaria)
  const filteredData = startDate ? attendanceData.filter(r => {
    if (!r.timestamp) return false;
    const recordDate = r.timestamp.toDate();
    const year = recordDate.getFullYear();
    const month = String(recordDate.getMonth() + 1).padStart(2, '0');
    const day = String(recordDate.getDate()).padStart(2, '0');
    const recordDateString = `${year}-${month}-${day}`;
    return recordDateString >= startDate;
  }) : attendanceData;

  // 2. Calcular Sesiones Totales (CORREGIDO: Basado en data filtrada)
  const sessions = [...new Set(filteredData.map(r => r.sessionCode))];
  // Si no hay sesiones filtradas, es 0. Evitamos división por cero en el cálculo.
  const totalClasses = sessions.length; 

  const studentStats = {};
  filteredData.forEach(r => {
    if (!studentStats[r.studentCarne]) {
      studentStats[r.studentCarne] = { name: r.studentName, count: 0, id: r.studentCarne };
    }
    studentStats[r.studentCarne].count += 1;
  });

  const report = Object.values(studentStats).map(s => {
    const percentage = totalClasses === 0 ? 0 : Math.round((s.count / totalClasses) * 100);
    return {
        ...s,
        percentage,
        status: percentage >= 80 ? 'Aprobado' : 'Riesgo'
    };
  });

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
    const rows = report.map(r => [
        `"${r.name}"`, 
        `"${r.id}"`, 
        r.count, 
        totalClasses, 
        `${r.percentage}%`, 
        r.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `consolidado_${course.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadHistoryCSV = () => {
      const headers = ["Fecha", "Hora", "Curso", "Estudiante", "Carnet", "Codigo Sesion"];
      const rows = filteredData.map(r => {
          const dateObj = r.timestamp ? r.timestamp.toDate() : new Date();
          return [
              dateObj.toLocaleDateString(),
              dateObj.toLocaleTimeString(),
              `"${r.courseName}"`,
              `"${r.studentName}"`,
              `"${r.studentCarne}"`,
              `"${r.sessionCode}"`
          ];
      });
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `historial_asistencia_${course.name}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-gray-50 border p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-600 flex items-center gap-2">
           <Calendar size={18} />
           <span>Analizando datos a partir de:</span>
        </div>
        <input 
          type="date" 
          value={startDate} 
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 border rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1 p-6 flex flex-col items-center">
          <h4 className="font-bold mb-4 text-gray-700">Estado General del Grupo</h4>
          {pieData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-gray-400 py-10">Sin datos en el periodo seleccionado</p>}
        </Card>

        <Card className="flex-1 p-6">
          <h4 className="font-bold mb-4 text-gray-700">Métricas Clave</h4>
          <div className="space-y-4">
            <div className="flex justify-between p-3 bg-blue-50 rounded">
              <span>Clases Impartidas (Periodo):</span>
              <span className="font-bold text-blue-700">{totalClasses}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span>Alumnos (Periodo):</span>
              <span className="font-bold">{report.length}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
                <Button variant="secondary" onClick={downloadSummaryCSV} title="Descargar lista de alumnos y sus promedios">
                    <Users size={16}/> Consolidado
                </Button>
                <Button variant="secondary" onClick={downloadHistoryCSV} title="Descargar historial completo registro por registro">
                    <FileText size={16}/> Historial
                </Button>
            </div>
            <Button variant="outline" onClick={generatePublicLink} className="w-full" icon={Share2}>
              Compartir Reporte Público
            </Button>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 bg-gray-50 border-b font-bold flex justify-between">
            <span>Detalle por Estudiante</span>
            <span className="text-xs text-gray-500 font-normal self-center">Base: {totalClasses} sesiones</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-500 border-b">
              <tr>
                <th className="p-3">Estudiante</th>
                <th className="p-3">Asistencias</th>
                <th className="p-3">% Acumulado</th>
                <th className="p-3">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {report.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{r.name} <div className="text-xs text-gray-400">{r.id}</div></td>
                  <td className="p-3">{r.count} / {totalClasses}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" 
                             style={{ width: `${r.percentage}%`, backgroundColor: r.percentage >= 80 ? '#22c55e' : '#ef4444' }}></div>
                      </div>
                      {r.percentage}%
                    </div>
                  </td>
                  <td className="p-3">
                    {r.percentage >= 80 ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">OK</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">BAJA</span>
                    )}
                  </td>
                </tr>
              ))}
              {report.length === 0 && (
                <tr><td colSpan="4" className="p-4 text-center text-gray-400">No hay asistencias registradas en este periodo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {onReset && (
        <div className="border border-red-200 rounded-xl p-6 bg-red-50 mt-8">
           <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2"><AlertTriangle size={20}/> Zona de Peligro</h4>
           <p className="text-sm text-red-600 mb-4">
             Si deseas iniciar un nuevo ciclo escolar o cometiste errores, puedes reiniciar el historial. 
             Esta acción eliminará <strong>permanentemente</strong> todos los registros de asistencia de este curso.
           </p>
           <Button variant="danger" onClick={() => onReset(course.name)} icon={Eraser}>
             Reiniciar Historial del Curso
           </Button>
        </div>
      )}

    </div>
  );
};

// 5. Admin Dashboard (CORREGIDO: SE RESTAURÓ SUPER ADMIN)
const AdminDashboard = ({ user, adminUser, appId }) => {
  const [tab, setTab] = useState('session'); // session | stats
  const [sessionCode, setSessionCode] = useState(null);
  const [courses, setCourses] = useState([]);
  const [allRecords, setAllRecords] = useState([]); 
  const [newCourseName, setNewCourseName] = useState('');
  const [selectedStatCourse, setSelectedStatCourse] = useState(''); 
  const [startDate, setStartDate] = useState(''); 

  // Estados para Super Admin
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [approvedTeachers, setApprovedTeachers] = useState([]);

  // Efectos para Super Admin
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

  // Handlers Super Admin
  const handleApprove = async (id) => await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qr_admins', id), { status: 'approved' });
  const handleReject = async (id) => { if(confirm('¿Rechazar?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qr_admins', id)); };

  useEffect(() => {
    if (!user || !adminUser) return;
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'qr_courses'), 
      where("createdBy", "==", adminUser.email), 
      orderBy('name')
    );
    const qSimple = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_courses'), where("createdBy", "==", adminUser.email));
    return onSnapshot(qSimple, (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user, adminUser, appId]);

  useEffect(() => {
    if (!user || courses.length === 0) return;
    const myCourseNames = courses.map(c => c.name);
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_attendance'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data(), dateStr: d.data().timestamp?.toDate().toLocaleString() }));
      const myRecords = data.filter(r => myCourseNames.includes(r.courseName));
      setAllRecords(myRecords);
    });
  }, [user, courses, appId]);

  const handleAddCourse = async (e) => { 
    e.preventDefault(); 
    if(newCourseName.trim()) { 
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'qr_courses'), { 
        name: newCourseName.trim(), 
        createdBy: adminUser.email, 
        createdAt: serverTimestamp() 
      }); 
      setNewCourseName(''); 
    }
  };

  const handleResetCourse = async (courseName) => {
    if(confirm(`⚠️ ¿ATENCIÓN DOCENTE!\n\nEstás a punto de ELIMINAR PERMANENTEMENTE todo el historial de asistencia del curso: "${courseName}".\n\nEsta acción NO se puede deshacer.\n¿Estás seguro de continuar?`)) {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'qr_attendance'), where("courseName", "==", courseName));
      try {
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
        alert(`Historial del curso "${courseName}" eliminado correctamente.`);
      } catch (error) {
        console.error("Error borrando:", error);
        alert("Hubo un error al intentar borrar los datos.");
      }
    }
  };

  const generateNewSession = () => setSessionCode(`SESION-${Date.now().toString().slice(-4)}`);

  return (
    <div className="space-y-6">
      <div className="bg-white border p-4 rounded-xl flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Panel de Control</h2>
          <p className="text-sm text-gray-500">{adminUser.role === 'superadmin' ? 'Super Administrador' : 'Docente'} | {adminUser.email}</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setTab('session')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'session' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Sesión</button>
          <button onClick={() => setTab('stats')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'stats' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Estadísticas</button>
        </div>
      </div>

      {tab === 'session' ? (
        <>
          {/* PANEL SUPER ADMIN RESTAURADO */}
          {adminUser?.role === 'superadmin' && (
            <div className="space-y-4 mb-6">
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
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${sessionCode}`} className="mb-4 mix-blend-multiply" />
                  <p className="font-mono text-xl font-bold tracking-widest mb-4">{sessionCode}</p>
                  <Button variant="danger" onClick={()=>setSessionCode(null)} className="w-full">Terminar Clase</Button>
                </div>
              ) : (
                <div className="text-center">
                  <QrCode size={64} className="text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 mb-6">Genera un código QR para que<br/>tus alumnos fichen asistencia.</p>
                  <Button onClick={generateNewSession} className="w-full">Generar QR Nuevo</Button>
                </div>
              )}
            </Card>

            <Card className="md:col-span-1 p-6 h-[450px] overflow-hidden flex flex-col">
              <h3 className="font-bold mb-4 flex items-center gap-2"><RefreshCw size={18}/> Actividad Reciente</h3>
              <div className="flex-1 overflow-auto space-y-3">
                {allRecords.slice(0, 20).map(r => (
                  <div key={r.id} className="border-l-4 border-blue-500 pl-3 py-1">
                    <p className="font-bold text-sm text-gray-800">{r.studentName}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{r.courseName}</span>
                      <span>{r.dateStr.split(',')[1]}</span>
                    </div>
                  </div>
                ))}
                {allRecords.length === 0 && <p className="text-center text-gray-400 mt-10">Sin actividad hoy</p>}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
            <label className="font-bold text-gray-700">Analizar Curso:</label>
            <select 
              value={selectedStatCourse} 
              onChange={(e) => setSelectedStatCourse(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-gray-50 min-w-[200px]"
            >
              <option value="">-- Selecciona --</option>
              {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {selectedStatCourse ? (
             <StatsView 
                course={courses.find(c => c.name === selectedStatCourse)}
                attendanceData={allRecords.filter(r => r.courseName === selectedStatCourse)}
                appId={appId}
                adminEmail={adminUser.email}
                onReset={handleResetCourse}
                startDate={startDate}
                setStartDate={setStartDate}
             />
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Selecciona un curso arriba para ver el rendimiento académico.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PÚBLICO (Solo Lectura) ---
const PublicReportView = ({ publicData, appId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(''); 

  useEffect(() => {
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'qr_attendance'),
      where("courseName", "==", publicData.courseName)
    );
    const unsub = onSnapshot(q, (snap) => {
      const records = snap.docs.map(d => d.data());
      setData(records);
      setLoading(false);
    });
    return () => unsub();
  }, [publicData, appId]);

  if(loading) return <div className="text-center p-10">Cargando reporte público...</div>;

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="bg-blue-600 text-white p-8 rounded-t-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Reporte de Asistencia Público</h1>
        <div className="flex gap-6 text-blue-100">
          <span className="flex items-center gap-2"><BookOpen size={18}/> Curso: {publicData.courseName}</span>
          <span className="flex items-center gap-2"><User size={18}/> Docente: {publicData.teacherEmail}</span>
        </div>
      </div>
      <div className="bg-white p-6 rounded-b-2xl shadow-lg border-x border-b">
         <StatsView 
            course={{name: publicData.courseName}} 
            attendanceData={data} 
            appId={appId}
            adminEmail={publicData.teacherEmail}
            startDate={startDate}
            setStartDate={setStartDate}
         />
         <p className="text-center text-xs text-gray-400 mt-8 border-t pt-4">
           Este es un reporte generado automáticamente por AsistenciaQR Pro. 
         </p>
      </div>
    </div>
  );
};

// --- (StudentDashboard se mantiene igual con jsQR dinámico) ---
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
    setStatus('locating'); setMsg('GPS...');
    if (!navigator.geolocation) { setStatus('error'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setStatus('scanning'); setScanning(true); },
      (err) => { setStatus('error'); setMsg('GPS requerido'); }
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
    } catch (err) { setMsg("Cámara bloqueada. Usa manual."); }
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
  
  // CORRECCIÓN DE SEGURIDAD: Evitar duplicados por sesión
  const processAttendance = async (code) => {
    // 1. Detener el escáner visualmente mientras verificamos
    setScanning(false);
    setStatus('saving'); 
    setMsg('Verificando asistencia...');

    try {
      // 2. VERIFICACIÓN DE DUPLICADOS
      // Consultamos si ya existe un registro con el mismo código de sesión y el mismo ID de estudiante
      const qCheck = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'qr_attendance'),
        where("sessionCode", "==", code),
        where("studentCarne", "==", userData.carne) // Mejor validación que usar UID de dispositivo
      );
      
      const existingDocs = await getDocs(qCheck);

      if (!existingDocs.empty) {
        // Ya existe -> Mostrar error y salir
        setStatus('error');
        setMsg('⚠️ Ya registraste asistencia en esta sesión.');
        return;
      }

      // 3. Si no existe, procedemos a guardar
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'qr_attendance'), { 
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
      setMsg(`¡Registrado correctamente!`); 

    } catch (e) { 
      console.error(e);
      setStatus('error'); 
      setMsg('Error de conexión.');
    }
  };
  
  const manual = () => { const c = prompt("Código:"); if(c) processAttendance(c); };

  return (
    <div className="max-w-xl mx-auto space-y-6"><Card className="p-6">
       <div className="flex items-center gap-4 mb-6"><div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">{userData.name[0]}</div><div><h2 className="text-xl font-bold">{userData.name}</h2><p className="text-gray-500">{userData.carne}</p></div></div>
       {!scanning && status !== 'success' && <div className="text-center"><p className="mb-4">Clase: <strong>{userData.currentCourse}</strong></p><Button onClick={startScan} className="w-full py-4"><QrCode/> Escanear QR</Button></div>}
       {scanning && <div className="relative aspect-square bg-black rounded-lg overflow-hidden flex items-center justify-center"><video ref={videoRef} className="absolute w-full h-full object-cover" muted playsInline /><canvas ref={canvasRef} className="hidden"/><div className="border-2 border-blue-500 w-64 h-64 z-10 animate-pulse"></div><div className="absolute bottom-4 flex gap-2 w-full px-4"><Button variant="danger" onClick={()=>{setScanning(false); setStatus('idle')}} className="flex-1">Cancelar</Button><Button variant="secondary" onClick={manual} className="flex-1">Manual</Button></div></div>}
       {status === 'success' && <div className="text-center py-8"><CheckCircle size={48} className="text-green-500 mx-auto mb-4"/><h3 className="text-2xl font-bold">¡Listo!</h3><p className="text-gray-600 mb-4">{msg}</p><Button variant="secondary" onClick={()=>setStatus('idle')} className="mt-4">Finalizar</Button></div>}
       {status === 'error' && <div className="text-center py-8"><AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4"/><h3 className="text-2xl font-bold">Atención</h3><p className="text-gray-600 mb-4">{msg}</p><Button variant="secondary" onClick={()=>setStatus('idle')} className="mt-4">Volver</Button></div>}
    </Card></div>
  );
};