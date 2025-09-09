"use client";

import Link from "next/link";

import {ArrowRightBend} from "@/utils/icons";

export default function Footer() {
    return (
        <footer className="overflow-hidden pt-5 px-1 lg:p-5">
            <div className="bg-[#f0ece6] rounded-3xl">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="flex flex-col gap-20 px-6 lg:px-10 py-10 xl:p-16 xl:px-[60px]">
                        <div className="flex max-lg:flex-col max-lg:gap-10 lg:items-center lg:justify-between">
                            {/* Newsletter */}
                            <div className="flex flex-col gap-5 w-full lg:w-1/2">
                                <h4 className="!text-foreground text-[22px] lg:text-[26px] xl:text-[30px]">
                                    Sign up for our newsletter
                                </h4>
                                <form className="relative flex">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="name@email.com"
                                        className="w-full rounded-full px-4 py-3 text-base border-none outline-none bg-[#f4f2ee] text-black h-[51px] placeholder:opacity-70 placeholder:font-medium"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-[5px] top-[5px] bottom-[5px] cursor-pointer rounded-full bg-black text-white px-5 md:px-6 font-medium shadow"
                                    >
                                        Subscribe
                                    </button>
                                </form>
                            </div>

                            {/* Navigation */}
                            <div className="flex gap-8 xl:gap-10 items-start">
                                <div className="flex gap-2">
                                    <div className="w-6 h-6">
                                        <ArrowRightBend />
                                    </div>
                                    <h6 className="!text-foreground text-xl">Pages</h6>
                                </div>
                                <ul className="space-y-2 text-lg">
                                    <li>
                                        <Link href="/" className="text-black p-1">
                                            Home
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/" className="text-black p-1">
                                            About
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/" className="text-black p-1">
                                            Pricing
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/" className="text-black p-1">
                                            Case Studies
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex max-lg:flex-col max-lg:gap-8 lg:items-end lg:justify-between">
                            {/* Socials */}
                            <div className="flex flex-col gap-5">
                                <div className="flex gap-2 text-black">
                                    <a
                                        href="https://x.com"
                                        target="_blank"
                                        rel="noopener"
                                        className="w-[36px] h-[36px] lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-white/40 hover:bg-white/70"
                                    >
                                        <span className="sr-only">Twitter</span>
                                        <div className="w-5 h-5">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polygon points="48 40 96 40 208 216 160 216 48 40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="113.88" y1="143.53" x2="48" y2="216" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="208" y1="40" x2="142.12" y2="112.47" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
                                        </div>
                                    </a>
                                    <a
                                        href="https://instagram.com"
                                        target="_blank"
                                        rel="noopener"
                                        className="w-[36px] h-[36px] lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-white/40 hover:bg-white/70"
                                    >
                                        <span className="sr-only">Instagram</span>
                                        <div className="w-5 h-5">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="40" fill="none" stroke="currentColor" strokeMiterlimit="10" stroke-width="16"/><rect x="32" y="32" width="192" height="192" rx="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="180" cy="76" r="12"/></svg>                                        </div>
                                    </a>
                                    <a
                                        href="https://linkedin.com"
                                        target="_blank"
                                        rel="noopener"
                                        className="w-[36px] h-[36px] lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-white/40 hover:bg-white/70"
                                    >
                                        <span className="sr-only">LinkedIn</span>
                                        <div className="w-5 h-5">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="32" y="32" width="192" height="192" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="120" y1="112" x2="120" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="88" y1="112" x2="88" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M120,140a28,28,0,0,1,56,0v36" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="88" cy="84" r="12"/></svg>                                        </div>
                                    </a>
                                </div>
                                <a
                                    href="mailto:hello@perklane.io"
                                    className="footer-mail text-black hover:text-foreground"
                                >
                                    hello@perklane.io
                                </a>
                            </div>

                            <p>
                                Designed by Lunis. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
