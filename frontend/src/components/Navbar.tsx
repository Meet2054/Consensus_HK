import { ConnectButton } from "@rainbow-me/rainbowkit";
import React from "react";
import useToken from "../hooks/useToken";
import Link from "next/link";
import { LuAlignJustify, LuMinus } from "react-icons/lu";

export default function Navbar() {
  const { userBalance } = useToken();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="relative bg-darkgreen pt-2 z-30 ">
      {/* Main Navbar */}
      <div className="flex flex-row justify-between items-center p-5 ">
        <Link href="/">
          <p className="text-white press-start-2p-regular">PREDICT</p>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex flex-row justify-center items-center gap-5 text-teal-300">
          <Link href="/profile">[View Profile]</Link>
          <Link href="/markets">[Prediction Markets]</Link>
          <Link href="/markets/view">[View Markets]</Link>
          <div>[{(Number(userBalance) / 10 ** 18).toLocaleString()} USDC]</div>
          <ConnectButton showBalance={false} />
        </div>

        {/* Mobile Menu Icon */}
        <div className="md:hidden flex items-center justify-between gap-2">
          {isMenuOpen ? (
            <LuMinus
              className="h-6 w-6 cursor-pointer text-white"
              onClick={toggleMenu}
            />
          ) : (
            <LuAlignJustify
              className="h-6 w-6 cursor-pointer text-white"
              onClick={toggleMenu}
            />
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-darkgreen text-teal-300 p-4">
          <div className="space-y-3">
            <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
              <div className="block">[View Profile]</div>
            </Link>
            <Link href="/markets" onClick={() => setIsMenuOpen(false)}>
              <div className="block">[Prediction Markets]</div>
            </Link>
            <Link href="/markets/view" onClick={() => setIsMenuOpen(false)}>
              <div className="block">[View Markets]</div>
            </Link>
            <div>[{Number(userBalance)} USDC]</div>
            <ConnectButton showBalance={false} />
          </div>
        </div>
      )}
    </div>
  );
}
