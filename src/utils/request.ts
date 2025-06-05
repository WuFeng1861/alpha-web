import axios from 'axios'

// 创建 axios 实例
const request = axios.create({
  baseURL: 'https://alpha.ac.cn/alphaPairApi',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 200 || res.code === 201) {
      return res
    }
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  error => {
    return Promise.reject(error)
  }
)

export default request