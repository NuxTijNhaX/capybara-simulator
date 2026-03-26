# AGENTS.md

Guidelines for AI agents working on the Capybara Simulator codebase.

## Project Overview

A zen idle game featuring a capybara. Built with vanilla JavaScript and Three.js in a single HTML file. No build system, bundler, or test framework.

## Commands

### Development
```bash
# Serve locally (simplest)
npx serve .

# Docker alternative
docker build -t capybara .
docker run -p 3000:3000 capybara
```

### No Build/Test/Lint
This project has no build step, test suite, or linting. Changes take effect immediately when the file is served.

## Code Style

### File Structure
- **Single file**: All code lives in `index.html`
- **Assets**: 3D models in `models/`, audio in `audio/`
- **No modules**: Everything in one `<script type="module">` block

### JavaScript Conventions

**Classes**: Use PascalCase with leading underscore for private
```javascript
class CapybaraSimulator {
    constructor() {
        this._isMobile = false;  // private flag
        this.renderer = null;     // public property
    }
    
    setupLighting() { }         // public method
    _buildFlowerInstances() { } // private method
}
```

**Naming**:
- Private properties: `_camelCase` with underscore prefix
- Public properties: `camelCase`
- Constants in methods: `UPPER_SNAKE_CASE`
- Three.js objects: descriptive nouns (`this._sun`, `this._rainParticles`)

**Formatting**:
- 4 spaces for indentation
- Opening brace on same line
- No trailing semicolons required (be consistent with existing code)
- JSDoc comments for complex methods

**Three.js Patterns**:
```javascript
// Reusable objects at class level to avoid allocation
this._bubbleCamRight = new THREE.Vector3();
this._bubbleHeadPos = new THREE.Vector3();

// Conditional quality based on mobile detection
this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this._isMobile ? 1.5 : 2));

// Shader material uniforms
mat.userData.uniforms = { windTime: { value: 0 } };
```

### Error Handling
- Use early returns for guard clauses
- Wrap async operations in try/catch
- Log errors to console with context
- Fail gracefully (game should still run if models fail)

### Performance Guidelines
- Always detect mobile: `this._isMobile = /Mobi|Android/i.test(navigator.userAgent)`
- Reduce quality on mobile: shadows, antialias, geometry segments
- Use `InstancedMesh` for repeated objects (flowers)
- Move per-frame CPU work to GPU shaders
- Cache `Vector3`, `Quaternion`, `Matrix4` objects as class properties
- Update uniforms instead of geometry for animations

### Adding Features
1. Add initialization in constructor (setup phase)
2. Create dedicated setup method for complex features
3. Update in `animate()` loop if needed
4. Handle cleanup in destructor if resources need disposal

### External Dependencies
```javascript
// Import map (defined in HTML head)
"imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
}

// Usage
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
```

### Asset Loading
- Models: Use `GLTFLoader` with async/await
- Audio: Native HTML5 Audio API
- Track loading progress with `this.loadedCount / this.totalModels`
- Placeholder while loading via `#loading` div

### CSS Conventions
- BEM-like naming: `#music-controls`, `#btn-rain`
- Mobile-first responsive with `@media (max-width: 600px)`
- Use CSS variables sparingly (prefer direct values for single file)
- Backdrop filters for frosted glass effects

## Common Tasks

**Add a new model**:
1. Copy `.glb` to `models/`
2. Add to `loadModels()` with `loader.loadAsync()`
3. Use in `buildScene()` or dedicated setup method

**Add a new hat**:
1. Add model to `models/hats/`
2. Add entry to `this.hatModels` array with config
3. Position relative to head bone in `_updateHatPosition()`

**Add weather effect**:
1. Setup in `setupWeather()` with shader material
2. Update uniforms in `_updateWeather(delta, time)`
3. Toggle with weather state machine

## Deployment

The `dev` branch auto-deploys to Railway. Merge to `main` for production.

```bash
git checkout dev
git merge feature/your-feature
git push origin dev
```

## Philosophy

Keep it simple. One file, no build, works everywhere. The capybara prefers minimal dependencies.
