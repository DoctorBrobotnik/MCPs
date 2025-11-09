# GitHub Actions CI/CD Workflow Documentation

This document explains how the GitHub Actions continuous integration and deployment (CI/CD) workflow works for building and publishing MCP server Docker images.

## Overview

The repository uses GitHub Actions to **automatically build, test, and publish Docker images** for all MCP servers. When code is pushed to the main branch, the workflow:

1. Detects which MCP servers have changed
2. Builds Docker images for those servers
3. Validates the images
4. Publishes to GitHub Container Registry (GHCR)
5. Makes images immediately available for users

## Workflow File Location

The workflow configuration is at: `.github/workflows/build-and-publish-mcps.yml`

## How It Works

### Trigger

The workflow is triggered when:
- Code is pushed to the `main` branch
- A pull request is created or updated
- Manual trigger via GitHub Actions UI

### Detection

The workflow automatically detects which MCP servers have been modified:
- Scans directories in the `MCPs/` folder
- Each directory should contain a `Dockerfile`
- Only modified servers are built (saves time and resources)

### Build Process

For each detected MCP server:

```
1. Checkout repository code
2. Set up Docker Buildx (multi-platform builds)
3. Login to GitHub Container Registry
4. Build Docker image with:
   - Platform: linux/amd64, linux/arm64
   - Tags: latest, git SHA
   - Metadata labels
5. Push to GHCR
6. Generate build report
```

### Output

After successful build:
- Image available at: `ghcr.io/doctorbrobotnik/[service-name]-mcp:latest`
- Specific version at: `ghcr.io/doctorbrobotnik/[service-name]-mcp:[git-sha]`
- Buildx cache enabled for faster future builds

## MCP Server Directory Structure

For the workflow to detect and build a server, the directory must contain:

```
my-service-mcp/
├── Dockerfile           (required)
├── src/                 (for TypeScript/Node.js)
├── package.json
├── tsconfig.json
├── README.md
└── ... other files
```

Or for Python:
```
my-service-mcp/
├── Dockerfile           (required)
├── requirements.txt
├── my_service_server.py
├── README.md
└── ... other files
```

## Dockerfile Requirements

Each MCP server's Dockerfile must:

1. **Be named exactly `Dockerfile`** (case-sensitive on Linux)
2. **Use a proper base image:**
   - TypeScript: `node:18-slim` or `node:20-slim`
   - Python: `python:3.11-slim` or `python:3.12-slim`
3. **Follow multi-stage build pattern** (for TypeScript):
   - Builder stage: compiles TypeScript
   - Production stage: runs the compiled server
4. **Create a non-root user** (UID > 5000)
5. **Set proper environment variables:**
   - TypeScript: `NODE_ENV=production`
   - Python: `PYTHONUNBUFFERED=1`
6. **Expose proper command** to run the server

## Image Naming and Tagging

### Image Name
GitHub Actions automatically determines the image name from the directory:
- Directory: `discord-mcp/` → Image name: `discord-mcp`
- Directory: `suno-mcp/` → Image name: `suno-mcp`

The registry prefix `ghcr.io/doctorbrobotnik/` is added automatically.

### Image Tags
Each built image receives multiple tags:
- `latest` - Points to the most recent successful build
- `[git-sha]` - Specific commit hash (e.g., `abc1234def`)
- `[git-sha-short]` - Short commit hash (first 7 characters)

### Complete Image URLs
Users can pull using:
```bash
# Latest version
docker pull ghcr.io/doctorbrobotnik/[service-name]-mcp:latest

# Specific version (by commit)
docker pull ghcr.io/doctorbrobotnik/[service-name]-mcp:abc1234
```

## Monitoring Builds

### GitHub UI

View build status in the GitHub repository:

1. **Actions Tab**
   - Shows all workflow runs
   - Green checkmark = successful build
   - Red X = failed build

2. **Individual Run**
   - Click on run to see details
   - View logs for each step
   - Check build duration and resource usage

### Status Indicators

Repository status can show build status:
- Main branch status badge indicates latest build
- Pull request checks show build status before merge

### Notifications

GitHub sends notifications when:
- Build fails (if enabled in settings)
- Build completes (if enabled)
- Review requested

## Troubleshooting

### Build Failures

**Check the workflow logs:**
1. Go to repository → Actions tab
2. Click on the failed workflow run
3. Expand the "Build" step
4. Look for error messages

**Common build failures:**

| Error | Cause | Solution |
|-------|-------|----------|
| `Dockerfile not found` | Dockerfile missing or in wrong directory | Ensure `Dockerfile` exists in MCP server directory |
| `FROM base image not found` | Invalid base image name | Use `node:18-slim` or `python:3.11-slim` |
| `RUN command failed` | Error during build | Check command syntax in Dockerfile logs |
| `COPY failed: file not found` | Referenced file doesn't exist | Verify all source files are in the build context |
| `Registry authentication failed` | GHCR login issue | Check GitHub token permissions and secrets |

