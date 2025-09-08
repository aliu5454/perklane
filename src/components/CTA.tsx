'use client';

import CTAButton from "@/components/CTAButton";

const profiles = [
    {
        src: "https://framerusercontent.com/images/5JOZsibBgQ896ZHozxgNAzUBVR4.png",
        alt: "Profile 1",
    },
    {
        src: "https://framerusercontent.com/images/owSfgEkhkT1JYpnzI1JOV2l6ql8.png",
        alt: "Profile 2",
    },
    {
        src: "https://framerusercontent.com/images/DpVLrc4ydDENH7Z3XC0cKzA6Y8.png",
        alt: "Profile 3",
    },
    {
        src: "https://framerusercontent.com/images/eAG5eHnKXcFvgXecMbbazevyI.png",
        alt: "Profile 4",
    },
];


export default function CTA() {
    return (
        <section className="w-full p-5">
            <div className="relative overflow-hidden rounded-4xl">
                {/* Background */}
                <div className="absolute inset-0">
                    <img
                        src="https://framerusercontent.com/images/VOQqXfb1vcL0G4SHaoMKFhqAg.png?width=1200&height=800"
                        alt="Background"
                        className="object-cover w-full h-full"
                    />
                </div>

                {/* Content */}
                <div className="container mx-auto max-w-[1200px]">
                    <div className="relative z-[2] px-20 py-16 flex justify-between text-white">
                        {/* Left Info */}
                        <div className="flex flex-col justify-between">
                            <div className="flex flex-col gap-5">
                                <h2 className="!text-white xl:text-[40px]">Start your journey</h2>
                                <p className="text-white/80">
                                    Let’s start building something great together.
                                </p>
                            </div>

                            <div className="flex flex-col gap-8">
                                {/* Contact Info */}
                                <div className="flex flex-col gap-1 items-star">
                                    <a
                                        href="tel:12068371232"
                                        className="text-white/80 text-lg hover:text-white/70"
                                    >
                                        206-837-1232
                                    </a>
                                    <a
                                        href="mailto:hello@perklane.io"
                                        className="text-[26px] hover:text-yellow-300 font-albert"
                                    >
                                        hello@perklane.io
                                    </a>
                                </div>

                                {/* Rating */}
                                <div className="flex gap-3 items-center">
                                    <div className="flex flex-wrap justify-center">
                                        {profiles.map((profile, i) => (
                                            <div
                                                key={i}
                                                className="relative rounded-[40px] border border-[#e6e6e6] overflow-hidden w-[32px] h-[32px] ml-[-6px] first:ml-auto"
                                            >
                                                <img
                                                    src={profile.src}
                                                    alt={profile.alt}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-sm">
                                        <p>4.9 / 5 Rated</p>
                                        <p className="text-white/60">Over 9.2k Customers</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Form */}
                        <form
                            className="contact-form max-w-[600px] w-[58%] bg-black/30 rounded-3xl p-8 flex flex-col gap-5">
                            <div>
                                <label className="block mb-1 text-white">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Jane Smith"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-white">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="jane@framer.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-white">Message</label>
                                <textarea
                                    name="message"
                                    placeholder="Enter your message"
                                    required
                                    className="min-h-[120px] resize-none"
                                />
                            </div>

                            <div className="flex justify-start">
                                <CTAButton label="Submit" isYellow={true} />
                            </div>
                        </form>
                    </div>
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/70 rounded-3xl" />
            </div>
        </section>
    );
}
