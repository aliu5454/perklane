'use client';

import Link from "next/link";

export default function CTAButton({ label = 'Contact us', isYellow = false } :{ label?: string, isYellow?: boolean }) {
    return (
        <Link
            href="/#contact"
            className={`flex items-center gap-3 rounded-4xl p-2 pl-4 ${isYellow ? 'bg-[#fef7af] text-black':'bg-black text-white'}`}
            style={{
                boxShadow: "0px 5px 15px 0px rgba(0, 0, 0, 0.2)"
            }}
        >
            <span>{label}</span>
            <span className={`flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full ${isYellow? 'bg-black text-white':'bg-white text-black'}`}>
                <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </span>
        </Link>
    );
}
