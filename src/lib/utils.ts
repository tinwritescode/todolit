import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { isAddress } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatName(name: string) {
  if (isAddress(name)) {
    return name.slice(0, 6) + "..." + name.slice(-4);
  }
  return name;
}
