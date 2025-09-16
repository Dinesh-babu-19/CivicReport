import { useEffect, useRef, useState } from 'react';

const SkillsSection = () => {
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

  const skills = [
    {
      name: 'React',
      description: 'Modern UI development with hooks and components',
      icon: '⚛️',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Node.js',
      description: 'Server-side JavaScript and API development',
      icon: '🟢',
      color: 'from-green-500 to-emerald-500',
    },
    {
      name: 'Express.js',
      description: 'Fast, unopinionated web framework for Node.js',
      icon: '🚀',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <section ref={sectionRef} className="py-20 px-6">
      <div className="container mx-auto">
        <div className={`text-center mb-16 transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-gradient">Skills & Technologies</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Passionate about creating innovative solutions with cutting-edge technologies
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {skills.map((skill, index) => (
            <div
              key={skill.name}
              className={`card-glow bg-gradient-card p-8 rounded-2xl text-center transition-all duration-800 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="text-6xl mb-6 animate-glow">{skill.icon}</div>
              <h3 className="text-2xl font-bold mb-4 text-gradient">{skill.name}</h3>
              <p className="text-muted-foreground leading-relaxed">{skill.description}</p>
              
              {/* Animated progress bar */}
              <div className="mt-6">
                <div className="w-full bg-secondary/30 rounded-full h-2">
                  <div
                    className={`h-2 bg-gradient-to-r ${skill.color} rounded-full transition-all duration-1000 delay-500`}
                    style={{
                      width: isVisible ? '90%' : '0%',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;