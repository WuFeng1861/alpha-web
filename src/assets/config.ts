/**
 * Configuration file for customizable assets
 *
 * This file allows you to easily customize the background images and logo
 * used throughout the application without modifying component code.
 */

import contractAbi from "./contractAbi"


export default {
  // contract configuration
  contractAddress: "0x6AE58b6543C5Ab6bb867C73f12f86D323a21562E",
  contractAbi: contractAbi,
  creatorAddress: '0x5C595De7DcD328fa07A6eAfb7e7423f42665F3De',
  // Logo configuration
  logo: {
    path: 'https://wufeng98.cn/imgServerApi/images/2ac15998-1577-476a-ac72-69a7685e1216.png',
    // Alternative text for accessibility
    alt: 'Alpha Logo',
  },
  
  // Background images
  backgrounds: {
    // Home page background
    home: 'https://wufeng98.cn/imgServerApi/images/97340fef-2356-40f9-93f7-2fbc16de8912.png',
    // Friends page background
    friends: 'https://wufeng98.cn/imgServerApi/images/164652f7-db47-4c8f-9851-af7fcceac796.png',
    // Box page background
    box: 'https://wufeng98.cn/imgServerApi/images/2e76dc4b-595c-4941-b890-5c92b895530b.png',
  },
  
  // Mascot image (green cat in the screenshots)
  mascot: {
    path: '/path/to/your/mascot.png',
    alt: 'Alpha Mascot',
  },
  
  // Mystery box image
  mysteryBox: {
    path: '/path/to/your/mystery-box.png',
    alt: 'Mystery Box',
  },
  
  // Social media links
  socialLinks: [
    {
      name: 'Gitbook',
      url: 'https://alpha-20.gitbook.io/alpha',
      icon: 'github'
    },
    {
      name: 'Twitter',
      url: 'https://x.com/Alpha5837135553/',
      icon: 'twitter'
    },
    // {
    //   name: 'GitHub',
    //   url: 'https://github.com',
    //   icon: 'github'
    // },
    {
      name: 'Telegram',
      url: 'https://t.me',
      icon: 'telegram'
    }
  ],
}
