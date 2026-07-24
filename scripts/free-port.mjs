import { execSync } from 'node:child_process';

const port = process.argv[2] || '5180';

function freeOnWindows() {
  let out = '';
  try {
    out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
  } catch {
    return;
  }

  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    if (!line.includes('LISTENING')) continue;
    const pid = line.trim().split(/\s+/).at(-1);
    if (pid && /^\d+$/.test(pid)) pids.add(pid);
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`[free-port] 已释放端口 ${port}（PID ${pid}）`);
    } catch {
      // ignore
    }
  }
}

function freeOnUnix() {
  try {
    execSync(`lsof -ti:${port} | xargs -r kill -9`, { stdio: 'ignore' });
    console.log(`[free-port] 已释放端口 ${port}`);
  } catch {
    // port already free
  }
}

if (process.platform === 'win32') freeOnWindows();
else freeOnUnix();
