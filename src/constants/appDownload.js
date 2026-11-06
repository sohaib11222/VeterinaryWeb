// Replace VITE_MYPETPLUS_APP_DOWNLOAD_URL with the production APK URL when it
// is available. The local path keeps every download entry point ready without
// hard-coding a temporary third-party URL into the UI.
export const APP_DOWNLOAD_URL = import.meta.env.VITE_MYPETPLUS_APP_DOWNLOAD_URL || '/downloads/mypetplus.apk'
export const APP_DOWNLOAD_FILE_NAME = 'MyPetPlus.apk'
