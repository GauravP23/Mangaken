
import { Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-content-frame border-t border-border w-full py-8 mt-auto">
      <div className="flex flex-col items-center justify-center gap-2">
        <span className="text-2xl font-bold text-white tracking-wide mb-1">Manga Ken</span>
        <span className="text-secondary-gray text-base mb-2">All right reservers to its corresponding developer</span>
        <a
          href="https://github.com/GauravP23/Mangaken"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-purple-500 hover:text-purple-400 text-lg font-semibold"
        >
          <span className="">Github</span>
          <Github className="inline w-5 h-5 text-purple-500 group-hover:text-purple-400 transition-colors" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
