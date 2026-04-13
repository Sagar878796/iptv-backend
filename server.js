const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CONFIG =====
const config = {
  host: "http://portal.airtel4k.co",
  mac: "00:1A:79:00:2D:6A",
  serial: "7D051746180ABD8E70AA3C6E23ADBC8D",
  device1: "FC21220582688",
  device2: "5D41402ABC4B2A76B9719D911017C592"
};

// ===== SIGNATURE GENERATOR =====
function generateSignature() {
  const combined = config.mac + config.serial + config.device1;
  return crypto.createHash("sha256").update(combined).digest("hex");
}

// ===== COMMON HEADERS =====
function getHeaders(token = "") {
  return {
    "User-Agent": "Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3",
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
  res.send("🚀 IPTV Backend Running with Device ID");
});

// ===== PLAYLIST API =====
app.get("/playlist", async (req, res) => {
  try {
    // Step 1: Handshake
    const handshake = await axios.get(
      `${config.host}/portal.php?type=stb&action=handshake&token=&prehash=false&JsHttpRequest=1-xml`,
      { headers: getHeaders() }
    );

    const token = handshake.data.js.token;

    // Step 2: Profile (IMPORTANT)
    await axios.get(
      `${config.host}/portal.php?type=stb&action=get_profile&hd=1&ver=ImageDescription:0.2.18-r23-pub-250;ImageDate:Thu Sep 13 11:31:16 EEST 2018;PORTAL version:5.5.0;API Version:JS API version:343;STB API version:146;Player Engine version:0x58c&num_banks=2&sn=${config.serial}&device_id=${config.device1}&device_id2=${config.device2}&signature=${generateSignature()}&auth_second_step=1&hw_version=1.7-BD-00&JsHttpRequest=1-xml`,
      { headers: getHeaders(token) }
    );

    // Step 3: Channels
    const channels = await axios.get(
      `${config.host}/portal.php?type=itv&action=get_all_channels&force_ch_link_check=&JsHttpRequest=1-xml`,
      { headers: getHeaders(token) }
    );

    let m3u = "#EXTM3U\n";

    channels.data.js.data.forEach((ch) => {
      m3u += `#EXTINF:-1 tvg-id="${ch.id}" tvg-name="${ch.name}",${ch.name}\n`;
      m3u += `${config.host}/play/live.php?mac=${config.mac}&stream=${ch.cmd}\n`;
    });

    res.setHeader("Content-Type", "text/plain");
    res.send(m3u);

  } catch (err) {
    console.log(err.response?.data || err.message);
    res.send("❌ Error generating playlist");
  }
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
