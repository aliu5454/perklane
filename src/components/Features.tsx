'use client';

import React from 'react';
import { useState } from "react";
import { ChartLine, Laptop, Stack, UserList } from "@/utils/icons";

function Features() {
    const features = [
        {
            id: 1,
            label: "Client portal",
            icon: <Laptop />,
            title: 'Centralized access for teams and clients',
            text: 'Securely share progress, files, feedback, and timelines with stakeholders. Keep everyone on the same page without switching platforms.',
            image: 'https://framerusercontent.com/images/FYu1jZWbjOddBtUuf68QAaN1Y.png?scale-down-to=1024'
        },
        {
            id: 2,
            label: "KPI tracking",
            icon: <ChartLine />,
            title: 'Measure what matters most',
            text: 'Monitor your team\'s goals and key business metrics in real time. Custom dashboards make insights easy to access and act on.',
            image: 'https://framerusercontent.com/images/A1gzdWReJANo54cCWI3zX4uFwOQ.png'
        },
        {
            id: 3,
            label: "Workflow automation",
            icon: <Stack />,
            title: 'Automate repetitive tasks',
            text: 'Save time with built-in automations that handle reminders, approvals, and task assignments — so your team can focus on high-impact work.',
            image: 'https://framerusercontent.com/images/YAV2ruGFxCKxoKpmyegpIo6Dc9o.png?scale-down-to=512'
        },
        {
            id: 4,
            label: "Team management",
            icon: <UserList />,
            title: 'Built for growing teams',
            text: 'Easily onboard new members, assign roles, and manage access. Keep your organization structured and scalable from day one.',
            image: 'https://framerusercontent.com/images/k9JvsWmwaFu5EjRUms2dFdTEhAs.png'
        },
    ];

    const [active, setActive] = useState(1);
    return (
        <section id="feature">
            <div className="container max-w-[1200px]">
                <div className="p-20 max-lg:px-6">
                    <div className="flex flex-col gap-10">
                        <div className="max-w-[610px] w-full mx-auto text-center">
                            <div className="flex flex-col items-center gap-5">
                                <h2 className="section-heading">Built for high performance</h2>
                                <p className="text-lg">
                                    Grovia gives your team everything it needs to stay aligned, track performance, and
                                    scale
                                    with confidence — all in one place.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* Tabs */}
                            <div className="flex max-xl:flex-col gap-2 rounded-3xl xl:rounded-[40px] bg-[#f0ece6] p-2">
                                {features.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = active === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActive(tab.id)}
                                            className={`relative flex w-full justify-center items-center gap-2 rounded-4xl xl:rounded-3xl p-4 xl:py-3.5 text-black cursor-pointer transition 
                                                  ${isActive ? "opacity-100 bg-white" 
                                                    : "opacity-50 hover:bg-white/70"}`}
                                            style={{ boxShadow: isActive ? "#0000001a 0px 4px 10px 0px" : "" }}
                                        >
                                            <div className="w-[20px] h-[20px]">{Icon}</div>
                                            {/*<Icon size={20} className="shrink-0"/>*/}
                                            <span className="text-lg font-medium leading-[1.4em]">{tab.label}</span>

                                            {/* background highlight */}
                                            {isActive && (
                                                <div
                                                    className="absolute inset-0 rounded-[64px] bg-white/80 shadow-md -z-10"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="bg-white/60 flex max-xl:flex-col xl:items-center gap-8 xl:gap-10 p-2 max-xl:pb-10 xl:pr-10 rounded-3xl h-full">
                                <div className="h-[175px] sm:h-[582px] xl:h-[389px] xl:w-[522px]">
                                    <div className="relative w-full h-full rounded-2xl overflow-hidden">
                                        <img
                                            src="https://framerusercontent.com/images/ONQIsStqeLWeki3a2HBJUTgVIII.png"
                                            alt="Abstract background"
                                            className="w-full h-full object-fill"
                                        />
                                        {active - 1 === 0 && <div className="absolute top-[32px] left-[32px] w-full h-full flex items-center shadow-[#00000040_0_4px_20px_0] rounded-2xl overflow-hidden">
                                            <img
                                                src={features[active-1].image}
                                                alt="Customer card"
                                                className="w-full h-full object-cover object-top-left"
                                            />
                                        </div>
                                        }
                                        {active - 1 === 1 && <div className="flex justify-center items-center">
                                            <div
                                                className="absolute xl:right-[32px] left-1/2 xl:left-[32px] top-[52%] max-xl:-translate-x-1/2 -translate-y-1/2 max-sm:w-[202px] h-[130px] sm:h-[290px] md:h-[311px] max-xl:w-[500px]">
                                                <div className="shadow-[#00000040_0_4px_20px_0] rounded-2xl overflow-hidden">
                                                    <img
                                                    src={features[active - 1].image}
                                                    alt="Customer card"
                                                    className="w-full h-full object-cover object-top-left"
                                                    />
                                                </div>
                                                <div
                                                    className="absolute bg-white/20 rounded-xl h-[115px] sm:h-[197px] md:h-[324px] -top-[16px] left-1/2 -translate-x-1/2 aspect-[1.21/1]"></div>
                                                <div
                                                    className="absolute bg-white/20 rounded-xl h-[125px] sm:h-[192px] md:h-[317px] -top-[8px] left-1/2 -translate-x-1/2 aspect-[1.34/1]"></div>
                                            </div>
                                        </div>
                                        }
                                        {active - 1 === 2 && <div
                                            className="absolute top-1/2 left-1/2 h-[140px] sm:h-[517px] xl:h-[297px] aspect-square -translate-x-1/2 -translate-y-1/2 flex justify-center items-center">
                                            <div
                                                className="absolute inset-0 shadow-[#00000026_-2px_4px_15px_0] rotate-[3deg] rounded-2xl aspect-[1.02/1]">
                                                <img
                                                    src={features[active - 1].image}
                                                    alt="Customer card"
                                                    className="w-full h-full object-cover object-top-left"
                                                />
                                            </div>
                                            <div
                                                className="absolute bg-white/10 rounded-2xl -left-[16px] h-full w-full top-[8px] border-dashed border border-white"></div>
                                        </div>
                                        }
                                        {active - 1 === 3 && <div>
                                            <div
                                                className="absolute top-[44px] right-[32px] left-[32px] flex items-center shadow-[#00000040_0_4px_20px_0] rounded-2xl overflow-hidden">
                                                <img
                                                    src={features[active - 1].image}
                                                    alt="Customer card"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="absolute top-[20px] w-[61%] max-w-[280px] left-1/2 -translate-x-1/2" style={{ filter: "drop-shadow(rgba(0, 0, 0, 0.2) 0px 4px 6px)" }}>
                                                <img src="https://framerusercontent.com/images/fI8c4AtzWSeOT2A8acLupLXlM.png" alt=""/>
                                            </div>
                                        </div>
                                        }
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-col items-start gap-4 xl:gap-6 xl:w-[430px] shrink-0 max-xl:px-6">
                                    <div className="inline-block text-black rounded-[62px] bg-[#fef7af] px-3 py-2 uppercase text-xs font-medium">
                                        {features[active-1].label}
                                    </div>
                                    <h3 className="text-2xl lg:text-[28px] xl:text-[36px] leading-[1.3em]">
                                        {features[active-1].title}
                                    </h3>
                                    <p>
                                        {features[active-1].text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Features;
