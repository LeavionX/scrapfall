import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"SCRAPFALL — Junkyard Mech Co-op",description:"Pilot a heavy mech with up to seven friends. Defend the salvage core in a retro first-person junkyard shooter."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
