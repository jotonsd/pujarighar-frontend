'use client'

import { useGetHeroSlidesQuery } from '@/api/heroSlides/heroSlidesApi'
import { Skeleton } from '@/components/ui/Skeleton'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'

export default function HeroSlider() {
  const locale = useLocale()
  const { data: slides = [], isLoading } = useGetHeroSlidesQuery()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const id = setInterval(() => setCurrent(p => (p + 1) % slides.length), 4000)
    return () => clearInterval(id)
  }, [slides.length])

  if (isLoading) return <Skeleton className="h-72 w-full rounded-2xl mb-10" />
  if (!slides.length) return null

  return (
    <div className="relative overflow-hidden rounded-2xl mb-10">
      {/* Track */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="w-full shrink-0 relative">
            {slide.image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.image}
                  alt={locale === 'bn' ? slide.title_bn : slide.title_en}
                  className="w-full h-72 object-cover"
                />
                {/* Overlay for text */}
                {(slide.title_bn || slide.title_en) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex flex-col justify-center px-10">
                    <h1 className="text-3xl font-bold text-white mb-2 drop-shadow">
                      {locale === 'bn' ? slide.title_bn : slide.title_en}
                    </h1>
                    {(slide.subtitle_bn || slide.subtitle_en) && (
                      <p className="text-white/80 text-base mb-5 max-w-md drop-shadow">
                        {locale === 'bn' ? slide.subtitle_bn : slide.subtitle_en}
                      </p>
                    )}
                    {slide.cta_link && (slide.cta_label_bn || slide.cta_label_en) && (
                      <Link href={slide.cta_link} className="btn-primary self-start px-6 py-2.5">
                        {locale === 'bn' ? slide.cta_label_bn : slide.cta_label_en}
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Text-only slide */
              <div
                className="w-full h-72 flex flex-col items-center justify-center text-center px-6"
                style={{ backgroundColor: slide.bg_color || '#FFF7ED' }}
              >
                <h1 className="text-4xl font-bold text-amber-800 mb-3">
                  {locale === 'bn' ? slide.title_bn : slide.title_en}
                </h1>
                {(slide.subtitle_bn || slide.subtitle_en) && (
                  <p className="text-gray-600 text-lg mb-7 max-w-lg">
                    {locale === 'bn' ? slide.subtitle_bn : slide.subtitle_en}
                  </p>
                )}
                {slide.cta_link && (slide.cta_label_bn || slide.cta_label_en) && (
                  <Link href={slide.cta_link} className="btn-primary px-8 py-3">
                    {locale === 'bn' ? slide.cta_label_bn : slide.cta_label_en}
                  </Link>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-5 h-1.5 bg-amber-500' : 'w-1.5 h-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
