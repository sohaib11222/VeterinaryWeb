import { useEffect, useRef, useState } from 'react'

let scriptLoaded = false
let translateInitialized = false

const DEFAULT_LANGUAGE = 'it'

const GoogleTranslate = () => {
  const translateElementRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const getCookie = (name) => {
      try {
        const cookies = String(document.cookie || '').split(';')
        for (const c of cookies) {
          const [k, ...rest] = c.trim().split('=')
          if (k === name) return rest.join('=')
        }
      } catch {
        return null
      }
      return null
    }

    const setGoogTransCookie = (value) => {
      try {
        document.cookie = `googtrans=${value};path=/`
        document.cookie = `googtrans=${value};path=/;domain=${window.location.hostname}`
      } catch {
        return
      }
    }

    let appliedDefaultLanguage = false
    const ensureDefaultLanguage = () => {
      const existing = getCookie('googtrans')
      if (existing) return
      appliedDefaultLanguage = true
      setGoogTransCookie(`/en/${DEFAULT_LANGUAGE}`)
    }

    ensureDefaultLanguage()

    const initializeTranslate = () => {
      if (!isMounted || translateInitialized) return

      const element = translateElementRef.current
      if (!element) {
        setTimeout(() => {
          if (isMounted && !translateInitialized) initializeTranslate()
        }, 50)
        return
      }

      if (element.querySelector('.goog-te-gadget') || translateInitialized) {
        if (isMounted) setIsLoading(false)
        translateInitialized = true
        return
      }

      if (window.google && window.google.translate) {
        try {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'ar,zh-CN,zh-TW,fr,de,hi,id,it,ja,ko,pt,ru,es,th,tr,vi',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
              multilanguagePage: true,
            },
            'google_translate_element'
          )
          translateInitialized = true
          if (isMounted) setIsLoading(false)

          if (appliedDefaultLanguage) {
            setTimeout(() => {
              const combo = document.querySelector('.goog-te-combo')
              if (combo && combo.value !== DEFAULT_LANGUAGE) {
                combo.value = DEFAULT_LANGUAGE
                combo.dispatchEvent(new Event('change'))
              }
            }, 350)
          }
        } catch {
          if (isMounted) setIsLoading(false)
        }
      }
    }

    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = () => {
        setTimeout(() => {
          if (!translateInitialized) {
            const element = document.getElementById('google_translate_element')
            if (element && window.google && window.google.translate) {
              try {
                new window.google.translate.TranslateElement(
                  {
                    pageLanguage: 'en',
                    includedLanguages: 'ar,zh-CN,zh-TW,fr,de,hi,id,it,ja,ko,pt,ru,es,th,tr,vi',
                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false,
                    multilanguagePage: true,
                  },
                  'google_translate_element'
                )
                translateInitialized = true

                if (appliedDefaultLanguage) {
                  setTimeout(() => {
                    const combo = document.querySelector('.goog-te-combo')
                    if (combo && combo.value !== DEFAULT_LANGUAGE) {
                      combo.value = DEFAULT_LANGUAGE
                      combo.dispatchEvent(new Event('change'))
                    }
                  }, 350)
                }
              } catch {
                return
              }
            }
          }
        }, 100)
      }
    }

    const addScript = () => {
      if (scriptLoaded || document.querySelector('script[src*="translate.google.com"]')) {
        scriptLoaded = true
        if (window.google && window.google.translate) {
          setTimeout(() => {
            if (isMounted && !translateInitialized) initializeTranslate()
          }, 100)
        }
        return
      }

      scriptLoaded = true
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      script.onerror = () => {
        scriptLoaded = false
        if (isMounted) setIsLoading(false)
      }
      document.body.appendChild(script)
    }

    if (window.google && window.google.translate && !translateInitialized) {
      setTimeout(() => {
        if (isMounted && !translateInitialized) initializeTranslate()
      }, 100)
    } else if (!scriptLoaded) {
      addScript()
      setTimeout(() => {
        if (isMounted && window.google && window.google.translate && !translateInitialized) {
          initializeTranslate()
        }
      }, 500)
    } else if (translateInitialized) {
      if (isMounted) setIsLoading(false)
    }

    let attempts = 0
    const maxAttempts = 40
    let checkDelay = 100

    const doCheck = () => {
      if (!isMounted) return

      attempts++
      if (attempts > maxAttempts) {
        if (isMounted) setIsLoading(false)
        return
      }

      const element = translateElementRef.current
      if (element && window.google && window.google.translate) {
        if (!element.querySelector('.goog-te-gadget')) {
          initializeTranslate()
        } else {
          if (isMounted) setIsLoading(false)
        }
      }

      if (attempts === 10) checkDelay = 500
      setTimeout(doCheck, checkDelay)
    }

    setTimeout(doCheck, checkDelay)

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <>
      <style>{`
        .goog-te-banner-frame{position:fixed!important;top:0!important;left:0!important;width:100%!important;z-index:9998!important;height:auto!important}
        body:not(.top){padding-top:0!important}
        body.top{padding-top:0!important}
        body.top .header,body.top .header-fixed,body.top .header-custom,body.top header{margin-top:42px!important;transition:margin-top .3s ease!important}
        body:not(.top) .header,body:not(.top) .header-fixed,body:not(.top) .header-custom,body:not(.top) header{margin-top:0!important}
        body.top .top-header{margin-top:42px!important;transition:margin-top .3s ease!important}
        body:not(.top) .top-header{margin-top:0!important}
        #google_translate_element{position:fixed!important;top:80px!important;right:20px!important;z-index:9999!important;display:inline-block!important;vertical-align:middle!important;visibility:visible!important;opacity:1!important;width:auto!important;height:auto!important;background-color:#fff!important;border-radius:6px!important;box-shadow:0 2px 10px rgba(0,0,0,.1)!important;padding:4px 6px!important;transform:scale(.85)!important;transform-origin:top right!important}
        #google_translate_element .goog-te-gadget{font-family:Poppins,sans-serif!important;font-size:11px!important;color:#333!important;display:inline-block!important;line-height:1.2!important}
        #google_translate_element .goog-te-gadget-simple{background-color:transparent!important;border:none!important;padding:2px 4px!important;display:inline-block!important;cursor:pointer!important}
        #google_translate_element .goog-te-gadget-simple .goog-te-menu-value{color:#333!important;font-size:11px!important;line-height:1.2!important}
        #google_translate_element .goog-te-gadget-simple .goog-te-menu-value span{color:#333!important;font-size:11px!important}
        .goog-te-menu-frame{max-width:100%!important;z-index:10000!important}
        .goog-te-menu2{max-width:100%!important;overflow-x:hidden!important}
        .header{position:relative!important;z-index:1000!important}
        @media (max-width:768px){#google_translate_element{font-size:10px!important;top:70px!important;right:10px!important;padding:3px 5px!important;transform:scale(.8)!important}#google_translate_element .goog-te-gadget{font-size:10px!important}#google_translate_element .goog-te-gadget-simple{padding:2px 3px!important;font-size:10px!important}#google_translate_element img{width:12px!important;height:12px!important;max-width:12px!important;max-height:12px!important;margin-right:2px!important}#google_translate_element .goog-te-gadget-simple .goog-te-menu-value{font-size:10px!important}#google_translate_element .goog-te-gadget-simple .goog-te-menu-value span{font-size:10px!important}}
      `}</style>
      <div
        id="google_translate_element"
        ref={translateElementRef}
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          minHeight: '18px',
          minWidth: '100px',
          lineHeight: '1.2',
          position: 'relative',
        }}
      >
        {isLoading && (
          <span
            style={{
              fontSize: '12px',
              color: '#666',
              display: 'inline-block',
              padding: '4px 8px',
            }}
          >
            🌐
          </span>
        )}
      </div>
    </>
  )
}

export default GoogleTranslate
