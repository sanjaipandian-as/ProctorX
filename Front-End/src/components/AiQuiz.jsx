import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Loader2, Zap, FileText, ChevronRight,
  BookOpen, Code2, AlignLeft, Sliders, Check, ArrowLeft,
  Save, Cpu, Trash2, FileUp, AlertCircle, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import AiQuizEditor from "./AiQuizEditor";

// ---------------------------------------------------------------------------
// Step indicator (Minimalist Black & White Line & Dots)
// ---------------------------------------------------------------------------
const STEPS = ["Configure", "Generating", "Review & Edit", "Save Quiz"];

function StepBar({ current }) {
  return (
    <div className="flex items-center justify-between w-full max-w-xl mx-auto mb-12 px-4">
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2
                ${done ? "bg-black border-black text-white"
                  : active ? "bg-white border-black text-black shadow-sm"
                  : "bg-white border-gray-250 border-gray-200 text-gray-400"}`}>
                {done ? <Check size={14} /> : stepNum}
              </div>
              <span className={`text-[9px] font-bold mt-2 uppercase tracking-widest absolute -bottom-6 whitespace-nowrap transition-colors
                ${active ? "text-black" : done ? "text-gray-600" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-[2px] flex-1 mx-2 transition-colors duration-300 ${done ? "bg-black" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Configure
// ---------------------------------------------------------------------------
function StepConfigure({ onGenerate }) {
  const [prompt, setPrompt] = useState("");
  const [numMcq, setNumMcq] = useState(5);
  const [numDescriptive, setNumDescriptive] = useState(2);
  const [numCoding, setNumCoding] = useState(1);
  const [difficulty, setDifficulty] = useState("Medium");
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const fetchDocs = async () => {
      setLoadingDocs(true);
      try {
        const res = await api.get("/api/ai/documents");
        setDocuments(res.data.documents || []);
      } catch {
        // Silent catch
      } finally {
        setLoadingDocs(false);
      }
    };
    fetchDocs();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Restrict file formats to PDF, DOC, DOCX. Reject zip or others.
    const allowedExtensions = /\.(pdf|doc|docx)$/i;
    if (!allowedExtensions.test(file.name)) {
      toast.error("Only PDF, DOC, and DOCX files are allowed");
      return;
    }
    if (documents.length >= 10) {
      toast.error("Upload limit reached. Maximum 10 documents allowed.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/api/ai/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const newDoc = { documentId: res.data.documentId, filename: file.name, chunksCount: res.data.chunksCount };
      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedDoc(newDoc);
      toast.success(`Uploaded successfully`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const deleteDoc = async (doc) => {
    try {
      await api.delete(`/api/ai/documents/${doc.documentId}`);
      setDocuments((prev) => prev.filter((d) => d.documentId !== doc.documentId));
      if (selectedDoc?.documentId === doc.documentId) setSelectedDoc(null);
      toast.success("Document removed");
    } catch {
      toast.error("Failed to remove document");
    }
  };

  const totalQ = numMcq + numDescriptive + numCoding;
  const canGenerate = prompt.trim().length >= 10 && totalQ > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canGenerate) return;
    onGenerate({ prompt: prompt.trim(), numMcq, numDescriptive, numCoding, difficulty, documentId: selectedDoc?.documentId || null });
  };

  const examplePrompts = [
    "JavaScript Promises & Async/Await",
    "Binary Search Trees & Traversal",
    "Python Decorators",
    "SQL Joins & Transactions"
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Prompt Card */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Topic / Objective</label>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g. Generate a quiz on React Hooks including useState, useEffect, and custom hooks..."
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-xs resize-none focus:outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all"
            rows={3}
            maxLength={1000}
          />
          <span className={`absolute bottom-3 right-4 text-[9px] font-bold ${prompt.length > 900 ? "text-red-500" : "text-gray-400"}`}>
            {prompt.length}/1000
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3.5">
          {examplePrompts.map((p, i) => (
            <button key={i} onClick={() => setPrompt(`Generate a quiz on ${p}`)} className="text-[10px] font-bold px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full hover:border-black hover:text-black transition-colors">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Counts + Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Counts */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Sliders size={12} /> Question Distribution</span>
            <span className="text-[10px] font-bold text-gray-400">{totalQ} Total</span>
          </div>

          {[
            { label: "MCQ", icon: <BookOpen size={11} />, val: numMcq, set: setNumMcq, max: 20 },
            { label: "Descriptive", icon: <AlignLeft size={11} />, val: numDescriptive, set: setNumDescriptive, max: 10 },
            { label: "Coding", icon: <Code2 size={11} />, val: numCoding, set: setNumCoding, max: 5 },
          ].map(({ label, icon, val, set, max }) => (
            <div key={label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <div className="flex items-center gap-2 text-gray-500">{icon} {label}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => set(Math.max(0, val - 1))} className="w-6 h-6 rounded-md bg-gray-50 border border-gray-200 text-gray-600 font-extrabold flex items-center justify-center hover:bg-gray-100">-</button>
                  <span className="text-xs font-black w-4 text-center text-gray-900">{val}</span>
                  <button onClick={() => set(Math.min(max, val + 1))} className="w-6 h-6 rounded-md bg-gray-50 border border-gray-200 text-gray-600 font-extrabold flex items-center justify-center hover:bg-gray-100">+</button>
                </div>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-black rounded-full transition-all" style={{ width: `${(val / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Difficulty */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2"><Cpu size={12} /> Target Complexity</div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {["Easy", "Medium", "Hard"].map((d) => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`py-3.5 rounded-xl border text-xs font-bold transition-all ${difficulty === d
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300 hover:text-gray-700"}`}>
                {d}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-gray-400 font-medium leading-normal mt-4">Selected complexity defines coding test case depth and distractor logic.</div>
        </div>
      </div>

      {/* RAG Card */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><FileText size={12} /> Study Material (PDF)</span>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || documents.length >= 10}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 shadow-sm"
          >
            {uploading ? <Loader2 size={10} className="animate-spin" /> : <FileUp size={10} />}
            {uploading ? "Indexing..." : "Upload Document"}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUpload} />
        </div>

        {loadingDocs ? (
          <div className="text-center py-4 text-gray-400 text-xs">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            No source documents uploaded.
          </div>
        ) : (
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1 light-scrollbar">
            {documents.map((doc) => (
              <div key={doc.documentId}
                onClick={() => setSelectedDoc(selectedDoc?.documentId === doc.documentId ? null : doc)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedDoc?.documentId === doc.documentId ? "border-black bg-gray-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                <FileText size={14} className={selectedDoc?.documentId === doc.documentId ? "text-black" : "text-gray-400"} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${selectedDoc?.documentId === doc.documentId ? "text-black" : "text-gray-600"}`}>{doc.filename}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteDoc(doc); }}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-100 transition-all">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action */}
      <button
        onClick={handleSubmit}
        disabled={!canGenerate}
        className="w-full py-4 bg-black hover:bg-gray-900 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-sm disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Zap size={14} className="fill-current" />
        Generate {totalQ > 0 ? `${totalQ} Question Quiz` : ""}
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Generating
// ---------------------------------------------------------------------------
function StepGenerating() {
  const stages = ["Analyzing topic details...", "Formulating questions...", "Grounding context...", "Removing duplicate questions...", "Generating language templates..."];
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStageIdx((p) => Math.min(p + 1, stages.length - 1)), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 space-y-6">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-gray-100 border-t-black animate-spin" />
        <Sparkles className="absolute w-5 h-5 text-black" />
      </div>
      <div className="text-center space-y-2">
        <AnimatePresence mode="wait">
          <motion.p key={stageIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="text-gray-800 font-bold text-sm">
            {stages[stageIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black">NVIDIA NIM · Llama 3.1 8B</p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Review — Extra Questions Generator (Sidebar)
// ---------------------------------------------------------------------------
function ExtraQuestionsGenerator({ documentId, onAppend }) {
  const [prompt, setPrompt] = useState("");
  const [numMcq, setNumMcq] = useState(0);
  const [numDescriptive, setNumDescriptive] = useState(0);
  const [numCoding, setNumCoding] = useState(0);
  const [generating, setGenerating] = useState(false);

  const handleGenerateExtra = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a topic or instructions for the extra questions");
      return;
    }
    if (numMcq === 0 && numDescriptive === 0 && numCoding === 0) {
      toast.error("Please select at least 1 question to generate");
      return;
    }

    setGenerating(true);
    try {
      const res = await api.post("/api/ai/generate-quiz", {
        prompt: prompt.trim(),
        numMcq,
        numDescriptive,
        numCoding,
        difficulty: "Medium",
        documentId: documentId || null
      }, {
        timeout: 180000 // 3 minutes timeout to handle LLM generation time
      });

      const parsed = res.data.parsed;
      if (!parsed?.questions?.length) {
        toast.error("AI did not generate any extra questions. Try refining the prompt.");
        return;
      }

      const normalized = parsed.questions.map((q) => ({
        questionText: q.questionText || "",
        questionType: q.questionType || "mcq",
        options: q.options || (q.questionType === "mcq" ? ["", "", "", ""] : null),
        correctAns: q.correctAns !== undefined ? q.correctAns : 0,
        descriptiveAnswer: q.descriptiveAnswer || null,
        testcases: q.testcases || null,
        starterCode: q.starterCode || null,
        marks: q.marks || 1,
      }));

      onAppend(normalized);
      setPrompt("");
      setNumMcq(0);
      setNumDescriptive(0);
      setNumCoding(0);
      toast.success(`Successfully appended ${normalized.length} extra questions!`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to generate extra questions");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-450 uppercase tracking-widest block">Instructions / Topic</label>
        <textarea
          placeholder="E.g. Add 2 more coding questions about BST search operations..."
          className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 resize-none focus:outline-none focus:border-black font-semibold leading-relaxed"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-gray-50 border border-gray-200 rounded-xl">
          <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">MCQ</label>
          <div className="flex items-center justify-between px-1">
            <button onClick={() => setNumMcq(m => Math.max(0, m - 1))} className="text-xs font-black text-gray-400 hover:text-black">-</button>
            <span className="text-xs font-black text-gray-800">{numMcq}</span>
            <button onClick={() => setNumMcq(m => m + 1)} className="text-xs font-black text-gray-400 hover:text-black">+</button>
          </div>
        </div>

        <div className="text-center p-2 bg-gray-50 border border-gray-200 rounded-xl">
          <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Desc</label>
          <div className="flex items-center justify-between px-1">
            <button onClick={() => setNumDescriptive(d => Math.max(0, d - 1))} className="text-xs font-black text-gray-400 hover:text-black">-</button>
            <span className="text-xs font-black text-gray-800">{numDescriptive}</span>
            <button onClick={() => setNumDescriptive(d => d + 1)} className="text-xs font-black text-gray-400 hover:text-black">+</button>
          </div>
        </div>

        <div className="text-center p-2 bg-gray-50 border border-gray-200 rounded-xl">
          <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Coding</label>
          <div className="flex items-center justify-between px-1">
            <button onClick={() => setNumCoding(c => Math.max(0, c - 1))} className="text-xs font-black text-gray-400 hover:text-black">-</button>
            <span className="text-xs font-black text-gray-800">{numCoding}</span>
            <button onClick={() => setNumCoding(c => c + 1)} className="text-xs font-black text-gray-400 hover:text-black">+</button>
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerateExtra}
        disabled={generating}
        className="w-full flex items-center justify-center gap-1.5 py-3 bg-black hover:bg-gray-900 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50 shadow-sm"
      >
        {generating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        {generating ? "Compiling..." : "Generate & Append"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Review
// ---------------------------------------------------------------------------
function StepReview({ questions, metadata, sourceChunks, onChange, onBack, onNext, documentId }) {
  const [showAiDrawer, setShowAiDrawer] = useState(false);

  const mcqCount = questions.filter((q) => q.questionType === "mcq").length;
  const descCount = questions.filter((q) => q.questionType === "descriptive").length;
  const codingCount = questions.filter((q) => q.questionType === "coding").length;
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <h2 className="text-base font-black text-gray-900">{metadata?.subject || "AI Generated Quiz"}</h2>
            <p className="text-xs text-gray-505 mt-1">Complexity: <span className="font-bold text-black">{metadata?.difficulty || "—"}</span></p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex gap-4">
              <div className="text-center"><p className="text-base font-black text-gray-900">{mcqCount}</p><p className="text-[9px] font-bold text-gray-400 uppercase">MCQ</p></div>
              <div className="text-center"><p className="text-base font-black text-gray-900">{descCount}</p><p className="text-[9px] font-bold text-gray-400 uppercase">Desc</p></div>
              <div className="text-center"><p className="text-base font-black text-gray-900">{codingCount}</p><p className="text-[9px] font-bold text-gray-400 uppercase">Code</p></div>
              <div className="text-center"><p className="text-base font-black text-gray-900">{totalMarks}</p><p className="text-[9px] font-bold text-gray-400 uppercase">Points</p></div>
            </div>
            <button
              onClick={() => setShowAiDrawer(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider shadow-sm transition-all"
            >
              <Sparkles size={11} /> Generate Extra
            </button>
          </div>
        </div>
        {sourceChunks?.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-700 font-bold bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
            <Check size={10} className="text-black" /> Context grounding validated
          </div>
        )}
      </div>

      <div className="w-full">
        <AiQuizEditor questions={questions} onChange={onChange} documentId={documentId} />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black transition-colors">
          <ArrowLeft size={12} /> Configure
        </button>
        <button
          onClick={onNext}
          disabled={questions.length === 0}
          className="flex items-center gap-1.5 px-5 py-3 bg-black hover:bg-gray-900 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-20"
        >
          Looks Good <ChevronRight size={12} />
        </button>
      </div>

      {/* AI Slide-over Panel (Drawer) */}
      <AnimatePresence>
        {showAiDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAiDrawer(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40"
            />
            
            {/* Drawer Body */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white border-l border-gray-200 shadow-2xl z-50 overflow-y-auto p-6 space-y-6 flex flex-col"
            >
              <div className="space-y-6 flex-1">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-150 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">AI Extra Generator</h3>
                      <p className="text-[9px] text-gray-400 font-bold mt-0.5">Generate and append questions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAiDrawer(false)}
                    className="text-[9px] font-extrabold text-gray-400 hover:text-black uppercase tracking-widest transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200"
                  >
                    Close
                  </button>
                </div>

                {/* Content */}
                <div className="pt-2">
                  <ExtraQuestionsGenerator
                    documentId={documentId}
                    onAppend={(newQs) => {
                      onChange([...questions, ...newQs]);
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Save
// ---------------------------------------------------------------------------
function StepSave({ questions, metadata, aiMeta, onBack, onSaved }) {
  const [title, setTitle] = useState(metadata?.subject || "AI Generated Quiz");
  const [duration, setDuration] = useState(60);
  const [saving, setSaving] = useState(false);

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  const handleSave = async () => {
    if (!title.trim() || duration < 1) {
      toast.error("Please fill in all fields");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        durationInMinutes: parseInt(duration, 10),
        questions: questions.map((q) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options || null,
          correctAns: q.correctAns !== undefined ? q.correctAns : null,
          descriptiveAnswer: q.descriptiveAnswer || null,
          testcases: q.testcases || null,
          starterCode: q.starterCode || null,
          marks: q.marks || 1,
        })),
        aiModel: aiMeta?.model || null,
        aiPromptVersion: aiMeta?.promptVersion || null,
        documentId: aiMeta?.documentId || null,
      };

      const res = await api.post("/api/ai/save-quiz", payload);
      toast.success(`Quiz saved successfully`);
      onSaved(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-md mx-auto">
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-5">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Quiz Title</label>
          <input
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter quiz title..."
            maxLength={200}
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Duration: {duration} mins</label>
          <div className="flex items-center gap-4">
            <input type="range" min={5} max={360} step={5} value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="flex-1 accent-black"
            />
          </div>
          <div className="flex justify-between text-[9px] text-gray-400 mt-1.5 font-bold">
            <span>5m</span><span>60m</span><span>120m</span><span>360m</span>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2 text-xs text-gray-600">
          <div className="flex justify-between"><span>Questions</span><span className="font-bold text-gray-900">{questions.length}</span></div>
          <div className="flex justify-between"><span>Total Points</span><span className="font-bold text-gray-900">{totalMarks}</span></div>
          <div className="flex justify-between"><span>Generator Model</span><span className="font-bold text-gray-900 font-mono text-[10px]">{aiMeta?.model?.split("/").pop()}</span></div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black transition-colors">
          <ArrowLeft size={12} /> Edit Questions
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-900 text-white rounded-xl font-bold text-xs shadow-sm transition-all disabled:opacity-20 flex-shrink-0"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? "Saving..." : "Save Draft"}
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Root AiQuiz
// ---------------------------------------------------------------------------
export default function AiQuiz() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [step, setStep] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [sourceChunks, setSourceChunks] = useState([]);
  const [aiMeta, setAiMeta] = useState(null);

  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [hasCheckedDraft, setHasCheckedDraft] = useState(false);

  // Check for unsaved cached draft on mount
  useEffect(() => {
    if (!user || user.role !== "teacher" || hasCheckedDraft) return;

    const checkDraft = async () => {
      try {
        const res = await api.get("/api/ai/draft");
        if (res.data) {
          setPendingDraft(res.data);
          setShowRestorePrompt(true);
        }
      } catch (err) {
        console.error("Failed to check for draft:", err);
      } finally {
        setHasCheckedDraft(true);
      }
    };

    checkDraft();
  }, [user, hasCheckedDraft]);

  // Debounced auto-save effect
  useEffect(() => {
    // Only auto-save if we are on Step 3 or 4 and have questions
    if (step < 3 || questions.length === 0) return;

    const timer = setTimeout(async () => {
      try {
        await api.post("/api/ai/draft", {
          questions,
          metadata,
          sourceChunks,
          aiMeta
        });
      } catch (err) {
        console.error("Auto-save draft failed:", err);
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [questions, metadata, sourceChunks, aiMeta, step]);

  if (!user || user.role !== "teacher") {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 text-sm">
        Unauthorized access. Teacher accounts only.
      </div>
    );
  }

  const handleRestoreDraft = () => {
    if (!pendingDraft) return;
    setQuestions(pendingDraft.questions || []);
    setMetadata(pendingDraft.metadata || null);
    setSourceChunks(pendingDraft.sourceChunks || []);
    setAiMeta(pendingDraft.aiMeta || null);
    setStep(3); // Direct transition to Review & Edit step
    setShowRestorePrompt(false);
    toast.success("Quiz draft restored successfully!");
  };

  const handleDiscardDraft = async () => {
    try {
      await api.delete("/api/ai/draft");
    } catch (err) {
      console.error("Failed to delete draft:", err);
    } finally {
      setShowRestorePrompt(false);
      setPendingDraft(null);
      toast.success("Draft discarded.");
    }
  };

  const handleGenerate = async ({ prompt, numMcq, numDescriptive, numCoding, difficulty, documentId }) => {
    setStep(2);
    try {
      const res = await api.post("/api/ai/generate-quiz", {
        prompt, numMcq, numDescriptive, numCoding, difficulty, documentId
      }, {
        timeout: 180000 // 3 minutes timeout to prevent frontend timeout aborts during heavy LLM queues
      });

      const parsed = res.data.parsed;
      if (!parsed?.questions?.length) {
        toast.error("Generation returned empty results");
        setStep(1);
        return;
      }

      const normalized = parsed.questions.map((q) => ({
        questionText: q.questionText || "",
        questionType: q.questionType || "mcq",
        options: q.options || (q.questionType === "mcq" ? ["", "", "", ""] : null),
        correctAns: q.correctAns !== undefined ? q.correctAns : 0,
        descriptiveAnswer: q.descriptiveAnswer || null,
        testcases: q.testcases || null,
        starterCode: q.starterCode || null,
        marks: q.marks || 1,
      }));

      setQuestions(normalized);
      setMetadata({ subject: parsed.subject, difficulty: parsed.difficulty });
      setSourceChunks(res.data.sourceChunks || []);
      setAiMeta({ model: res.data.model, promptVersion: res.data.promptVersion, documentId });
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Quiz generation failed or timed out");
      setStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black py-16 px-8">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-[9px] font-extrabold uppercase tracking-widest border border-gray-200">
            <Sparkles className="w-3 h-3 text-black" /> AI Quiz Generator
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">
            {step === 1 && "Configure Your Quiz"}
            {step === 2 && "Compiling Quiz..."}
            {step === 3 && "Review Draft Questions"}
            {step === 4 && "Save Draft Quiz"}
          </h1>
          <p className="text-gray-650 text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
            {step === 1 && "Define topics, question types, and target complexity. Optionally upload study materials (PDF, DOC, DOCX) for grounded generation."}
            {step === 2 && "Building test cases, calculating correct responses, and writing starter templates."}
            {step === 3 && "Review draft questions. Edit, add manual entries, or adjust individual marks."}
            {step === 4 && "Set title and duration parameters to save draft to your dashboard."}
          </p>
        </div>

        <StepBar current={step} />

        <div className="pt-2">
          <AnimatePresence mode="wait">
            {step === 1 && <StepConfigure key="configure" onGenerate={handleGenerate} />}
            {step === 2 && <StepGenerating key="generating" />}
            {step === 3 && (
              <StepReview
                key="review"
                questions={questions}
                metadata={metadata}
                sourceChunks={sourceChunks}
                onChange={setQuestions}
                onBack={() => setStep(1)}
                onNext={() => setStep(4)}
                documentId={aiMeta?.documentId || null}
              />
            )}
            {step === 4 && (
              <StepSave
                key="save"
                questions={questions}
                metadata={metadata}
                aiMeta={aiMeta}
                onBack={() => setStep(3)}
                onSaved={() => navigate("/staff-dashboard")}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Restore Draft Confirmation Modal */}
      <AnimatePresence>
        {showRestorePrompt && pendingDraft && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-gray-900">Restore Unsaved Quiz?</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    We found an unsaved AI-generated quiz draft for <span className="font-bold text-black">"{pendingDraft.metadata?.subject || "AI Generated Quiz"}"</span>. Would you like to restore it and continue review?
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleDiscardDraft}
                  className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-black transition-colors"
                >
                  Discard Draft
                </button>
                <button
                  onClick={handleRestoreDraft}
                  className="px-5 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
                >
                  Restore Draft
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


