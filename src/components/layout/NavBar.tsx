'use client';

import Link from "next/link";
import CTAButton from "@/components/CTAButton";
import Image from "next/image";

export default function Navbar() {
    return (
        <nav className="navbar flex items-center justify-between lg:w-[615px] left-[24px] right-[24px] top-[16px] lg:top-[24px] lg:left-1/2 lg:-translate-x-1/2">
            {/* Logo */}
            <div className="navbar-logo shrink-0">
                <Link href="/" aria-label="Home">
                    <Image
                        src="/logos/nav-logo.png"
                        alt="Company Logo"
                        width={120}
                        height={40}
                        priority
                    />
                </Link>
            </div>

            {/* Navigation Links */}
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

            {/* Call to Action */}
            <div className="navbar-cta">
                <div className="max-lg:hidden">
                    <CTAButton/>
                </div>
                <div className="lg:hidden">
                    {/*Hamburger*/}
                    <button
                        className="flex items-center gap-3 rounded-4xl p-2 pl-4 bg-black text-white"
                        style={{
                            boxShadow: "0px 5px 15px 0px rgba(0, 0, 0, 0.2)"
                        }}
                    >
                        <span>Menu</span>
                        <span
                            className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-white text-black">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 24 24"
                                 fill="none">
                                <path d="M4 18L20 18" stroke="#000000" stroke-width="2" stroke-linecap="round"/>
                                <path d="M4 12L20 12" stroke="#000000" stroke-width="2" stroke-linecap="round"/>
                                <path d="M4 6L20 6" stroke="#000000" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
