"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Send, GraduationCap, Loader2, Lightbulb, ClipboardCheck, 
  Zap, HelpCircle, Plus, Trash2, ChevronDown, Sparkles, 
  Globe, CheckCircle2, XCircle, UserCircle, ShieldCheck 
} from "lucide-react";

// --- TYPEWRITER COMPONENT ---
// This handles the "ChatGPT style" text streaming
const Typewriter = ({ text, speed = 15, onComplete }: { text: string, speed?: number, onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayedText("");
    indexRef.current = 0;
    
    const intervalId = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText((prev) => prev + text.charAt(indexRef.current));
        indexRef.current++;
      } else {
        clearInterval(intervalId);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed, onComplete]);

  return <div className="whitespace-pre-wrap">{displayedText}</div>;
};

interface ChatSession {
  id: number;
  title: string;
  subject: string;
  question: string;
  answer: string;
  timestamp: string;
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [subject, setSubject] = useState("general");
  const [grade, setGrade] = useState("high");
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState("ask");
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [userLocation, setUserLocation] = useState("Locating...");
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);

  // Quiz State
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizFeedback, setQuizFeedback] = useState<{correct: boolean, explanation: string} | null>(null);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem("tutor_history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedGrade = localStorage.getItem("tutor_grade");
    if (savedGrade) {
      setGrade(savedGrade);
      setShowGradeModal(false);
    } else {
      setShowGradeModal(true);
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`);
          const data = await res.json();
          setUserLocation(data.countryName || "Global");
        } catch { setUserLocation("Earth"); }
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("tutor_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + "px";
    }
  }, [question]);

  const selectGrade = (selectedGrade: string) => {
    setGrade(selectedGrade);
    localStorage.setItem("tutor_grade", selectedGrade);
    setShowGradeModal(false);
  };

  const modes = [
    { id: "ask", label: "General", icon: <HelpCircle size={14} />, color: "from-blue-600 to-cyan-400", prefix: "" },
    { id: "quick", label: "Synopsis", icon: <Zap size={14} />, color: "from-orange-500 to-yellow-400", prefix: "Summarize: " },
    { id: "study", label: "Study", icon: <Lightbulb size={14} />, color: "from-purple-600 to-fuchsia-400", prefix: "Detailed study guide for: " },
    { id: "quiz", label: "Quiz", icon: <ClipboardCheck size={14} />, color: "from-emerald-500 to-teal-300", prefix: "Quiz me on: " },
  ];

  const subjects = [
    { id: "general", label: "GENERAL" }, { id: "math", label: "MATH" }, 
    { id: "science", label: "SCIENCE" }, { id: "english", label: "ENGLISH" }
  ];

  const grades = [
    { id: "elementary", label: "Elementary (K-5)", desc: "Simple & Fun" }, 
    { id: "middle", label: "Middle School (6-8)", desc: "Clear & Concise" }, 
    { id: "high", label: "High School (9-12)", desc: "Academic Prep" }, 
    { id: "uni", label: "University", desc: "Expert Depth" }
  ];

  const askAI = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    setQuizMode(false);
    setQuizFeedback(null);
    const currentMode = modes.find(m => m.id === activeMode);

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: `${currentMode?.prefix}${question}`, 
          subject: subject,
          grade: grade,
          location: userLocation 
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // We set answer immediately, but the Typewriter component will handle the visual streaming
        setAnswer(data.answer);
        
        const newSession: ChatSession = {
          id: Date.now(),
          title: question.slice(0, 30) + (question.length > 30 ? "..." : ""),
          subject: activeMode,
          question: question,
          answer: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setHistory(prev => [newSession, ...prev]);

        if (activeMode === "quiz" && data.answer.includes("Q:")) {
            parseQuiz(data.answer);
        }
      }
    } catch (err) {
      setAnswer("LINK FAILURE: Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const parseQuiz = (text: string) => {
    // We expect the backend to give us a clean format, but regex helps be safe
    const qBlocks = text.split(/Q:/g).filter(b => b.trim().length > 10);
    const formatted = qBlocks.map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      
      // Extract explanation after the "|||" or "Explanation:" tag
      let explanation = "No explanation provided.";
      if (block.includes("|||")) {
        explanation = block.split("|||")[1].replace("Explanation:", "").trim();
      } else if (block.includes("Explanation:")) {
        explanation = block.split("Explanation:")[1].trim();
      }

      return {
        question: lines[0],
        options: lines.filter(l => l.match(/^[A-D][\)\.]/)),
        correct: block.split("Correct:")[1]?.trim()[0].toUpperCase(),
        explanation: explanation
      };
    });
    
    if (formatted.length > 0) {
      setQuizQuestions(formatted);
      setCurrentQuizIndex(0);
      setQuizMode(true);
    }
  };

  const handleQuizAnswer = (letter: string) => {
    const current = quizQuestions[currentQuizIndex];
    // Set feedback state, which triggers the explanation Typewriter in the UI
    setQuizFeedback({ 
      correct: letter === current.correct, 
      explanation: current.explanation 
    });
  };

  return (
    <div className="flex h-screen bg-[#010205] text-slate-100 overflow-hidden font-sans">
      
      {/* STARTUP MODAL */}
      {showGradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
           <div className="bg-[#0a0f1a] border border-cyan-500/30 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_50px_rgba(6,182,212,0.15)]">
              <div className="mx-auto bg-cyan-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck size={32} className="text-cyan-400" />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter text-white mb-2">SYSTEM CALIBRATION</h2>
              <p className="text-slate-400 text-xs mb-8">Select your academic level to optimize neural response complexity.</p>
              <div className="grid grid-cols-1 gap-3">
                {grades.map((g) => (
                  <button key={g.id} onClick={() => selectGrade(g.id)} className="flex items-center justify-between px-6 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all group">
                    <span className="font-bold text-sm tracking-wide text-white group-hover:text-cyan-400">{g.label}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">{g.desc}</span>
                  </button>
                ))}
              </div>
           </div>
        </div>
      )}

      {/* SIDEBAR (Same as before) */}
      <aside className="w-72 bg-black/60 border-r border-white/5 backdrop-blur-2xl flex flex-col z-20">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-cyan-500 p-2 rounded-lg"><GraduationCap size={20} className="text-black" /></div>
            <h2 className="font-black tracking-tighter text-xl italic underline decoration-cyan-500/30">TUTORME.AI</h2>
          </div>
          <button onClick={() => { setQuestion(""); setAnswer(""); setQuizMode(false); }} className="w-full flex items-center gap-2 justify-center py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest">
            <Plus size={16} /> New Session
          </button>
        </div>
        <div className="flex-grow overflow-y-auto px-4 space-y-2 custom-scrollbar">
          {history.map((item) => (
            <div key={item.id} className="group relative">
              <button onClick={() => { setQuestion(item.question); setAnswer(item.answer); setActiveMode(item.subject); setQuizMode(false); }} className="w-full flex flex-col p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all text-left">
                <span className="text-[11px] font-bold text-slate-300 truncate w-[90%]">{item.title}</span>
                <span className="text-[8px] text-cyan-500/50 uppercase mt-1 font-black">{item.subject} • {item.timestamp}</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setHistory(history.filter(h => h.id !== item.id)); }} className="absolute right-2 top-4 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-500"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow flex flex-col relative h-full">
        <div className="h-14 flex items-center justify-between px-8 border-b border-white/5 bg-black/20 backdrop-blur-sm z-30">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-emerald-500/80 text-[10px] font-black tracking-widest uppercase"><Globe size={12} /> {userLocation}</div>
              <div className="h-4 w-px bg-white/10" />
              <div className="relative">
                <button onClick={() => setIsSubjectOpen(!isSubjectOpen)} className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-slate-300">
                  {subjects.find(s => s.id === subject)?.label} <ChevronDown size={12} />
                </button>
                {isSubjectOpen && (
                  <div className="absolute top-full left-0 mt-2 w-32 bg-[#0a0f1a] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
                    {subjects.map(s => (<button key={s.id} onClick={() => { setSubject(s.id); setIsSubjectOpen(false); }} className="w-full text-left px-4 py-3 text-[10px] font-bold hover:bg-cyan-500/10 hover:text-cyan-400">{s.label}</button>))}
                  </div>
                )}
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="relative">
                <button onClick={() => setIsGradeOpen(!isGradeOpen)} className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-cyan-400">
                  <UserCircle size={14} /> {grades.find(g => g.id === grade)?.label.split(" (")[0]} <ChevronDown size={12} />
                </button>
                {isGradeOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[#0a0f1a] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
                    {grades.map(g => (<button key={g.id} onClick={() => { setGrade(g.id); setIsGradeOpen(false); }} className="w-full text-left px-4 py-3 text-[10px] font-bold hover:bg-white/5">{g.label}</button>))}
                  </div>
                )}
              </div>
           </div>
        </div>

        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar relative z-0">
          <div className="max-w-3xl mx-auto pt-10 pb-40">
            {quizMode ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-10 shadow-2xl animate-in zoom-in-95">
                <div className="mb-6 text-emerald-400 font-black text-[10px] uppercase tracking-widest">Question {currentQuizIndex + 1} of {quizQuestions.length}</div>
                
                {/* 1. THE QUESTION */}
                <h2 className="text-2xl font-light mb-8 text-white">{quizQuestions[currentQuizIndex].question}</h2>
                
                {/* 2. THE OPTIONS */}
                <div className="grid grid-cols-1 gap-3 mb-8">
                  {quizQuestions[currentQuizIndex].options.map((opt: string) => {
                    const letter = opt[0].toUpperCase();
                    const isSelected = quizFeedback !== null; // Freeze buttons if already answered
                    const isCorrect = letter === quizQuestions[currentQuizIndex].correct;
                    const isUserChoice = true; // Simplified for visual logic
                    
                    return (
                      <button key={letter} disabled={isSelected} onClick={() => handleQuizAnswer(letter)} className={`text-left p-4 rounded-xl border transition-all ${isSelected ? isCorrect ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-white/5 border-white/10 opacity-30" : "bg-white/5 border-white/10 hover:border-cyan-500/50 hover:bg-white/10"}`}>{opt}</button>
                    );
                  })}
                </div>

                {/* 3. THE FEEDBACK (TYPES OUT) */}
                {quizFeedback && (
                  <div className="animate-in fade-in slide-in-from-top-4 border-t border-white/10 pt-6">
                    <div className={`flex items-center gap-2 mb-2 font-bold ${quizFeedback.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                      {quizFeedback.correct ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}
                      {quizFeedback.correct ? "Correct!" : "Incorrect"}
                    </div>
                    
                    {/* HERE IS THE TYPEWRITER FOR QUIZ EXPLANATION */}
                    <div className="text-slate-300 text-lg italic leading-relaxed mb-6">
                       <Typewriter text={quizFeedback.explanation} speed={20} />
                    </div>

                    <button onClick={() => { if (currentQuizIndex < quizQuestions.length - 1) { setCurrentQuizIndex(prev => prev + 1); setQuizFeedback(null); } else { setQuizMode(false); setAnswer("Module Complete."); } }} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold uppercase tracking-widest">
                      {currentQuizIndex < quizQuestions.length - 1 ? "Next Question" : "Finish Quiz"}
                    </button>
                  </div>
                )}
              </div>
            ) : answer ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-10 text-slate-200 leading-relaxed text-xl font-light italic shadow-2xl">
                <div className="mb-6 flex items-center gap-2 text-cyan-500 font-black text-[10px] uppercase tracking-[0.3em]"><Sparkles size={14} /> Output Decoded</div>
                {/* HERE IS THE TYPEWRITER FOR NORMAL ANSWERS */}
                <Typewriter text={answer} speed={10} />
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center opacity-10 text-center">
                <GraduationCap size={80} className="mb-4" />
                <h1 className="text-4xl font-black italic tracking-tighter">Awaiting Input...</h1>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-[#010205] via-[#010205] to-transparent z-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center gap-2 mb-4">
              {modes.map((mode) => (
                <button key={mode.id} onClick={() => setActiveMode(mode.id)} className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all text-[9px] font-black tracking-widest uppercase ${activeMode === mode.id ? `bg-gradient-to-r ${mode.color} text-white border-transparent` : "bg-black/40 border-white/10 text-slate-500 hover:border-white/30"}`}>{mode.icon} {mode.label}</button>
              ))}
            </div>
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-2 relative shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
              <textarea ref={textAreaRef} rows={1} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Enter instruction..." className="w-full bg-transparent border-none outline-none p-4 pr-16 text-white text-lg font-light resize-none max-h-48 overflow-y-auto" />
              <button onClick={askAI} disabled={loading || !question.trim()} className="absolute bottom-3 right-3 p-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-10 rounded-xl transition-all shadow-lg">
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}