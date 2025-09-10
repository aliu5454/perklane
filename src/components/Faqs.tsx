import React from 'react';
import { useState } from "react";

import Button from "@/components/Button";

import {Plus} from "@/utils/icons";

type FAQ = {
    question: string;
    answer: string;
};

const faqs: FAQ[] = [
    {
        question: "How does Perklane work?",
        answer:
            "Perklane lets customers scan a QR code, instantly add your branded loyalty card to Apple or Google Wallet, and automatically collect stamps or rewards with every purchase—no apps, no plastic cards.",
    },
    {
        question: "Do my customers need to download an app?",
        answer:
            "No. Customers simply scan a QR code and their loyalty card appears directly in their phone's native wallet.",
    },
    {
        question: "How are rewards tracked?",
        answer:
            "Every visit or purchase is logged instantly and securely. No manual tracking, no paper cards—Perklane syncs with your checkout flow.",
    },
    {
        question: "Does Perklane integrate with my POS system?",
        answer:
            "Yes. Perklane works alongside most modern POS systems. Even if your POS isn't directly integrated, you can still log visits via QR scan in seconds.",
    },
    {
        question: "How long does it take to get started?",
        answer:
            "You can launch in minutes. Just customize your card, display your QR code, and start rewarding customers right away.",
    },
    {
        question: "Is it secure?",
        answer:
            "Absolutely. Perklane uses the same wallet infrastructure as Apple Pay and Google Wallet, ensuring bank-level encryption and data privacy.",
    },
    {
        question: "How much does it cost?",
        answer:
            "Perklane is designed for small and medium businesses with flexible, affordable plans that scale with you. No hidden fees.",
    },
    {
        question: "Can I customize the loyalty program?",
        answer:
            "Yes. You decide the reward structure (e.g., \"Buy 5, get 1 free\"), branding, and promotions. Your card looks and feels like part of your business.",
    },
    {
        question: "What kind of insights will I get?",
        answer:
            "You'll see new vs. returning customers, redemption rates, and campaign performance, so you can double down on what works.",
    },
    {
        question: "What happens if a customer changes their phone?",
        answer:
            "No problem—the loyalty card is tied to their wallet account. If they switch devices, their rewards come with them.",
    },
];

function Faqs() {
    const [openIndexes, setOpenIndexes] = useState<number[]>([]);

    const toggleFAQ = (index: number) => {
        setOpenIndexes((prev) =>
            prev.includes(index)
                ? prev.filter((i) => i !== index)
                : [...prev, index]
        );
    };

    return (
        <section>
            <div className="container max-w-[1200px]">
                <div className="p-20 max-lg:px-6">
                    <div className="flex flex-col xl:flex-row xl:justify-between max-xl:gap-10">
                        <div className="flex flex-col items-start gap-5 w-full xl:w-[343px] max-w-[600px] flex-none">
                            <h2 className="section-heading">Your questions, answered</h2>
                            <p>
                                Get answers to the most common questions about our
                                platform and services.
                            </p>
                            <Button label="Contact us"/>
                        </div>

                        <div className="w-full xl:w-[58%] flex flex-col gap-2 bg-[#efece6] rounded-3xl p-2">
                            {faqs.map((faq, index) => {
                                const isOpen = openIndexes.includes(index);
                                return (
                                    <div
                                        key={index}
                                        className="faq-item cursor-pointer transition-all duration-300 ease-in-out"
                                        style={{
                                            boxShadow: isOpen ? "#00000026 5px 8px 15px 0" : "",
                                        }}
                                        onClick={() => toggleFAQ(index)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg lg:text-xl pr-3">
                                                {faq.question}
                                            </h3>
                                            <div className="shrink-0">
                                                <div
                                                    className={`w-5 h-5 text-[#aeaeae] transition-transform duration-300 ease-in-out ${
                                                        isOpen ? "rotate-225" : ""
                                                    }`}
                                                >
                                                    <Plus/>
                                                </div>
                                            </div>
                                        </div>
                                        <div 
                                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                            }`}
                                        >
                                            <p className="mt-4 text-gray-600 transform transition-all duration-300 ease-in-out">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Faqs;
