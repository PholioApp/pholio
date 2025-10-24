import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Eye, 
  EyeOff, 
  Image, 
  Shield, 
  Lock, 
  Mail, 
  User, 
  Check, 
  X, 
  AlertCircle, 
  Sparkles,
  Zap,
  Star,
  TrendingUp,
  Users,
  Award,
  Crown,
  Heart,
  Camera,
  Verified
} from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailValid, setEmailValid] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [formProgress, setFormProgress] = useState(0);
  const [stats, setStats] = useState({ totalUsers: 0, totalImages: 0, usersToday: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    setPasswordStrength(Math.min(strength, 100));
  }, [password]);

  // Validate email
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(email));
  }, [email]);

  // Calculate form progress
  useEffect(() => {
    let progress = 0;
    const fields = isLogin ? 2 : 3;
    if (email) progress += 100 / fields;
    if (password && !isForgotPassword) progress += 100 / fields;
    if (!isLogin && username) progress += 100 / fields;
    setFormProgress(Math.min(progress, 100));
  }, [email, password, username, isLogin, isForgotPassword]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "bg-destructive";
    if (passwordStrength < 70) return "bg-yellow-500";
    return "bg-accent";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 70) return "Medium";
    return "Strong";
  };

  // Fetch real stats from database
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total users
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Get total images
        const { count: totalImages } = await supabase
          .from('images')
          .select('*', { count: 'exact', head: true });

        // Get users who joined today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: usersToday } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString());

        setStats({
          totalUsers: totalUsers || 0,
          totalImages: totalImages || 0,
          usersToday: usersToday || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Check if this is a password reset link
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setIsPasswordReset(true);
      setIsLogin(false);
      setIsForgotPassword(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isPasswordReset) {
        const { error } = await supabase.auth.updateUser({
          password: password,
        });

        if (error) throw error;

        toast({
          title: "Password updated!",
          description: "Your password has been successfully reset.",
        });
        setIsPasswordReset(false);
        navigate("/");
      } else if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) throw error;

        toast({
          title: "Check your email",
          description: "We sent you a password reset link.",
        });
        setIsForgotPassword(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Welcome to SwipeSnap.",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header with badges */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-primary mb-4 shadow-glow animate-scale-in relative">
            <Image className="w-10 h-10 text-white animate-pulse" />
            <div className="absolute -top-2 -right-2">
              <Badge className="bg-accent text-white border-0 shadow-lg">
                <Verified className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
            SwipeSnap
          </h1>
          
          <p className="text-muted-foreground mb-4 text-lg">
            {isPasswordReset ? "🔒 Enter your new password" : isForgotPassword ? "📧 Reset your password" : "✨ Discover and sell amazing photography"}
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
            <Badge variant="secondary" className="gap-1">
              <Shield className="w-3 h-3" />
              Secure
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Users className="w-3 h-3" />
              {stats.totalUsers.toLocaleString()}+ Users
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Camera className="w-3 h-3" />
              {stats.totalImages.toLocaleString()}+ Photos
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              Growing Fast
            </Badge>
          </div>

          {/* Form progress indicator */}
          {formProgress > 0 && formProgress < 100 && (
            <div className="max-w-xs mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Progress value={formProgress} className="h-1.5" />
                <span className="text-xs text-muted-foreground">{Math.round(formProgress)}%</span>
              </div>
            </div>
          )}
        </div>

        <Card className="p-8 bg-gradient-card shadow-card border-border backdrop-blur-sm hover:shadow-glow transition-all duration-300 animate-fade-in">
          {/* Security badge */}
          <div className="flex items-center justify-between mb-6">
            <Badge variant="outline" className="gap-1">
              <Lock className="w-3 h-3" />
              256-bit SSL
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Award className="w-3 h-3" />
              {isLogin ? "Welcome Back" : "Join Now"}
            </Badge>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && !isForgotPassword && !isPasswordReset && (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Username
                  </Label>
                  {username && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Camera className="w-3 h-3" />
                      {username.length}/20
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="photographer123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.slice(0, 20))}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField("")}
                    required={!isLogin}
                    maxLength={20}
                    className="bg-secondary border-border pl-4 transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                  />
                  {username.length >= 3 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Badge className="bg-accent border-0 gap-1 text-xs">
                        <Check className="w-3 h-3" />
                      </Badge>
                    </div>
                  )}
                </div>
                {focusedField === "username" && (
                  <Alert className="animate-fade-in">
                    <Sparkles className="w-4 h-4" />
                    <AlertDescription className="text-xs">
                      Choose a unique username (3-20 characters)
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {!isPasswordReset && (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  {email && (
                    <Badge variant={emailValid ? "default" : "destructive"} className="text-xs gap-1">
                      {emailValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {emailValid ? "Valid" : "Invalid"}
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField("")}
                    required
                    className="bg-secondary border-border pl-4 transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                  />
                  {emailValid && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Badge className="bg-accent border-0 gap-1 text-xs">
                        <Check className="w-3 h-3" />
                      </Badge>
                    </div>
                  )}
                </div>
                {focusedField === "email" && (
                  <Alert className="animate-fade-in">
                    <Mail className="w-4 h-4" />
                    <AlertDescription className="text-xs">
                      We'll never share your email with anyone else
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {!isForgotPassword && (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  {password && (
                    <Badge 
                      className={`text-xs gap-1 ${
                        passwordStrength < 40 ? 'bg-destructive' : 
                        passwordStrength < 70 ? 'bg-yellow-500' : 
                        'bg-accent'
                      } border-0`}
                    >
                      <Zap className="w-3 h-3" />
                      {getPasswordStrengthText()}
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField("")}
                    required
                    className="bg-secondary border-border pr-20 transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {password.length >= 8 && (
                      <Badge className="bg-accent border-0 gap-1 text-xs">
                        <Check className="w-3 h-3" />
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                
                {/* Password strength meter */}
                {password && (
                  <div className="space-y-2 animate-fade-in">
                    <Progress value={passwordStrength} className={`h-1.5 ${getPasswordStrengthColor()}`} />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`flex items-center gap-1 ${password.length >= 8 ? 'text-accent' : 'text-muted-foreground'}`}>
                        {password.length >= 8 ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        8+ characters
                      </div>
                      <div className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-accent' : 'text-muted-foreground'}`}>
                        {/[A-Z]/.test(password) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Uppercase
                      </div>
                      <div className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-accent' : 'text-muted-foreground'}`}>
                        {/[0-9]/.test(password) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Number
                      </div>
                      <div className={`flex items-center gap-1 ${/[^a-zA-Z0-9]/.test(password) ? 'text-accent' : 'text-muted-foreground'}`}>
                        {/[^a-zA-Z0-9]/.test(password) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Special char
                      </div>
                    </div>
                  </div>
                )}

                {focusedField === "password" && !password && (
                  <Alert className="animate-fade-in">
                    <Shield className="w-4 h-4" />
                    <AlertDescription className="text-xs">
                      Use a strong password with 8+ characters, uppercase, numbers, and symbols
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Submit button with loading state */}
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-300 hover:scale-[1.02] hover:shadow-glow relative overflow-hidden group"
              disabled={loading || (password && passwordStrength < 40 && !isLogin && !isForgotPassword)}
              size="lg"
            >
              <div className="absolute inset-0 bg-gradient-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {isPasswordReset ? (
                      <>
                        <Lock className="w-4 h-4" />
                        Reset Password
                      </>
                    ) : isForgotPassword ? (
                      <>
                        <Mail className="w-4 h-4" />
                        Send Reset Link
                      </>
                    ) : isLogin ? (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Sign In
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4" />
                        Sign Up
                      </>
                    )}
                  </>
                )}
              </span>
            </Button>

            {/* Additional badges and info */}
            {!isPasswordReset && (
              <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                <Badge variant="outline" className="text-xs gap-1">
                  <Shield className="w-3 h-3" />
                  Encrypted
                </Badge>
                <Badge variant="outline" className="text-xs gap-1">
                  <Heart className="w-3 h-3" />
                  Ad-free
                </Badge>
                <Badge variant="outline" className="text-xs gap-1">
                  <Star className="w-3 h-3" />
                  Premium
                </Badge>
              </div>
            )}

            {!isPasswordReset && (
              <div className="text-center text-sm space-y-3 pt-4 border-t border-border">
                {!isForgotPassword && isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-primary hover:underline block w-full font-medium transition-all hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Forgot password?
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setIsLogin(!isLogin);
                  }}
                  className="text-primary hover:underline block w-full font-medium transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  {isForgotPassword ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Back to sign in
                    </>
                  ) : isLogin ? (
                    <>
                      <User className="w-4 h-4" />
                      Don't have an account? Sign up
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Already have an account? Sign in
                    </>
                  )}
                </button>
              </div>
            )}
          </form>

          {/* Footer badges */}
          <div className="mt-6 pt-6 border-t border-border space-y-4">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs gap-1">
                <Camera className="w-3 h-3" />
                Photography
              </Badge>
              <Badge variant="secondary" className="text-xs gap-1">
                <TrendingUp className="w-3 h-3" />
                Marketplace
              </Badge>
              <Badge variant="secondary" className="text-xs gap-1">
                <Award className="w-3 h-3" />
                Quality
              </Badge>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Trusted by professionals worldwide</p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{stats.totalUsers.toLocaleString()} Users</span>
                </div>
                <div className="flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  <span>{stats.totalImages.toLocaleString()} Photos</span>
                </div>
              </div>
            </div>

            {!isPasswordReset && !isForgotPassword && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <Shield className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs font-medium">Secure</p>
                  <p className="text-xs text-muted-foreground">SSL Protected</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <Zap className="w-5 h-5 mx-auto mb-1 text-accent" />
                  <p className="text-xs font-medium">Fast</p>
                  <p className="text-xs text-muted-foreground">Instant Access</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <Heart className="w-5 h-5 mx-auto mb-1 text-destructive" />
                  <p className="text-xs font-medium">Loved</p>
                  <p className="text-xs text-muted-foreground">By Creators</p>
                </div>
              </div>
            )}

            {/* Feature highlights */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Badge className="bg-accent border-0 gap-1">
                  <Check className="w-3 h-3" />
                  Free
                </Badge>
                <span className="text-muted-foreground">No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge className="bg-primary border-0 gap-1">
                  <Check className="w-3 h-3" />
                  Instant
                </Badge>
                <span className="text-muted-foreground">Start selling immediately</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge className="bg-purple-500 border-0 gap-1">
                  <Check className="w-3 h-3" />
                  Premium
                </Badge>
                <span className="text-muted-foreground">High-quality marketplace</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Bottom social proof */}
        <div className="mt-6 text-center animate-fade-in">
          {stats.usersToday > 0 && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-primary border-2 border-background flex items-center justify-center text-xs font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <Badge className="bg-accent border-0 gap-1">
                <TrendingUp className="w-3 h-3" />
                +{stats.usersToday} joined today
              </Badge>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Join photographers selling worldwide 🌍</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
