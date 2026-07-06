import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { GraduationCap, Trophy, Award, Calendar, ChevronRight, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === "admin") {
        navigate("/admin");
      } else if (profile.role === "coordinator") {
        navigate("/coordinator");
      } else if (profile.role === "student") {
        navigate("/student");
      }
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-indigo-100 via-purple-100 to-amber-100">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-secondary animate-spin animate-reverse"></div>
          </div>
          <p className="text-slate-500 text-sm font-semibold tracking-wider uppercase animate-pulse">Entering Campus Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-100 via-indigo-100 via-purple-100 to-amber-100 text-slate-900 relative overflow-hidden flex flex-col justify-between font-sans selection:bg-primary/20 selection:text-primary">
      {/* Background Soft Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/12 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[20%] w-[35%] h-[35%] bg-amber-500/8 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Vibrant Glowing Neon Lights (Floating Orbs) */}
      <div className="absolute top-[25%] left-[-5%] w-[380px] h-[380px] rounded-full bg-cyan-400/20 blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }}></div>
      <div className="absolute bottom-[25%] right-[5%] w-[420px] h-[420px] rounded-full bg-pink-400/20 blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute top-[10%] right-[25%] w-[300px] h-[300px] rounded-full bg-amber-300/25 blur-[110px] pointer-events-none animate-pulse" style={{ animationDuration: '7s' }}></div>

      {/* CSS Twinkling Glitters Keyframes */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8) rotate(0deg); }
          50% { opacity: 0.9; transform: scale(1.2) rotate(15deg); }
        }
        .animate-twinkle-slow {
          animation: twinkle 4s infinite ease-in-out;
        }
        .animate-twinkle-mid {
          animation: twinkle 3s infinite ease-in-out 1s;
        }
        .animate-twinkle-fast {
          animation: twinkle 2.5s infinite ease-in-out 0.5s;
        }
        
        .marquee-container {
          width: 100vw;
          position: relative;
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
          overflow: hidden;
          padding: 1.5rem 0;
        }
        .marquee-inner {
          display: flex;
          width: max-content;
          animation: marquee 32s linear infinite;
        }
        .marquee-inner:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
        .marquee-card {
          width: 310px;
          margin: 0 1.25rem;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(14px);
          border-radius: 1.75rem;
          padding: 1.75rem;
          box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.08), 0 1px 3px rgba(0, 0, 0, 0.01);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .marquee-card:hover {
          transform: translateY(-6px) scale(1.015);
          border-color: rgba(99, 102, 241, 0.3);
          box-shadow: 0 20px 30px -10px rgba(99, 102, 241, 0.15);
          background: rgba(255, 255, 255, 0.9);
        }
      `}</style>

      {/* Floating Sparkly Glitters In Background */}
      <Sparkles className="absolute top-[18%] left-[10%] text-amber-400 w-5 h-5 opacity-40 animate-twinkle-slow pointer-events-none" />
      <Sparkles className="absolute top-[22%] right-[15%] text-indigo-400 w-6 h-6 opacity-35 animate-twinkle-mid pointer-events-none" />
      <Sparkles className="absolute bottom-[35%] left-[8%] text-pink-400 w-4 h-4 opacity-45 animate-twinkle-fast pointer-events-none" />
      <Sparkles className="absolute bottom-[20%] right-[10%] text-cyan-400 w-5 h-5 opacity-40 animate-twinkle-slow pointer-events-none" />
      <Sparkles className="absolute top-[45%] right-[40%] text-amber-500 w-4 h-4 opacity-30 animate-twinkle-mid pointer-events-none" />

      {/* Floating Header */}
      <header className="container mx-auto px-6 mt-4 relative z-10">
        <div className="max-w-6xl mx-auto bg-white/75 border border-white/85 backdrop-blur-md rounded-2xl px-6 py-4 flex justify-between items-center shadow-lg shadow-indigo-100/30">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary p-2 rounded-xl shadow-lg shadow-primary/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-wider bg-gradient-primary bg-clip-text text-transparent">
              PSG iTech Club Zone
            </span>
          </div>
          <Button 
            onClick={() => navigate("/login")}
            className="border-slate-200 bg-white/70 hover:bg-white text-slate-800 transition-all text-xs sm:text-sm font-semibold rounded-xl px-5 py-2 shadow-sm"
            variant="outline"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Main Hero */}
      <main className="container mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center gap-12 relative z-10 text-center">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Mini Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-slate-200 text-primary text-xs font-semibold uppercase tracking-wider shadow-sm backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse shrink-0" />
            <span>Complete Campus Engagement Portal</span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[0.95] text-slate-900">
            Discover. Attend.<br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Earn Rewards.
            </span>
          </h1>

          <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-medium">
            Welcome to the official PSG iTech Club Zone. Connect with clubs, join technical hackathons, manage registrations, track volunteer hours, and secure verified credentials.
          </p>

          <div className="flex justify-center gap-4 pt-2">
            <Button
              size="lg"
              className="bg-gradient-primary hover:opacity-95 text-white font-bold px-10 py-7 rounded-2xl shadow-xl shadow-primary/25 hover:scale-105 transition-all duration-300 text-lg gap-2"
              onClick={() => navigate("/login")}
            >
              Get Started <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Glassmorphic 2x2 Grid of Glowing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full mx-auto mt-8 px-4">
          {[
            {
              title: "Discover Events",
              desc: "Seamlessly search and register for technical workshops, cultural meets, and sports events.",
              icon: <Calendar className="w-6 h-6 text-blue-600 transition-transform duration-300 group-hover:scale-110" />,
              bg: "from-blue-500/10 to-cyan-500/10 border-blue-200",
              hoverGlow: "hover:shadow-[0_20px_40px_rgba(59,130,246,0.18)] hover:border-blue-400/60"
            },
            {
              title: "Achievements Cabinet",
              desc: "Grow your points, unlock exclusive achievement levels, and build your digital credentials shelf.",
              icon: <Trophy className="w-6 h-6 text-amber-500 transition-transform duration-300 group-hover:scale-110" />,
              bg: "from-amber-500/10 to-orange-500/10 border-amber-200",
              hoverGlow: "hover:shadow-[0_20px_40px_rgba(245,158,11,0.18)] hover:border-amber-400/60"
            },
            {
              title: "Volunteer Credits",
              desc: "Serve as a volunteer, earn extra points, and download certified volunteer accolades.",
              icon: <Award className="w-6 h-6 text-purple-600 transition-transform duration-300 group-hover:scale-110" />,
              bg: "from-purple-500/10 to-pink-500/10 border-purple-200",
              hoverGlow: "hover:shadow-[0_20px_40px_rgba(168,85,247,0.18)] hover:border-purple-400/60"
            },
            {
              title: "Verifiable PDFs",
              desc: "Get instant downloads of premium signature-verified landscape certificates for your records.",
              icon: <GraduationCap className="w-6 h-6 text-emerald-600 transition-transform duration-300 group-hover:scale-110" />,
              bg: "from-emerald-500/10 to-teal-500/10 border-emerald-200",
              hoverGlow: "hover:shadow-[0_20px_40px_rgba(16,185,129,0.18)] hover:border-emerald-400/60"
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`group bg-white/70 border border-white/85 backdrop-blur-md rounded-3xl p-8 text-left shadow-[0_4px_20px_rgba(99,102,241,0.03)] hover:-translate-y-2 hover:scale-[1.01] transition-all duration-300 ${item.hoverGlow}`}
            >
              <div className={`p-3 rounded-2xl w-fit mb-5 bg-gradient-to-tr ${item.bg} border`}>
                {item.icon}
              </div>
              <h3 className="font-bold text-xl text-slate-800 mb-2 transition-colors duration-300 group-hover:text-slate-900">{item.title}</h3>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="container mx-auto px-6 py-6 text-center text-slate-400 text-xs sm:text-sm relative z-10 border-t border-slate-200 mt-8">
        <p>© 2026 PSG Institute of Technology and Applied Research. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
