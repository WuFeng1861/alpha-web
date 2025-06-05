import { createVNode, render } from 'vue'
import Toast from '../components/Toast.vue'

// 创建一个div作为Toast的容器
const div = document.createElement('div')
document.body.appendChild(div)

// 创建Toast实例
const vnode = createVNode(Toast)
render(vnode, div)

// 导出Toast方法
export default {
  // 显示成功提示
  success(message: string, duration?: number) {
    vnode.component?.exposed?.show({
      message,
      type: 'success',
      duration
    })
  },
  
  // 显示错误提示
  error(message: string, duration?: number) {
    vnode.component?.exposed?.show({
      message,
      type: 'error',
      duration
    })
  },
  
  // 显示普通信息提示
  info(message: string, duration?: number) {
    vnode.component?.exposed?.show({
      message,
      type: 'info',
      duration
    })
  },
  
  // 隐藏Toast
  hide() {
    vnode.component?.exposed?.hide()
  }
}