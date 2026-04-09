"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Upload, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmbedGenerator } from "@/components/dashboard/embed-generator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const agentSchema = z.object({
  name: z.string().min(1),
  title: z.string(),
  greeting: z.string(),
  calendlyUrl: z.string().url().optional().or(z.literal("")),
});
type AgentForm = z.infer<typeof agentSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoErr, setPhotoErr] = useState("");
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
      reset({ name: cfg.name, title: cfg.title, greeting: cfg.greeting, calendlyUrl: cfg.calendlyUrl ?? "" });
      if (cfg.photoUrl) setPhotoPreview(cfg.photoUrl);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [reset]);

  const processFile = (file: File) => {
    setPhotoErr("");
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setPhotoErr("Please upload a JPG, PNG, WebP, or GIF image."); return;
    }
    if (file.size > 5 * 1024 * 1024) { setPhotoErr("Image must be under 5MB."); return; }
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
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Customize your agent and platform preferences</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card size="sm">
          <CardHeader className="border-b pb-4">
            <CardTitle>Agent Settings</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-5">
            {/* Photo */}
            <div>
              <Label className="mb-3 block">Agent Profile Picture</Label>
              <div className="flex items-start gap-5 flex-wrap">
                <div className="relative shrink-0">
                  <Avatar className="size-20">
                    <AvatarImage src={photoPreview ?? undefined} alt="Agent" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  {photoPreview && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-xs"
                      onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                      className="absolute -top-1 -right-1"
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </div>
                <div className="flex-1 min-w-48">
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
                    onDragOver={(e) => e.preventDefault()}
                    className="cursor-pointer rounded-lg border-2 border-dashed border-border p-5 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
                  >
                    <Upload className="size-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {photoPreview ? "Click or drop to replace" : "Drop photo here, or click to browse"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP or GIF · Max 5MB</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />
                  {photoErr && <p className="mt-2 text-xs text-destructive">{photoErr}</p>}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="agent-name">Agent Name</Label>
                <Input id="agent-name" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="agent-title">Title</Label>
                <Input id="agent-title" {...register("title")} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="greeting">Greeting Message</Label>
              <Textarea id="greeting" {...register("greeting")} rows={3} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="calendly">Calendly URL</Label>
              <Input id="calendly" {...register("calendlyUrl")} placeholder="https://calendly.com/your-link" />
            </div>

            <div>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {saved ? <Check className="size-4" /> : <Save className="size-4" />}
                {saved ? "Saved!" : "Save Agent Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Website embed */}
      <Card size="sm">
        <CardHeader className="border-b pb-4">
          <CardTitle>Website Integration</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <EmbedGenerator />
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card size="sm">
        <CardHeader className="border-b pb-4">
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col gap-0">
          {[
            { label: "Email Notifications", sub: "Get an email when a new lead is captured", val: emailNotifs, set: setEmailNotifs },
            { label: "In-App Notifications", sub: "Show alerts in the dashboard for new activity", val: inAppNotifs, set: setInAppNotifs },
          ].map((item, i) => (
            <div key={i}>
              {i > 0 && <Separator className="my-3" />}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                </div>
                <Switch checked={item.val} onCheckedChange={item.set} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
