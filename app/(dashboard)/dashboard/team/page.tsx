"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRole } from "@prisma/client";

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
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage access and roles for your staff</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowForm((s) => !s)}>
          <UserPlus className="size-4" />
          {showForm ? "Cancel" : "Add Member"}
        </Button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card size="sm">
              <CardHeader className="border-b pb-4">
                <CardTitle>Add Team Member</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-44 flex flex-col gap-1.5">
                      <Label>Full Name</Label>
                      <Input {...register("name")} placeholder="Lisa Walker" />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="flex-1 min-w-48 flex flex-col gap-1.5">
                      <Label>Email</Label>
                      <Input {...register("email")} placeholder="email@example.com" />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="flex-1 min-w-40 flex flex-col gap-1.5">
                      <Label>Password</Label>
                      <Input {...register("password")} type="password" placeholder="••••••••" />
                      {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Role</Label>
                      <Select value={selectedRole} onValueChange={(v) => setValue("role", v as UserRole)}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(UserRole).map((r) => (
                            <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" disabled={isSubmitting} size="sm">
                      {isSubmitting ? "Adding…" : "Add Member"}
                    </Button>
                  </div>
                  {serverError && <p className="mt-3 text-sm text-destructive">{serverError}</p>}
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <Card size="sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u, i) => {
                  const initials = u.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                  return (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">{u.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{ROLE_LABELS[u.role]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                          <span className="size-1.5 rounded-full bg-green-500" />
                          Active
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.id !== currentUserId && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => deleteUser(u.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="pt-0">
          <p className="text-sm font-medium">More team features coming soon</p>
          <p className="text-xs text-muted-foreground mt-1">
            Activity logs, per-lead assignment, and granular permissions are on the roadmap.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
