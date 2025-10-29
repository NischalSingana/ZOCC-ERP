import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

// Eye component with pupil that follows a target (mouse)
function Eye({ x, y, size = 18, lookAway = false }) {
  const pupilRange = size * 0.3
  const angle = Math.atan2(y, x)
  const pupilX = lookAway ? Math.cos(angle + Math.PI) * (pupilRange * 0.8) : Math.cos(angle) * pupilRange
  const pupilY = lookAway ? Math.sin(angle + Math.PI) * (pupilRange * 0.8) : Math.sin(angle) * pupilRange

  const [blink, setBlink] = useState(false)
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }, 4000 + Math.random() * 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <svg width={size * 2.2} height={size * 2.2} viewBox={`-${size} -${size} ${size * 2} ${size * 2}`}>
      <g>
        <motion.circle r={size * 0.9} fill="#fff" cx={0} cy={0} />
        {blink ? (
          <motion.rect x={-size * 0.9} y={-2} width={size * 1.8} height={4} rx={2} fill="#111" />
        ) : (
          <motion.circle r={size * 0.4} fill="#111" cx={pupilX} cy={pupilY} />
        )}
      </g>
    </svg>
  )
}

// Happy smile for orange
function HappySmile() {
  return (
    <svg width="80" height="30" viewBox="0 0 80 30">
      <path d="M 10 10 Q 40 25 70 10" stroke="#B85C00" strokeWidth="4" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

// Worried mouth for purple
function WorriedMouth() {
  return (
    <svg width="60" height="25" viewBox="0 0 60 25">
      <path d="M 8 8 Q 30 18 52 8" stroke="#3D1F6F" strokeWidth="4" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

// Simple line mouth for yellow
function SimpleMouth() {
  return (
    <svg width="60" height="10" viewBox="0 0 60 10">
      <line x1="8" y1="5" x2="52" y2="5" stroke="#8B7500" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  )
}

// Shape with two eyes that follow cursor
function Shape({ type, color, width, height, radius = 24, mood, mouse, lookAway, faceType = 'normal' }) {
  const ref = useRef(null)
  const [local, setLocal] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const x = mouse.x - centerX
    const y = mouse.y - centerY
    setLocal({ x, y })
  }, [mouse])

  const common = {
    className: 'soft-card',
    style: { backgroundColor: color },
  }

  let face
  if (faceType === 'happy') {
    face = (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="flex gap-4">
          <Eye x={local.x / 8} y={local.y / 8} lookAway={lookAway} size={18} />
          <Eye x={local.x / 8} y={local.y / 8} lookAway={lookAway} size={18} />
        </div>
        <HappySmile />
      </div>
    )
  } else if (faceType === 'worried') {
    face = (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="flex gap-4">
          <Eye x={local.x / 8} y={local.y / 8} lookAway={lookAway} size={16} />
          <Eye x={local.x / 8} y={local.y / 8} lookAway={lookAway} size={16} />
        </div>
        <WorriedMouth />
      </div>
    )
  } else if (faceType === 'simple') {
    face = (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="flex gap-4">
          <Eye x={local.x / 8} y={local.y / 8} lookAway={lookAway} size={16} />
          <Eye x={local.x / 8} y={local.y / 8} lookAway={lookAway} size={16} />
        </div>
        <SimpleMouth />
      </div>
    )
  } else {
    face = (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex gap-4">
          <Eye x={local.x / 8} y={local.y / 8} lookAway={lookAway} size={18} />
          <Eye x={local.x / 8} y={local.y / 8} lookAway={lookAway} size={18} />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className="relative"
    >
      {type === 'circle' && (
        <div {...common} className={`rounded-full ${common.className}`} style={{ ...common.style, width, height }}>
          {face}
        </div>
      )}
      {type === 'rounded' && (
        <div {...common} className={`${common.className}`} style={{ ...common.style, width, height, borderRadius: radius }}>
          {face}
        </div>
      )}
      {type === 'half' && (
        <div {...common} className={`${common.className} overflow-hidden`} style={{ ...common.style, width, height, borderBottomLeftRadius: radius, borderBottomRightRadius: radius }}>
          {face}
        </div>
      )}
    </motion.div>
  )
}

export default function PlayfulShapes({ lookAway }) {
  const containerRef = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      setMouse({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center select-none">
      <div className="relative" style={{ width: 520, height: 400 }}>
        {/* Orange half-circle with happy smile and tracking eyes - bottom left */}
        <div className="absolute" style={{ left: 0, bottom: 0, zIndex: 3 }}>
          <Shape type="half" color="#FF8A3D" width={280} height={160} radius={140} mood="happy" mouse={mouse} lookAway={lookAway} faceType="happy" />
        </div>
        
        {/* Purple rectangle - back center with worried face and tracking eyes */}
        <div className="absolute" style={{ left: 140, top: 0, zIndex: 1 }}>
          <Shape type="rounded" color="#7C3AED" width={180} height={260} radius={28} mood="worried" mouse={mouse} lookAway={lookAway} faceType="worried" />
        </div>
        
        {/* Black rectangle - center with tracking eyes */}
        <div className="absolute" style={{ left: 280, top: 120, zIndex: 4 }}>
          <Shape type="rounded" color="#2D3748" width={140} height={200} radius={28} mood="curious" mouse={mouse} lookAway={lookAway} faceType="normal" />
        </div>
        
        {/* Yellow rounded pill - right with simple face (dot + line) */}
        <div className="absolute" style={{ left: 380, bottom: 0, zIndex: 2 }}>
          <Shape type="rounded" color="#F4D03F" width={180} height={240} radius={90} mood="surprised" mouse={mouse} lookAway={lookAway} faceType="simple" />
        </div>
      </div>
    </div>
  )
}