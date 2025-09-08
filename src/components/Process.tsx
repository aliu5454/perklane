'use client';

import React from 'react';
import { useState } from "react";

function Process() {
    const [active, setActive] = useState<"01" | "02" | "03">("01");

    return (
        <section>
            <div className="container max-w-[1200px]">
                <div className="flex flex-col items-center p-20">
                    <div className="relative w-[83%]">
                        <div
                            className="relative h-[480px] w-full flex justify-start items-start border-2 border-white rounded-3xl overflow-hidden">
                            <img
                                src="https://framerusercontent.com/images/gU3HkY1CdAlVmjaQoAPwETeEos.png"
                                alt="Dashboard UI"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="absolute left-0 right-0 bottom-0 z-2 h-[90px]"
                             style={{ background: "linear-gradient(180deg,rgba(244,242,238,0) 0%,rgba(244,242,238,.99) 65%, rgb(244, 242, 238) 100%)"}}
                        />
                    </div>


                    <div className="flex gap-2 rounded-3xl bg-[#f0ece6] p-2">
                        <div id="group"
                             className={`grid gap-2 transition-all duration-500
                              ${active === "03" ? "grid-cols-2 w-1/2" : "grid-cols-3 w-[75%]"}
                            `}
                        >
                            <ProcessStep
                                index="01"
                                title="Easy Setup"
                                text="Create your workspace and invite your team. Get everything ready in minutes."
                                image="https://framerusercontent.com/images/hYqXfHm4SLL09lb8eXINkwGpaY.png"
                                active={active === "01"}
                                customClass={`transition-all duration-300 ${
                                    active === "01" ? "col-span-2" : "col-span-1"
                                }`}
                                onHover={() => setActive("01")}
                            />
                            <ProcessStep
                                index="02"
                                title="Collaborate"
                                text="Assign tasks and keep communication clear. Everyone stays aligned."
                                image="https://framerusercontent.com/images/lpUXQzvzgT4sfG94CeE4ukM15U.png"
                                active={active === "02"}
                                customClass={`transition-all duration-300 ${
                                    active === "02" ? "col-span-2" : "col-span-1"
                                }`}
                                onHover={() => setActive("02")}
                            />
                        </div>
                        <ProcessStep
                            index="03"
                            title="Track growth"
                            text="Use dashboards to monitor progress, trends, and what matters most."
                            image="https://framerusercontent.com/images/XoXQ8sesm7JX8MLXDCX4E5uw.png"
                            active={active === "03"}
                            customClass="transition-all duration-300 flex-1"
                            onHover={() => setActive("03")}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function ProcessStep({ index, title, text, image, active = false, customClass, onHover } :{
    index: string;
    title: string;
    text: string;
    image: string;
    active: boolean;
    customClass?: string;
    onHover?: () => void;
}) {
    return (
        <div
            className={customClass}
            onMouseEnter={onHover}
        >
            <div className="bg-white rounded-[20px] h-[340px] p-6 shadow-[#0000001a_0_0_0_0] overflow-hidden transition-all"
                 style={{transformOrigin: "50% 50% 0px"}}
            >
                <div className="flex justify-between gap-4 h-full">
                    <div className="flex-1 h-full flex flex-col justify-between shrink-0 w-[220px]">
                        <p className="text-lg text-[#AEAEAE]">{index}</p>
                        <div className="flex flex-col gap-4">
                            <h5 className="text-[26px]">
                                {title}
                            </h5>
                            <p className="">
                                {text}
                            </p>
                        </div>
                    </div>

                    {active &&
                        <div className="relative w-[220px] h-full rounded-2xl overflow-hidden origin-[50%_50%_0]">
                            <div className="absolute inset-0">
                                <img
                                    src="https://framerusercontent.com/images/42I2Ca6MGWWXgCMIC2PlpemkZ0.png?scale-down-to=512"
                                    alt="Step Bg"
                                    className="h-full w-full object-cover"
                                />
                                <div className="absolute top-[20px] left-[20px] h-[351px] w-[120%] rounded-2xl overflow-hidden border-2 border-white">
                                    <img
                                        src={image}
                                        alt="Step Image"
                                        className="h-full w-full object-cover"
                                    />
                            </div>
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}

export default Process;
