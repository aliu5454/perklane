import React from 'react';
import Button from "@/components/Button";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FAQ = {
    question: string;
    answer: string;
};

const faqs: FAQ[] = [
    {
        question: "What types of companies do you work with?",
        answer:
            "We partner with startups, small businesses, and growing teams across industries. Whether you're in tech, retail, or services, our solutions adapt to your needs.",
    },
    {
        question: "How long does it take to see results?",
        answer:
            "Most clients begin noticing improvements within the first few weeks. For deeper operational changes, we typically see lasting impact within 2 to 3 months.",
    },
    {
        question: "Can Grovia integrate with our existing tools?",
        answer:
            "Yes. Grovia is built to work with a wide range of platforms including Slack, Notion, Google Workspace, and more.",
    },
    {
        question: "Do you offer one-time consultations or ongoing support?",
        answer:
            "Both. You can engage us for one-time strategy sessions or ongoing advisory support depending on your goals and team needs.",
    },
    {
        question: "What does onboarding look like?",
        answer:
            "Our onboarding process is simple and collaborative. We start with a kickoff session, align on goals, and provide a tailored roadmap to guide the next steps.",
    },
];

function Faqs() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section>
            <div className="container max-w-[1200px]">
                <div className="p-20">
                    <div className="flex flex-col xl:flex-row xl:justify-between max-xl:gap-10">
                        <div className="flex flex-col items-start gap-5 w-full xl:w-[343px] max-w-[600px] flex-none">
                            <h2 className="section-heading">
                                Your questions, answered
                            </h2>
                            <p>
                                Get quick answers to the most common questions about our platform and
                                services.
                            </p>
                            <Button label="Contact us"/>
                        </div>

                        <div className="w-full xl:w-[58%] flex flex-col gap-2 bg-[#efece6] rounded-3xl p-2">
                            {faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className="faq-item"
                                    style={{boxShadow: openIndex === index ? '#00000026 5px 8px 15px 0' : ''}}
                                    onClick={() => toggleFAQ(index)}
                                >
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl">{faq.question}</h3>
                                        <ChevronDown
                                            className={`w-5 h-5 transition-transform ${
                                                openIndex === index ? "rotate-180" : ""
                                            }`}
                                        />
                                    </div>
                                    {openIndex === index && (
                                        <p className="mt-4 text-gray-600">{faq.answer}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Faqs;
