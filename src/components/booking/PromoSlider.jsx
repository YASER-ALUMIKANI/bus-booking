import React, { useState, useEffect } from 'react'

const promoSlides = [
  { image: '/service-slide-1.jpg', text: 'يمن باص - لخدمات السفر والخدمات العامة' },
  { image: '/service-slide-2.jpg', text: 'سفر مريح بلا متاعب - وكلاء شركة ترحيب بالبيضاء' },
  { image: '/service-slide-3.jpg', text: 'استخراج تأشيرات الزيارة العائلية للسعودية' },
  { image: '/service-slide-4.jpg', text: 'استخراج فيز عمل وتسهيل معاملات المغتربين' },
  { image: '/service-slide-5.jpg', text: 'يمن باص - متخصصون في خدمات السفر البري' }
]

export const PromoSlider = () => {
  const [currentPromoSlide, setCurrentPromoSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromoSlide((prev) => (prev === promoSlides.length - 1 ? 0 : prev + 1))
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative rounded-3xl overflow-hidden h-44 sm:h-60 bg-slate-950 shadow-md">
      {promoSlides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            idx === currentPromoSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-10"></div>
          <img src={slide.image} alt={slide.text} className="w-full h-full object-cover" />
          <div className="absolute bottom-6 right-6 z-20 text-white font-extrabold text-sm sm:text-lg drop-shadow-md">
            {slide.text}
          </div>
        </div>
      ))}
    </div>
  )
}

export default PromoSlider
