import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { BookOpen, GraduationCap, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CLASS_OPTIONS } from "@/lib/constants";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState("");
  const [role, setRole] = useState<"teacher" | "student">("student");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (role === "student" && !className.trim()) {
          throw new Error("Class name is required for students");
        }
        await signUp(email, password, fullName, role, role === "student" ? className.trim() : undefined);
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account before signing in.",
        });
        setIsSignUp(false);
      } else {
        await signIn(email, password);
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-1/3 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-charcoal">
              <BookOpen className="h-5 w-5 text-charcoal-foreground" />
            </div>
          </div>
          <h1 className="mb-1 text-center text-2xl font-bold text-foreground">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Sign up to get started" : "Sign in to your account"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {(["student", "teacher"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${role === r
                          ? "border-charcoal bg-charcoal/5 text-charcoal"
                          : "border-border text-muted-foreground hover:border-primary/30"
                          }`}
                      >
                        {r === "student" ? (
                          <GraduationCap className="h-4 w-4" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                        {r === "student" ? "Student" : "Teacher"}
                      </button>
                    ))}
                  </div>
                </div>
                {role === "student" && (
                  <div>
                    <Label htmlFor="className">Class Name</Label>
                    <Select value={className} onValueChange={setClassName}>
                      <SelectTrigger id="className">
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASS_OPTIONS.map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-charcoal text-charcoal-foreground hover:bg-charcoal/90"
            >
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
