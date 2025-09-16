import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-float" style={{ background: 'radial-gradient(60% 60% at 50% 50%, hsl(var(--forest-green) / 0.25), transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s', background: 'radial-gradient(60% 60% at 50% 50%, hsl(var(--teal) / 0.22), transparent)' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s', background: 'radial-gradient(60% 60% at 50% 50%, hsl(var(--leaf-green) / 0.18), transparent)' }} />
      </div>

      <div className={`container mx-auto px-6 text-center z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold mb-6">
            Hi, I'm{' '}
            <span className="text-gradient typewriter inline-block">
              Dinesh
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '3s' }}>
            Full Stack Developer specializing in modern web technologies
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '3.5s' }}>
            <Button 
              size="lg" 
              className="bg-gradient-hero hover:shadow-glow transition-all duration-300 px-8 py-6 text-lg font-semibold"
            >
              View My Work
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-6 text-lg font-semibold transition-all duration-300 border-[hsl(var(--forest-green))]/40 text-[hsl(var(--forest-green))] hover:bg-[hsl(var(--fresh-lime))]/20"
            >
              Get In Touch
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;