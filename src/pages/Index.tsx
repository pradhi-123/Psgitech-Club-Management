import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { GraduationCap, Trophy, Award, Calendar, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-[#070b19]">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-purple-500 animate-spin animate-reverse"></div>
          </div>
          <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase animate-pulse">Entering Campus Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b19] text-white relative overflow-hidden flex flex-col justify-between font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Background Soft Neon Light Rays */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-blue-600/15 to-purple-600/0 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-purple-600/15 to-pink-600/0 blur-[130px] pointer-events-none"></div>
      <div className="absolute top-[30%] left-[40%] w-[35vw] h-[35vw] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Floating Header */}
      <header className="container mx-auto px-6 mt-4 relative z-10">
        <div className="max-w-6xl mx-auto bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl px-6 py-4 flex justify-between items-center shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 p-2 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
              PSG iTech Club Zone
            </span>
          </div>
          <Button 
            onClick={() => navigate("/login")}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all text-xs sm:text-sm font-semibold rounded-xl px-5 py-2 shadow-inner"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Main Hero */}
      <main className="container mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center gap-12 relative z-10 text-center">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Neon Mini Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-blue-400 text-xs font-semibold uppercase tracking-wider shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Complete Campus Engagement Portal</span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[0.95] text-white">
            Discover. Attend.<br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-500 bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              Earn Rewards.
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-medium">
            Welcome to the official PSG iTech Club Zone. Connect with clubs, join technical hackathons, manage registrations, track volunteer hours, and secure verified credentials.
          </p>

          <div className="flex justify-center gap-4 pt-2">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-bold px-10 py-7 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.35)] hover:scale-105 transition-all duration-300 text-lg gap-2"
              onClick={() => navigate("/login")}
            >
              Get Started <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Amazon-style Deal Rail Carousel */}
        <div className="relative w-full max-w-5xl mx-auto px-4 mt-6 group">
          {/* Left Arrow Button */}
          <button
            onClick={handleScrollLeft}
            className="absolute left-[-10px] sm:left-[-20px] top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/[0.08] backdrop-blur-xl shadow-2xl text-white transition-all hover:scale-110 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 focus:outline-none"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Carousel Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 px-2 no-scrollbar"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* Styles to hide scrollbar in Chrome/Safari */}
            <style>{`
              .no-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {[
              {
                title: "Discover Events",
                desc: "Seamlessly search and register for technical workshops, cultural meets, and sports events.",
                icon: <Calendar className="w-6 h-6 text-blue-400" />,
                bg: "from-blue-500/20 via-blue-500/5 to-transparent border-blue-500/30"
              },
              {
                title: "Achievements Cabinet",
                desc: "Grow your points, unlock exclusive achievement levels, and build your digital credentials shelf.",
                icon: <Trophy className="w-6 h-6 text-amber-400" />,
                bg: "from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/30"
              },
              {
                title: "Volunteer Credits",
                desc: "Serve as a volunteer, earn extra points, and download certified volunteer accolades.",
                icon: <Award className="w-6 h-6 text-purple-400" />,
                bg: "from-purple-500/20 via-purple-500/5 to-transparent border-purple-500/30"
              },
              {
                title: "Verifiable PDFs",
                desc: "Get instant downloads of premium signature-verified landscape certificates for your records.",
                icon: <GraduationCap className="w-6 h-6 text-emerald-400" />,
                bg: "from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/30"
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="w-[280px] sm:w-[320px] shrink-0 snap-start bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_10px_30px_rgba(99,102,241,0.08)] hover:translate-y-[-6px] hover:border-indigo-500/40 transition-all duration-300 text-left relative overflow-hidden"
              >
                {/* Visual Glass Accent Top Line */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${item.bg.replace('from-', 'from-[#ffffff00] via-').replace('via-', 'to-')}`}></div>
                
                <div className={`p-3 rounded-2xl w-fit mb-4 bg-gradient-to-tr ${item.bg} border`}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-lg text-slate-100 mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={handleScrollRight}
            className="absolute right-[-10px] sm:right-[-20px] top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/[0.08] backdrop-blur-xl shadow-2xl text-white transition-all hover:scale-110 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 focus:outline-none"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </main>

      <footer className="container mx-auto px-6 py-6 text-center text-slate-500 text-xs sm:text-sm relative z-10 border-t border-white/[0.04] mt-8">
        <p>© 2026 PSG Institute of Technology and Applied Research. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
