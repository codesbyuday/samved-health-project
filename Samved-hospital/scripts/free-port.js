const { execSync } = require('child_process');

const PORT = 3000;

function freePort(port) {
  try {
    if (process.platform === 'win32') {
      try {
        const output = execSync(`netstat -ano | findstr :${port}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
        const lines = output.trim().split(/\r?\n/);
        const pids = new Set();
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0' && pid !== process.pid.toString()) {
              pids.add(pid);
            }
          }
        }
        pids.forEach((pid) => {
          try {
            console.log(`[predev] Freeing port ${port} by terminating PID ${pid}...`);
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          } catch (e) {
            // Process may have already exited
          }
        });
      } catch (e) {
        // findstr returns exit code 1 when no match found; port is free
      }
    } else {
      try {
        const pid = execSync(`lsof -t -i:${port}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
        if (pid) {
          console.log(`[predev] Freeing port ${port} by terminating PID ${pid}...`);
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        }
      } catch (e) {
        // Port is free
      }
    }
  } catch (err) {
    // Ignore any error so dev server can proceed regardless
  }
}

freePort(PORT);
