import { useEffect, useState } from "react";

const images = [
  "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800&q=80",
  "https://images.unsplash.com/photo-1545048702-79362596cdc9?w=800&q=80",
  "https://images.unsplash.com/photo-1551649001-7a2482d98d05?w=800&q=80",
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
  "https://images.unsplash.com/photo-1606293459132-c1ee30baeb73?w=800&q=80",
];

const AboutImageCarousel = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((p) => (p + 1) % images.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      {/* Main rotating image */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg shadow-thai-lg">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`งานฝีมือไทย ${i + 1}`}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
              i === active ? "opacity-100 scale-100" : "opacity-0 scale-105"
            }`}
          />
        ))}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Go to image ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === active ? "w-8 bg-primary" : "w-2 bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Floating thumbnails */}
      <div className="hidden sm:block">
        <div
          className="absolute -top-6 -right-6 w-28 h-28 rounded-lg overflow-hidden shadow-xl border-4 border-background animate-float"
          style={{ animationDelay: "0s" }}
        >
          <img
            src={images[(active + 1) % images.length]}
            alt=""
            className="w-full h-full object-cover transition-all duration-500"
          />
        </div>
        <div
          className="absolute top-1/2 -right-10 w-24 h-24 rounded-lg overflow-hidden shadow-xl border-4 border-background animate-float"
          style={{ animationDelay: "1s" }}
        >
          <img
            src={images[(active + 2) % images.length]}
            alt=""
            className="w-full h-full object-cover transition-all duration-500"
          />
        </div>
      </div>

      {/* Brand badge */}
      <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-6 rounded-lg shadow-lg max-w-xs z-10">
        <p className="font-semibold text-lg">นำความเป็นไทยมาสู่คุณ</p>
        <p className="text-sm mt-2 opacity-90">ตั้งแต่ 2024</p>
      </div>
    </div>
  );
};

export default AboutImageCarousel;
