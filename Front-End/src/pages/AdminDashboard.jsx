import { useEffect, useState } from "react";
import api from "../lib/api";
import toast, { Toaster } from "react-hot-toast";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { ShieldAlert, Users, Layers, Award, FileSpreadsheet, Check, X, Shield, Search, LogOut, Plus, UserPlus } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import useSocket from "../hooks/useSocket";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const socket = useSocket();
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    approvedTeachers: 0,
    pendingTeachers: 0,
    totalQuizzes: 0,
    totalResults: 0
  });

  useEffect(() => {
    if (socket) {
      // Join the admin audit room
      socket.emit('admin:join-audit');

      socket.on('admin:event', (event) => {
        setAuditLogs((prev) => [event, ...prev].slice(0, 100));
      });

      return () => {
        socket.off('admin:event');
      };
    }
  }, [socket]);
  const [pendingTeachersList, setPendingTeachersList] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'approvals', 'students', 'create-staff'
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(null); // ID of teacher to reject

  // Staff creation form state
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    staffId: ""
  });
  const [creatingStaff, setCreatingStaff] = useState(false);

  const fetchStats = async () => {
    try {
      const statsRes = await api.get('/api/admin/stats');
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load system statistics');
    }
  };

  const fetchPendingTeachers = async () => {
    try {
      const res = await api.get('/api/admin/teachers/pending');
      setPendingTeachersList(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load pending registrations');
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/api/admin/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load students directory');
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchPendingTeachers(), fetchStudents()]);
      setLoading(false);
    };
    loadAllData();
  }, []);

  const handleApprove = async (id, name) => {
    try {
      await api.put(`/api/admin/teachers/${id}/approve`);
      toast.success(`Approved teacher: ${name}`);
      await Promise.all([fetchStats(), fetchPendingTeachers()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason) return toast.error("Please enter a reason for rejection");
    try {
      await api.put(`/api/admin/teachers/${showRejectModal}/reject`, { reason: rejectReason });
      toast.success("Teacher registration rejected successfully.");
      setShowRejectModal(null);
      setRejectReason("");
      await Promise.all([fetchStats(), fetchPendingTeachers()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setCreatingStaff(true);
    try {
      await api.post('/api/admin/teachers', staffForm);
      toast.success(`Instructor account created: ${staffForm.name}`);
      setStaffForm({
        name: "",
        email: "",
        password: "",
        staffId: ""
      });
      await fetchStats();
      setView('dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create instructor account");
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminRole");
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  // Chart configs
  const userDistributionData = {
    labels: ['Students', 'Teachers'],
    datasets: [{
      data: [stats.totalStudents, stats.totalTeachers],
      backgroundColor: ['#000000', '#cccccc'],
      borderColor: '#ffffff',
      borderWidth: 2
    }],
  };

  const activityData = {
    labels: ['Quizzes Created', 'Student Attempts'],
    datasets: [{
      label: 'Volume',
      data: [stats.totalQuizzes, stats.totalResults],
      backgroundColor: ['#22c55e', '#10b981'],
      borderRadius: 6,
    }],
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-black font-sans" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Loading records...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gray-50 text-black flex font-sans"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
    >
      <Toaster position="top-right" />
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <form onSubmit={handleRejectSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-extrabold text-black mb-2 tracking-tight">Reject Registration</h3>
            <p className="text-xs text-gray-500 mb-6 font-medium">Please provide a reason to email the applicant detailing why their registration request was rejected.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-black mb-6 text-sm transition-all"
              rows="4"
              placeholder="e.g. Invalid Staff ID credentials provided."
              required
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowRejectModal(null); setRejectReason(""); }}
                className="px-5 py-2.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-black hover:border-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold bg-red-600 rounded-lg text-white hover:bg-red-700 transition-all shadow-sm"
              >
                Reject Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sidebar */}
      <aside className="bg-white w-64 border-r border-gray-200 flex-shrink-0 flex flex-col justify-between shadow-sm z-10">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-extrabold text-lg">
              PX
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-none">ProctorX</h1>
              <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mt-1">Admin Portal</p>
            </div>
          </div>
          
          <nav className="mt-4 px-4 space-y-1.5">
            <button
              onClick={() => setView('dashboard')}
              className={`flex items-center w-full py-3 px-4 rounded-xl font-bold transition-all text-sm ${view === 'dashboard' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-black'}`}
            >
              <Layers className="w-4 h-4 mr-3" />
              Overview Stats
            </button>
            <button
              onClick={() => setView('create-staff')}
              className={`flex items-center w-full py-3 px-4 rounded-xl font-bold transition-all text-sm ${view === 'create-staff' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-black'}`}
            >
              <UserPlus className="w-4 h-4 mr-3" />
              Create Instructor
            </button>
            <button
              onClick={() => setView('approvals')}
              className={`flex items-center justify-between w-full py-3 px-4 rounded-xl font-bold transition-all text-sm ${view === 'approvals' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-black'}`}
            >
              <span className="flex items-center">
                <ShieldAlert className="w-4 h-4 mr-3" />
                Teacher Approvals
              </span>
              {pendingTeachersList.length > 0 && (
                <span className={`px-2 py-0.5 text-[10px] rounded-md font-extrabold ${view === 'approvals' ? 'bg-white text-black' : 'bg-red-50 text-red-600 border border-red-100'}`}>{pendingTeachersList.length}</span>
              )}
            </button>
            <button
              onClick={() => setView('students')}
              className={`flex items-center w-full py-3 px-4 rounded-xl font-bold transition-all text-sm ${view === 'students' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-black'}`}
            >
              <Users className="w-4 h-4 mr-3" />
              Students Directory
            </button>
          </nav>
        </div>
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all text-sm"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 border-b border-gray-200 pb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-black tracking-tight">System Admin Portal</h2>
            <p className="text-gray-500 text-xs mt-1.5 font-medium">Control registrations, review statistics and manage users</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center font-extrabold text-white uppercase shadow-sm">
              A
            </div>
            <div>
              <p className="font-extrabold text-sm text-black">Administrator</p>
              <p className="text-[10px] uppercase tracking-wider text-green-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 block"></span> Security Active
              </p>
            </div>
          </div>
        </header>

        {view === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
                <div className="p-3 bg-gray-100 text-black rounded-xl border border-gray-200"><Users className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total Students</p>
                  <p className="text-3xl font-extrabold text-black mt-1">{stats.totalStudents}</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
                <div className="p-3 bg-gray-100 text-black rounded-xl border border-gray-200"><Award className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total Teachers</p>
                  <p className="text-3xl font-extrabold text-black mt-1">{stats.totalTeachers}</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl border border-green-100"><Layers className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Active Quizzes</p>
                  <p className="text-3xl font-extrabold text-black mt-1">{stats.totalQuizzes}</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
                <div className="p-3 bg-gray-100 text-black rounded-xl border border-gray-200"><FileSpreadsheet className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total Attempts</p>
                  <p className="text-3xl font-extrabold text-black mt-1">{stats.totalResults}</p>
                </div>
              </div>
            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2 bg-white border border-gray-200 p-8 rounded-2xl shadow-sm">
                <h3 className="text-sm font-extrabold text-black mb-6 uppercase tracking-wide border-b border-gray-100 pb-4">User Allocation</h3>
                <div className="max-w-[240px] mx-auto pt-4">
                  <Doughnut data={userDistributionData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#6b7280', font: { family: "'Plus Jakarta Sans', sans-serif", weight: 'bold' } } } } }} />
                </div>
              </div>
              <div className="lg:col-span-3 bg-white border border-gray-200 p-8 rounded-2xl shadow-sm">
                <h3 className="text-sm font-extrabold text-black mb-6 uppercase tracking-wide border-b border-gray-100 pb-4">Platform Activities</h3>
                <div className="pt-4 h-64">
                  <Bar data={activityData} options={{ maintainAspectRatio: false, responsive: true, scales: { y: { ticks: { color: '#9ca3af' }, grid: { color: '#f3f4f6' } }, x: { ticks: { color: '#9ca3af' }, grid: { display: false } } }, plugins: { legend: { display: false } } }} />
                </div>
              </div>
            </div>

            {/* Live Integrity Audit Stream */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h3 className="text-sm font-extrabold text-black flex items-center gap-2 uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4 text-black animate-pulse" /> Live Integrity Audit Stream
                </h3>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-green-50 text-green-700 border border-green-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span> Live Connected
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 font-mono text-xs h-64 overflow-y-auto space-y-3.5 custom-scrollbar">
                {auditLogs.length === 0 ? (
                  <div className="text-gray-400 font-medium text-center py-20 flex flex-col items-center gap-3">
                    <Search className="w-6 h-6 text-gray-300" />
                    Listening for live system-wide assessment activities...
                  </div>
                ) : (
                  auditLogs.map((log, idx) => {
                    let typeColor = "text-black";
                    let bgColor = "bg-gray-200";
                    if (log.type === "warning") {
                      typeColor = "text-amber-700";
                      bgColor = "bg-amber-100";
                    }
                    else if (log.type === "submit") {
                      typeColor = "text-green-700";
                      bgColor = "bg-green-100";
                    }

                    return (
                      <div key={idx} className="flex items-start gap-3 border-l-2 border-gray-300 pl-3">
                        <span className="text-[10px] text-gray-500 font-sans font-bold">
                          [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>
                        <div>
                          <span className={`font-extrabold text-[9px] px-1.5 py-0.5 rounded ${bgColor} ${typeColor} uppercase mr-2 tracking-widest`}>
                            {log.type}
                          </span>
                          <span className="text-gray-700 font-medium">{log.message}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'create-staff' && (
          <div className="max-w-2xl bg-white border border-gray-200 p-8 md:p-10 rounded-2xl shadow-sm space-y-8">
            <div className="border-b border-gray-100 pb-6">
              <h3 className="text-lg font-extrabold text-black">Create Instructor (Staff) Account</h3>
              <p className="text-xs text-gray-500 mt-1.5 font-medium">Register teachers directly. They will be approved and ready to log in immediately.</p>
            </div>
            
            <form onSubmit={handleCreateStaff} className="space-y-5">
              <div>
                <label className="text-xs text-gray-700 font-bold uppercase tracking-wide block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Dr. John Doe"
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-black text-sm transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-700 font-bold uppercase tracking-wide block mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="e.g. johndoe@university.edu"
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-black text-sm transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-700 font-bold uppercase tracking-wide block mb-1.5">Unique Staff ID</label>
                <input
                  type="text"
                  value={staffForm.staffId}
                  onChange={(e) => setStaffForm({ ...staffForm, staffId: e.target.value })}
                  placeholder="e.g. STAFF-5582"
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-black text-sm transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-700 font-bold uppercase tracking-wide block mb-1.5">Temporary Password</label>
                <input
                  type="password"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-black text-sm transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={creatingStaff}
                className="w-full py-3.5 font-bold bg-black hover:bg-gray-900 rounded-xl text-white transition-all shadow-md flex justify-center items-center gap-2 mt-4"
              >
                {creatingStaff ? 'Generating account...' : (
                  <>
                    <Plus className="w-4 h-4" /> Create Account
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {view === 'approvals' && (
          <div className="space-y-6">
            <h3 className="text-lg font-extrabold text-black mb-6 uppercase tracking-wide border-b border-gray-200 pb-4">Teacher Registration Approvals</h3>
            {pendingTeachersList.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 p-16 rounded-2xl text-center">
                <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="text-sm font-extrabold text-black uppercase tracking-wide">All queues cleared</h4>
                <p className="text-gray-500 text-xs mt-1.5 font-medium">There are currently no teacher registration requests pending approval.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTeachersList.map((teacher) => (
                  <div key={teacher.id} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-extrabold text-black border border-gray-200 text-lg uppercase">
                        {teacher.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-black">{teacher.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">{teacher.email}</p>
                        <p className="text-[10px] text-gray-400 mt-1 font-mono font-bold uppercase tracking-widest">Staff ID: {teacher.staffId}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(teacher.id, teacher.name)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-green-50 hover:border-green-200 text-gray-600 hover:text-green-700 transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm"
                        title="Approve User"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => setShowRejectModal(teacher.id)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-600 hover:text-red-600 transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm"
                        title="Reject User"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'students' && (
          <div className="space-y-6">
            <h3 className="text-lg font-extrabold text-black mb-6 uppercase tracking-wide border-b border-gray-200 pb-4">Registered Students Directory</h3>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-widest text-[10px] border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Registered Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-extrabold text-black">{student.name}</td>
                        <td className="px-6 py-4 text-gray-500 font-medium">{student.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md border ${student.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                            {student.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-xs font-medium">{new Date(student.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
