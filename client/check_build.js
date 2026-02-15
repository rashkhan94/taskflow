const { execSync } = require('child_process');
const fs = require('fs');
try {
    const out = execSync('npx vite build', { stdio: 'pipe', env: { ...process.env, FORCE_COLOR: '0' } });
    console.log('SUCCESS');
    console.log(out.toString());
} catch (e) {
    console.log('STDERR:');
    console.log(e.stderr ? e.stderr.toString() : 'none');
    console.log('STDOUT:');
    console.log(e.stdout ? e.stdout.toString() : 'none');
}
