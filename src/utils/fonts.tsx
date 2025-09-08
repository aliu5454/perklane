import {Albert_Sans, Geist} from "next/font/google";

export const geist = Geist({
    variable: "--font-geist",
    subsets: ["latin"],
    weight: ["400", "500", "700"],
});

export const albert = Albert_Sans({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
    variable: '--font-albert',
});
