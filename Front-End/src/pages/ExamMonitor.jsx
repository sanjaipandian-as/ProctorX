import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import useSocket from '../hooks/useSocket';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  Play, 
  CheckCircle2, 
  ArrowLeft, 
  Ban, 
  Info,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const ExamMonitor = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket(quizId);

  const [quizDetails, setQuizDetails] = useState(null);
  const [students, setStudents] = useState([]); // Array of { studentId, name, status, warnings: [] }
  const [loading, setLoading] = useState(true);

  // Fetch quiz details on mount
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/api/quizzes/${quizId}`);
        setQuizDetails(res.data);
      } catch (err) {
        console.error('Error fetching quiz details:', err);
        toast.error('Failed to load quiz details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [quizId]);

  // Handle socket interactions
  useEffect(() => {
    if (!socket) return;

    // Join teacher monitor room
    socket.emit('teacher:monitor', { quizId });

    // Handle initial state load
    socket.on('exam:initial-students', (activeList) => {
      const formatted = activeList.map(s => ({
        ...s,
        warnings: [],
        warningsCount: s.warningsCount || 0
      }));
      setStudents(formatted);
    });

    // Handle student joins
    socket.on('exam:student-joined', ({ studentId, name, status }) => {
      setStudents((prev) => {
        const exists = prev.find(s => s.studentId === studentId);
        if (exists) {
          return prev.map(s => s.studentId === studentId ? { ...s, status: 'active' } : s);
        } else {
          return [...prev, { studentId, name, status: 'active', warnings: [], warningsCount: 0 }];
        }
      });
      toast.success(`${name} entered the exam room`);
    });

    // Handle warnings
    socket.on('exam:warning', ({ studentId, name, type, count }) => {
      setStudents((prev) =>
        prev.map(s => {
          if (s.studentId === studentId) {
            return {
              ...s,
              warningsCount: count,
              warnings: [...s.warnings, { type, timestamp: new Date().toLocaleTimeString() }]
            };
          }
          return s;
        })
      );
      toast.error(`Warning: ${name} triggered ${type} violation!`, { icon: '⚠️' });
    });

    // Handle student disconnected
    socket.on('exam:student-disconnected', ({ studentId }) => {
      setStudents((prev) =>
        prev.map(s => s.studentId === studentId ? { ...s, status: 'disconnected' } : s)
      );
    });

    // Handle student submissions
    socket.on('exam:student-submitted', ({ studentId }) => {
      setStudents((prev) =>
        prev.map(s => s.studentId === studentId ? { ...s, status: 'submitted' } : s)
      );
    });

    return () => {
      socket.off('exam:initial-students');
      socket.off('exam:student-joined');
      socket.off('exam:warning');
      socket.off('exam:student-disconnected');
      socket.off('exam:student-submitted');
    };
  }, [socket, quizId]);

  const handleForceSubmit = (studentId, studentName) => {
    if (window.confirm(`Are you sure you want to FORCE SUBMIT ${studentName}'s exam?`)) {
      if (socket) {
        socket.emit('teacher:force-submit', { quizId, studentId });
        toast.success(`Sent force-submission command to ${studentName}`);
        
        // Update local status
        setStudents((prev) =>
          prev.map(s => s.studentId === studentId ? { ...s, status: 'submitted' } : s)
        );
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 text-xs font-bold rounded-lg bg-green-50 text-green-700 border border-green-200">Active</span>;
      case 'disconnected':
        return <span className="px-3 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">Disconnected</span>;
      case 'submitted':
        return <span className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">Submitted</span>;
      default:
        return <span className="px-3 py-1 text-xs font-bold rounded-lg bg-gray-50 text-gray-500 border border-gray-200">Offline</span>;
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white text-black font-sans">
        <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeStudentsCount = students.filter(s => s.status === 'active').length;
  const submissionsCount = students.filter(s => s.status === 'submitted').length;

  return (
    <div 
      className="h-screen w-screen flex flex-col bg-white text-black font-sans overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
    >
      <style>{`
        .light-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .light-scrollbar::-webkit-scrollbar-track {
          background: transparent !important;
        }
        .light-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1) !important;
          border-radius: 9999px !important;
        }
        .light-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2) !important;
        }
      `}</style>

      {/* Top Header Panel */}
      <div className="h-[72px] border-b border-gray-200 px-6 md:px-10 flex items-center justify-between shrink-0 bg-white shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/staff-dashboard')}
            className="p-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-gray-900 tracking-tight leading-none flex items-center gap-2">
              <Shield className="w-4 h-4 text-black" /> Live Exam Monitor
            </h1>
            <p className="text-gray-500 text-[10px] mt-1">Real-time behavior & security violations feed</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-150 px-2.5 py-1 rounded">
            Quiz Code: {quizId}
          </span>
        </div>
      </div>

      {/* Double-Panel Workspace Layout (Borderless Separation + Transparent Scrollbar) */}
      <div className="flex flex-1 overflow-hidden w-full">
        
        {/* LEFT PANEL: Live Stats Dashboard */}
        <div className="w-[360px] md:w-[400px] shrink-0 bg-[#fbfbfc] p-6 overflow-y-auto light-scrollbar space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                Exam Information
              </div>

              {/* Title & Info */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Assessment</span>
                <h4 className="text-sm font-extrabold text-gray-900 leading-snug">{quizDetails?.title}</h4>
                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Duration: {quizDetails?.durationInMinutes} mins
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-3 pt-4 border-t border-gray-200/60">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                Real-time metrics
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-gray-800">Active Students</span>
                  <span className="text-[9px] text-gray-400 block">Currently answering questions</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 text-green-700 font-extrabold text-sm flex items-center justify-center shadow-sm">
                  {activeStudentsCount}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-gray-800">Submissions Completed</span>
                  <span className="text-[9px] text-gray-400 block">Finished assessment</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-sm flex items-center justify-center shadow-sm">
                  {submissionsCount}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-gray-800">Total Enrolled</span>
                  <span className="text-[9px] text-gray-400 block">Total students entered room</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 text-gray-700 font-extrabold text-sm flex items-center justify-center shadow-sm">
                  {students.length}
                </div>
              </div>
            </div>

          </div>

          {/* Quick Notice widget */}
          <div className="mt-8 bg-white border border-gray-200 rounded-xl p-4 space-y-2 shadow-sm text-xs text-gray-500 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-gray-700 uppercase text-[10px]">
              <Info className="w-3.5 h-3.5 text-gray-400" /> Proctor Security
            </div>
            Students with 4 or more warnings are highlighted. You can manually force-submit any student's quiz attempt using the button on their card.
          </div>

        </div>

        {/* RIGHT PANEL: Live Monitoring Workspace Feed */}
        <div className="flex-1 bg-white p-6 md:p-10 overflow-y-auto light-scrollbar space-y-6">
          
          {/* Status Header */}
          <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2.5 uppercase tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0"></span>
              Live Monitoring Panel
            </h2>
          </div>

          {/* Student monitoring grid */}
          {students.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-16 text-center max-w-xl mx-auto space-y-4">
              <Users className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Waiting for students to join...</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Provide the quiz ID <code className="px-2 py-1 bg-white border border-gray-200 rounded text-gray-700 font-mono font-bold">{quizId}</code> and the OTP passcode to allow students to log in and start the exam.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => {
                const hasViolations = student.warningsCount > 0;
                const isCritical = student.warningsCount >= 4;
                return (
                  <div
                    key={student.studentId}
                    className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-sm ${
                      isCritical 
                        ? 'border-red-300 bg-red-50/10' 
                        : hasViolations 
                        ? 'border-amber-300' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-sm font-extrabold text-gray-900 leading-snug truncate max-w-[150px]">{student.name}</h3>
                          <p className="text-[10px] text-gray-400 font-mono mt-1">ID: {student.studentId.substring(0, 8)}...</p>
                        </div>
                        {getStatusBadge(student.status)}
                      </div>

                      {/* Warnings Meter */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-500">
                          <span>Warnings Logged</span>
                          <span className={isCritical ? 'text-red-700' : 'text-gray-700'}>
                            {student.warningsCount} / 5
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isCritical ? 'bg-red-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${(student.warningsCount / 5) * 100}%` }}
                          />
                        </div>

                        {/* Student Warning Logs */}
                        {student.warnings.length > 0 && (
                          <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 max-h-24 overflow-y-auto space-y-1.5 mt-2 light-scrollbar">
                            {student.warnings.map((w, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-[10px] text-amber-800 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                                <span className="font-mono text-[9px] text-gray-400">{w.timestamp}</span>
                                <span className="leading-snug">{w.type}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {student.status !== 'submitted' && (
                      <button
                        onClick={() => handleForceSubmit(student.studentId, student.name)}
                        className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold border border-red-100 hover:border-red-200 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 mt-2"
                      >
                        <Ban className="w-3.5 h-3.5" /> Force Submit Attempt
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default ExamMonitor;
