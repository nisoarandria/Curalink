import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon";
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import { cn } from "@/lib/utils";

type IconProps = Omit<HugeiconsIconProps, "icon"> & {
  icon: HugeiconsIconProps["icon"];
};

function Icon({
  className,
  strokeWidth = 2,
  color = "currentColor",
  ...props
}: IconProps) {
  return (
    <HugeiconsIcon
      className={cn("shrink-0", className)}
      strokeWidth={strokeWidth}
      color={color}
      aria-hidden
      {...props}
    />
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <Icon
      icon={Loading03Icon}
      className={cn("animate-spin", className)}
    />
  );
}

export { Icon, SpinnerIcon };

export { default as Activity01Icon } from "@hugeicons/core-free-icons/Activity01Icon";
export { default as Analytics02Icon } from "@hugeicons/core-free-icons/Analytics02Icon";
export { default as Add01Icon } from "@hugeicons/core-free-icons/Add01Icon";
export { default as AiBrain01Icon } from "@hugeicons/core-free-icons/AiBrain01Icon";
export { default as AlertCircleIcon } from "@hugeicons/core-free-icons/AlertCircleIcon";
export { default as Appointment01Icon } from "@hugeicons/core-free-icons/Appointment01Icon";
export { default as ArrowLeft01Icon } from "@hugeicons/core-free-icons/ArrowLeft01Icon";
export { default as ArrowRight01Icon } from "@hugeicons/core-free-icons/ArrowRight01Icon";
export { default as Baby01Icon } from "@hugeicons/core-free-icons/Baby01Icon";
export { default as BloodIcon } from "@hugeicons/core-free-icons/BloodIcon";
export { default as BloodPressureIcon } from "@hugeicons/core-free-icons/BloodPressureIcon";
export { default as BodyWeightIcon } from "@hugeicons/core-free-icons/BodyWeightIcon";
export { default as Bone01Icon } from "@hugeicons/core-free-icons/Bone01Icon";
export { default as BookOpen01Icon } from "@hugeicons/core-free-icons/BookOpen01Icon";
export { default as Bookmark01Icon } from "@hugeicons/core-free-icons/Bookmark01Icon";
export { default as BotIcon } from "@hugeicons/core-free-icons/BotIcon";
export { default as Calendar01Icon } from "@hugeicons/core-free-icons/Calendar01Icon";
export { default as CallIcon } from "@hugeicons/core-free-icons/CallIcon";
export { default as Cancel01Icon } from "@hugeicons/core-free-icons/Cancel01Icon";
export { default as ClipboardIcon } from "@hugeicons/core-free-icons/ClipboardIcon";
export { default as Clock01Icon } from "@hugeicons/core-free-icons/Clock01Icon";
export { default as Delete01Icon } from "@hugeicons/core-free-icons/Delete01Icon";
export { default as Dollar01Icon } from "@hugeicons/core-free-icons/Dollar01Icon";
export { default as File01Icon } from "@hugeicons/core-free-icons/File01Icon";
export { default as FlashIcon } from "@hugeicons/core-free-icons/FlashIcon";
export { default as FloppyDiskIcon } from "@hugeicons/core-free-icons/FloppyDiskIcon";
export { default as HeartAddIcon } from "@hugeicons/core-free-icons/HeartAddIcon";
export { default as Home01Icon } from "@hugeicons/core-free-icons/Home01Icon";
export { default as Hospital01Icon } from "@hugeicons/core-free-icons/Hospital01Icon";
export { default as Idea01Icon } from "@hugeicons/core-free-icons/Idea01Icon";
export { default as Image01Icon } from "@hugeicons/core-free-icons/Image01Icon";
export { default as InformationCircleIcon } from "@hugeicons/core-free-icons/InformationCircleIcon";
export { default as Location01Icon } from "@hugeicons/core-free-icons/Location01Icon";
export { default as Login01Icon } from "@hugeicons/core-free-icons/Login01Icon";
export { default as Logout01Icon } from "@hugeicons/core-free-icons/Logout01Icon";
export { default as Notification01Icon } from "@hugeicons/core-free-icons/Notification01Icon";
export { default as PencilEdit01Icon } from "@hugeicons/core-free-icons/PencilEdit01Icon";
export { default as Pulse01Icon } from "@hugeicons/core-free-icons/Pulse01Icon";
export { default as Search01Icon } from "@hugeicons/core-free-icons/Search01Icon";
export { default as SecurityCheckIcon } from "@hugeicons/core-free-icons/SecurityCheckIcon";
export { default as SentIcon } from "@hugeicons/core-free-icons/SentIcon";
export { default as Upload01Icon } from "@hugeicons/core-free-icons/Upload01Icon";
export { default as UserAdd01Icon } from "@hugeicons/core-free-icons/UserAdd01Icon";
export { default as UserGroupIcon } from "@hugeicons/core-free-icons/UserGroupIcon";
export { default as UserIcon } from "@hugeicons/core-free-icons/UserIcon";
export { default as ViewIcon } from "@hugeicons/core-free-icons/ViewIcon";
export { default as ViewOffIcon } from "@hugeicons/core-free-icons/ViewOffIcon";
export { default as WeightScale01Icon } from "@hugeicons/core-free-icons/WeightScale01Icon";
