# Railway Build Fix - ERP MisCausas

## Issue Resolved
Railway build was failing with "sh: vite: not found" because build dependencies were in devDependencies but Railway's production build process doesn't install them by default.

## Files Modified

### 1. Dockerfile
**Changed**: Install all dependencies including devDependencies for build
```dockerfile
# Before
RUN npm ci --only=production

# After  
RUN npm ci
```

### 2. railway.json
**Added**: Explicit build command to ensure all dependencies are available
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  }
}
```

### 3. nixpacks.toml (New File)
**Created**: Nixpacks configuration for Railway deployment
```toml
[phases.setup]
nixPkgs = ['nodejs-20_x', 'npm-9_x']

[phases.install]
cmds = ['npm install']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'npm start'
```

### 4. .github/workflows/deploy.yml
**Changed**: Use npm install instead of npm ci for consistency
```yaml
# Before
run: npm ci

# After
run: npm install
```

## How This Fixes the Build

1. **Dockerfile**: Now installs all dependencies (including vite, typescript, etc.) needed for building
2. **railway.json**: Explicitly tells Railway to run `npm install && npm run build`
3. **nixpacks.toml**: Provides Railway with specific build instructions
4. **GitHub Actions**: Ensures consistency between local and CI builds

## Build Process Flow

1. **Install Phase**: `npm install` (includes devDependencies)
2. **Build Phase**: `npm run build` (vite build + esbuild server)
3. **Production Phase**: Runs built application with `npm start`

## Alternative Solutions Considered

1. **Move build tools to dependencies**: Not ideal as it bloats production
2. **Multi-stage Docker build**: More complex, not necessary for Railway
3. **Custom build scripts**: Current solution is cleaner

## Verification

After pushing these changes, Railway will:
1. Use nixpacks.toml configuration
2. Install all dependencies including build tools
3. Successfully run `vite build` 
4. Bundle server with esbuild
5. Start production server

## Next Steps

1. Commit and push these changes:
```bash
git add .
git commit -m "Fix Railway build: add nixpacks config and update dependencies"
git push origin main
```

2. Railway will automatically redeploy
3. Build should complete successfully in 3-5 minutes
4. Application will be available at generated Railway URL

## Files to Push

- `Dockerfile` (updated)
- `railway.json` (updated) 
- `nixpacks.toml` (new)
- `.github/workflows/deploy.yml` (updated)
- `RAILWAY_BUILD_FIX.md` (new)