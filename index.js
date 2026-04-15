const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CONFIG =====
const config = {
  host: "http://4k.spicetv.cc/stalker_portal/", // FIXED
  mac: "00:1A:79:00:2C:D8",
  serial: "061A842DFD8AA25AA9184BAB968565D2E8831804C89956DA707F8396F7D4BBDB",
  device1: "61A63207AA03F",
  device2: "061A842DFD8AA25AA9184BAB968565D2E8831804C89956DA707F8396F7D4BBDB"
};

// ===== SIGNATURE =====
function generateSignature() {
  return crypto
    .createHash("sha256")
    .update(config.mac + config.serial + config.device1)
    .digest("hex");
}

// ===== HEADERS =====
function getHeaders(token = "") {
  return {
    "User-Agent": "Mozilla/5.0 (QtEmbedded; U; Linux; C)",
    "X-User-Agent": "Model: MAG250; Link: Ethernet",
    "Cookie": `mac=${config.mac}; stb_lang=en; timezone=Asia/Kolkata`,
    "Authorization": token ? `Bearer ${token}` : "",
    "Referer": config.host,
    "Accept": "*/*",
    "Connection": "keep-alive"
  };
}

// ===== HOME =====
app.get("/", (req, res) => {
  res.send("🚀 IPTV Server Running");
});

// ===== PLAYLIST =====
app.get("/playlist", async (req, res) => {
  try {
    console.log("🔄 Generating playlist...");

    // 1️⃣ Handshake
    const handshake = await axios.get(
      `${config.host}portal.php?type=stb&action=handshake&JsHttpRequest=1-xml`,
      { headers: getHeaders() }
    );

    if (!handshake.data?.js?.token) {
      throw new Error("Handshake failed (MAC invalid / blocked)");
    }

    const token = handshake.data.js.token;
    console.log("✅ Token OK");

    // 2️⃣ Profile
    await axios.get(
      `${config.host}portal.php?type=stb&action=get_profile&sn=${config.serial}&device_id=${config.device1}&device_id2=${config.device2}&signature=${generateSignature()}&JsHttpRequest=1-xml`,
      { headers: getHeaders(token) }
    );

    console.log("✅ Profile OK");

    // 3️⃣ Channels
    const channelsRes = await axios.get(
      `${config.host}portal.php?type=itv&action=get_all_channels&JsHttpRequest=1-xml`,
      { headers: getHeaders(token) }
    );

    const channels = channelsRes.data?.js?.data;

    if (!channels || !Array.isArray(channels)) {
      throw new Error("Channels not found");
    }

    console.log(`📺 Total Channels: ${channels.length}`);

    let m3u = "#EXTM3U\n";

    channels.forEach((ch) => {
      if (!ch.cmd || !ch.name) return;

      let stream = ch.cmd;

      // remove ffmpeg prefix
      if (stream.startsWith("ffmpeg ")) {
        stream = stream.replace("ffmpeg ", "");
      }

      m3u += `#EXTINF:-1 tvg-id="${ch.id || ""}" group-title="IPTV",${ch.name}\n`;
      m3u += `${stream}\n`;
    });

    res.setHeader("Content-Type", "text/plain");
    res.send(m3u);

  } catch (err) {
    console.log("❌ ERROR:", err.response?.data || err.message);

    res.send(`
❌ Error generating playlist

Possible reasons:
- MAC invalid / expired
- Portal blocked
- ISP restriction
`);
  }
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
