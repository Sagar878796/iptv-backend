export default async function handler(req, res) {
  try {
    const config = {
      host: "http://portal.airtel4k.co",
      mac: "00:1A:79:00:2D:6A",
      serial: "7D051746180ABD8E70AA3C6E23ADBC8D",
      device1: "FC21220582688F2AA17265FAC3C00AD4C8467372CB70D79278F6CAD53AFDB7D7",
      device2: "FC21220582688F2AA17265FAC3C00AD4C8467372CB70D79278F6CAD53AFDB7D7"
    };

    // 🔐 Handshake
    let res1 = await fetch(`${config.host}/portal.php?type=stb&action=handshake&JsHttpRequest=1-xml`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Cookie": `mac=${config.mac}`
      }
    });

    let data1 = await res1.json();
    let token = data1.js.token;

    // 🔥 Profile
    await fetch(`${config.host}/portal.php?type=stb&action=get_profile&JsHttpRequest=1-xml`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Cookie": `mac=${config.mac}; serial=${config.serial}; device_id=${config.device1}; device_id2=${config.device2}`
      }
    });

    // 📡 Channels
    let res2 = await fetch(`${config.host}/portal.php?type=itv&action=get_all_channels&JsHttpRequest=1-xml`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Cookie": `mac=${config.mac}; serial=${config.serial}; device_id=${config.device1}; device_id2=${config.device2}`
      }
    });

    let data2 = await res2.json();
    let channels = data2.js.data;

    // 🎬 M3U
    let m3u = "#EXTM3U\n";

    for (let ch of channels) {
      let stream = ch.cmd.replace("ffmpeg ", "");

      m3u += `#EXTINF:-1,${ch.name}\n`;
      m3u += `${config.host}/${stream}\n`;
    }

    res.setHeader("Content-Type", "text/plain");
    res.send(m3u);

  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
}
