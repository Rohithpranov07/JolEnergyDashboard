"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
  href?: string;
}

function DisplayCard({
  className,
  icon,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  titleClassName = "text-blue-400",
  href = "/dashboard",
}: DisplayCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex h-[4.5rem] w-[15rem] -skew-y-[8deg] select-none flex-col justify-between rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-2 transition-all duration-700",
        "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[13rem] after:bg-gradient-to-l after:from-[#060D1A] after:to-transparent after:content-['']",
        "hover:border-white/20 hover:bg-white/10",
        "[&>*]:flex [&>*]:items-center [&>*]:gap-1.5",
        "cursor-pointer",
        className
      )}
    >
      <div>
        <span className="relative inline-block rounded-full bg-white/10 p-1">
          {icon}
        </span>
        <p className={cn("text-sm font-semibold", titleClassName)}>{title}</p>
      </div>
      <p className="whitespace-nowrap text-xs text-white/70">{description}</p>
      <p className="text-white/35 text-[10px]">{date}</p>
    </Link>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
      {(cards ?? []).map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}
