import React from 'react'

const SendingMessageAnimation = () => {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 max-md:h-1 max-md:w-1 bg-orange-500 rounded-full animate-flash"></div>
      <div className="w-2 h-2 max-md:h-1 max-md:w-1 bg-orange-500 rounded-full animate-flash delay-200"></div>
      <div className="w-2 h-2 max-md:h-1 max-md:w-1 bg-orange-500 rounded-full animate-flash delay-400"></div>
      <span className="text-xs max-md:text-8px text-orange-500">Sending</span>
    </div>
  )
}

export default SendingMessageAnimation
