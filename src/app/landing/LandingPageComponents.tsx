
"use client";

export const FloatingShape = ({ className, delay }: { className: string; delay: string }) => (
  <div 
    className={`absolute rounded-full filter blur-3xl opacity-30 animate-float ${className}`}
    style={{ animationDelay: delay }}
  />
);

export const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
  <div className="glassmorphism-card p-6 rounded-2xl text-center group transition-all duration-300 hover:border-primary/50 hover:-translate-y-2">
    <div className="inline-block p-4 bg-primary/10 rounded-full mb-4 group-hover:bg-primary/20 transition-colors">
      <Icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
    </div>
    <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <p className="text-4xl md:text-5xl font-bold gradient-text">{value}</p>
    <p className="text-sm text-muted-foreground uppercase tracking-widest">{label}</p>
  </div>
);
