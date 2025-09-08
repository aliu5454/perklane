'use client';

import React from 'react';
import BGTexture from "@/components/layout/BGTexture";
import CTAButton from "@/components/CTAButton";
import Button from "@/components/Button";
import HeroWidgets from "@/components/HeroWidgets";
import ClientMarquee from "@/components/ClientMarquee";

function Header() {
    return (
        <>
            <header className="pt-20 relative z-[4] flex flex-col gap-16">
                <div className="pt-10 lg:pt-20 px-6 lg:px-16">
                    <div className="container max-w-[1200px] mx-auto">
                        <div className="flex flex-col xl:flex-row xl:justify-between gap-12">
                            <div
                                className="flex flex-col max-xl:items-center gap-8 xl:gap-[44px] max-xl:max-w-[600px] max-xl:w-full max-xl:mx-auto xl:w-[35%]">
                                    <div className="hero-section">
                                        <div className="hero-header text-center xl:text-start">
                                            <h1>Strategy and growth for modern teams</h1>
                                            <p className="text-lg text-[#605f5f]">
                                                Grovia partners with startups to streamline operations, elevate team
                                                performance,
                                                and build a foundation for lasting success.
                                            </p>
                                        </div>
                                    </div>

                                <div className="flex items-center justify-center xl:justify-start gap-3">
                                    <CTAButton/>
                                    <Button label="Contact us"/>
                                </div>
                            </div>

                            <div className="relative w-full lg:max-w-[600px] lg:w-[75%] xl:w-[49%] h-[400px] xl:h-[416px] w-[75%] mx-auto">
                                <HeroWidgets/>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <ClientMarquee/>
                </div>
            </header>


            <BGTexture/>
        </>
    );
}

export default Header;
