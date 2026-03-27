import { SiFacebook, SiInstagram, SiTiktok } from "react-icons/si";
import upseinLogo from "@assets/UpSEIN_Logo_1774251344290.png";

export default function Footer() {
  return (
    <footer className="bg-black py-6 px-4 sm:px-6 lg:px-8">
      {/* Mobile: 2 rows. Desktop: 1 row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        {/* Row 1 on mobile: social icons aligned right */}
        <div className="flex items-center justify-end sm:order-2 gap-5">
          <a href="https://www.facebook.com/ievra.vn" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
            <SiFacebook size={16} />
          </a>
          <a href="https://www.instagram.com/ievra.vn" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
            <SiInstagram size={16} />
          </a>
          <a href="https://www.tiktok.com/@ievra.vn" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
            <SiTiktok size={16} />
          </a>
          <a href="https://upsein.com" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-1.5 group" title="Developed by UpSEIN">
            <span className="text-white/30 text-[12px] font-light group-hover:text-white/50 transition-colors">Developed by</span>
            <img src={upseinLogo} alt="UpSEIN" className="h-6 w-auto grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
          </a>
        </div>

        {/* Row 2 on mobile: copyright + developed by on same line */}
        <div className="flex items-center justify-between sm:justify-start sm:order-1 gap-4">
          <p className="text-white/40 text-xs font-light">
            Copyright © {new Date().getFullYear()} IEVRA. All rights reserved.
          </p>
          <a href="https://upsein.com" target="_blank" rel="noopener noreferrer" className="flex sm:hidden items-center gap-1.5 group flex-shrink-0" title="Developed by UpSEIN">
            <span className="text-white/30 text-[12px] font-light group-hover:text-white/50 transition-colors">Developed by</span>
            <img src={upseinLogo} alt="UpSEIN" className="h-6 w-auto grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
          </a>
        </div>
      </div>
    </footer>
  );
}
