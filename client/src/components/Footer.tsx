
import { Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-content-frame border-t border-border w-full py-4 sm:py-6 lg:py-8 mt-auto">
      <div className="flex flex-col items-center justify-center gap-2 px-2 sm:px-4">
        <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-wide mb-1">Manga Ken</span>
        <span className="text-secondary-gray text-xs sm:text-sm lg:text-base mb-2 text-center">All right reserved to its corresponding developer</span>
        <a
          href="https://github.com/GauravP23/Mangaken"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-purple-500 hover:text-purple-400 text-sm sm:text-base lg:text-lg font-semibold group"
        >
          <span className="">Github</span>
          <Github className="inline w-4 h-4 sm:w-5 sm:h-5 text-purple-500 group-hover:text-purple-400 transition-colors" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
