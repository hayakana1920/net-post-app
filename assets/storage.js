(function (root) {
  const PROFILE_KEY = "netPostApp.analysisProfiles.v1";
  const LOG_KEY = "netPostApp.performanceLogs.v1";

  function readJson(key, fallback) {
    try {
      const value = root.localStorage?.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    root.localStorage?.setItem(key, JSON.stringify(value));
  }

  function loadProfiles() {
    return readJson(PROFILE_KEY, []);
  }

  function saveProfile(profile) {
    const profiles = loadProfiles();
    const id = profile.id || `profile-${Date.now()}`;
    const next = { ...profile, id, updated_at: new Date().toISOString() };
    const index = profiles.findIndex((item) => item.id === id);
    if (index >= 0) profiles[index] = next;
    else profiles.unshift(next);
    writeJson(PROFILE_KEY, profiles);
    return next;
  }

  function deleteProfile(id) {
    writeJson(PROFILE_KEY, loadProfiles().filter((item) => item.id !== id));
  }

  function renameProfile(id, name) {
    const profiles = loadProfiles().map((item) => item.id === id ? { ...item, profile_name: name } : item);
    writeJson(PROFILE_KEY, profiles);
  }

  function addPerformanceLog(log) {
    const logs = readJson(LOG_KEY, []);
    logs.unshift({ ...log, id: `log-${Date.now()}`, saved_at: new Date().toISOString() });
    writeJson(LOG_KEY, logs);
  }

  const api = { PROFILE_KEY, LOG_KEY, loadProfiles, saveProfile, deleteProfile, renameProfile, addPerformanceLog };
  root.NetPostStorage = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
