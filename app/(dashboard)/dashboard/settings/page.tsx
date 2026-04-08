"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Save, Upload, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EmbedGenerator } from "@/components/dashboard/embed-generator";
import { Skeleton } from "@/components/ui/skeleton";

const agentSchema = z.object({
  name: z.string().min(1),
  title: z.string(),
  greeting: z.string(),
  calendlyUrl: z.string().url().optional().or(z.literal("")),
});
type AgentForm = z.infer<typeof agentSchema>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-gold/18 bg-white/4"
    >
      <div className="border-b border-gold/12 px-6 py-4 font-bold text-white text-[16px]">{title}</div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoErr, setPhotoErr] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [saved, setSaved] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<AgentForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(agentSchema as any),
  });

  useEffect(() => {
    axios.get("/api/admin/agent-config").then((r) => {
      const cfg = r.data as AgentForm & { photoUrl: string | null };
      reset({
        name: cfg.name,
        title: cfg.title,
        greeting: cfg.greeting,
        calendlyUrl: cfg.calendlyUrl ?? "",
      });
      if (cfg.photoUrl) setPhotoPreview(cfg.photoUrl);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [reset]);

  const processFile = (file: File) => {
    setPhotoErr("");
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setPhotoErr("Please upload a JPG, PNG, WebP, or GIF image."); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoErr("Image must be under 5MB."); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setPhotoFile(file);
  };

  const onSubmit = async (values: AgentForm) => {
    await axios.patch("/api/admin/agent-config", {
      ...values,
      calendlyUrl: values.calendlyUrl || null,
      ...(photoPreview && { photoUrl: photoPreview }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[200px] rounded-2xl bg-white/4" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-[13px] text-white/45">Customize your agent and platform preferences</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Section title="Agent Settings">
          {/* Photo upload */}
          <div className="mb-6">
            <label className="mb-2 block text-[12px] font-medium text-white/60">
              Agent Profile Picture
            </label>
            <div className="flex items-start gap-5 flex-wrap">
              {/* Preview */}
              <div className="relative shrink-0">
                <div className={`size-[88px] rounded-full overflow-hidden border-[3px] bg-gold/10 flex items-center justify-center transition-all ${photoPreview ? "border-gold shadow-[0_0_24px_rgba(212,168,46,0.3)]" : "border-gold/30"}`}>
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="Agent" className="size-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <div className="text-2xl">🤖</div>
                      <div className="text-[9px] text-white/25 mt-1">No photo</div>
                    </div>
                  )}
                </div>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                    className="absolute -top-1 -right-1 flex size-[22px] items-center justify-center rounded-full border-2 border-[#0c1228] bg-red-500 text-white text-[13px] font-bold cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {/* Drop zone */}
              <div className="flex-1 min-w-[200px]">
                <div
                  onClick={() => fileRef.current?.click()}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all ${
                    dragOver ? "border-gold bg-gold/6" : photoPreview ? "border-emerald-400/40 bg-emerald-400/4" : "border-gold/18 bg-white/2 hover:border-gold/30"
                  }`}
                >
                  <div className="text-2xl mb-1.5">{photoPreview ? "🖼️" : "📸"}</div>
                  <div className={`text-[13px] font-medium mb-1 ${photoPreview ? "text-emerald-400" : "text-white/50"}`}>
                    {photoPreview ? "Photo uploaded! Click or drop to replace" : "Drop your photo here, or click to browse"}
                  </div>
                  <div className="text-[11px] text-white/25">JPG, PNG, WebP or GIF · Max 5MB</div>
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />
                {photoErr && (
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 px-3 py-2">
                    <span className="text-red-400 text-sm">⚠</span>
                    <span className="text-[12px] text-red-400">{photoErr}</span>
                  </div>
                )}
                {photoPreview && !photoErr && (
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-2">
                    <Check className="size-3.5 text-emerald-400" />
                    <span className="text-[12px] text-emerald-400">Profile picture ready</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-white/60">Agent Name</label>
              <Input {...register("name")} className="max-w-[300px] border-gold/18 bg-white/5 text-white" />
              {errors.name && <p className="mt-1 text-[11px] text-red-400">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-white/60">Title</label>
              <Input {...register("title")} className="border-gold/18 bg-white/5 text-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-white/60">Greeting Message</label>
              <textarea
                {...register("greeting")}
                rows={3}
                className="majestic-scroll w-full resize-vertical rounded-xl border border-gold/18 bg-white/5 px-3 py-2.5 text-[13px] leading-relaxed text-white outline-none transition-colors focus:border-gold/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-white/60">Calendly URL</label>
              <Input {...register("calendlyUrl")} placeholder="https://calendly.com/your-link" className="border-gold/18 bg-white/5 text-white" />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-[#c8900a] to-[#d4a820] px-5 py-2.5 text-[13px] font-bold text-[#06091a] transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              {saved ? <Check className="size-4" /> : <Save className="size-4" />}
              {saved ? "Settings Saved!" : "Save Agent Settings"}
            </button>
          </div>
        </Section>
      </form>

      {/* Website embed */}
      <Section title="Website Integration">
        <EmbedGenerator />
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        {[
          { label: "Email Notifications", sub: "Get an email when a new lead is captured", val: emailNotifs, set: setEmailNotifs },
          { label: "In-App Notifications", sub: "Show alerts in the dashboard for new activity", val: inAppNotifs, set: setInAppNotifs },
        ].map((item, i) => (
          <div key={i} className={`flex items-center justify-between py-3 ${i === 0 ? "border-b border-gold/10" : ""}`}>
            <div>
              <div className="text-[13px] font-medium text-white/85">{item.label}</div>
              <div className="text-[12px] text-white/40 mt-0.5">{item.sub}</div>
            </div>
            <Switch checked={item.val} onCheckedChange={item.set} />
          </div>
        ))}
      </Section>
    </div>
  );
}
