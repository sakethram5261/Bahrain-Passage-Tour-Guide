const DB_NAME = 'BahrainPassageDB'
const DB_VERSION = 1
const STORE_NAME = 'photos'

export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = (e) => resolve(e.target.result)
    request.onerror = (e) => reject(e.target.error)
  })
}

export const savePhoto = async (id, base64Data) => {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.put(base64Data, id)
      request.onsuccess = () => resolve()
      request.onerror = (e) => reject(e.target.error)
    })
  } catch (err) {
    console.error('Failed to save photo to IndexedDB', err)
  }
}

export const getPhoto = async (id) => {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(id)
      request.onsuccess = (e) => resolve(e.target.result)
      request.onerror = (e) => reject(e.target.error)
    })
  } catch (err) {
    console.error('Failed to get photo from IndexedDB', err)
    return null
  }
}

export const getAllPhotos = async () => {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.openCursor()
      const photos = {}
      request.onsuccess = (e) => {
        const cursor = e.target.result
        if (cursor) {
          photos[cursor.key] = cursor.value
          cursor.continue()
        } else {
          resolve(photos)
        }
      }
      request.onerror = (e) => reject(e.target.error)
    })
  } catch (err) {
    console.error('Failed to get all photos from IndexedDB', err)
    return {}
  }
}

export const deletePhoto = async (id) => {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = (e) => reject(e.target.error)
    })
  } catch (err) {
    console.error('Failed to delete photo from IndexedDB', err)
  }
}

export const clearAllPhotos = async () => {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = (e) => reject(e.target.error)
    })
  } catch (err) {
    console.error('Failed to clear photos from IndexedDB', err)
  }
}
