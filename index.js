export default {
  async fetch(request) {

    const portal = "http://4k.spicetv.cc/stalker_portal";
    const mac = "00:1A:79:00:2C:D8";

    // ✅ YOUR REAL VALUES
    const device_id = "061A842DFD8AA25AA9184BAB968565D2E8831804C89956DA707F8396F7D4BBDB";
    const device_id2 = device_id;
    const serial = "61A63207AA03F";

    const headers = {
      "User-Agent": "Mozilla/5.0 (QtEmbedded; U; Linux; C)",
      "X-User-Agent": "Model: MAG250; Link: WiFi",
      "Cookie": `mac=${mac}; stb_lang=en; timezone=Asia/Kolkata;`
    };

    // STEP 1: Handshake
    let tokenRes = await fetch(`${portal}/server/load.php?type=stb&action=handshake&JsHttpRequest=1-xml`, { headers });
    let tokenData = await tokenRes.json();
    let token = tokenData.js.token;

    // STEP 2: Profile (CRITICAL)
    await fetch(`${portal}/server/load.php?type=stb&action=get_profile&hd=1&sn=${serial}&device_id=${device_id}&device_id2=${device_id2}&signature=00000000000000000000000000000000&auth_second_step=1&not_valid_token=0&JsHttpRequest=1-xml`, {
      headers: { ...headers, "Authorization": `Bearer ${token}` }
    });

    // STEP 3: Get Channels
    let chRes = await fetch(`${portal}/server/load.php?type=itv&action=get_all_channels&JsHttpRequest=1-xml`, {
      headers: { ...headers, "Authorization": `Bearer ${token}` }
    });

    let chData = await chRes.json();
    let channels = chData.js.data;

    let m3u = "#EXTM3U\n";

    // STEP 4: Generate stream links
    for (let ch of channels) {
      try {
        let linkRes = await fetch(`${portal}/server/load.php?type=itv&action=create_link&cmd=${encodeURIComponent(ch.cmd)}&JsHttpRequest=1-xml`, {
          headers: { ...headers, "Authorization": `Bearer ${token}` }
        });

        let linkData = await linkRes.json();
        let stream = linkData.js.cmd;

        m3u += `#EXTINF:-1 group-title="Live",${ch.name}\n${stream}\n`;

      } catch (e) {}
    }

    return new Response(m3u, {
      headers: { "content-type": "audio/x-mpegurl" }
    });
  }
};
