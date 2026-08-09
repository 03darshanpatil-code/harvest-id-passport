const fs = require("fs");
const path = require("path");

const profileStorePath = path.join(__dirname, "../data/profile.json");

const defaultProfile = {
  fullName: "Ramesh Kumar",
  farmName: "Green Valley Farms",
  phone: "+91 98450 00000",
  email: "ramesh@greenvalley.in",
  location: "Bengaluru, Karnataka",
  preferences: {
    reminders: true,
    aiFormatting: true,
    publicSharing: true,
  },
};

const readProfileStore = () => {
  try {
    const raw = fs.readFileSync(profileStorePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : defaultProfile;
  } catch {
    return defaultProfile;
  }
};

const writeProfileStore = (profile) => {
  fs.writeFileSync(profileStorePath, JSON.stringify(profile, null, 2));
};

const normalizeProfile = (profile = {}) => ({
  ...defaultProfile,
  ...profile,
  preferences: {
    reminders: true,
    aiFormatting: true,
    publicSharing: true,
    ...(profile.preferences || {}),
  },
});

const getProfile = async (req, res) => {
  try {
    const profile = normalizeProfile(readProfileStore());
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const incoming = req.body || {};
    const persisted = normalizeProfile({
      ...readProfileStore(),
      ...incoming,
      preferences: {
        ...(readProfileStore().preferences || {}),
        ...(incoming.preferences || {}),
      },
    });

    writeProfileStore(persisted);
    res.json({ success: true, data: persisted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
