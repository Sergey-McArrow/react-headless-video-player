export {}

const buildResult = await Bun.build({
  entrypoints: ['./playground/app.tsx'],
  target: 'browser',
})

if (!buildResult.success) {
  console.error('Failed to bundle playground:', buildResult.logs)
  process.exit(1)
}

const appJs = await buildResult.outputs[0].text()

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>react-headless-video-player Playground</title>
  <style>
    body {
      margin: 0;
      background-color: #0f172a;
      color: #f8fafc;
    }
    * {
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/app.js"></script>
</body>
</html>`

const server = Bun.serve({
  port: 3333,
  fetch(req) {
    const url = new URL(req.url)
    if (url.pathname === '/app.js') {
      return new Response(appJs, {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
      })
    }
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  },
})

console.log(`Playground running at http://localhost:${server.port}`)

