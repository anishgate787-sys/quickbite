import type {Metadata} from 'next';
import './globals.css';
export const metadata: Metadata={title:'QuickBite',description:'Skip the canteen queue. Order ahead.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<div className="site-watermark" style={{fontSize:'11px'}} title="A little campus magic, built with care">BUILT BY KARAN CHAUDHARI</div></body></html>}
