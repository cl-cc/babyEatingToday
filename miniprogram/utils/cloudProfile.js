const { PROFILE_COLLECTION } = require('../config/cloud')
const { normalizeProfile } = require('./profileDefaults')
const { getDB, isCloudReady } = require('./cloud')

let docId = null

function stripDoc(raw) {
  if (!raw) return null
  return normalizeProfile(raw)
}

function toCloudData(profile) {
  const db = getDB()
  const data = normalizeProfile(profile)
  if (db) {
    data.updatedAt = db.serverDate()
  }
  return data
}

async function fetchProfile() {
  const db = getDB()
  if (!db) return null

  const res = await db.collection(PROFILE_COLLECTION).limit(1).get()
  const doc = res.data && res.data[0]
  if (!doc) {
    docId = null
    return null
  }

  docId = doc._id
  return stripDoc(doc)
}

async function upsertProfile(profile) {
  const db = getDB()
  if (!db) return normalizeProfile(profile)

  const data = toCloudData(profile)

  if (docId) {
    await db.collection(PROFILE_COLLECTION).doc(docId).update({ data })
  } else {
    const existing = await db.collection(PROFILE_COLLECTION).limit(1).get()
    if (existing.data && existing.data[0]) {
      docId = existing.data[0]._id
      await db.collection(PROFILE_COLLECTION).doc(docId).update({ data })
    } else {
      const addRes = await db.collection(PROFILE_COLLECTION).add({ data })
      docId = addRes._id
    }
  }

  return normalizeProfile(profile)
}

function resetDocId() {
  docId = null
}

module.exports = {
  isCloudReady,
  fetchProfile,
  upsertProfile,
  resetDocId,
}
