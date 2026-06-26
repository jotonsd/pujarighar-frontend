declare global {
  interface Window {
    FB?: {
      init: (params: { appId: string; cookie?: boolean; xfbml?: boolean; version: string }) => void
      login: (
        callback: (response: { authResponse?: { accessToken: string }; status: string }) => void,
        options?: { scope: string },
      ) => void
    }
    fbAsyncInit?: () => void
  }
}

let loadPromise: Promise<void> | null = null

export function loadFacebookSdk(appId: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.FB) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve) => {
    window.fbAsyncInit = () => {
      window.FB?.init({ appId, cookie: true, xfbml: false, version: 'v19.0' })
      resolve()
    }
    if (document.getElementById('facebook-jssdk')) return
    const script = document.createElement('script')
    script.id = 'facebook-jssdk'
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    script.defer = true
    document.body.appendChild(script)
  })
  return loadPromise
}

export function facebookLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not loaded'))
      return
    }
    window.FB.login(
      (response) => {
        if (response.authResponse?.accessToken) {
          resolve(response.authResponse.accessToken)
        } else {
          reject(new Error('Facebook login cancelled or failed'))
        }
      },
      { scope: 'email,public_profile' },
    )
  })
}
