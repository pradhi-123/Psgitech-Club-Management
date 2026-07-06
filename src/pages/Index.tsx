import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { GraduationCap, Trophy, Award, Calendar, ChevronRight } from "lucide-react";

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

        {/* Infinite Auto-Scrolling Marquee Slider */}
        <style>{`
          .marquee-container {
            width: 100vw;
            position: relative;
            left: 50%;
            right: 50%;
            margin-left: -50vw;
            margin-right: -50vw;
            overflow: hidden;
            padding: 2rem 0;
          }
          .marquee-inner {
            display: flex;
            width: max-content;
            animation: marquee 25s linear infinite;
          }
          .marquee-inner:hover {
            animation-play-state: paused;
          }
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-card {
            width: 320px;
            margin: 0 1rem;
            flex-shrink: 0;
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.5);
            backdrop-filter: blur(10px);
            border-radius: 1.5rem;
            padding: 1.75rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .marquee-card:hover {
            transform: translateY(-8px) scale(1.02);
            border-color: rgba(59, 130, 246, 0.5);
            box-shadow: 0 20px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.04);
            background: white;
          }
        `}</style>

        <div className="marquee-container mt-4">
          <div className="marquee-inner">
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
            ].concat([
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
            ]).map((item, idx) => (
              <div key={idx} className="marquee-card text-left">
                <div className={`p-3 rounded-2xl w-fit mb-4 bg-gradient-to-tr ${item.bg} border`}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-6 py-6 text-center text-slate-400 text-xs sm:text-sm relative z-10 border-t border-slate-100 mt-8">
        <p>© 2026 PSG Institute of Technology and Applied Research. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
