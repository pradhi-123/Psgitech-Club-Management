import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Lock, User } from "lucide-react";
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
    // Submit username (can be Roll Number or Email) and Password
    const { error, role } = await signIn(username, password);

    setLoading(false);
    if (error) {
      toast.error("Login failed: " + error.message);
    } else {
      toast.success("Login successful!");
      // Redirect based on the user role
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
    <div className="min-h-screen bg-gradient-to-tr from-blue-100 via-indigo-100 via-purple-100 to-amber-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background soft color glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/8 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Back button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 gap-1 text-sm font-medium z-10"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Button>

      <Card className="w-full max-w-md bg-white/80 border border-white/60 backdrop-blur-xl shadow-2xl relative z-10 text-slate-900 rounded-3xl overflow-hidden hover:shadow-primary/5 transition-all duration-500 hover:scale-[1.005]">
        <CardHeader className="text-center space-y-2 pb-6 border-b border-slate-100">
          <div className="mx-auto mb-2 p-2 bg-white/90 border border-slate-200/50 rounded-2xl w-fit shadow-sm">
            <img src={collegeLogo} alt="PSG Institute Logo" className="h-16 w-auto mx-auto object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            PSG iTech Campus Portal
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs sm:text-sm">Enter your credentials below to log in</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700 font-semibold flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-500" />
                Roll Number / Email Address
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g. 22AD001 or name@domain.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-primary focus:ring-primary/20 h-11"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-semibold flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-500" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-primary focus:ring-primary/20 pr-10 h-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">For students, your default password is your Roll Number.</p>
            </div>

            {/* Sign In Button */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-primary text-white font-bold py-5 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] hover:opacity-95 duration-200 mt-4 text-base" 
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
