"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import axios from "axios";
import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormValues>({ resolver: zodResolver(schema as any) });

  const onSubmit = async (values: FormValues) => {
    setServerError("");
    try {
      await axios.post("/api/auth/login", values);
      router.push("/dashboard/overview");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setServerError(
          (err.response?.data as { error?: string })?.error ?? "Login failed"
        );
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#06091a] via-[#0d1b3e] to-[#06091a] p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[400px]"
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[#c8900a] to-[#e8c040] text-3xl shadow-[0_0_32px_rgba(212,168,46,0.4)]">
            🛡️
          </div>
          <div className="text-center">
            <h1 className="font-bold text-gold-2 text-2xl">Majestic Insurance</h1>
            <p className="text-[13px] text-white/40 mt-1">Agent Dashboard</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gold/18 bg-white/3 p-8 backdrop-blur-xl">
          <h2 className="mb-1 text-lg font-semibold text-white">Welcome back</h2>
          <p className="mb-6 text-[13px] text-white/45">Sign in to access your dashboard.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-white/60">
                Email address
              </label>
              <Input
                type="email"
                placeholder="admin@gomajesticinsurance.com"
                className="border-gold/20 bg-white/5 text-white placeholder-white/20 focus-visible:border-gold/50"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-white/60">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="border-gold/20 bg-white/5 pr-10 text-white placeholder-white/20 focus-visible:border-gold/50"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors cursor-pointer"
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] text-red-400">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5">
                <p className="text-[13px] text-red-400">{serverError}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-11 w-full rounded-xl bg-gradient-to-r from-[#c8900a] to-[#d4a820] text-[#06091a] font-bold hover:opacity-90 transition-opacity"
            >
              {isSubmitting ? (
                "Signing in…"
              ) : (
                <>
                  <LogIn className="size-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-white/20">
          <ShieldCheck className="size-3.5" />
          Majestic Insurance Agency · Muskegon Lakeshore
        </div>
      </motion.div>
    </div>
  );
}
