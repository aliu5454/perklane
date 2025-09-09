'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import CTAButton from "@/components/CTAButton";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="navbar relative flex items-center max-lg:justify-between lg:gap-[56px] justify-between lg:w-[615px] left-[24px] right-[24px] top-[16px] lg:top-[24px] lg:left-1/2 lg:-translate-x-1/2">
            {/* Logo */}
            <div className="navbar-logo shrink-0">
                <Link href="/" aria-label="Home" className="relative block w-[105px] sm:w-[120px] lg:w-[140px] h-10">
                    <Image
                        src="/logos/nav-logo.png"
                        alt="Company Logo"
                        fill
                        priority
                        className="object-contain"
                    />
                </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="navbar-links hidden lg:flex gap-1 items-center justify-center text-black px-2">
                <Link href="/#about" className="nav-link">
                    About
                </Link>
                <Link href="/#feature" className="nav-link">
                    Features
                </Link>
                <Link href="/#pricing" className="nav-link">
                    Pricing
                </Link>
            </div>

            {/* CTA + Hamburger */}
            <div className="navbar-cta">
                <div className="max-lg:hidden">
                    <CTAButton />
                </div>

                {/* Hamburger */}
                <div className="lg:hidden">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center gap-3 rounded-4xl p-2 pl-4 bg-black text-white font-medium leading-[1.1em]"
                        style={{ boxShadow: "0px 5px 15px 0px rgba(0, 0, 0, 0.2)" }}
                    >
                        <span>Menu</span>
                        <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-white text-black">
              {menuOpen ? (
                  // Cross Icon
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                  >
                      <path
                          d="M6 6L18 18M6 18L18 6"
                          stroke="#000000"
                          strokeWidth="2"
                          strokeLinecap="round"
                      />
                  </svg>
              ) : (
                  // Hamburger Icon
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                  >
                      <path
                          d="M4 18L20 18M4 12L20 12M4 6L20 6"
                          stroke="#000000"
                          strokeWidth="2"
                          strokeLinecap="round"
                      />
                  </svg>
              )}
            </span>
                    </button>
                </div>
            </div>

            {/* Mobile Slide Menu */}
            <div
                className={`absolute z-[-1] left-0 w-full bg-white overflow-hidden  rounded-[4.4%] md:rounded-[12px] text-black text-center transition-all duration-500 lg:hidden ${
                    menuOpen ? "h-auto opacity-100 top-[68px]" : "h-px opacity-0 top-0"
                }`}
                style={{ boxShadow: "rgba(224, 215, 198, 0.5) 0px 1px 20px 0px" }}
            >
                <div className="flex flex-col items-center gap-3.5 p-4">
                    <Link href="/#about" className="w-full" onClick={() => setMenuOpen(false)}>
                    About
                </Link>
                    <Link href="/#feature" className="w-full" onClick={() => setMenuOpen(false)}>
                        Features
                    </Link>
                    <Link href="/#pricing" className="w-full" onClick={() => setMenuOpen(false)}>
                        Pricing
                    </Link>
                    <Link href="/#pricing" className="w-full" onClick={() => setMenuOpen(false)}>
                        Contact us
                    </Link></div>
            </div>
        </nav>
    );
}
