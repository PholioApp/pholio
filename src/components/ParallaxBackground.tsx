import { useEffect, useState } from "react";
import { Camera, Aperture, Image, Focus } from "lucide-react";

interface FloatingIcon {
  id: number;
  Icon: any;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  rotation: number;
}

export const ParallaxBackground = () => {
  const [icons, setIcons] = useState<FloatingIcon[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Create floating icons
    const iconComponents = [Camera, Aperture, Image, Focus];
    const newIcons: FloatingIcon[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      Icon: iconComponents[Math.floor(Math.random() * iconComponents.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 20 + Math.random() * 40,
      speed: 0.5 + Math.random() * 1.5,
      opacity: 0.05 + Math.random() * 0.1,
      rotation: Math.random() * 360,
    }));
    setIcons(newIcons);

    // Track mouse movement for parallax
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {icons.map((icon) => {
        const Icon = icon.Icon;
        const parallaxX = mousePosition.x * icon.speed;
        const parallaxY = mousePosition.y * icon.speed;

        return (
          <div
            key={icon.id}
            className="absolute animate-float"
            style={{
              left: `${icon.x}%`,
              top: `${icon.y}%`,
              transform: `translate(${parallaxX}px, ${parallaxY}px) rotate(${icon.rotation}deg)`,
              transition: "transform 0.3s ease-out",
              animationDelay: `${icon.id * 0.5}s`,
              animationDuration: `${10 + icon.speed * 5}s`,
            }}
          >
            <Icon
              size={icon.size}
              className="text-primary"
              style={{ opacity: icon.opacity }}
            />
          </div>
        );
      })}
    </div>
  );
};
