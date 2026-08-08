import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

/**
 * Liquid gradient background (WebGL shader).
 * Ported from the "flow-gradient-hero-section" component and adapted to run as a
 * fixed fullscreen background layer behind the app content. Pointer interaction
 * is tracked on `window` so the ripple effect works even though the canvas sits
 * at -z-10 behind the UI. Colors are the dark theme: vivid red-orange blobs on
 * a near-black navy base — matches the app's black + red look.
 */

class TouchTexture {
  constructor() {
    this.size = 64
    this.width = 64
    this.height = 64
    this.maxAge = 64
    this.radius = 0.1
    this.speed = 1 / 64
    this.trail = []
    this.last = null
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.ctx = this.canvas.getContext('2d')
    this.ctx.fillStyle = 'black'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.texture = new THREE.Texture(this.canvas)
  }

  update() {
    this.ctx.fillStyle = 'black'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const p = this.trail[i]
      const f = p.force * this.speed * (1 - p.age / this.maxAge)
      p.x += p.vx * f
      p.y += p.vy * f
      p.age++
      if (p.age > this.maxAge) this.trail.splice(i, 1)
      else this.drawPoint(p)
    }
    this.texture.needsUpdate = true
  }

  addTouch(point) {
    let force = 0
    let vx = 0
    let vy = 0
    if (this.last) {
      const dx = point.x - this.last.x
      const dy = point.y - this.last.y
      if (dx === 0 && dy === 0) return
      const d = Math.sqrt(dx * dx + dy * dy)
      vx = dx / d
      vy = dy / d
      force = Math.min((dx * dx + dy * dy) * 20000, 2.0)
    }
    this.last = { x: point.x, y: point.y }
    this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy })
  }

  drawPoint(p) {
    const pos = { x: p.x * this.width, y: (1 - p.y) * this.height }
    let intensity =
      p.age < this.maxAge * 0.3
        ? Math.sin((p.age / (this.maxAge * 0.3)) * (Math.PI / 2))
        : -((1 - (p.age - this.maxAge * 0.3) / (this.maxAge * 0.7)) *
            ((1 - (p.age - this.maxAge * 0.3) / (this.maxAge * 0.7)) - 2))
    intensity *= p.force
    const color = `${((p.vx + 1) / 2) * 255}, ${((p.vy + 1) / 2) * 255}, ${intensity * 255}`
    const radius = this.radius * this.width
    this.ctx.shadowOffsetX = this.size * 5
    this.ctx.shadowOffsetY = this.size * 5
    this.ctx.shadowBlur = radius
    this.ctx.shadowColor = `rgba(${color},${0.2 * intensity})`
    this.ctx.beginPath()
    this.ctx.fillStyle = 'rgba(255,0,0,1)'
    this.ctx.arc(pos.x - this.size * 5, pos.y - this.size * 5, radius, 0, Math.PI * 2)
    this.ctx.fill()
  }
}

