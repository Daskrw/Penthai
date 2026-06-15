import { useEffect, useState } from "react";

import monksAlms from "@/assets/about/monks-alms.jpg";
import cookingClass from "@/assets/about/cooking-class.jpg";
import communityElder from "@/assets/about/community-elder.jpg";
import thaiDesserts from "@/assets/about/thai-desserts.jpg";
import farmVisit from "@/assets/about/farm-visit.jpg";

const images = [
  { src: monksAlms, alt: "ตักบาตรทางน้ำ", caption: "สืบสานประเพณี" },
  { src: cookingClass, alt: "เรียนทำขนมไทย", caption: "ภูมิปัญญาท้องถิ่น" },
  { src: communityElder, alt: "ผู้อาวุโสชุมชน", caption: "รากฐานชุมชน" },
  { src: thaiDesserts, alt: "ขนมไทยโบราณ", caption: "มรดกแห่งรสชาติ" },
  { src: farmVisit, alt: "เยี่ยมชมเกษตรกร", caption: "เกษตรยั่งยืน" },
];

const AboutImageCarousel = () => {
  const [active, setActive] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const t = setInterval(() => {
      setActive((p) => (p + 1) % images.length);
    }, 4500);
    return () => clearInterval(t);
  }, [isHovered]);

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Main composition container ── */}
      <div className="relative grid grid-cols-12 grid-rows-6 gap-2.5 md:gap-3 min-h-[520px] md:min-h-[600px]">
        
        {/* ── Hero / Primary image — spans the left-center area ── */}
        <div className="col-span-8 row-span-4 relative overflow-hidden rounded-sm group">
          {/* Thin gold accent — top edge */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-600/40 to-transparent z-10" />

          {images.map((img, i) => (
            <img
              key={img.src}
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${
                i === active
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-[1.03]"
              }`}
            />
          ))}

          {/* Quiet overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent pointer-events-none" />

          {/* Caption — bottom-left */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7 z-10">
            <p className="text-white/60 text-[10px] md:text-xs tracking-[0.25em] uppercase font-light mb-1">
              {images[active].caption}
            </p>
            <p className="text-white text-sm md:text-base font-light tracking-wide">
              {images[active].alt}
            </p>
          </div>
        </div>

        {/* ── Side image — top-right, tall vertical ── */}
        <div className="col-span-4 row-span-3 relative overflow-hidden rounded-sm group">
          <img
            src={images[(active + 1) % images.length].src}
            alt={images[(active + 1) % images.length].alt}
            loading="lazy"
            className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors duration-500" />
          {/* Subtle caption on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
            <p className="text-white/90 text-[10px] tracking-[0.2em] uppercase font-light">
              {images[(active + 1) % images.length].caption}
            </p>
          </div>
        </div>

        {/* ── Bottom-right small square ── */}
        <div className="col-span-4 row-span-3 relative overflow-hidden rounded-sm group">
          <img
            src={images[(active + 2) % images.length].src}
            alt={images[(active + 2) % images.length].alt}
            loading="lazy"
            className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors duration-500" />
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
            <p className="text-white/90 text-[10px] tracking-[0.2em] uppercase font-light">
              {images[(active + 2) % images.length].caption}
            </p>
          </div>
        </div>

        {/* ── Bottom-left wide strip ── */}
        <div className="col-span-5 row-span-2 relative overflow-hidden rounded-sm group">
          <img
            src={images[(active + 3) % images.length].src}
            alt={images[(active + 3) % images.length].alt}
            loading="lazy"
            className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors duration-500" />
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
            <p className="text-white/90 text-[10px] tracking-[0.2em] uppercase font-light">
              {images[(active + 3) % images.length].caption}
            </p>
          </div>
        </div>

        {/* ── Bottom-center small piece ── */}
        <div className="col-span-3 row-span-2 relative overflow-hidden rounded-sm group">
          <img
            src={images[(active + 4) % images.length].src}
            alt={images[(active + 4) % images.length].alt}
            loading="lazy"
            className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors duration-500" />
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
            <p className="text-white/90 text-[10px] tracking-[0.2em] uppercase font-light">
              {images[(active + 4) % images.length].caption}
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation dots — minimal, positioned below ── */}
      <div className="flex items-center justify-center gap-3 mt-6">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`ไปที่ภาพ ${i + 1}`}
            className={`transition-all duration-500 ease-out rounded-full ${
              i === active
                ? "w-8 h-1 bg-amber-700/70"
                : "w-1.5 h-1.5 bg-stone-300 hover:bg-stone-400"
            }`}
          />
        ))}
      </div>

      {/* ── Decorative accent — thin line with label ── */}
      <div className="flex items-center gap-4 mt-5">
        <div className="flex-1 h-px bg-gradient-to-r from-stone-200 via-amber-600/20 to-transparent" />
        <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 font-light select-none">
          เรื่องราวของเรา
        </span>
        <div className="flex-1 h-px bg-gradient-to-l from-stone-200 via-amber-600/20 to-transparent" />
      </div>
    </div>
  );
};

export default AboutImageCarousel;
