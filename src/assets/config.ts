/**
 * Configuration file for customizable assets
 *
 * This file allows you to easily customize the background images and logo
 * used throughout the application without modifying component code.
 */

import contractAbi from "./contractAbi"
import shakingContractAbi from "./shakingContractAbi"
import boboAbi from "./BoBoAbi"
import multiTokenExchangeAbi from "./MultiTokenExchangeAbi"

export default {
  // contract configuration
  contractAddress: "0xb63214B454c08eBD7bb025F51E2278F0c10B113A",
  shakingContractAddress: '0x35499aa163f85e5694ccb95e28614e65e3d5503e',
  shakingALPSContractAddress: '0xF02D70B4b398180c80989E9a5aCB1B191bFd60FF',
  boboContractAddress: '0xeD1103AeeEeD012d2D28d07b590DF407Cc846F35',
  USDTAddress: '0x55d398326f99059fF775485246999027B3197955',
  mappingContractAddress: '0x4D342A0Dd0694F735B8c48fCd191325833E8a01a',
  alpsContractAddress: '0x258948986c19ea2915E48a5D7a475dfE2B86E893',
  contractAbi: contractAbi,
  shakingContractAbi: shakingContractAbi,
  boboAbi: boboAbi,
  multiTokenExchangeAbi: multiTokenExchangeAbi,
  creatorAddress: '0x5C595De7DcD328fa07A6eAfb7e7423f42665F3De',
  // Logo configuration
  logo: {
    path: 'https://wufeng98.cn/imgServerApi/images/2ac15998-1577-476a-ac72-69a7685e1216.png',
    // Alternative text for accessibility
    alt: 'Alpha Logo',
  },
  alpsLogo: {
    path: 'https://wufeng98.cn/imgServerApi/images/d33954db-5c32-4554-9cbd-28a2fd144110.png',
    alt: 'ALPS Logo',
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
      url: 'https://t.me/Alpha_ac_an',
      icon: 'telegram'
    }
  ],
}
