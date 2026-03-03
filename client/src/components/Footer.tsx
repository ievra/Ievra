import { SiFacebook, SiInstagram, SiTiktok } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="bg-black py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <p className="text-white/40 text-xs font-light">
          Copyright © {new Date().getFullYear()} IEVRA. All rights reserved.
        </p>
        <div className="flex items-center gap-5">
          <a
            href="https://www.facebook.com/ievra.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white transition-colors"
          >
            <SiFacebook size={16} />
          </a>
          <a
            href="https://www.instagram.com/ievra.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white transition-colors"
          >
            <SiInstagram size={16} />
          </a>
          <a
            href="https://www.tiktok.com/@ievra.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white transition-colors"
          >
            <SiTiktok size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}
