import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { GraduationCap, Trophy, Award, Calendar, ChevronRight, ChevronLeft } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-500 text-lg font-medium">Entering Campus Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-100 via-indigo-100 via-purple-100 to-amber-100 text-slate-900 relative overflow-hidden flex flex-col justify-between">
      {/* Background soft color glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/8 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <header className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-wide bg-gradient-primary bg-clip-text text-transparent">
            PSG iTech Club Zone
          </span>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate("/login")}
          className="border-slate-200 bg-white/70 hover:bg-white transition-all text-xs sm:text-sm text-slate-800 shadow-sm"
        >
          Sign In
        </Button>
      </header>

      <main className="container mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center gap-12 relative z-10 text-center">
        {/* Centered Hero Content */}
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-primary text-xs font-semibold uppercase tracking-wider shadow-sm">
            <span>✨ Complete Campus Engagement Portal</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-tight text-slate-900">
            Discover. Attend.<br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Earn Rewards.
            </span>
          </h1>
          <p className="text-slate-500 text-base sm:text-xl leading-relaxed max-w-2xl mx-auto">
            Welcome to the official PSG iTech Club Zone. Connect with clubs, join technical hackathons, manage registrations, track volunteer hours, and secure verified credentials.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Button
              size="lg"
              className="bg-gradient-primary hover:opacity-95 text-white font-bold px-10 py-7 rounded-2xl shadow-xl shadow-primary/25 hover:scale-105 duration-300 text-lg gap-2"
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
            className="absolute left-[-10px] sm:left-[-20px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/90 hover:bg-white border border-slate-200 shadow-lg text-slate-800 transition-all hover:scale-110 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 focus:outline-none"
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
                icon: <Calendar className="w-6 h-6 text-blue-600" />,
                bg: "from-blue-500/10 to-cyan-500/10 border-blue-200"
              },
              {
                title: "Achievements Cabinet",
                desc: "Grow your points, unlock exclusive achievement levels, and build your digital credentials shelf.",
                icon: <Trophy className="w-6 h-6 text-amber-500" />,
                bg: "from-amber-500/10 to-orange-500/10 border-amber-200"
              },
              {
                title: "Volunteer Credits",
                desc: "Serve as a volunteer, earn extra points, and download certified volunteer accolades.",
                icon: <Award className="w-6 h-6 text-purple-600" />,
                bg: "from-purple-500/10 to-pink-500/10 border-purple-200"
              },
              {
                title: "Verifiable PDFs",
                desc: "Get instant downloads of premium signature-verified landscape certificates for your records.",
                icon: <GraduationCap className="w-6 h-6 text-emerald-600" />,
                bg: "from-emerald-500/10 to-teal-500/10 border-emerald-200"
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="w-[280px] sm:w-[320px] shrink-0 snap-start bg-white/80 border border-slate-200/60 backdrop-blur-md rounded-3xl p-6 shadow-sm hover:shadow-xl hover:translate-y-[-6px] hover:border-blue-300 transition-all duration-300 text-left"
              >
                <div className={`p-3 rounded-2xl w-fit mb-4 bg-gradient-to-tr ${item.bg} border`}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={handleScrollRight}
            className="absolute right-[-10px] sm:right-[-20px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/90 hover:bg-white border border-slate-200 shadow-lg text-slate-800 transition-all hover:scale-110 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 focus:outline-none"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </main>

      <footer className="container mx-auto px-6 py-6 text-center text-slate-400 text-xs sm:text-sm relative z-10 border-t border-slate-100 mt-8">
        <p>© 2026 PSG Institute of Technology and Applied Research. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
