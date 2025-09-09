"use client";

const logos = [
    "https://framerusercontent.com/images/R2OYvPZhdcTBwh7SRH0mvzywjI.png",
    "https://framerusercontent.com/images/Dh1WasrtFb5FjG7c7ba7QktYpA.png?scale-down-to=512",
    "https://framerusercontent.com/images/EvXJBu5zcC2UE2s1wSux4dNJvxA.png?scale-down-to=512",
    "https://framerusercontent.com/images/DWm8NxN5l4qOWkTkdZ1Q1rLXnDc.png?scale-down-to=1024",
];

export default function ClientMarquee() {
    return (
        <div className="container max-w-[1040px] mx-auto max-md:pt-6">
            <div className="clients-logo flex gap-8 overflow-hidden relative w-full"
                 style={{ maskImage: "linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 12.5%, rgb(0, 0, 0) 87.5%, rgba(0, 0, 0, 0) 100%)" }}
            >
                <ul className="flex animate-marquee gap-8">
                    {logos.concat(logos).map((logo, idx) => (
                        <li key={idx} className="flex-shrink-0 opacity-60">
                            <img
                                src={logo}
                                alt={`Brand ${idx + 1}`}
                                className="h-8 lg:h-16 w-auto object-contain"
                            />
                        </li>
                    ))}
                </ul>

                <ul className="flex animate-marquee gap-8">
                    {logos.concat(logos).map((logo, idx) => (
                        <li key={idx} className="flex-shrink-0 opacity-60">
                            <img
                                src={logo}
                                alt={`Brand ${idx + 1}`}
                                className="h-16 w-auto object-contain"
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
