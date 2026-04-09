import React from "react";
import { Star } from "lucide-react";

const getRoundedToHalf = (value) => Math.round(value * 2) / 2

const StarDisplay = ({
  rating = 0,
  max = 5,
  size = 16,
  className = "",
  activeClassName = "text-orange-500",
  inactiveClassName = "text-gray-300"
}) => {
  const safeRating = Number.isFinite(rating) ? Math.max(0, Math.min(max, rating)) : 0
  const roundedRating = getRoundedToHalf(safeRating)

  return (
    <div className={`flex items-center gap-0.5 ${className}`.trim()}>
      {Array.from({ length: max }, (_, index) => {
        const position = index + 1
        const isFull = roundedRating >= position
        const isHalf = !isFull && roundedRating >= position - 0.5

        if (isFull) {
          return <Star key={position} size={size} className={`fill-current ${activeClassName}`} />
        }

        if (isHalf) {
          return (
            <span key={position} className="relative inline-flex" style={{ width: size, height: size }}>
              <Star size={size} className={inactiveClassName} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${size / 2}px` }}>
                <Star size={size} className={`fill-current ${activeClassName}`} />
              </span>
            </span>
          )
        }

        return <Star key={position} size={size} className={inactiveClassName} />
      })}
    </div>
  )
}

export default StarDisplay