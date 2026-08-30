"use client";

import { useState, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, ShieldAlert, CheckCircle2, KeyRound, LogIn, MailCheck, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [mode, setMode] = useState<"register" | "signin">("register");
  const [step, setStep] = useState<"email" | "verify" | "name" | "password" | "success">("email");
  const [successAction, setSuccessAction] = useState<"register" | "signin">("register");
  
  const [showLogoutBanner, setShowLogoutBanner] = useState(false);
  const [loggedOutName, setLoggedOutName] = useState<string | null>(null);
  
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [memberName, setMemberName] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!isMounted) return;

      if (session && !error) {
        // Validate if user actually exists or if token is orphaned
        const { data: userCheck, error: userError } = await supabase.auth.getUser();
        if (userError || !userCheck?.user) {
          // Orphaned session token from a deleted DB user -> force sign out
          await supabase.auth.signOut();
          localStorage.removeItem("uonotes_last_user");
          setIsAuthenticated(false);
          setIsCheckingSession(false);
          return;
        }

        const name = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || null;
        if (name) {
          localStorage.setItem("uonotes_last_user", name);
          setMemberName(name);
        }
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsCheckingSession(false);
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        const lastUser = localStorage.getItem("uonotes_last_user");
        if (lastUser) setLoggedOutName(lastUser);
        
        setIsAuthenticated(false);
        setShowLogoutBanner(true);
        setMode("signin"); 
        setStep("email");
        
        setPassword("");
        setConfirmPassword("");
        setToken("");
        setFirstName("");
        setLastName("");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Step 1: Verify Email & Send OTP
  const handleVerifyEmail = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setShowLogoutBanner(false);

    const formattedEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase
        .from("whitelisted_emails")
        .select("name, email")
        .ilike("email", formattedEmail);

      if (error || !data || data.length === 0) {
        setErrorMsg("Email not found on the authorized member whitelist.");
        setLoading(false);
        return;
      }

      const matchedUser = data[0];
      
      // Pre-fill names if available from whitelist
      if (matchedUser.name) {
        const parts = matchedUser.name.split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
      } else {
        setFirstName("");
        setLastName("");
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: formattedEmail,
        options: { shouldCreateUser: true },
      });

      if (otpError) {
        setErrorMsg(otpError.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep("verify");
    } catch {
      setErrorMsg("Network connection error. Check your connection.");
      setLoading(false);
    }
  };

  // Step 2: Verify Code
  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: "email",
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("name");
  };

 // Step 3: Set Name in DB
  const handleSetName = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("Please enter both your first and last name.");
      return;
    }

    setLoading(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    setMemberName(fullName);

    // 1. Update the Auth metadata immediately
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    if (authError) {
      setErrorMsg(authError.message);
      setLoading(false);
      return;
    }

    // Grab the current user (they are authenticated via the OTP code right now)
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Patch the public profiles table so it drops the NULL and reflects the actual name
    if (user) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);
    }

    // 3. Sync the name back to the whitelisted_emails table
    await supabase
      .from("whitelisted_emails")
      .update({ name: fullName })
      .ilike("email", email.trim());

    setLoading(false);
    setStep("password");
  };

  // Step 4: Set Password & Login
  const handleCreatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
      data: { full_name: memberName }, // Ensure it's passed here as well just in case
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (memberName) localStorage.setItem("uonotes_last_user", memberName);

    setSuccessAction("register");
    setStep("success");
    
    // Force a hard reload to render the Next.js Server Components (Hero section)
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // Direct Sign-In
  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setShowLogoutBanner(false);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const name = data?.user?.user_metadata?.full_name || email.split("@")[0];
    setMemberName(name);
    localStorage.setItem("uonotes_last_user", name);

    setSuccessAction("signin");
    setStep("success");
    
    // Force a hard reload to render the Next.js Server Components (Hero section)
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <>
      {isCheckingSession && <div className="fixed inset-0 z-50 bg-[#FFF0F0]" />}
      {isAuthenticated && children}

      <AnimatePresence>
        {!isAuthenticated && !isCheckingSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFF0F0] px-4 select-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-brand-red/15 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-black/[0.03] to-transparent pointer-events-none" />

              <AnimatePresence>
                {showLogoutBanner && step === "email" && mode === "signin" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3.5 text-red-700 shadow-sm"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                      <LogOut className="w-4.5 h-4.5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-mono uppercase tracking-wider font-bold">Session Terminated</p>
                      <p className="text-xs font-medium text-red-800">
                        Goodbye, {loggedOutName || "Member"}. You are safely logged out.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {step === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col items-center text-center py-6 gap-3"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-emerald-600 font-bold">
                      // {successAction === "register" ? "ACCOUNT CREATED SUCCESSFULLY" : "AUTHENTICATION SUCCESSFUL"}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 font-sans uppercase">
                      {successAction === "register" 
                        ? `WELCOME, ${memberName || "MEMBER"}` 
                        : `WELCOME BACK, ${memberName || "MEMBER"}!`}
                    </h2>
                    <p className="text-xs text-gray-600 font-light">
                      Initializing UONotes portal...
                    </p>
                  </motion.div>
                ) : mode === "signin" ? (
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red mb-3 shadow-xs">
                        <LogIn className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-red font-bold mb-1">
                        // MEMBER LOGIN
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 font-sans">
                        SIGN IN TO PORTAL
                      </h2>
                      <p className="text-xs text-gray-600 font-light mt-1 max-w-xs">
                        Enter your email and password to access your account.
                      </p>
                    </div>

                    <form onSubmit={handleSignIn} className="flex flex-col gap-3.5">
                      <AnimatePresence>
                        {errorMsg && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-center gap-1.5 text-red-600 text-[11px] font-mono text-center bg-red-50 p-2.5 rounded-xl border border-red-100"
                          >
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex flex-col gap-3">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@uottawa.ca"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red text-gray-900 focus:outline-none bg-gray-50/50 transition-all"
                          required
                          autoFocus
                          disabled={loading}
                        />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red text-gray-900 focus:outline-none bg-gray-50/50 transition-all"
                          required
                          disabled={loading}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gray-900 text-white text-xs font-mono uppercase tracking-widest rounded-xl hover:bg-brand-red transition-colors cursor-pointer shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 group mt-2"
                      >
                        <span>{loading ? "SIGNING IN..." : "SIGN IN"}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        type="button"
                        onClick={() => { setMode("register"); setStep("email"); setErrorMsg(null); setShowLogoutBanner(false); }}
                        className="text-[11px] font-mono text-gray-500 hover:text-brand-red text-center mt-1"
                      >
                        ← Don&apos;t have an account? Register here
                      </button>
                    </form>
                  </motion.div>
                ) : step === "verify" ? (
                  <motion.div
                    key="verify"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red mb-3 shadow-xs">
                        <MailCheck className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-red font-bold mb-1">
                        // STEP 2 OF 4
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 font-sans">
                        VERIFY YOUR EMAIL
                      </h2>
                      <p className="text-xs text-gray-600 font-light mt-1 max-w-xs">
                        We sent a confirmation code to <span className="font-semibold">{email}</span>.
                      </p>
                    </div>

                    <form onSubmit={handleVerifyCode} className="flex flex-col gap-3.5">
                      <AnimatePresence>
                        {errorMsg && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-center gap-1.5 text-red-600 text-[11px] font-mono text-center bg-red-50 p-2.5 rounded-xl border border-red-100"
                          >
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <input
                        type="text"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Enter code"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-center font-mono tracking-widest text-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red text-gray-900 focus:outline-none bg-gray-50/50 transition-all"
                        required
                        autoFocus
                        disabled={loading}
                      />

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gray-900 text-white text-xs font-mono uppercase tracking-widest rounded-xl hover:bg-brand-red transition-colors cursor-pointer shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 group mt-2"
                      >
                        <span>{loading ? "VERIFYING..." : "CONFIRM CODE"}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        type="button"
                        onClick={() => { setStep("email"); setErrorMsg(null); }}
                        className="text-[11px] font-mono text-gray-500 hover:text-brand-red text-center mt-1"
                      >
                        ← Back to email entry
                      </button>
                    </form>
                  </motion.div>
                ) : step === "name" ? (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red mb-3 shadow-xs">
                        <User className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-red font-bold mb-1">
                        // STEP 3 OF 4
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 font-sans">
                        WHO ARE YOU?
                      </h2>
                      <p className="text-xs text-gray-600 font-light mt-1 max-w-xs">
                        Enter your first and last name for your profile.
                      </p>
                    </div>

                    <form onSubmit={handleSetName} className="flex flex-col gap-3.5">
                      <AnimatePresence>
                        {errorMsg && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-center gap-1.5 text-red-600 text-[11px] font-mono text-center bg-red-50 p-2.5 rounded-xl border border-red-100"
                          >
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex flex-col gap-3">
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First Name"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red text-gray-900 focus:outline-none bg-gray-50/50 transition-all"
                          required
                          autoFocus
                          disabled={loading}
                        />
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last Name"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red text-gray-900 focus:outline-none bg-gray-50/50 transition-all"
                          required
                          disabled={loading}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gray-900 text-white text-xs font-mono uppercase tracking-widest rounded-xl hover:bg-brand-red transition-colors cursor-pointer shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 group mt-2"
                      >
                        <span>{loading ? "SAVING..." : "CONTINUE"}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </form>
                  </motion.div>
                ) : step === "password" ? (
                  <motion.div
                    key="password"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red mb-3 shadow-xs">
                        <KeyRound className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-red font-bold mb-1">
                        // STEP 4 OF 4, WELCOME {memberName}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 font-sans">
                        SET YOUR PASSWORD
                      </h2>
                      <p className="text-xs text-gray-600 font-light mt-1 max-w-xs">
                        Create a secure password to complete your account setup.
                      </p>
                    </div>

                    <form onSubmit={handleCreatePassword} className="flex flex-col gap-3.5">
                      <AnimatePresence>
                        {errorMsg && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-center gap-1.5 text-red-600 text-[11px] font-mono text-center bg-red-50 p-2.5 rounded-xl border border-red-100"
                          >
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex flex-col gap-3">
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create password"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red text-gray-900 focus:outline-none bg-gray-50/50 transition-all"
                          required
                          autoFocus
                          disabled={loading}
                        />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red text-gray-900 focus:outline-none bg-gray-50/50 transition-all"
                          required
                          disabled={loading}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gray-900 text-white text-xs font-mono uppercase tracking-widest rounded-xl hover:bg-brand-red transition-colors cursor-pointer shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 group mt-2"
                      >
                        <span>{loading ? "FINISHING..." : "COMPLETE SETUP"}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red mb-3 shadow-xs">
                        <Lock className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-red font-bold mb-1">
                        // STEP 1 OF 4
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 font-sans">
                        PORTAL REGISTRATION
                      </h2>
                      <p className="text-xs text-gray-600 font-light mt-1 max-w-xs">
                        Enter your authorized email to begin verification.
                      </p>
                    </div>

                    <form onSubmit={handleVerifyEmail} className="flex flex-col gap-3.5">
                      <AnimatePresence>
                        {errorMsg && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-center gap-1.5 text-red-600 text-[11px] font-mono text-center bg-red-50 p-2.5 rounded-xl border border-red-100"
                          >
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@uottawa.ca"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red text-gray-900 focus:outline-none bg-gray-50/50 transition-all"
                        required
                        autoFocus
                        disabled={loading}
                      />

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gray-900 text-white text-xs font-mono uppercase tracking-widest rounded-xl hover:bg-brand-red transition-colors cursor-pointer shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 group mt-2"
                      >
                        <span>{loading ? "SENDING CODE..." : "SEND VERIFICATION CODE"}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <div className="mt-2 text-center">
                        <button
                          type="button"
                          onClick={() => { setMode("signin"); setErrorMsg(null); setShowLogoutBanner(false); }}
                          className="text-[11px] font-mono text-gray-500 hover:text-brand-red"
                        >
                          Already have an account? <span className="underline font-semibold">Sign in here</span>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center">
                <span className="text-[10px] font-mono text-gray-400 tracking-wider">
                  UONOTES // SECURE INFRASTRUCTURE
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}