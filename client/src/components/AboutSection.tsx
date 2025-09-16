import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';

const AboutSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      title: 'Frontend Excellence',
      description: 'Creating responsive, accessible, and performant user interfaces',
      icon: '💻',
    },
    {
      title: 'Backend Mastery',
      description: 'Building robust APIs and scalable server-side applications',
      icon: '⚙️',
    },
    {
      title: 'Full Stack Vision',
      description: 'End-to-end development with modern tools and best practices',
      icon: '🚀',
    },
  ];

  return (
    <section ref={sectionRef} className="py-20 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className={`transition-all duration-800 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              About <span className="text-gradient">Me</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              I'm a passionate full-stack developer with expertise in modern web technologies. 
              I love creating innovative solutions that combine beautiful design with powerful functionality.
            </p>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              With a strong foundation in React, Node.js, and Express.js, I build applications 
              that are not only visually appealing but also scalable and maintainable.
            </p>
          </div>

          <div className={`space-y-6 transition-all duration-800 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className={`card-glow bg-gradient-card p-6 border-primary/20 transition-all duration-800`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl animate-float" style={{ animationDelay: `${index * 1000}ms` }}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-gradient">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;