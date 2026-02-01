'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface StatsSectionProps {
  locale: string;
  translations: {
    destinations: string;
    partners: string;
    years: string;
    travelers: string;
  };
}

interface StatItemProps {
  value: number;
  suffix?: string;
  label: string;
  delay?: number;
}

function useCountUp(end: number, duration: number = 2000, delay: number = 0) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) return;

    const timeout = setTimeout(() => {
      let start = 0;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(timeout);
  }, [hasStarted, end, duration, delay]);

  return { count, start: () => setHasStarted(true) };
}

function StatItem({ value, suffix = '', label, delay = 0 }: StatItemProps) {
  const { count, start } = useCountUp(value, 2000, delay);
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          start();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible, start]);

  return (
    <div
      ref={ref}
      className={cn(
        'text-center transition-all duration-700',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-4xl md:text-5xl lg:text-6xl font-heading text-terracotta-500 mb-2">
        {count}
        {suffix}
      </div>
      <div className="text-gray-600 font-medium">{label}</div>
    </div>
  );
}

export function StatsSection({ translations }: StatsSectionProps) {
  const stats = [
    { value: 30, suffix: '+', label: translations.destinations },
    { value: 20, suffix: '+', label: translations.partners },
    { value: 150, suffix: '+', label: translations.years },
    { value: 15000, suffix: '+', label: translations.travelers },
  ];

  return (
    <section className="py-16 md:py-20 bg-sand-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <StatItem
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={index * 150}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
