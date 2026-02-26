"use client";

import Slider from "react-slick";
import { ImageOff } from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
const OfferingCarousel = ({ items, onSelect }) => {
  const settings = {
    dots: true,
    infinite: false,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    swipe: true,
    arrows: false,
    adaptiveHeight: true,
  };


  // const getCommission = (item) => {
  //   return item?.raw?.agreedValue?.single?.value || null;
  // };

  const getCommission = (item) => {
    const value = item?.raw?.agreedValue?.single?.value;
    return value ? Number(value) : 0;
  };

  const highestCommission = Math.max(
    ...items.map((item) => getCommission(item)),
    0
  );

  return (
    <div className="mt-4">
      <Slider {...settings}>
        {items.map((item, i) => (
          <div key={i} className="px-1 py-2 relative">



            <div
              className={`relative rounded-xl p-4 transition-all duration-300
    ${getCommission(item) === highestCommission && highestCommission > 0
                  ? "bg-emerald-50 border-2 border-emerald-400 shadow-lg scale-[1.02]"
                  : "bg-white shadow"
                }
  `} onClick={() => onSelect(item)}
            >

              {getCommission(item) && (
                <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  {getCommission(item)}% Commission
                </span>
              )}

              {getCommission(item) === highestCommission &&
                highestCommission > 0 && (
                  <div className="absolute -top-2 left-3 bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-full shadow font-semibold">
                    BEST COMMISSION
                  </div>
                )}
              <div className="h-40 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                {item.imageURL ? (
                  <img
                    src={item.imageURL}
                    alt={item.label}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageOff size={32} className="text-gray-400" />
                )}
              </div>

              <h4 className="mt-3 font-semibold text-gray-800">
                {item.label}
              </h4>

              <p className="text-sm text-gray-500 line-clamp-2">
                {item.description}
              </p>

              {item.percentage && (
                <p className="mt-2 text-xs text-orange-600 font-medium">
                  Agreed: {item.percentage}%
                </p>
              )}
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default OfferingCarousel;