const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3002;

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy middleware configuration
const proxyOptions = {
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/': '/'
  },
  onProxyReq: (proxyReq, req, res) => {
    // Rewrite headers to make it look like a real domain
    proxyReq.setHeader('Host', 'kmit-vichaar-dev.vercel.app');
    proxyReq.setHeader('Origin', 'https://kmit-vichaar-dev.vercel.app');
    proxyReq.setHeader('Referer', 'https://kmit-vichaar-dev.vercel.app/');
  },
  onProxyRes: (proxyRes, req, res) => {
    // Rewrite response headers
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].includes('text/html')) {
      // Replace localhost references in HTML
      let body = '';
      proxyRes.on('data', chunk => {
        body += chunk;
      });
      proxyRes.on('end', () => {
        body = body.replace(/localhost:3001/g, 'kmit-vichaar-dev.vercel.app');
        body = body.replace(/http:\/\/localhost:3001/g, 'https://kmit-vichaar-dev.vercel.app');
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Length', Buffer.byteLength(body));
        res.end(body);
      });
    } else {
      // For non-HTML responses, just proxy through
      Object.keys(proxyRes.headers).forEach(key => {
        res.setHeader(key, proxyRes.headers[key]);
      });
      proxyRes.pipe(res);
    }
  }
};

// Use proxy for all routes
app.use('/', createProxyMiddleware(proxyOptions));

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`🌐 Access your app at: http://localhost:${PORT}`);
  console.log(`🔒 hCaptcha should now work (bypasses localhost restriction)`);
  console.log(`📱 Your React app is proxied from: http://localhost:3001`);
});
