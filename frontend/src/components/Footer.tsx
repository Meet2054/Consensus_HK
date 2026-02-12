"use client";

import Link from "next/link";

const Footer = ({ className }: { className?: string }) => (
  <footer className="flex w-full justify-center gap-8 border-t p-4 z-20 text-white">
    <div className="text-base font-bold uppercase opacity-60 transition-all press-start-2p-regular">
      &copy; {new Date().getFullYear()} PREDICT
    </div>
    <p className="press-start-2p-regular">
      CONSENSUS 2026
    </p>
  </footer>
);

export default Footer;
