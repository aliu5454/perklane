'use client';

import React from 'react';

import Button from "@/components/Button";
import ClientMarquee from "@/components/ClientMarquee";
import CTAButton from "@/components/CTAButton";
import HeroWidgets from "@/components/HeroWidgets";
import Image from "next/image";

function Header() {
    return (
        <>
            <header className="pt-20 relative z-[4] flex flex-col gap-16 overflow-hidden">
                <div className="">
                    <div className="container max-w-[1200px] mx-auto pt-10 lg:pt-20 px-6 lg:px-16 xl:px-20">
                        <div className="flex flex-col max-xl:items-center xl:flex-row xl:justify-between gap-12">
                            <div
                                className="flex flex-col max-xl:items-center gap-8 xl:gap-[44px] max-xl:max-w-[600px] max-xl:w-full max-lg:mx-auto xl:w-[41%]">
                                    <div className="hero-section">
                                        <div className="hero-header text-center xl:text-start">
                                            <h1>Strategy and growth for modern teams</h1>
                                            <p className="text-lg text-[#605f5f] leading-[1.4em]">
                                                Grovia partners with startups to streamline operations, elevate team
                                                performance,
                                                and build a foundation for lasting success.
                                            </p>
                                        </div>
                                    </div>

                                <div className="flex items-center justify-center xl:justify-start gap-3">
                                    <CTAButton label="Get started" />
                                    <Button label="Contact us"/>
                                </div>
                            </div>

                            <div className="relative w-full lg:max-w-[600px] lg:w-[75%] xl:w-[49%] h-[270px] lg:h-[400px] xl:h-[416px] w-[75%] max-xl:mx-auto">
                                <Image
                                    src="/images/herographictest.png"
                                    alt="Hero Graphic"
                                    fill
                                    className="object-contain"
                                />
                                {/*<HeroWidgets/>*/}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <ClientMarquee/>
                </div>
            </header>
        </>
    );
}

export default Header;
