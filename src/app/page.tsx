import CTA from "@/components/CTA";
import Faqs from "@/components/Faqs";
import Features from "@/components/Features";
import Header from "@/components/Header";
import BGTexture from "@/components/layout/BGTexture";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/NavBar";
import Process from "@/components/Process";
import RedirectHandler from "@/components/RedirectHandler";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";


export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // If user is logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <RedirectHandler>
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
    </RedirectHandler>
  );
}
