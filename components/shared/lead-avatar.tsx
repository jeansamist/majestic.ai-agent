import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function LeadAvatar({
  name,
  size = "md",
  className,
}: {
  name: string | null;
  interest?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const sizeCls = { sm: "size-8", md: "size-9", lg: "size-11" }[size];

  return (
    <Avatar className={cn(sizeCls, className)}>
      <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
    </Avatar>
  );
}
