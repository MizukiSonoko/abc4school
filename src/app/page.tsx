"use client"
import React, { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogOverlay, DialogContent } from "@reach/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useHotkeys } from "react-hotkeys-hook"
import "@reach/dialog/styles.css"
import { useRouter } from "next/navigation"

interface TimelineEvent {
  time: string
  options: string[]
  details: string[]
}

export default function Component() {
  const router = useRouter()
  const events: TimelineEvent[] = [
    { time: "1年1学期", options: ["生命", "家族", "ことば", "あそび"], details: ["生命の詳細", "家族の詳細", "ことばの詳細", "あそびの詳細"] },
    { time: "1年2学期", options: ["生命", "細胞", "遺伝"], details: ["生命の詳細", "細胞の詳細", "遺伝の詳細"] },
    { time: "1年3学期", options: ["水", "海洋", "気候"], details: ["水の詳細", "海洋の詳細", "気候の詳細"] },
    { time: "2年1学期", options: ["山", "地質", "生態系", "土"], details: ["山の詳細", "地質の詳細", "生態系の詳細", "土の詳細"] },
    { time: "2年2学期", options: ["海", "海洋生物", "環境保護"], details: ["海の詳細", "海洋生物の詳細", "環境保護の詳細"] },
    { time: "2年3学期", options: ["道", "交通", "都市計画"], details: ["道の詳細", "交通の詳細", "都市計画の詳細"] },
    { time: "3年1学期", options: ["エネルギー", "省エネ", "発電所", "電気", "電線"], details: ["エネルギーの詳細", "省エネの詳細", "発電所の詳細", "電気の詳細", "電線の詳細"] },
    { time: "3年2学期", options: ["地球", "地球科学", "環境問題"], details: ["地球の詳細", "地球科学の詳細", "環境問題の詳細"] },
    { time: "3年3学期", options: ["宇宙", "天文学", "宇宙開発"], details: ["宇宙の詳細", "天文学の詳細", "宇宙開発の詳細"] },
  ]

  const [selectedOptions, setSelectedOptions] = useState<number[]>(events.map(() => -1))
  const [connections, setConnections] = useState<{ x: number; y: number }[]>([])
  const [selectedEvent, setSelectedEvent] = useState<{ eventIndex: number; optionIndex: number } | null>(null)
  const [isDetailMode, setIsDetailMode] = useState<boolean>(false) // モードの管理
  const containerRef = useRef<HTMLDivElement>(null)

  // Escキーでモーダルを閉じるためのHotkeyフック
  useHotkeys("esc", () => {
    console.log("AA")
    setSelectedEvent(null)
  }, [setSelectedEvent])

  const handleSelect = (eventIndex: number, optionIndex: number) => {
    if (isDetailMode) {
      // 詳細モードの場合、詳細を表示
      setSelectedEvent({ eventIndex, optionIndex })
    } else {
      // パス選択モードの場合、パスを選択
      const newSelectedOptions = [...selectedOptions]
      newSelectedOptions[eventIndex] = optionIndex
      setSelectedOptions(newSelectedOptions)
    }
  }

  useEffect(() => {
    const updateConnections = () => {
      if (!containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newConnections = selectedOptions
        .map((optionIndex, eventIndex) => {
          if (optionIndex === -1) return null
          const element = document.getElementById(`card-${eventIndex}-${optionIndex}`)
          if (!element) return null
          const rect = element.getBoundingClientRect()
          return {
            x: rect.left + rect.width / 2 - containerRect.left,
            y: rect.top - containerRect.top,
          }
        })
        .filter((conn): conn is { x: number; y: number } => conn !== null)
      setConnections(newConnections)
    }

    updateConnections()
    window.addEventListener('resize', updateConnections)
    return () => window.removeEventListener('resize', updateConnections)
  }, [selectedOptions])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-green-500 p-4">
      {/* スイッチ */}
      <div className="absolute top-4 left-4 flex items-center space-x-4 bg-gray">
        <Label>パス選択モード</Label>
        <Switch className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500" checked={isDetailMode} onCheckedChange={() => setIsDetailMode(!isDetailMode)} />
        <Label>詳細モード</Label>
      </div>

      <div ref={containerRef} className="w-full max-w-4xl space-y-8 relative">
        <h1 className="text-2xl font-bold text-center mb-8">学年別テーマ タイムライン</h1>
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
          <AnimatePresence>
            {connections.map((conn, index) => (
              <React.Fragment key={`connection-${index}`}>
                {index > 0 && (
                  <motion.line
                    x1={connections[index - 1].x}
                    y1={connections[index - 1].y}
                    x2={conn.x}
                    y2={conn.y}
                    stroke="#c53a22"
                    strokeWidth="3"
                    strokeOpacity="0.4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ pathLength: 0, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </React.Fragment>
            ))}
          </AnimatePresence>
        </svg>
        {events.map((event, eventIndex) => (
          <div key={eventIndex} className="relative">
            <div className="text-sm font-medium text-gray-500 mb-2">{event.time}</div>
            <div className="flex space-x-4 overflow-x-auto pb-4 justify-center">
              {event.options.map((option, optionIndex) => (
                <motion.div
                  key={optionIndex}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card
                    id={`card-${eventIndex}-${optionIndex}`}
                    className={`w-40 cursor-pointer transition-all duration-300 ease-in-out bg-white ${
                      selectedOptions[eventIndex] === optionIndex
                        ? "ring-2 ring-green-500 shadow-lg bg-green-200"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => handleSelect(eventIndex, optionIndex)}
                  >
                    <CardHeader>
                      <CardTitle className="text-center text-sm">{option}</CardTitle>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {/* モーダル表示 */}
        {selectedEvent && isDetailMode && (
          <Dialog isOpen={!!selectedEvent} onDismiss={() => setSelectedEvent(null)}>
            <DialogOverlay>
              <DialogContent className="bg-white rounded p-8">
                <h2 className="text-xl font-bold mb-4">
                  {events[selectedEvent.eventIndex].options[selectedEvent.optionIndex]}
                </h2>
                <p>{events[selectedEvent.eventIndex].details[selectedEvent.optionIndex]}</p>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
                >
                  閉じる
                </button>
                <button
                  onClick={() => router.push('/detail')}
                  className="mx-4 mt-4 px-4 py-2 bg-red-500 text-white rounded"
                >
                  詳細
                </button>
              </DialogContent>
            </DialogOverlay>
          </Dialog>
        )}
      </div>
    </div>
  )
}
