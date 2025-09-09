'use client';

import Link from "next/link";
import {ArrowRight} from "@/utils/icons";

export default function CTAButton({ label = 'Contact us', isYellow = false } :{ label?: string, isYellow?: boolean }) {
    return (
        <Link
            href="/#contact"
            className={`flex items-center gap-3 rounded-4xl font-medium p-2 pl-4 ${isYellow ? 'bg-[#fef7af] text-black':'bg-black text-white'}`}
            style={{
                boxShadow: "0px 5px 15px 0px rgba(0, 0, 0, 0.2)"
            }}
        >
            <span>{label}</span>
            <span className={`flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full ${isYellow? 'bg-black text-white':'bg-white text-black'}`}>
               <div className="w-3.5 h-3.5">
                   <ArrowRight/>
               </div>
            </span>
        </Link>
    );
}
