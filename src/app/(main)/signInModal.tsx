"use client";
import { proxy } from "valtio";

export const signInModal = proxy({
  isOpen: false,
  setIsOpen: (isOpen: boolean) => {
    signInModal.isOpen = isOpen;
  },
});
