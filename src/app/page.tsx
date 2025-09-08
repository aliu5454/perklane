'use client'
import Navbar from "@/components/layout/NavBar";
import Header from "@/components/Header";
import Process from "@/components/Process";
import Features from "@/components/Features";
import Faqs from "@/components/Faqs";
import Footer from "@/components/layout/Footer";
import CTA from "@/components/CTA";

export default function Home() {
  return (
    <main>
        <Navbar />
        <Header />
        <Process />
        <Features />
        <Faqs />
        <CTA />
        <Footer />

        <div className="fixed z-10 bottom-0 left-0 right-0 h-[25px]" style={{ backdropFilter: "blur(3px)" }}></div>
    </main>
  );
}
