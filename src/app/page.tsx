'use client'
import CTA from "@/components/CTA";
import Faqs from "@/components/Faqs";
import Features from "@/components/Features";
import Header from "@/components/Header";
import BGTexture from "@/components/layout/BGTexture";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/NavBar";
import Process from "@/components/Process";


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

        <BGTexture/>

        <div className="hidden xl:fixed z-10 bottom-0 left-0 right-0 h-[25px]" style={{ backdropFilter: "blur(3px)" }}></div>
    </main>
  );
}