### Image Not Available

If image doesn't appear in GHCR after successful build:
1. Check workflow run completed successfully (green checkmark)
2. Verify image name is correct in catalog
3. Give GHCR a moment to propagate (usually instant)
4. Check GitHub account permissions for GHCR push

### Pull Image Locally

Test pulling the image locally:
```bash
docker pull ghcr.io/doctorbrobotnik/[service-name]-mcp:latest
docker run --rm ghcr.io/doctorbrobotnik/[service-name]-mcp:latest
```

## Development Workflow with CI/CD

### For Developers

1. **Create/modify MCP server locally** in a feature branch
2. **Test locally:**
   ```bash
   npm run build && npm start  # TypeScript
   # or
   python my_service_server.py  # Python
   ```
3. **Commit and push to GitHub**
4. **GitHub Actions automatically:**
   - Builds Docker image
   - Publishes to GHCR
   - Completes in 5-10 minutes
5. **Image is ready for users** with no additional work

### For Users

1. **Pull pre-built image** from GHCR
2. **No local Docker build needed**
3. **Always get latest version** (or specific version by SHA)

## Multi-Platform Builds

The workflow builds images for multiple platforms:
- **linux/amd64** - Intel/AMD x86_64 (most common)
- **linux/arm64** - ARM processors (Apple Silicon, newer Raspberry Pi)

Both platforms are built automatically and work seamlessly with `docker pull`.

## Caching

GitHub Actions uses buildx caching to:
- Speed up subsequent builds
- Cache dependencies and base layers
- Reduce build time from 5-10 min to 2-3 min on rebuilds

Cache is automatically managed and requires no configuration.

## Registry Authentication

### Public Images

The repository is public, and most images are built as public. Users can pull without authentication:
```bash
docker pull ghcr.io/doctorbrobotnik/[service-name]-mcp:latest
```

### Private Images (if needed)

For private images, users may need to authenticate:
```bash
echo ${{ github.token }} | docker login ghcr.io -u $ --password-stdin
```

Or with Personal Access Token (PAT):
```bash
echo "YOUR_PAT" | docker login ghcr.io -u USERNAME --password-stdin
```

## Secrets and Environment Variables

### Build-Time Secrets

Secrets used during build are managed in GitHub Secrets:
- Add under repository → Settings → Secrets and variables
- Access in workflow: `${{ secrets.SECRET_NAME }}`
- Not embedded in final image

### Runtime Secrets

Secrets needed at runtime are configured differently:
- Stored in Docker Desktop: `docker mcp secret set`
- Passed to container via environment variables
- Not embedded in image

**Never commit secrets to the repository.**

## Build Performance

### Build Times

Typical build times:
- First build: 5-10 minutes (with dependencies)
- Subsequent builds: 2-3 minutes (with cache)
- Multi-platform: Builds both architectures in parallel

### Resources

GitHub Actions provides:
- 2 CPU cores per runner
- 7 GB RAM
- Adequate disk space for builds

## Benefits of CI/CD

✅ **Consistency** - All images built in identical environment
✅ **Automation** - No manual Docker build steps
✅ **Testing** - Automated validation before publishing
✅ **Distribution** - Images available immediately
✅ **Versioning** - Automatic image tagging
✅ **User Experience** - Users pull pre-built images
✅ **Updates** - Images auto-update when code changes
✅ **Scalability** - Easily add new servers to workflow

## Workflow Maintenance

### Adding New MCP Servers

No configuration needed! The workflow automatically:
1. Detects new directories
2. Looks for Dockerfile
3. Builds and publishes automatically

Just commit a new MCP server directory with a Dockerfile.

### Removing Servers

To remove a server from CI/CD:
1. Delete the server directory from the repository
2. The workflow will no longer build it
3. Previous images remain in GHCR

### Modifying Existing Servers

Changes to existing servers trigger automatic rebuilds:
1. Update server code
2. Commit and push
3. Workflow automatically builds new image
4. New image published with same name, new tags

## GitHub Actions Permissions

The workflow requires permissions to:
- Read repository contents: `contents: read`
- Write to GHCR: `packages: write`
- Create build reports: `actions: read`

These are configured in the workflow file and granted by GitHub.

## Conclusion

The GitHub Actions workflow provides a seamless, automated build and publishing system for MCP servers. Developers push code, users pull pre-built images—no local Docker builds needed.

For questions or issues with the workflow, check the Actions tab for detailed logs.
