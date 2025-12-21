import { execSync } from 'child_process';
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/13257e3b-6487-44c5-a92a-5c9ccfc77026',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'build-backend.js:6',message:'Module initialization',data:{hasFsCpSync:typeof fs.cpSync,hasFsRmSync:typeof fs.rmSync,hasFsExistsSync:typeof fs.existsSync,hasFsWriteFileSync:typeof fs.writeFileSync},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B'})}).catch(()=>{});
// #endregion

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SOURCE_DIR = join(__dirname, 'backend');
const DIST_DIR = join(__dirname, 'dist-backend');

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13257e3b-6487-44c5-a92a-5c9ccfc77026',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'build-backend.js:12',message:'Path resolution',data:{__dirname,SOURCE_DIR,DIST_DIR},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

const buildBackend = () => {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13257e3b-6487-44c5-a92a-5c9ccfc77026',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'build-backend.js:16',message:'Function entry',data:{DIST_DIR,distExists:fs.existsSync(DIST_DIR)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion

    // Clean dist directory if it exists
    if (fs.existsSync(DIST_DIR)) {
      console.log('🧹 Cleaning dist-backend directory...');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/13257e3b-6487-44c5-a92a-5c9ccfc77026',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'build-backend.js:20',message:'Before rmSync',data:{DIST_DIR,hasRmSync:typeof fs.rmSync},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      fs.rmSync(DIST_DIR, { recursive: true, force: true });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/13257e3b-6487-44c5-a92a-5c9ccfc77026',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'build-backend.js:22',message:'After rmSync',data:{success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    }

    // Copy source files to dist-backend (excluding node_modules)
    console.log('📚 Copying source files to dist-backend...');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13257e3b-6487-44c5-a92a-5c9ccfc77026',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'build-backend.js:26',message:'Before cpSync',data:{SOURCE_DIR,DIST_DIR,hasCpSync:typeof fs.cpSync},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    fs.cpSync(SOURCE_DIR, DIST_DIR, {
      recursive: true,
      filter: (src) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/13257e3b-6487-44c5-a92a-5c9ccfc77026',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'build-backend.js:29',message:'Filter function',data:{src,includesNodeModules:src.includes('node_modules'),normalizedSrc:src.replace(/\\/g,'/')},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        // Exclude node_modules directory
        return !src.includes('node_modules');
      }
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13257e3b-6487-44c5-a92a-5c9ccfc77026',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'build-backend.js:35',message:'After cpSync',data:{success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Install production dependencies using npm (avoids pnpm workspace detection issues)
    console.log('📦 Installing production dependencies...');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13257e3b-6487-44c5-a92a-5c9ccfc77026',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'build-backend.js:49',message:'Before execSync',data:{cwd:DIST_DIR,command:'npm install --production'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    execSync('npm install --production', { 
      cwd: DIST_DIR, 
      stdio: 'inherit'
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13257e3b-6487-44c5-a92a-5c9ccfc77026',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'build-backend.js:53',message:'After execSync',data:{success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    console.log('✅ Backend build completed successfully!');
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13257e3b-6487-44c5-a92a-5c9ccfc77026',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'build-backend.js:57',message:'Error caught',data:{errorName:error.name,errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
    // #endregion
    console.error('❌ Error building backend:', error);
    process.exit(1);
  }
}

buildBackend();