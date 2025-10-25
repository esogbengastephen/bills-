'use client'

export function GeometricPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black">
        {/* Geometric shapes pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          {/* Circles */}
          <div className="absolute top-4 left-4 w-8 h-8 bg-gray-700 rounded-full"></div>
          <div className="absolute top-12 left-16 w-6 h-6 bg-gray-600 rounded-full"></div>
          <div className="absolute top-8 left-32 w-10 h-10 bg-gray-800 rounded-full"></div>
          <div className="absolute top-20 left-8 w-4 h-4 bg-gray-700 rounded-full"></div>
          
          {/* Quarter circles */}
          <div className="absolute top-16 left-24 w-12 h-12 bg-gray-600 rounded-full" style={{clipPath: 'circle(50% at 0% 0%)'}}></div>
          <div className="absolute top-6 left-40 w-8 h-8 bg-gray-700 rounded-full" style={{clipPath: 'circle(50% at 100% 0%)'}}></div>
          <div className="absolute top-24 left-20 w-6 h-6 bg-gray-800 rounded-full" style={{clipPath: 'circle(50% at 0% 100%)'}}></div>
          
          {/* Rectangles */}
          <div className="absolute top-10 left-48 w-8 h-4 bg-gray-700 rounded-sm"></div>
          <div className="absolute top-18 left-36 w-6 h-8 bg-gray-600 rounded-sm"></div>
          <div className="absolute top-14 left-52 w-4 h-6 bg-gray-800 rounded-sm"></div>
          
          {/* Triangles */}
          <div className="absolute top-22 left-44 w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-gray-700"></div>
          <div className="absolute top-8 left-56 w-0 h-0 border-l-3 border-r-3 border-b-5 border-l-transparent border-r-transparent border-b-gray-600"></div>
          
          {/* Repeat pattern */}
          <div className="absolute top-4 left-64 w-8 h-8 bg-gray-700 rounded-full"></div>
          <div className="absolute top-12 left-72 w-6 h-6 bg-gray-600 rounded-full"></div>
          <div className="absolute top-8 left-80 w-10 h-10 bg-gray-800 rounded-full"></div>
          <div className="absolute top-20 left-68 w-4 h-4 bg-gray-700 rounded-full"></div>
          
          <div className="absolute top-16 left-88 w-12 h-12 bg-gray-600 rounded-full" style={{clipPath: 'circle(50% at 0% 0%)'}}></div>
          <div className="absolute top-6 left-96 w-8 h-8 bg-gray-700 rounded-full" style={{clipPath: 'circle(50% at 100% 0%)'}}></div>
          
          <div className="absolute top-10 left-104 w-8 h-4 bg-gray-700 rounded-sm"></div>
          <div className="absolute top-18 left-92 w-6 h-8 bg-gray-600 rounded-sm"></div>
        </div>
      </div>
    </div>
  )
}
