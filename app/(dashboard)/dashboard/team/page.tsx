"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRole } from "@prisma/client";

const ROLE_COLORS: Record<string, { text: string }> = {
  ADMIN: { text: "text-gold" },
  SALES_AGENT: { text: "text-blue-400" },
  VIEWER: { text: "text-purple-400" },
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin", SALES_AGENT: "Sales Agent", VIEWER: "Viewer",
};

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Minimum 8 characters"),
  role: z.nativeEnum(UserRole),
});
type CreateForm = z.infer<typeof createSchema>;

interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export default function TeamPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createSchema as any),
    defaultValues: { role: UserRole.SALES_AGENT },
  });
  const selectedRole = watch("role");

  useEffect(() => {
    Promise.all([
      axios.get("/api/admin/users"),
      axios.get("/api/auth/session"),
    ]).then(([usersRes, sessionRes]) => {
      setUsers((usersRes.data as { users: TeamUser[] }).users);
      setCurrentUserId((sessionRes.data as { user: { id: string } | null }).user?.id ?? null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const onSubmit = async (values: CreateForm) => {
    setServerError("");
    try {
      const r = await axios.post("/api/admin/users", values);
      setUsers((prev) => [...prev, r.data as TeamUser]);
      reset();
      setShowForm(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setServerError((err.response?.data as { error?: string })?.error ?? "Failed to create user");
      }
    }
  };

  const deleteUser = async (id: string) => {
    await axios.delete(`/api/admin/users/${id}`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="mt-1 text-[13px] text-white/45">Manage access and roles for your staff</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c8900a] to-[#d4a820] px-4 py-2 text-[13px] font-bold text-[#06091a] hover:opacity-90 cursor-pointer"
        >
          <UserPlus className="size-4" />
          {showForm ? "Cancel" : "Add Member"}
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden rounded-2xl border border-gold/18 bg-white/4"
          >
            <div className="p-5">
              <h3 className="mb-4 font-bold text-white text-[16px]">Add Team Member</h3>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[180px]">
                    <label className="mb-1 block text-[12px] font-medium text-white/50">Full Name</label>
                    <Input {...register("name")} placeholder="Lisa Walker" className="border-gold/18 bg-white/5 text-white" />
                    {errors.name && <p className="mt-1 text-[11px] text-red-400">{errors.name.message}</p>}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="mb-1 block text-[12px] font-medium text-white/50">Email</label>
                    <Input {...register("email")} placeholder="email@example.com" className="border-gold/18 bg-white/5 text-white" />
                    {errors.email && <p className="mt-1 text-[11px] text-red-400">{errors.email.message}</p>}
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="mb-1 block text-[12px] font-medium text-white/50">Password</label>
                    <Input {...register("password")} type="password" placeholder="••••••••" className="border-gold/18 bg-white/5 text-white" />
                    {errors.password && <p className="mt-1 text-[11px] text-red-400">{errors.password.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-white/50">Role</label>
                    <Select value={selectedRole} onValueChange={(v) => setValue("role", v as UserRole)}>
                      <SelectTrigger className="border-gold/18 bg-white/5 text-white/70 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(UserRole).map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-gradient-to-r from-[#c8900a] to-[#d4a820] px-4 py-2 text-[13px] font-bold text-[#06091a] hover:opacity-90 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? "Adding…" : "Add Member"}
                  </button>
                </div>
                {serverError && <p className="mt-3 text-[13px] text-red-400">{serverError}</p>}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gold/18 bg-white/4">
        <div className="grid grid-cols-[2.5fr_2fr_1.2fr_1fr_0.5fr] gap-3 border-b border-gold/12 bg-white/2 px-5 py-2.5">
          {["Member", "Email", "Role", "Joined", ""].map((h, i) => (
            <div key={i} className="text-[10px] uppercase tracking-[1px] text-white/25">{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-0">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="m-3 h-14 rounded-xl bg-white/4" />)}
          </div>
        ) : (
          users.map((u, i) => {
            const roleCls = ROLE_COLORS[u.role]?.text ?? "text-gold";
            const initials = u.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-[2.5fr_2fr_1.2fr_1fr_0.5fr] items-center gap-3 border-b border-gold/8 px-5 py-3.5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`relative size-9 rounded-full border-2 flex items-center justify-center text-[12px] font-bold ${roleCls} border-current bg-current/10 shrink-0`}>
                    {initials}
                    <div className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-400 border-2 border-[#06091a]" />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-white/90">{u.name}</div>
                    <div className="text-[11px] text-white/30">
                      Joined {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
                <div className="truncate text-[12px] text-white/50">{u.email}</div>
                <div className={`text-[12px] font-semibold ${roleCls}`}>{ROLE_LABELS[u.role]}</div>
                <div className="flex items-center gap-1.5 text-[12px] text-emerald-400">
                  <div className="size-[7px] rounded-full bg-emerald-400 shadow-[0_0_5px_#4ade80]" />
                  Active
                </div>
                <div className="flex justify-center">
                  {u.id !== currentUserId && (
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="text-red-400/40 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Roadmap note */}
      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-dashed border-gold/12 bg-white/[0.015] p-5">
        <span className="text-2xl">✦</span>
        <div>
          <div className="text-[13px] font-semibold text-white/85">More team features coming soon</div>
          <div className="text-[12px] text-white/40 mt-1">
            Activity logs, per-lead assignment, and granular permissions are on the roadmap.
          </div>
        </div>
      </div>
    </div>
  );
}
