import React from 'react'
import { assets } from '../../assets/assets'
import Image from 'next/image'
import Link from 'next/link'

const Navbar = () => {

  return (
    <div className='flex items-center px-4 md:px-8 py-3 justify-between border-b'>
      <Link href='/'>
        <Image className='w-28 lg:w-32 cursor-pointer' src={assets.logo} alt="logo" sizes="(max-width: 1024px) 112px, 128px" />
      </Link>
      <button className='bg-gray-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm'>Đăng xuất</button>
    </div>
  )
}

export default Navbar