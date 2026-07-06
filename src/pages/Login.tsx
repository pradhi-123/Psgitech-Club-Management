import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Lock, User, Sparkles } from "lucide-react";
import collegeLogo from "@/assets/college-logo.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter both username and password");
      return;
    }

    setLoading(true);
    const { error, role } = await signIn(username, password);

    setLoading(false);
    if (error) {
      toast.error("Login failed: " + error.message);
    } else {
      toast.success("Login successful!");
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "coordinator") {
        navigate("/coordinator");
      } else {
        navigate("/student");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Soft Neon Light Rays */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-blue-600/15 to-purple-600/0 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-purple-600/15 to-pink-600/0 blur-[130px] pointer-events-none"></div>

      {/* Back button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-slate-400 hover:text-white hover:bg-white/10 gap-1 text-sm font-semibold z-10 transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Button>

      {/* Glassmorphic Login Card */}
      <Card className="w-full max-w-md bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10 text-white rounded-3xl overflow-hidden hover:shadow-[0_20px_50px_rgba(99,102,241,0.05)] transition-all duration-500 hover:scale-[1.005]">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

        <CardHeader className="text-center space-y-2 pb-6 border-b border-white/[0.04]">
          <div className="mx-auto mb-2 p-2 bg-white/95 border border-slate-200/50 rounded-2xl w-fit shadow-lg">
            <img src={collegeLogo} alt="PSG Institute Logo" className="h-16 w-auto mx-auto object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent filter drop-shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            PSG iTech Campus Portal
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs sm:text-sm">Enter your credentials below to log in</CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300 font-medium flex items-center gap-1.5 text-xs sm:text-sm">
                <User className="w-4 h-4 text-slate-400" />
                Roll Number / Email Address
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g. 22AD001 or name@domain.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/[0.03] border-white/[0.08] text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-11 rounded-xl transition-all"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 font-medium flex items-center gap-1.5 text-xs sm:text-sm">
                <Lock className="w-4 h-4 text-slate-400" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/[0.03] border-white/[0.08] text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20 pr-10 h-11 rounded-xl transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-slate-500 shrink-0" />
                For students, your default password is your Roll Number.
              </p>
            </div>

            {/* Sign In Button */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-bold py-5 rounded-xl shadow-lg shadow-indigo-500/10 hover:scale-[1.01] transition-all duration-200 mt-4 text-base" 
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
