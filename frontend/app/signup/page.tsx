"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupUser } from "../utils/api";

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");

    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateForm = () => {
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPassword = formData.password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      return "All fields are required";
    }

    if (trimmedName.length < 2) {
      return "Name must be at least 2 characters";
    }

    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      return "Please enter a valid email address";
    }

    if (trimmedPassword.length < 6) {
      return "Password must be at least 6 characters";
    }

    if (!agree) {
      return "Please accept terms first";
    }

    return "";
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (loading) return;

  const validationError = validateForm();

  if (validationError) {
    setErrorMessage(validationError);
    return;
  }

  try {
    setLoading(true);
    setErrorMessage("");

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password.trim(),
    };

    const res = await signupUser(payload);

    if (res?.token) {
      localStorage.setItem("token", res.token);
    }

    if (res?.user) {
      localStorage.setItem("user", JSON.stringify(res.user));
    }

    router.push("/ai");
  } catch (error: any) {
    console.error("Signup failed:", error.message);

    setErrorMessage(error.message || "Signup failed. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <header className="w-full bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 text-white p-1.5 rounded-lg text-xl">
              💬
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              AI AGENT
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-slate-900">
              Features
            </a>
            <a href="#" className="hover:text-slate-900">
              Pricing
            </a>
            <Link
              href="/login"
              className="text-slate-800 font-semibold border border-slate-200 px-4 py-2 rounded-lg"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <section className="flex items-center justify-center px-6 py-16">
        <form
          onSubmit={handleSignup}
          className="w-full max-w-[440px] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl shadow-slate-200/50"
        >
          <div className="bg-slate-50 border-b border-slate-100 px-7 py-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Join Us
            </p>
            <h2 className="text-xl font-semibold text-slate-800">
              GET STARTED FOR FREE
            </h2>
          </div>

          <div className="p-8">
            <div className="space-y-4">
              <input
                suppressHydrationWarning
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="👤 Name"
                required
                autoComplete="name"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-slate-400 text-slate-700"
              />

              <input
                suppressHydrationWarning
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="✉️ Email Address"
                required
                autoComplete="email"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-slate-400 text-slate-700"
              />

              <input
                suppressHydrationWarning
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="🔑 Password"
                required
                autoComplete="new-password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-slate-400 text-slate-700"
              />
            </div>

            <label className="mt-6 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => {
                  setAgree(e.target.checked);
                  setErrorMessage("");
                }}
                className="mt-1 h-4 w-4"
              />
              <span className="text-sm text-slate-500">
                I agree to the Terms and Privacy Policy.
              </span>
            </label>

            {errorMessage && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </div>
            )}

            <button
              suppressHydrationWarning
              type="submit"
              disabled={loading}
              className="w-full mt-8 rounded-xl bg-slate-800 px-4 py-4 font-bold text-white hover:bg-slate-900 shadow-lg disabled:opacity-50 transition-all"
            >
              {loading ? "CREATING..." : "CREATE ACCOUNT"}
            </button>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-slate-800 font-semibold underline"
              >
                Login
              </Link>
            </p>

            <div className="mt-8 flex items-center justify-center gap-8 border-t border-slate-100 pt-8 grayscale opacity-40 text-2xl font-bold">
              <span>G</span>
              <span>in</span>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}