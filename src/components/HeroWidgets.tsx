import React from 'react';

function HeroWidgets() {
    const customers = [
        {
            name: "Maggie Johns",
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
        { day: "M", y: 17, r: 14, b: 14 },
        { day: "T", y: 41, r: 14, b: 26 },
        { day: "W", y: 19, r: 36, b: 14 },
        { day: "T", y: 22, r: 14, b: 40 },
        { day: "F", y: 31, r: 14, b: 14 },
        { day: "S", y: 11, r: 25, b: 14 },
        { day: "S", y: 17, r: 14, b: 14 },
    ];

    return (
        <>
            <section
                className="absolute top-[8px] left-[6px] w-[320px] lg:w-[460px] rotate-[2deg] flex flex-col gap-4 lg:gap-6 py-4 lg:py-6 bg-white/60 rounded-2xl border-[1.3px] lg:border-2 rounded-[14px] lg:rounded-[20px] border-white shadow-[-3px_15px_25px_#68635026]">
                {/* Header */}
                <div className="flex items-center justify-between px-6">
                    <h2 className="text-[13px] lg:text-lg font-semibold">Customers</h2>
                    <button className="flex items-center gap-1 text-[10px] lg:text-sm text-[#1A1A1A]">
                        Sort by Newest
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                        </svg>
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
                            <button className="hidden text-gray-500 hover:text-black">⋮</button>
                        </li>
                    ))}
                </ul>

                {/* Footer Button */}
                <div className="flex justify-between px-6">
                    <button className="inline-flex items-center gap-2 text-sm font-medium text-black hover:underline">
                        All customers
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>
            </section>


            <section
                className="absolute bottom-[8px] right-[8px] w-[240px] lg:w-[304px] -rotate-[3deg] flex flex-col gap-5 py-[28px] px-8 bg-white/40 rounded-2xl border-[1.6px] lg:border-2 rounded-[16px] lg:rounded-[20px] border-white shadow-[-3px_15px_25px_#68635026]"
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
                                    className="bg-[#84e6f6] rounded-t-[4px]"
                                    style={{height: `${item.b}px`}}
                                />
                                <div
                                    className="bg-[#f7a49e]"
                                    style={{height: `${item.r}px`}}
                                />
                                <div
                                    className="bg-[#fecd1a]"
                                    style={{height: `${item.y}px`}}
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
