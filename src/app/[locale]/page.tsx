import { getLocale } from 'next-intl/server'
import HeroSlider from '@/components/home/HeroSlider'
import HomePackages from '@/components/home/HomePackages'
import HomeProducts from '@/components/home/HomeProducts'

export default async function HomePage() {
  const locale = await getLocale()

  const features = [
    { icon: '🪔', title_bn: 'প্রামাণিক পণ্য', title_en: 'Authentic Products', desc_bn: 'বিশুদ্ধ ও মানসম্পন্ন পূজার সামগ্রী', desc_en: 'Pure and quality puja items' },
    { icon: '🚚', title_bn: 'দ্রুত ডেলিভারি', title_en: 'Fast Delivery', desc_bn: 'দরজায় পৌঁছে দেই', desc_en: 'Delivered to your doorstep' },
    { icon: '🙏', title_bn: 'বিশ্বস্ত সেবা', title_en: 'Trusted Service', desc_bn: 'গ্রাহক সন্তুষ্টি আমাদের লক্ষ্য', desc_en: 'Customer satisfaction is our goal' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Packages */}
      <HomePackages />

      {/* Products — 18 items, 6 per row */}
      <HomeProducts />

      {/* Authentic products section */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-5 text-center">
          {locale === 'bn' ? 'কেন পূজারিঘর?' : 'Why PujariGhar?'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="card text-center">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-2">
                {locale === 'bn' ? f.title_bn : f.title_en}
              </h3>
              <p className="text-gray-500 text-sm">
                {locale === 'bn' ? f.desc_bn : f.desc_en}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
