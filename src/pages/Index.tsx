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

      <main className="container mx-auto px-6 py-12 flex-1 flex flex-col md:flex-row items-center justify-center gap-12 relative z-10">
        {/* Left column: Hero Title */}
        <div className="flex-1 space-y-6 text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-primary text-xs font-semibold uppercase tracking-wider shadow-sm">
            <span>✨ Complete Campus Engagement Portal</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-slate-900">
            Discover. Attend.<br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Earn Rewards.
            </span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg leading-relaxed">
            Welcome to the official PSG iTech Club Zone. Connect with clubs, join technical hackathons, manage registrations, track volunteer hours, and secure verified credentials.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 pt-2">
            <Button
              size="lg"
              className="bg-gradient-primary hover:opacity-95 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-primary/25 hover:scale-105 duration-300 w-full sm:w-auto text-base gap-2"
              onClick={() => navigate("/login")}
            >
              Get Started <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Right column: Highlights Grid (3D Flash Cards) */}
        <style>{`
          .flashcard-container {
            perspective: 1000px;
            height: 190px;
          }
          .flashcard-inner {
            position: relative;
            width: 100%;
            height: 100%;
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            transform-style: preserve-3d;
            cursor: pointer;
          }
          .flashcard-container:hover .flashcard-inner {
            transform: rotateY(180deg);
          }
          .flashcard-front, .flashcard-back {
            position: absolute;
            width: 100%;
            height: 100%;
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
            border-radius: 1.25rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 1.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
            transition: all 0.3s ease;
          }
          .flashcard-front {
            background: rgba(255, 255, 255, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(10px);
          }
          .flashcard-back {
            background: linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%);
            border: 1px solid rgba(59, 130, 246, 0.2);
            color: white;
            transform: rotateY(180deg);
          }
        `}</style>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg w-full">
          {[
            {
              title: "Discover Events",
              desc: "Seamlessly search and register for technical workshops, cultural meets, and sports events.",
              icon: <Calendar className="w-6 h-6 text-blue-600" />,
              backIcon: <Calendar className="w-8 h-8 text-blue-200 mb-2" />
            },
            {
              title: "Achievements Cabinet",
              desc: "Grow your points, unlock exclusive achievement levels, and build your digital credentials shelf.",
              icon: <Trophy className="w-6 h-6 text-amber-500" />,
              backIcon: <Trophy className="w-8 h-8 text-amber-200 mb-2" />
            },
            {
              title: "Volunteer Credits",
              desc: "Serve as a volunteer, earn extra points, and download certified volunteer accolades.",
              icon: <Award className="w-6 h-6 text-purple-600" />,
              backIcon: <Award className="w-8 h-8 text-purple-200 mb-2" />
            },
            {
              title: "Verifiable PDFs",
              desc: "Get instant downloads of premium signature-verified landscape certificates for your records.",
              icon: <GraduationCap className="w-6 h-6 text-emerald-600" />,
              backIcon: <GraduationCap className="w-8 h-8 text-emerald-200 mb-2" />
            }
          ].map((item, idx) => (
            <div key={idx} className="flashcard-container">
              <div className="flashcard-inner">
                {/* Front Side */}
                <div className="flashcard-front">
                  <div className="bg-slate-50 p-3 rounded-2xl w-fit mb-4 border border-slate-100/80">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-1">{item.title}</h3>
                  <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mt-1 animate-pulse">Hover to reveal details</span>
                </div>
                {/* Back Side */}
                <div className="flashcard-back">
                  {item.backIcon}
                  <h3 className="font-bold text-base mb-1.5 text-white/95">{item.title}</h3>
                  <p className="text-white/80 text-xs leading-relaxed text-center">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="container mx-auto px-6 py-6 text-center text-slate-400 text-xs sm:text-sm relative z-10 border-t border-slate-100 mt-8">
        <p>© 2026 PSG Institute of Technology and Applied Research. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
