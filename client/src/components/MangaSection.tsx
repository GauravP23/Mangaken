import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface MangaSectionProps {
  title: string;
  children: ReactNode;
  subtitle?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  variant?: 'default' | 'highlight';
}

const MangaSection = ({
  title,
  children,
  subtitle,
  showViewAll = true,
  onViewAll,
  variant = 'default'
}: MangaSectionProps) => {
  const isHighlight = variant === 'highlight';
  
  return (
    <section className={`mb-16 ${isHighlight ? 'py-8 px-6 bg-gradient-to-r from-muted to-background rounded-xl border border-border' : ''}`}>
      <div className="flex flex-col mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-white flex items-center gap-2">
            <span className={`w-1 h-8 rounded ${isHighlight ? 'bg-secondary' : 'bg-primary'}`}></span>
            {title}
          </h2>
          {showViewAll && (
            <Button
              variant="ghost"
              className="text-clickable hover:text-primary hover:bg-muted group"
              onClick={onViewAll}
            >
              View All
              <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Button>
          )}
        </div>
        
        {subtitle && (
          <p className="text-secondary-gray mt-2">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  );
};

export default MangaSection;
