/**
 * Login Page
 *
 * Firebase authentication page. Will include:
 * - Email/password login form
 * - Email/password registration form
 * - Google sign-in button
 * - Redirect to /home on successful auth
 */

import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { auth } from "../lib/firebase";
import Logo from "../components/Logo";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const isRegister = mode === "register";

  // animation trigger
  const [panelVisible, setPanelVisible] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Allow /login?mode=register
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedMode = params.get("mode");
    if (requestedMode === "register") setMode("register");
    if (requestedMode === "login") setMode("login");
  }, [location.search]);

  // Animate on mode change
  useEffect(() => {
    setPanelVisible(false);
    const t = setTimeout(() => setPanelVisible(true), 40);
    return () => clearTimeout(t);
  }, [mode]);

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password) return false;
    if (isRegister && !displayName.trim()) return false;
    return true;
  }, [email, password, displayName, isRegister]);

  function toggleMode(nextMode) {
    setError("");
    setNotice("");
    setMode(nextMode);
  }

  async function handleEmailPassword(e) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!canSubmit) {
      setError("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        await updateProfile(cred.user, { displayName: displayName.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }

      navigate("/home", { replace: true });
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setError("");
    setNotice("");

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Enter your email first, then click “Forgot password?”.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setNotice("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo size={36} />
            <span className="font-heading text-lg text-white tracking-wide">
              Viva Las Ventures
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm text-accent/80 hover:text-white transition-colors"
            >
              Back
            </Link>

            <button
              type="button"
              onClick={() => toggleMode(isRegister ? "login" : "register")}
              className="text-sm bg-primary text-background font-semibold px-5 py-2 rounded-full hover:bg-primary/90 transition-colors"
            >
              {isRegister ? "Log in" : "Sign up"}
            </button>
          </div>
        </div>
      </nav>

      <section className="relative pt-24 pb-16 px-6">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-cyan-glow/5 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 w-[520px] h-[520px] bg-primary/5 rounded-full blur-[140px]" />
          <div className="absolute top-40 left-[12%] w-1.5 h-1.5 bg-cyan-glow rounded-full animate-pulse-glow" />
          <div className="absolute top-56 right-[18%] w-1 h-1 bg-primary rounded-full animate-pulse-glow animation-delay-400" />
          <div className="absolute bottom-28 left-[25%] w-1 h-1 bg-cyan-glow rounded-full animate-pulse-glow animation-delay-800" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-heading font-bold text-white">
              {isRegister ? "Create Your Account" : "Welcome Back"}
            </h1>

            <div className="flex items-center justify-center gap-3 my-6">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-glow" />
              <Sparkle />
              <div className="h-px w-24 bg-cyan-glow" />
              <Sparkle />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-glow" />
            </div>

            <p className="text-white/60 font-body text-lg">
              {isRegister
                ? "Create a free account with email or Google to start planning."
                : "Log in to access your saved plans and itinerary."}
            </p>
          </div>

          {/* Center card */}
          <div className="mt-10 max-w-xl mx-auto">
            <div className="bg-surface/60 border border-white/5 rounded-2xl p-8 hover:border-cyan-glow/30 hover:bg-surface transition-all duration-300">
              {/* Animated panel */}
              <div
                className={[
                  "transition-all duration-300 ease-out",
                  panelVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-white mb-2">
                      {isRegister ? "Sign up" : "Log in"}
                    </h2>
                    <p className="text-white/50 font-body mb-6">
                      {isRegister
                        ? "Create an account in seconds."
                        : "Continue with Google or sign in with email."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleMode(isRegister ? "login" : "register")}
                    className="text-xs text-accent/80 hover:text-white transition-colors"
                  >
                    {isRegister ? "Have an account?" : "Need an account?"}
                  </button>
                </div>

                {/* Google */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full border border-white/10 text-white font-medium px-6 py-3.5 rounded-full hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <div className="text-xs text-white/30 uppercase tracking-widest">
                    or
                  </div>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <form onSubmit={handleEmailPassword} className="space-y-4">
                  {isRegister && (
                    <Field label="Name">
                      <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Peyton"
                        autoComplete="name"
                        className={inputClass}
                      />
                    </Field>
                  )}

                  <Field label="Email">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      type="email"
                      autoComplete="email"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Password">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      type="password"
                      autoComplete={
                        isRegister ? "new-password" : "current-password"
                      }
                      className={inputClass}
                    />

                    {!isRegister && (
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={loading}
                        className="mt-2 text-xs text-accent/80 hover:text-white transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </Field>

                  {notice && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      {notice}
                    </div>
                  )}

                  {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!canSubmit || loading}
                    className="w-full bg-primary text-background font-semibold px-8 py-3.5 rounded-full text-base hover:bg-primary/90 hover:scale-[1.01] transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {loading
                      ? "Please wait..."
                      : isRegister
                      ? "Create account"
                      : "Log in"}
                  </button>

                  <div className="pt-2 text-center text-xs text-white/30 font-body">
                    {isRegister ? (
                      <>
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => toggleMode("login")}
                          className="text-cyan-glow hover:text-white transition-colors"
                        >
                          Log in
                        </button>
                      </>
                    ) : (
                      <>
                        Need an account?{" "}
                        <button
                          type="button"
                          onClick={() => toggleMode("register")}
                          className="text-cyan-glow hover:text-white transition-colors"
                        >
                          Sign up
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center text-xs text-white/30 font-body">
            Viva Las Ventures • AI-powered itinerary planning for Las Vegas
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-white/70 font-body mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-background/60 border border-white/10 text-white placeholder:text-white/30 rounded-xl px-4 py-3 outline-none focus:border-cyan-glow/40 focus:ring-2 focus:ring-cyan-glow/10 transition";

function Sparkle() {
  return (
    <svg className="w-4 h-4 text-cyan-glow" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M44.5 20H24v8.5h11.8C34.2 33.7 29.6 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.5 0 6.6 1.4 8.9 3.6l6-6C35.2 5.1 29.9 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.1-2.2-.5-4z"
        fill="currentColor"
      />
    </svg>
  );
}

function mapFirebaseAuthError(err) {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn’t look valid.";
    case "auth/user-not-found":
      return "No account found with that email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/email-already-in-use":
      return "That email is already in use. Try logging in instead.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before finishing.";
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled. Try again.";
    case "auth/operation-not-allowed":
      return "This sign-in method isn’t enabled in Firebase Auth.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default:
      return err?.message || "Something went wrong. Please try again.";
  }
}