const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');

const app = express();
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({ windowMs: 60000, max: 10 });
app.use(limiter);

const hostRegex = /^(?:[a-zA-Z0-9.-]+|\d{1,3}(?:\.\d{1,3}){3})$/;
function validPort(p) {
  const n = Number(p);
  return Number.isInteger(n) && n > 0 && n <= 65535;
}

app.post('/send', (req, res) => {
  try {
    const { host, port } = req.body;
    if (!host || !port) return res.status(400).json({ ok:false, error: 'host and port required' });
    if (!hostRegex.test(host)) return res.status(400).json({ ok:false, error: 'invalid host' });
    if (!validPort(port)) return res.status(400).json({ ok:false, error: 'invalid port' });

    const serverArg = `${host}:${port}`;
    const args = [
      '--server', serverArg,
      '--to', 'test@example.com',
      '--from', 'web-ui@example.com',
      '--header', 'Subject: MailHog test from web UI',
      '--data', 'This is a test message sent by swaks (via web UI).'
    ];

    const swaks = spawn('swaks', args);

    let out = '', err = '';
    swaks.stdout.on('data', d => out += d.toString());
    swaks.stderr.on('data', d => err += d.toString());

    swaks.on('close', (code) => {
      const success = code === 0;
      res.json({ ok: success, code, stdout: out, stderr: err });
    });

    swaks.on('error', (e) => {
      res.status(500).json({ ok:false, error: e.message });
    });

  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`web UI listening on ${PORT}`));

