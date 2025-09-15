export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 格式化数字显示
export const formatBalance = (balance: string|number): string => {
  const num = parseFloat(balance.toString())
  if (isNaN(num)) return '0'
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K'
  } else {
    return Number(num.toFixed(6)).toString();
  }
}

// 格式化余额显示，保留指定小数位数
export const formatBalanceFixed = (balance: string|number, decimals: number = 2): string => {
  const num = parseFloat(balance.toString())
  if (isNaN(num)) return '0.00'
  
  return num.toFixed(decimals)
}
