export default {
  async fetch(request) {
    const url = new URL(request.url)
    const target = url.searchParams.get("url")

    if (!target) {
      return new Response("Use ?url=", { status: 400 })
    }

    try {
      const res = await fetch(target, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": target,
        },
      })

      const contentType = res.headers.get("content-type") || ""

      // 🟢 If M3U playlist → rewrite all links
      if (contentType.includes("mpegurl") || target.includes(".m3u")) {
        let text = await res.text()

        text = text.replace(/https?:\/\/[^\s]+/g, (link) => {
          return `${url.origin}/?url=${encodeURIComponent(link)}`
        })

        return new Response(text, {
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": "*",
          },
        })
      }

      // 🔵 Normal stream proxy
      return new Response(res.body, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": contentType,
        },
      })

    } catch (e) {
      return new Response("Error: " + e.message, { status: 500 })
    }
  },
}
