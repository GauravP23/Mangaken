
import { Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border w-full py-6 mt-auto">
      <div className="flex flex-col items-center justify-center gap-2 px-4">
        <span className="text-lg sm:text-xl font-black text-foreground tracking-wide">Manga Ken</span>
        <span className="text-muted-foreground text-xs sm:text-sm text-center">All rights reserved to its corresponding developer</span>
        <a
          href="https://github.com/GauravP23/Mangaken"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-primary hover:text-primary/80 text-sm font-semibold group transition-colors"
        >
          <span>Github</span>
          <Github className="w-4 h-4 text-primary group-hover:text-primary/80 transition-colors" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
