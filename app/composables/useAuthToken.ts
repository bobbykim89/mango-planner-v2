import { useCookie } from '#imports'

export const useAuthToken = () => {
  const cookie = useCookie('access_token', {
    maxAge: 604800,
    sameSite: true,
  })
  return cookie
}
