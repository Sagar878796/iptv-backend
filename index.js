const fs = require("fs");
const axios = require("axios");

// ===== CONFIG =====
const config = {
  host: "http://4k.spicetv.cc/stalker_portal/",
  mac: "00:1A:79:00:2C:D8",
  serial: "061A842DFD8AA25AA9184BAB968565D2E8831804C89956DA707F8396F7D4BBDB",
  device1: "61A63207AA03F",
  device2: "061A842DFD8AA25AA9184BAB968565D2E8831804C89956DA707F8396F7D4BBDB"
};

// ===== HEADERS =====
function headers(token = "") {
  return {
    "User-Agent": "Mozilla/5.0 (QtEmbedded; U; Linux; C)",
    "X-User-Agent": "Model: MAG254; Link: WiFi",
    "Connection": "Keep-Alive",
    "Accept": "*/*",
    "Referer": config.host + "c/",
    "Cookie": `mac=${config.mac}; stb_lang=en; timezone=Asia/Kolkata`,
    "Authorization": token ? `Bearer ${token}` : "",
    "X-Serial-Number": config.serial,
    "X-Device-Id": config.device1,
    "X-Device-Id2": config.device2
  };
}

// ===== API =====
async function getToken() {
  const res = await axios.get(
    `${config.host}portal.php?type=stb&action=handshake&JsHttpRequest=1-xml`,
    { headers: headers() }
  );
  return res.data.js.token;
}

async function getProfile(token) {
  await axios.get(
    `${config.host}portal.php?type=stb&action=get_profile&JsHttpRequest=1-xml`,
    { headers: headers(token) }
  );
}

async function getChannels(token) {
  const res = await axios.get(
    `${config.host}portal.php?type=itv&action=get_all_channels&JsHttpRequest=1-xml`,
    { headers: headers(token) }
  );
  return res.data.js.data;
}

async function createLink(token, cmd) {
  const res = await axios.get(
    `${config.host}portal.php?type=itv&action=create_link&cmd=${cmd}&JsHttpRequest=1-xml`,
    { headers: headers(token) }
  );
  return res.data.js.cmd;
}

// ===== MAIN =====
async function run() {
  try {
    console.log("Token...");
    const token = await getToken();

    console.log("Profile...");
    await getProfile(token);

    console.log("Channels...");
    const channels = await getChannels(token);

    let m3u = "#EXTM3U\n";

    for (let ch of channels) {
      try {
        const link = await createLink(token, ch.cmd);

        m3u += `#EXTINF:-1,${ch.name}\n`;
        m3u += `${link}\n`;

        console.log("✔", ch.name);
      } catch {
        console.log("❌ Skip", ch.name);
      }
    }

    fs.writeFileSync("static.m3u", m3u);
    console.log("✅ DONE");

  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

run();
