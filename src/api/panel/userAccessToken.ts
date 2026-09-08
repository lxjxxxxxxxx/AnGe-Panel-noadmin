import { post } from '@/utils/request'

export function createAccessToken<T>(data: { name: string }) {
  return post<T>({ url: '/panel/userAccessToken/create', data })
}

export function getAccessTokenList<T>() {
  return post<T>({ url: '/panel/userAccessToken/getList' })
}

export function deleteAccessToken<T>(data: { id: number }) {
  return post<T>({ url: '/panel/userAccessToken/deletes', data })
}
