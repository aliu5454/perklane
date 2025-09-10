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
            "Customers scan your QR code, add your branded loyalty card to Apple or Google Wallet, and every visit or purchase is logged instantly. No apps to download, no plastic cards to carry—everything lives securely in their phone's native wallet.",
    },
    {
        question: "Does it integrate with my checkout system?",
        answer:
            "Yes. Perklane works alongside most POS systems. If your POS isn't directly integrated, rewards can still be logged instantly via QR scan. Setup takes just minutes—customize your card, display your code, and start rewarding customers right away.",
    },
    {
        question: "How customizable is the program?",
        answer:
            "You choose the reward structure (e.g., \"Buy 5, get 1 free\"), branding, and promotions. Your card looks and feels like part of your business, not a generic loyalty app.",
    },
    {
        question: "What about security and customer data?",
        answer:
            "Perklane uses the same wallet infrastructure as Apple Pay and Google Wallet with bank-level encryption. Customer cards and rewards are tied to their wallet account, so if they change phones, their rewards move with them.",
    },
    {
        question: "How much does it cost?",
        answer:
            "Perklane is built for small and medium businesses with simple, affordable plans that scale with you. No hidden fees.",
    },
    {
        question: "What kind of insights will I get?",
        answer:
            "Track new vs. returning customers, redemption rates, and campaign performance—all in one dashboard—so you know exactly what's working to bring customers back.",
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
