import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Image } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-4 shadow-glow">
            <Image className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            SwipeSnap
          </h1>
          <p className="text-muted-foreground">
            {isPasswordReset ? "Enter your new password" : isForgotPassword ? "Reset your password" : "Discover and sell amazing photography"}
          </p>
        </div>

        <Card className="p-6 bg-gradient-card shadow-card border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isForgotPassword && !isPasswordReset && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="photographer123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                  className="bg-secondary border-border"
                />
              </div>
            )}

            {!isPasswordReset && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-secondary border-border"
                />
              </div>
            )}

            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-secondary border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Loading..." : isPasswordReset ? "Reset Password" : isForgotPassword ? "Send Reset Link" : isLogin ? "Sign In" : "Sign Up"}
            </Button>

            {!isPasswordReset && (
              <div className="text-center text-sm space-y-2">
                {!isForgotPassword && isLogin && (
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-primary hover:underline block w-full"
                >
                  Forgot password?
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsLogin(!isLogin);
                }}
                className="text-primary hover:underline block w-full"
              >
                {isForgotPassword
                  ? "Back to sign in"
                  : isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