class GradientBackground {
  constructor(sceneManager) {
    this.sceneManager = sceneManager
    this.mesh = null
    this.isPaused = false
    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uColor1: { value: new THREE.Vector3(0.945, 0.353, 0.133) },
      uColor2: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
      uColor3: { value: new THREE.Vector3(0.945, 0.353, 0.133) },
      uColor4: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
      uColor5: { value: new THREE.Vector3(0.945, 0.353, 0.133) },
      uColor6: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
      uSpeed: { value: 1.2 },
      uIntensity: { value: 1.8 },
      uTouchTexture: { value: null },
      uGrainIntensity: { value: 0.08 },
      uDarkNavy: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
      uGradientSize: { value: 0.45 },
      uGradientCount: { value: 12.0 },
      uColor1Weight: { value: 0.5 },
      uColor2Weight: { value: 1.8 },
    }
  }

  init() {
    const viewSize = this.sceneManager.getViewSize()
    const geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1)
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vUv = uv;
        }`,
      fragmentShader: `
        uniform float uTime, uSpeed, uIntensity, uGrainIntensity, uGradientSize, uGradientCount, uColor1Weight, uColor2Weight;
        uniform vec2 uResolution;
        uniform vec3 uColor1, uColor2, uColor3, uColor4, uColor5, uColor6, uDarkNavy;
        uniform sampler2D uTouchTexture;
        varying vec2 vUv;

        float grain(vec2 uv, float t) {
          return fract(sin(dot(uv * uResolution * 0.5 + t, vec2(12.9898, 78.233))) * 43758.5453) * 2.0 - 1.0;
        }

        vec3 getGradientColor(vec2 uv, float time) {
          vec2 c1 = vec2(0.5 + sin(time * uSpeed * 0.4) * 0.4, 0.5 + cos(time * uSpeed * 0.5) * 0.4);
          vec2 c2 = vec2(0.5 + cos(time * uSpeed * 0.6) * 0.5, 0.5 + sin(time * uSpeed * 0.45) * 0.5);
          vec2 c3 = vec2(0.5 + sin(time * uSpeed * 0.35) * 0.45, 0.5 + cos(time * uSpeed * 0.55) * 0.45);
          vec2 c4 = vec2(0.5 + cos(time * uSpeed * 0.5) * 0.4, 0.5 + sin(time * uSpeed * 0.4) * 0.4);
          vec2 c5 = vec2(0.5 + sin(time * uSpeed * 0.7) * 0.35, 0.5 + cos(time * uSpeed * 0.6) * 0.35);
          vec2 c6 = vec2(0.5 + cos(time * uSpeed * 0.45) * 0.5, 0.5 + sin(time * uSpeed * 0.65) * 0.5);

          float i1 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c1));
          float i2 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c2));
          float i3 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c3));
          float i4 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c4));
          float i5 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c5));
          float i6 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c6));

          vec3 color = vec3(0.0);
          color += uColor1 * i1 * (0.55 + 0.45 * sin(time * uSpeed)) * uColor1Weight;
          color += uColor2 * i2 * (0.55 + 0.45 * cos(time * uSpeed * 1.2)) * uColor2Weight;
          color += uColor3 * i3 * (0.55 + 0.45 * sin(time * uSpeed * 0.8)) * uColor1Weight;
          color += uColor4 * i4 * (0.55 + 0.45 * cos(time * uSpeed * 1.3)) * uColor2Weight;
          color += uColor5 * i5 * (0.55 + 0.45 * sin(time * uSpeed * 1.1)) * uColor1Weight;
          color += uColor6 * i6 * (0.55 + 0.45 * cos(time * uSpeed * 0.9)) * uColor2Weight;

          color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;
          float lum = dot(color, vec3(0.299, 0.587, 0.114));
          color = mix(vec3(lum), color, 1.35);
          color = pow(color, vec3(0.92));
          float brightness = length(color);
          color = mix(uDarkNavy, color, max(brightness * 1.2, 0.15));
          return color;
        }

        void main() {
          vec2 uv = vUv;
          vec4 touchTex = texture2D(uTouchTexture, uv);
          uv.x -= (touchTex.r * 2.0 - 1.0) * 0.8 * touchTex.b;
          uv.y -= (touchTex.g * 2.0 - 1.0) * 0.8 * touchTex.b;
          vec2 center = vec2(0.5);
          float dist = length(uv - center);
          float ripple = sin(dist * 20.0 - uTime * 3.0) * 0.04 * touchTex.b;
          uv += vec2(ripple);
          vec3 color = getGradientColor(uv, uTime);
          color += grain(uv, uTime) * uGrainIntensity;
          color = clamp(color, vec3(0.0), vec3(1.0));
          gl_FragColor = vec4(color, 1.0);
        }`,
    })
    this.mesh = new THREE.Mesh(geometry, material)
    this.sceneManager.scene.add(this.mesh)
  }

  update(delta) {
    if (!this.isPaused) this.uniforms.uTime.value += delta
  }

  onResize(w, h) {
    const viewSize = this.sceneManager.getViewSize()
    if (this.mesh) {
      this.mesh.geometry.dispose()
      this.mesh.geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1)
    }
    this.uniforms.uResolution.value.set(w, h)
  }
}

class App {
  constructor(container) {
    this.container = container
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(this.renderer.domElement)
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 10000)
    this.camera.position.z = 50
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0e27)
    this.clock = new THREE.Clock()
    this.animationId = null
    this.touchTexture = new TouchTexture()
    this.gradientBackground = new GradientBackground(this)
    this.gradientBackground.uniforms.uTouchTexture.value = this.touchTexture.texture
    this.init()
  }

  setPaused(paused) {
    this.gradientBackground.isPaused = paused
  }

  getViewSize() {
    const fov = (this.camera.fov * Math.PI) / 180
    const height = Math.abs(this.camera.position.z * Math.tan(fov / 2) * 2)
    return { width: height * this.camera.aspect, height }
  }

  init() {
    this.gradientBackground.init()

    // Track pointer on `window` (not the canvas) so the ripple follows the
    // cursor even though the layer sits behind the UI at -z-10.
    this.onPointerMove = (e) => {
      this.touchTexture.addTouch({
        x: e.clientX / window.innerWidth,
        y: 1 - e.clientY / window.innerHeight,
      })
    }
    this.onTouchMove = (e) => {
      const t = e.touches && e.touches[0]
      if (!t) return
      this.touchTexture.addTouch({
        x: t.clientX / window.innerWidth,
        y: 1 - t.clientY / window.innerHeight,
      })
    }
    this.onResize = () => {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
      this.gradientBackground.onResize(this.container.clientWidth, this.container.clientHeight)
    }

    window.addEventListener('mousemove', this.onPointerMove)
    window.addEventListener('touchmove', this.onTouchMove, { passive: true })
    window.addEventListener('resize', this.onResize)
    this.tick()
  }

  tick() {
    const delta = Math.min(this.clock.getDelta(), 0.1)
    this.touchTexture.update()
    this.gradientBackground.update(delta)
    if (!this.gradientBackground.isPaused) this.renderer.render(this.scene, this.camera)
    this.animationId = requestAnimationFrame(() => this.tick())
  }

  cleanup() {
    if (this.animationId) cancelAnimationFrame(this.animationId)
    window.removeEventListener('mousemove', this.onPointerMove)
    window.removeEventListener('touchmove', this.onTouchMove)
    window.removeEventListener('resize', this.onResize)
    this.renderer.dispose()
    if (this.container && this.renderer.domElement && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}

export default function LiquidGradient({ showPauseButton = true }) {
  const containerRef = useRef(null)
  const appRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (appRef.current) appRef.current.cleanup()
    appRef.current = new App(container)
    return () => {
      if (appRef.current) appRef.current.cleanup()
    }
  }, [])

  useEffect(() => {
    if (appRef.current) appRef.current.setPaused(!isPlaying)
  }, [isPlaying])

  return (
    <>
      {/* WebGL liquid gradient layer */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div ref={containerRef} className="absolute inset-0" />
        {/* Legibility overlay so table/card text stays readable over the motion */}
        <div className="absolute inset-0 bg-[#06060f]/50" />
      </div>

      {/* Pause / play the animation */}
      {showPauseButton && (
        <button
          onClick={() => setIsPlaying((v) => !v)}
          aria-label={isPlaying ? 'Pause background animation' : 'Play background animation'}
          className="fixed right-4 bottom-4 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-slate-300 backdrop-blur transition hover:border-red-500/50 hover:text-white"
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          )}
        </button>
      )}
    </>
  )
}
