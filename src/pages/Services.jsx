import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

const slides = [
  {
    image: '/service-slide-1.jpg',
    title: 'يمن باص - رائد خدمات السفر والنقل البري',
    description: 'الهوية الرسمية لوكالة "يمن باص" لخدمات السفر والسياحة والخدمات العامة في اليمن، نسعى لتقديم تجارب سفر استثنائية وآمنة لكافة عملائنا.'
  },
  {
    image: '/service-slide-2.jpg',
    title: 'خدمات النقل البري المتميز (وكلاء شركة ترحيب)',
    description: 'نقدم رحلات برية مريحة ومنظمة عبر أحدث الحافلات المجهزة بوسائل الراحة، من فرعنا في محافظة البيضاء (الشارع العام - أمام مطعم نجوم الشام) لربط مختلف المحافظات والوجهات الدولية.'
  },
  {
    image: '/service-slide-3.jpg',
    title: 'استخراج وتسهيل تأشيرات الزيارة العائلية',
    description: 'نساعدكم في تخليص معاملات وتأشيرات الزيارة العائلية إلى المملكة العربية السعودية وغيرها، بخطوات ميسرة وسرعة في التنفيذ لجمع شمل العائلات.'
  },
  {
    image: '/service-slide-4.jpg',
    title: 'استخراج فيز العمل والمعاملات الرسمية',
    description: 'تقديم خدمات استخراج فيز وتأشيرات العمل الرسمية وتسهيل كافة الإجراءات المتعلقة بالفحوصات الطبية وتصديق الوثائق للراغبين في العمل بالخارج.'
  },
  {
    image: '/service-slide-5.jpg',
    title: 'التخصص والريادة في خدمات السفر البري والدولي',
    description: 'نضم فريق عمل خبير ومتخصص في حجز وتأمين مقاعد السفر، وتنسيق الرحلات، وتوفير الدعم المتكامل للمسافرين لضمان رحلة سعيدة وخالية من المتاعب.'
  }
]

const extraServices = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'حجز مقاعد فوري',
    description: 'اختر مقعدك المفضل على حافلات النقل الجماعي واحجز تذكرتك إلكترونياً بضغطة زر مع حساب فوري للأسعار.'
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: 'تسهيل المعاملات والفيز',
    description: 'استخراج تأشيرات العمل والزيارات العائلية إلى المملكة العربية السعودية وتوثيق المستندات والوثائق الطبية.'
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'سفر مريح وآمن',
    description: 'شراكات مع كبرى شركات النقل البري (مثل شركة ترحيب) لضمان تقديم أعلى معايير السلامة والرفاهية طوال الرحلة.'
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: 'دعم العملاء على مدار الساعة',
    description: 'فريق خدمة عملاء متفاني جاهز للإجابة على استفساراتكم ومساعدتكم في تأكيد أو تعديل حجوزاتكم في أي وقت.'
  }
]

const Services = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }, [])

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }, [])

  // Auto-slide effect
  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(handleNext, 5000)
    return () => clearInterval(timer)
  }, [isPlaying, handleNext])

  return (
    <main className="pt-[8ch] min-h-[calc(100vh-8ch)] bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* Page Header */}
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 dark:bg-orange-950/20 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-900/30">
            خدمات السفر والمعاملات
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-slate-100">خدماتنا المتميزة</h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base leading-7 text-neutral-500 dark:text-neutral-400">
            نسعى في يمن باص لتوفير خدمات سفر متكاملة وحلول نقل بري متميزة بالإضافة لتسهيل معاملات التأشيرات والفيز بكل موثوقية وسرعة.
          </p>
        </div>

        {/* Premium Interactive Slideshow (cPanel / Agency Style) */}
        <div 
          className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-slate-950 shadow-xl group max-w-3xl mx-auto w-full h-[380px] sm:h-[480px]"
          onMouseEnter={() => setIsPlaying(false)}
          onMouseLeave={() => setIsPlaying(true)}
        >
          {/* Slides Track */}
          <div className="w-full h-full relative">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                {/* Background Image overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10"></div>
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-contain object-center bg-slate-950"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />

                {/* Content Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10 z-20 text-white space-y-1.5 sm:space-y-3">
                  <h3 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white drop-shadow-md">
                    {slide.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-6 sm:leading-7 drop-shadow">
                    {slide.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Slide Navigation Buttons */}
          <button
            onClick={handlePrev}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition border border-white/10 opacity-0 group-hover:opacity-100"
            aria-label="الشريحة السابقة"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition border border-white/10 opacity-0 group-hover:opacity-100"
            aria-label="الشريحة التالية"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Indicators Dots */}
          <div className="absolute top-4 right-4 z-30 flex gap-1.5 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition ${
                  index === currentSlide ? 'bg-orange-500 scale-125' : 'bg-white/40'
                }`}
                aria-label={`الذهاب إلى الشريحة ${index + 1}`}
              ></button>
            ))}
          </div>
        </div>

        {/* Service Descriptions & Contact Banner */}
        <div className="bg-gradient-to-r from-orange-600/10 via-amber-500/5 to-transparent border border-orange-200/50 dark:border-orange-950/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200">يسعدنا خدمتكم في فرعنا الرئيسي بمحافظة البيضاء</h4>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              العنوان: الشارع العام - أمام مطعم نجوم الشام | وكلاء شركة ترحيب للنقل البري الدولي
            </p>
          </div>
          <div className="flex gap-4 flex-wrap justify-center font-mono font-bold text-slate-700 dark:text-slate-300">
            <a href="tel:738518881" className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 px-4 py-2 rounded-2xl shadow-sm hover:border-orange-500 transition text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
              738518881
            </a>
            <a href="tel:773802050" className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 px-4 py-2 rounded-2xl shadow-sm hover:border-orange-500 transition text-sm flex items-center gap-2">
              773802050
            </a>
          </div>
        </div>

        {/* Static Feature Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 text-center">باقة الخدمات الشاملة</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {extraServices.map((service, index) => (
              <div
                key={index}
                className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition hover:border-orange-500/40 dark:hover:border-orange-500/20"
              >
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center mb-4">
                  {service.icon}
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-2">
                  {service.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-6">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center py-6">
          <Link
            to="/bus"
            className="inline-flex items-center gap-2.5 rounded-full bg-orange-600 px-8 py-4 text-sm font-bold text-white shadow-lg hover:bg-orange-700 transition transform hover:scale-[1.02]"
          >
            <span>ابدأ حجز رحلتك الآن</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

      </div>
    </main>
  )
}

export default Services
