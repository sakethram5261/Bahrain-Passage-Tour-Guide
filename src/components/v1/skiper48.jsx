import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCards, Navigation, Pagination, Autoplay } from 'swiper/modules'

// Import Swiper core and modules styles
import 'swiper/css'
import 'swiper/css/effect-cards'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export const Carousel_002 = ({
  images = [],
  showPagination = true,
  showNavigation = true,
  loop = true,
  autoplay = true,
  spaceBetween = 40
}) => {
  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-[#a19688]/40 bg-[#FCFBF8] flex flex-col items-center justify-center text-center p-6 text-[#9c8e88]/60 select-none">
        <span className="text-3xl animate-bounce">📸</span>
        <span className="font-serif text-[11px] font-bold mt-2">Album Empty</span>
        <span className="font-sans text-[8.5px] mt-0.5 leading-relaxed">Focus your Wayfarer Lens on chronicle spots and snap photos to print cards here!</span>
      </div>
    )
  }

  const autoplayConfig = autoplay 
    ? { delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }
    : false

  return (
    <div className="w-full max-w-[280px] mx-auto py-4 select-none relative skiper-cards-carousel relative">
      <Swiper
        effect={'cards'}
        grabCursor={true}
        modules={[EffectCards, Navigation, Pagination, Autoplay]}
        loop={loop && images.length > 1}
        autoplay={images.length > 1 ? autoplayConfig : false}
        spaceBetween={spaceBetween}
        pagination={showPagination && images.length > 1 ? { clickable: true } : false}
        navigation={showNavigation && images.length > 1 ? true : false}
        className="mySwiper w-full aspect-[4/3] overflow-visible"
      >
        {images.map((img, idx) => (
          <SwiperSlide 
            key={idx} 
            className="rounded-xl overflow-hidden shadow-2xl bg-white border border-[#a19688]/20 p-2.5 pb-8 relative flex flex-col justify-between"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Absolute photo corners in physical album style */}
            <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 border-black z-20" />
            <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 border-black z-20" />
            <div className="absolute bottom-8 left-2 w-2.5 h-2.5 border-b-2 border-l-2 border-black z-20" />
            <div className="absolute bottom-8 right-2 w-2.5 h-2.5 border-b-2 border-r-2 border-black z-20" />

            <div className="w-full h-[calc(100%-8px)] rounded overflow-hidden relative bg-bahrain-dark flex items-center justify-center">
              <img 
                src={img.src} 
                alt={img.alt || 'Passport snapshot'} 
                className="w-full h-full object-cover relative z-10"
              />
            </div>
            
            {/* Postmark stamp simulation on slide */}
            <div className="absolute bottom-1 right-2 scale-[0.65] origin-bottom-right pointer-events-none select-none opacity-90 z-20">
              <div className="border-2 border-double border-bahrain-red/60 rounded-full w-14 h-14 rotate-12 flex flex-col items-center justify-center text-bahrain-red font-serif text-[4.5px] font-bold">
                <span className="uppercase tracking-widest leading-none">PASSPORT</span>
                <span className="uppercase text-[3.5px] mt-0.5 leading-none">SEALED</span>
              </div>
            </div>

            <div className="absolute bottom-1 left-3 right-3 text-left">
              <span className="font-serif text-[8.5px] text-bronze-charcoal font-bold tracking-tight block truncate">
                {img.alt}
              </span>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
