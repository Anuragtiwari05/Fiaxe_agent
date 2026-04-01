"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "../utils/api";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await loginUser(formData);

      if (res?.data?.token) {
        localStorage.setItem("token", res.data.token);
      }

      if (res?.data?.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      alert("Login successful");
      router.push("/ai");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Login failed");
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
              href="/signup"
              className="text-slate-800 font-semibold border border-slate-200 px-4 py-2 rounded-lg"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      <section className="flex items-center justify-center px-6 py-16">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-[440px] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl shadow-slate-200/50"
        >
          <div className="bg-slate-50 border-b border-slate-100 px-7 py-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Welcome Back
            </p>
            <h2 className="text-xl font-semibold text-slate-800">
              SIGN IN TO YOUR ACCOUNT
            </h2>
          </div>

          <div className="p-8">
            <div className="space-y-4">
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="✉️ Email Address"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-slate-400 text-slate-700"
              />

              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="🔑 Password"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-slate-400 text-slate-700"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 rounded-xl bg-slate-800 px-4 py-4 font-bold text-white hover:bg-slate-900 shadow-lg disabled:opacity-50 transition-all"
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-slate-800 font-semibold underline"
              >
                Create one
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