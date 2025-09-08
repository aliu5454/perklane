"use client";

import Link from "next/link";

export default function Footer() {
    return (
        <footer className="overflow-hidden p-5">
            <div className="bg-[#f0ece6] rounded-3xl">
                <div className="container max-w-[1200px] mx-auto">
                    <div className="flex flex-col gap-20 px-10 py-10 xl:p-16 xl:px-[60px]">
                        <div className="flex items-center justify-between">
                            {/* Newsletter */}
                            <div className="flex flex-col gap-5 w-1/2">
                                <h4 className="!text-foreground text-[30px]">
                                    Sign up for our newsletter
                                </h4>
                                <form className="relative flex">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="name@email.com"
                                        className="w-full rounded-full px-4 py-3 text-base border-none outline-none bg-[#f4f2ee] text-black"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-[5px] top-[5px] bottom-[5px] cursor-pointer rounded-full bg-black text-white px-6 font-medium shadow"
                                    >
                                        Subscribe
                                    </button>
                                </form>
                            </div>

                            {/* Navigation */}
                            <div className="flex gap-10 items-start">
                                <h6 className="!text-foreground text-xl">Pages</h6>
                                <ul className="space-y-2 text-lg">
                                    <li>
                                        <Link href="/" className="text-black p-1">
                                            Home
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/about" className="text-black p-1">
                                            About
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/#pricing" className="text-black p-1">
                                            Pricing
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/case-studies" className="text-black p-1">
                                            Case Studies
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex items-end justify-between">
                            {/* Socials */}
                            <div className="flex flex-col gap-5">
                                <div className="flex gap-3">
                                    <a
                                        href="https://x.com"
                                        target="_blank"
                                        rel="noopener"
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 hover:bg-white/70"
                                    >
                                        <span className="sr-only">Twitter</span>
                                        <svg
                                            className="w-5 h-5 text-black"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                d="M21 5.5l-6.5 6.5 6.5 6.5h-2.5L12 14l-6.5 4.5H3l6.5-6.5L3 5.5h2.5L12 10l6.5-4.5H21z"/>
                                        </svg>
                                    </a>
                                    <a
                                        href="https://instagram.com"
                                        target="_blank"
                                        rel="noopener"
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 hover:bg-white/70"
                                    >
                                        <span className="sr-only">Instagram</span>
                                        <svg
                                            className="w-5 h-5 text-black"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2c1.6 0 3 1.4 3 3v10c0 1.6-1.4 3-3 3H7c-1.6 0-3-1.4-3-3V7c0-1.6 1.4-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.5-.9a1.1 1.1 0 100 2.2 1.1 1.1 0 000-2.2z"/>
                                        </svg>
                                    </a>
                                    <a
                                        href="https://linkedin.com"
                                        target="_blank"
                                        rel="noopener"
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 hover:bg-white/70"
                                    >
                                        <span className="sr-only">LinkedIn</span>
                                        <svg
                                            className="w-5 h-5 text-black"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4v12h-4V8zM8.5 8h3.7v1.6h.1c.5-1 1.7-2.1 3.6-2.1 3.8 0 4.5 2.5 4.5 5.7V20h-4v-5.5c0-1.3 0-3-1.8-3s-2 1.4-2 2.9V20h-4V8z"/>
                                        </svg>
                                    </a>
                                </div>
                                <a
                                    href="mailto:hello@perklane.io"
                                    className="footer-mail text-black hover:text-foreground"
                                >
                                    hello@perklane.io
                                </a>
                            </div>

                            {/* Contact */}

                            <p className="">
                                Designed by Lunis. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
