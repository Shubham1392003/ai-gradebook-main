import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type UserRole = "teacher" | "student" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: "teacher" | "student", className?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Return safe defaults during tree initialization / hot reload
    return {
      user: null,
      session: null,
      role: null as UserRole,
      loading: true,
      signUp: async () => { },
      signIn: async () => { },
      signOut: async () => { },
    } as AuthContextType;
  }
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [fetchingRole, setFetchingRole] = useState(false);

  const loading = loadingAuth || fetchingRole;

  const fetchRole = async (userId: string, metadataRole?: string) => {
    setFetchingRole(true);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
      }

      let fetchedRole = data?.role;

      // Self-healing: If no role in DB, check metadata and gracefully insert it since we now have a session
      if (!fetchedRole && metadataRole) {
        fetchedRole = metadataRole as UserRole;
        try {
          await supabase.from("user_roles").insert({ user_id: userId, role: metadataRole as "teacher" | "student" });
        } catch (insertErr) {
          console.error("Self-healing role insert failed:", insertErr);
        }
      }

      setRole((fetchedRole as UserRole) ?? "student");
    } finally {
      setFetchingRole(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchRole(session.user.id, session.user.user_metadata?.role);
          }, 0);
        } else {
          setRole(null);
        }
      }
    );

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchRole(session.user.id, session.user.user_metadata?.role);
        }
      } finally {
        setLoadingAuth(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: "teacher" | "student", className?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          ...(className ? { class_name: className } : {})
        },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;

    // Only attempt insert if we get a session synchronously (no email confirmation needed)
    if (data.session && data.user) {
      const { error: roleError } = await supabase.from("user_roles").insert({ user_id: data.user.id, role });
      if (roleError) console.error("Role insertion failed:", roleError);
    }

    setRole(role);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
