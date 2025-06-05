import request from '../utils/request'

// 获取所有交易对
export const getTradingPairs = () => {
  return request({
    url: '/trading-pairs',
    method: 'get',
    params: {
      user: 'wufeng1998'
    }
  })
}

// 获取所有代币合约
export const getTokenContracts = () => {
  return request({
    url: '/token-contracts',
    method: 'get'
  })
}