"use client"

import { useRef, useEffect, useState } from "react"

export default function Component() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const isTouchingRef = useRef(false)
  const [isMobile, setIsMobile] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      setIsMobile(window.innerWidth < 768) // Set mobile breakpoint
    }

    updateCanvasSize()

    let particles: {
      x: number
      y: number
      baseX: number
      baseY: number
      size: number
      color: string
      reflectionColor: string
      reflectionOpacity: number
      life: number
      isEcho: boolean
      velocity: { x: number; y: number }
      reflective: boolean
    }[] = []

    let textImageData: ImageData | null = null

    function createTextImage() {
      if (!ctx || !canvas) return 0

      ctx.fillStyle = "black"
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()

      // Calculate text size and position
      const fontSize = isMobile ? 52 : 90
      ctx.font = `bold ${fontSize}px "Space Grotesk", sans-serif`

      const text = "Echo Chat"
      const textMetrics = ctx.measureText(text)
      const textWidth = textMetrics.width

      // Position text in center
      const x = (canvas.width - textWidth) / 2
      const y = canvas.height / 2 + fontSize / 3 // Adjust for baseline

      // Draw text with slight shadow for better definition
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)"
      ctx.shadowBlur = 2
      ctx.fillText(text, x, y)

      // Calculate the split point between "Echo" and "Chat"
      const echoText = "Echo"
      const echoWidth = ctx.measureText(echoText).width
      const splitX = x + echoWidth

      ctx.restore()

      textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      return { fontSize, splitX }
    }

    function createParticle(textInfo: { fontSize: number; splitX: number }) {
      if (!ctx || !canvas || !textImageData) return null

      const data = textImageData.data
      const { splitX } = textInfo

      for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * canvas.width)
        const y = Math.floor(Math.random() * canvas.height)

        if (data[(y * canvas.width + x) * 4 + 3] > 128) {
          const isEcho = x < splitX

          // Determine if this particle will be reflective (about 15% of particles)
          const reflective = Math.random() < 0.15

          // Create a subtle color variation for reflective particles
          const reflectionColor = reflective
            ? isEcho
              ? `rgb(${30 + Math.floor(Math.random() * 20)}, ${30 + Math.floor(Math.random() * 20)}, ${50 + Math.floor(Math.random() * 30)})`
              : `rgb(${40 + Math.floor(Math.random() * 20)}, ${30 + Math.floor(Math.random() * 20)}, ${30 + Math.floor(Math.random() * 20)})`
            : "#111111"

          return {
            x: x,
            y: y,
            baseX: x,
            baseY: y,
            size: reflective ? Math.random() * 1.2 + 0.8 : Math.random() * 0.8 + 0.4, // Smaller particles overall
            color: "#111111",
            reflectionColor,
            reflectionOpacity: Math.random() * 0.5 + 0.5,
            isEcho: isEcho,
            life: Math.random() * 100 + 50,
            velocity: {
              x: (Math.random() - 0.5) * 0.05, // Much more subtle movement
              y: (Math.random() - 0.5) * 0.05,
            },
            reflective,
          }
        }
      }

      return null
    }

    function createInitialParticles(textInfo: { fontSize: number; splitX: number }) {
      // Increase particle density for better text definition
      const baseParticleCount = 10000
      const particleCount = Math.floor(baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)))
      for (let i = 0; i < particleCount; i++) {
        const particle = createParticle(textInfo)
        if (particle) particles.push(particle)
      }
    }

    let animationFrameId: number

    function animate(textInfo: { fontSize: number; splitX: number }) {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const { x: mouseX, y: mouseY } = mousePositionRef.current
      const maxDistance = 180 // Reduced interaction radius for more stability

      // Create a subtle pulsing effect for reflective particles
      const pulseIntensity = Math.sin(Date.now() * 0.001) * 0.5 + 0.5

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Add very subtle floating motion when not being hovered
        if (distance >= maxDistance || (!isTouchingRef.current && "ontouchstart" in window)) {
          // Much more subtle movement
          p.x += p.velocity.x * 0.5
          p.y += p.velocity.y * 0.5

          // Gradually return to base position - stronger pull for stability
          p.x += (p.baseX - p.x) * 0.08
          p.y += (p.baseY - p.y) * 0.08

          // Set default appearance
          if (p.reflective) {
            // For reflective particles, add a subtle pulsing glow
            ctx.shadowBlur = 3 + pulseIntensity * 2
            ctx.shadowColor = p.reflectionColor
            ctx.fillStyle = p.reflectionColor
            ctx.globalAlpha = p.reflectionOpacity * (0.7 + pulseIntensity * 0.3)
          } else {
            ctx.shadowBlur = 0
            ctx.fillStyle = p.color
            ctx.globalAlpha = 1
          }
        } else {
          // Interactive hover effect
          const force = (maxDistance - distance) / maxDistance
          const angle = Math.atan2(dy, dx)
          const moveX = Math.cos(angle) * force * 30 // Reduced movement
          const moveY = Math.sin(angle) * force * 30

          // More stable movement with stronger return to base
          p.x = p.x + (p.baseX - moveX - p.x) * 0.1
          p.y = p.y + (p.baseY - moveY - p.y) * 0.1

          if (p.reflective) {
            // Enhanced glow effect for reflective particles
            ctx.shadowBlur = 5 + force * 5
            ctx.shadowColor = p.reflectionColor
            ctx.fillStyle = p.reflectionColor
            ctx.globalAlpha = p.reflectionOpacity * (0.8 + force * 0.2)
          } else {
            // Subtle glow for regular particles
            ctx.shadowBlur = force * 3
            ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
            ctx.fillStyle = p.color
            ctx.globalAlpha = 1
          }
        }

        // Draw the particle
        ctx.fillRect(p.x, p.y, p.size, p.size)
        ctx.globalAlpha = 1

        // Particle lifecycle management
        p.life--
        if (p.life <= 0) {
          const newParticle = createParticle(textInfo)
          if (newParticle) {
            particles[i] = newParticle
          } else {
            particles.splice(i, 1)
            i--
          }
        }
      }

      // Maintain particle count
      const baseParticleCount = 10000
      const targetParticleCount = Math.floor(
        baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)),
      )
      while (particles.length < targetParticleCount) {
        const newParticle = createParticle(textInfo)
        if (newParticle) particles.push(newParticle)
      }

      animationFrameId = requestAnimationFrame(() => animate(textInfo))
    }

    const textInfo = createTextImage()
    createInitialParticles(textInfo)
    animate(textInfo)

    const handleResize = () => {
      updateCanvasSize()
      const newTextInfo = createTextImage()
      particles = []
      createInitialParticles(newTextInfo)
    }

    const handleMove = (x: number, y: number) => {
      mousePositionRef.current = { x, y }
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault()
        handleMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    const handleTouchStart = () => {
      isTouchingRef.current = true
    }

    const handleTouchEnd = () => {
      isTouchingRef.current = false
      mousePositionRef.current = { x: 0, y: 0 }
    }

    const handleMouseLeave = () => {
      if (!("ontouchstart" in window)) {
        mousePositionRef.current = { x: 0, y: 0 }
      }
    }

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("scroll", handleScroll)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
    canvas.addEventListener("mouseleave", handleMouseLeave)
    canvas.addEventListener("touchstart", handleTouchStart)
    canvas.addEventListener("touchend", handleTouchEnd)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("scroll", handleScroll)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("touchmove", handleTouchMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
      canvas.removeEventListener("touchstart", handleTouchStart)
      canvas.removeEventListener("touchend", handleTouchEnd)
      cancelAnimationFrame(animationFrameId)
    }
  }, [isMobile])

  return (
    <div className="relative w-full h-dvh flex flex-col items-center justify-center bg-white">
      <canvas
        ref={canvasRef}
        className="w-full h-full absolute top-0 left-0 touch-none"
        aria-label="Interactive particle effect with Echo Chat text"
      />

      <div className="absolute bottom-[140px] text-center z-10">
        <p className="font-['Space_Grotesk'] text-gray-700 text-xs sm:text-base md:text-sm font-medium tracking-wide">
          Experience the future of{" "}
          <a href="#" className="invite-link text-gray-900 hover:text-black transition-colors duration-300 font-bold">
            conversational AI
          </a>{" "}
          <span>with</span>
          <span className="transition-colors duration-300 font-bold"> Echo Chat</span>
          <style jsx>{`
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');
            
            a.invite-link:hover + span + span {
              color: #000000;
            }
          `}</style>
        </p>
      </div>

      {/* Scroll Prompt - Arrow only */}
      <div
        className={`absolute bottom-10 flex flex-col items-center justify-center transition-opacity duration-700 ${scrolled ? "opacity-0" : "opacity-100"}`}
      >
        <div className="scroll-indicator">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="animate-bounce"
          >
            <path
              d="M20 5V35M20 35L10 25M20 35L30 25"
              stroke="#333"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <style jsx>{`
          .scroll-indicator {
            position: relative;
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0% {
              transform: translateY(0);
              opacity: 0.8;
            }
            50% {
              transform: translateY(10px);
              opacity: 1;
            }
            100% {
              transform: translateY(0);
              opacity: 0.8;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
