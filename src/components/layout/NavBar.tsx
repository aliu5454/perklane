'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

import CTAButton from "@/components/CTAButton";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Check if we're on dashboard pages
    const isDashboardPage = pathname?.startsWith('/dashboard');

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Default avatar component
    const DefaultAvatar = ({ size = 40 }: { size?: number }) => (
        <div 
            className="w-full h-full bg-black flex items-center justify-center text-white font-medium"
            style={{ fontSize: `${size * 0.4}px` }}
        >
            {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
    );

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
                    {session && isDashboardPage ? (
                    // Dashboard Navigation
                    <>
                        <Link 
                            href="/dashboard" 
                            className={`nav-link ${pathname === '/dashboard' ? 'font-semibold' : ''}`}
                        >
                            Pass Studio
                        </Link>
                        <Link 
                            href="/dashboard/analytics" 
                            className={`nav-link ${pathname === '/dashboard/analytics' ? 'font-semibold' : ''}`}
                        >
                            Analytics
                        </Link>
                        <Link 
                            href="/dashboard/points" 
                            className={`nav-link ${pathname === '/dashboard/points' ? 'font-semibold' : ''}`}
                        >
                            Points
                        </Link>
                    </>
                ) : (
                    // Main Site Navigation
                    <>
                        <Link href="/#about" className="nav-link">
                            About
                        </Link>
                        <Link href="/#feature" className="nav-link">
                            Features
                        </Link>
                        <Link href="/#pricing" className="nav-link">
                            Pricing
                        </Link>
                    </>
                )}
            </div>

            {/* CTA + Hamburger */}
            <div className="navbar-cta">
                <div className="max-lg:hidden">
                    {status === "loading" ? (
                        <div className="w-10 h-10 bg-gray-200 animate-pulse rounded-full"></div>
                    ) : session ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/60 hover:border-white transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                                style={{ boxShadow: "rgba(224, 215, 198, 0.3) 0px 2px 8px 0px" }}
                            >
                                {session.user?.image ? (
                                    <Image
                                        src={session.user.image}
                                        alt="User avatar"
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <DefaultAvatar size={40} />
                                )}
                            </button>
                            
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-sm rounded-[20px] shadow-lg z-50" style={{ boxShadow: "rgba(224, 215, 198, 0.5) 0px 5px 20px 0px" }}>
                                    <div className="py-3">
                                        <div className="px-4 py-2 text-sm text-foreground border-b border-gray-200">
                                            {session.user?.name || session.user?.email}
                                        </div>
                                        <button
                                            onClick={() => {
                                                signOut();
                                                setDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-black hover:bg-white/60 transition-colors rounded-b-[20px]"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/auth/signin"
                                className="rounded-4xl bg-black text-white border border-black py-3 px-5 flex justify-center items-center h-[44px] text-nowrap font-medium cursor-pointer hover:bg-black hover:text-white transition-colors"
                            >
                                Sign in
                            </Link>
                            {/* <Link
                                href="/auth/signup"
                                className="rounded-4xl bg-black text-white py-3 px-5 flex justify-center items-center h-[44px] text-nowrap font-medium cursor-pointer hover:bg-gray-800 transition-colors"
                            >
                                Sign up
                            </Link> */}
                        </div>
                    )}
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
                    {session && isDashboardPage ? (
                        // Dashboard Navigation (Mobile)
                        <>
                            <Link 
                                href="/dashboard" 
                                className={`w-full ${pathname === '/dashboard' ? 'font-semibold' : ''}`} 
                                onClick={() => setMenuOpen(false)}
                            >
                                Pass Studio
                            </Link>
                            <Link 
                                href="/dashboard/analytics" 
                                className={`w-full ${pathname === '/dashboard/analytics' ? 'font-semibold' : ''}`} 
                                onClick={() => setMenuOpen(false)}
                            >
                                Analytics
                            </Link>
                            <Link 
                                href="/dashboard/points" 
                                className={`w-full ${pathname === '/dashboard/points' ? 'font-semibold' : ''}`} 
                                onClick={() => setMenuOpen(false)}
                            >
                                Points
                            </Link>
                        </>
                    ) : (
                        // Main Site Navigation (Mobile)
                        <>
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
                            </Link>
                        </>
                    )}
                    
                    {/* Mobile Auth Buttons */}
                    <div className="w-full border-t pt-4 mt-2">
                        {session ? (
                            <div className="flex flex-col gap-3 w-full">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/60" style={{ boxShadow: "rgba(224, 215, 198, 0.3) 0px 2px 8px 0px" }}>
                                        {session.user?.image ? (
                                            <Image
                                                src={session.user.image}
                                                alt="User avatar"
                                                width={48}
                                                height={48}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <DefaultAvatar size={48} />
                                        )}
                                    </div>
                                    <span className="text-sm text-center">{session.user?.name || session.user?.email}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        signOut()
                                        setMenuOpen(false)
                                    }}
                                    className="w-full rounded-4xl border border-black py-3 px-5 text-black font-medium hover:bg-black hover:text-white transition-colors"
                                >
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 w-full">
                                <Link
                                    href="/auth/signin"
                                    onClick={() => setMenuOpen(false)}
                                    className="w-full text-center rounded-4xl border border-black py-3 px-5 text-black font-medium hover:bg-black hover:text-white transition-colors"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    onClick={() => setMenuOpen(false)}
                                    className="w-full text-center rounded-4xl bg-black text-white py-3 px-5 font-medium hover:bg-gray-800 transition-colors"
                                >
                                    Sign up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
