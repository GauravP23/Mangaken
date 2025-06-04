import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface MangaSectionProps {
  title: string;
  children: ReactNode;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

const MangaSection = ({ title, children, showViewAll = true, onViewAll }: MangaSectionProps) => {
  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
          <span className="w-1 h-8 bg-red-600 rounded"></span>
          {title}
        </h2>
        {showViewAll && (
          <Button
            variant="ghost"
            className="text-red-400 hover:text-red-300 hover:bg-gray-800 group"
            onClick={onViewAll}
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </Button>
        )}
      </div>
      {children}
    </section>
  );
};

export default MangaSection;
