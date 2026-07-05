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

        {/* Right column: Highlights Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full">
          {[
            {
              title: "Discover Events",
              desc: "Seamlessly search and register for technical workshops, cultural meets, and sports events.",
              icon: <Calendar className="w-6 h-6 text-primary" />,
              border: "hover:border-primary/30"
            },
            {
              title: "Achievements Cabinet",
              desc: "Grow your points, unlock exclusive achievement levels, and build your digital credentials shelf.",
              icon: <Trophy className="w-6 h-6 text-amber-500" />,
              border: "hover:border-amber-500/30"
            },
            {
              title: "Volunteer Credits",
              desc: "Serve as a volunteer, earn extra points, and download certified volunteer accolades.",
              icon: <Award className="w-6 h-6 text-purple-600" />,
              border: "hover:border-purple-500/30"
            },
            {
              title: "Verifiable PDFs",
              desc: "Get instant downloads of premium signature-verified landscape certificates for your records.",
              icon: <GraduationCap className="w-6 h-6 text-emerald-600" />,
              border: "hover:border-emerald-500/30"
            }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className={`p-6 rounded-2xl bg-white/70 border border-slate-200/60 backdrop-blur-md transition-all duration-300 hover:bg-white hover:scale-[1.02] shadow-sm hover:shadow-md ${item.border}`}
            >
              <div className="bg-slate-50 p-3 rounded-xl w-fit mb-4 border border-slate-100">
                {item.icon}
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">{item.title}</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
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
