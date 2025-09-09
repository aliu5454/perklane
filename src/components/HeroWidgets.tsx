import React from 'react';

function HeroWidgets() {
    const customers = [
        {
            name: "Maggie Johnson",
            company: "Oasis Organic Inc.",
            avatar: "https://framerusercontent.com/images/DpVLrc4ydDENH7Z3XC0cKzA6Y8.png",
            isActive: true
        },
        {
            name: "Chris Friedkly",
            company: "Supermarket Villanova",
            avatar: "https://framerusercontent.com/images/yH9xkXhZMdMzsKt4c6ybgHCFhsI.png",
            isActive: false
        },
        {
            name: "Gael Harry",
            company: "New York Finest Fruits",
            avatar: "https://framerusercontent.com/images/5JOZsibBgQ896ZHozxgNAzUBVR4.png",
            isActive: false
        },
    ];

    const data = [
        { day: "M", yClass: "h-[12px] lg:h-[17px]", rClass: "h-[11px] lg:h-[14px]", bClass: "h-[11px] lg:h-[14px]" },
        { day: "T", yClass: "h-[33px] lg:h-[41px]", rClass: "h-[11px] lg:h-[14px]", bClass: "h-[20px] lg:h-[26px]" },
        { day: "W", yClass: "h-[14px] lg:h-[19px]", rClass: "h-[29px] lg:h-[36px]", bClass: "h-[11px] lg:h-[14px]" },
        { day: "T", yClass: "h-[17px] lg:h-[22px]", rClass: "h-[11px] lg:h-[14px]", bClass: "h-[32px] lg:h-[40px]" },
        { day: "F", yClass: "h-[24px] lg:h-[31px]", rClass: "h-[11px] lg:h-[14px]", bClass: "h-[11px] lg:h-[14px]" },
        { day: "S", yClass: "h-[7px] lg:h-[11px]", rClass: "h-[20px] lg:h-[25px]", bClass: "h-[11px] lg:h-[14px]" },
        { day: "S", yClass: "h-[12px] lg:h-[17px]", rClass: "h-[11px] lg:h-[14px]", bClass: "h-[11px] lg:h-[14px]" }
    ]


    return (
        <>
            <section
                className="absolute top-0 left-0 lg:top-[8px] lg:left-[6px] w-[320px] lg:w-[460px] rotate-[2deg] flex flex-col gap-4 lg:gap-6 py-4 lg:py-6 bg-white/60 border-[1.3px] lg:border-2 rounded-[14px] lg:rounded-[20px] border-white shadow-[-3px_15px_25px_#68635026]">
                {/* Header */}
                <div className="flex items-center justify-between px-6">
                    <h2 className="text-[13px] lg:text-lg font-semibold">Customers</h2>
                    <button className="flex items-center gap-1 text-[10px] lg:text-sm text-[#1A1A1A] leading-[1.3em]">
                        Sort by Newest
                        <div className="w-3 h-3">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="208 96 128 176 48 96" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
                        </div>
                    </button>
                </div>

                {/* Customers List */}
                <ul className="px-2">
                    {customers.map((c, idx) => (
                        <li key={idx} className="flex items-center justify-between p-[10px] lg:p-4 rounded-[11px] lg:rounded-2xl"
                            style={{backgroundColor: c.isActive ? "#fef7af" : "transparent"}}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-[23px] h-[23px] lg:w-[33px] lg:h-[33px] rounded-full overflow-hidden">
                                    <img
                                        src={c.avatar}
                                        alt={c.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="leading-[1.2em]">
                                    <p className="text-[10px] max-lg:h-[14px] lg:text-sm font-medium text-black flex items-center">
                                        {c.name}
                                    </p>
                                    <p className="text-[8px] max-lg:h-[11px] lg:text-xs text-[#605F5F] flex items-center">
                                        {c.company}
                                    </p>
                                </div>
                            </div>
                            {c.isActive && <div className="flex gap-3">
                                {/* Icon Group */}
                                <div className="flex">
                                    <div className="w-[36px] flex justify-center">
                                        <div className="w-4 h-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                                <rect width="256" height="256" fill="none"/>
                                                <path
                                                    d="M92.69,216H48a8,8,0,0,1-8-8V163.31a8,8,0,0,1,2.34-5.65L165.66,34.34a8,8,0,0,1,11.31,0L221.66,79a8,8,0,0,1,0,11.31L98.34,213.66A8,8,0,0,1,92.69,216Z"
                                                    fill="none" stroke="currentColor" strokeLinecap="round"
                                                    stroke-linejoin="round" stroke-width="16"/>
                                                <line x1="136" y1="64" x2="192" y2="120" fill="none"
                                                      stroke="currentColor" strokeLinecap="round"
                                                      stroke-linejoin="round" stroke-width="16"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="w-[36px] flex justify-center">
                                        <div className="w-4 h-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                                <rect width="256" height="256" fill="none"/>
                                                <path
                                                    d="M128,189.09l54.72,33.65a8.4,8.4,0,0,0,12.52-9.17l-14.88-62.79,48.7-42A8.46,8.46,0,0,0,224.27,94L160.36,88.8,135.74,29.2a8.36,8.36,0,0,0-15.48,0L95.64,88.8,31.73,94a8.46,8.46,0,0,0-4.79,14.83l48.7,42L60.76,213.57a8.4,8.4,0,0,0,12.52,9.17Z"
                                                    fill="none" stroke="currentColor" strokeLinecap="round"
                                                    stroke-linejoin="round" stroke-width="16"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="w-[36px] flex justify-center">
                                        <div className="w-4 h-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                                <rect width="256" height="256" fill="none"/>
                                                <path
                                                    d="M132,216H48a8,8,0,0,1-8-8V124a92,92,0,0,1,92-92h0a92,92,0,0,1,92,92h0A92,92,0,0,1,132,216Z"
                                                    fill="none" stroke="currentColor" strokeLinecap="round"
                                                    stroke-linejoin="round" stroke-width="16"/>
                                                <circle cx="132" cy="128" r="12"/>
                                                <circle cx="88" cy="128" r="12"/>
                                                <circle cx="176" cy="128" r="12"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div></div>

                                {/* Last Icon */}
                                <div className="w-[36px] flex justify-center">
                                    <div className="w-4 h-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                            <rect width="256" height="256" fill="none"/>
                                            <circle cx="128" cy="128" r="12"/>
                                            <circle cx="128" cy="60" r="12"/>
                                            <circle cx="128" cy="196" r="12"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>}
                        </li>
                    ))}
                </ul>

                {/* Footer Button */}
                <div className="flex justify-between px-6">
                    <button className="inline-flex items-center gap-2 text-sm lg:text-sm text-black h-[22px]">
                        All customers

                        <div className="w-3.5 h-3.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                                <rect width="256" height="256" fill="none"/>
                                <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor"
                                        strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/>
                                <line x1="88" y1="128" x2="168" y2="128" fill="none" stroke="currentColor"
                                      strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/>
                                <polyline points="136 96 168 128 136 160" fill="none" stroke="currentColor"
                                          strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/>
                            </svg>
                        </div>
                    </button>
                </div>
            </section>


            <section
                className="absolute bottom-[-22px] md:bottom-[2px] lg:bottom-[8px] xl:bottom-[0px] right-[-5px] md:right-[8px] w-[240px] lg:w-[304px] -rotate-[3deg] flex flex-col gap-5 py-[28px] px-8 bg-white/40 border-[1.6px] lg:border-2 rounded-[16px] lg:rounded-[20px] border-white shadow-[-3px_15px_25px_#68635026]"
                style={{ backdropFilter: "blur(5px)" }}
            >
                {/* Top Info */}
                <div className="flex flex-col gap-[2px] lg:gap-1">
                    <div className="flex justify-between text-black text-[9px] lg:text-xs">
                        <p className="opacity-50">Daily Average</p>
                        <p>
                            <span className="text-[#e83043]">+30m</span>
                            <span className="opacity-50"> this week</span>
                        </p>
                    </div>
                    <div>
                        <p className="text-[20px] lg:text-2xl text-black font-medium">2h 20m</p>
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="flex items-end justify-between gap-2">
                    {data.map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-[10px] lg:gap-[14px]">
                            <div className="flex flex-col w-[16px] lg:w-[19px]">
                                <div
                                    className={`bg-[#84e6f6] rounded-t-[4px] ${item.bClass}`}
                                />
                                <div
                                    className={`bg-[#f7a49e] ${item.rClass}`}
                                />
                                <div
                                    className={`bg-[#fecd1a] ${item.yClass}`}
                                />
                            </div>
                            <p className="text-[9px] lg:text-xs font-medium">
                                {item.day}
                            </p>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}

export default HeroWidgets;
