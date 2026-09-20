import { cn } from "cn";

const SIZES = {
  sm: "h-8 w-8 rounded-[10px] text-xs",
  md: "h-[34px] w-[34px] rounded-[11px] text-xs",
  lg: "h-[50px] w-[50px] rounded-[14px] text-base",
  xl: "h-[78px] w-[78px] rounded-[18px] text-2xl",
} as const;

/** Rounded-square member avatar: photo when there is one, initials otherwise. */
export function MemberAvatar({
  firstName,
  lastName,
  photoUrl,
  size = "sm",
  className,
}: {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        className={cn("flex-none object-cover", SIZES[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "flex flex-none items-center justify-center bg-secondary font-medium text-muted-foreground",
        SIZES[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}
