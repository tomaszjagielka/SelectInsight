import React, { useEffect, useRef, useState } from "react"

import { getPort } from "@plasmohq/messaging/port"

import ContentPopup, {
  type IContentPopup
} from "~/popup/content-popup/content-popup"

import TemplatePopup, { type ITemplate } from "../template-popup/template-popup"

export interface IPopupManager {
  selectedText: string
  surroundingText: string
  mousePosition: { x: number; y: number }
}

const PopupManager: React.FC<IPopupManager> = ({
  selectedText,
  surroundingText,
  mousePosition
}) => {
  const [contentPopups, setContentPopups] = useState<IContentPopup[]>([])
  const [contentPopupPosition, setContentPopupPosition] = useState({
    x: 0,
    y: 0
  })
  const [topmostContentPopupZIndex, setContentPopupZIndex] = useState(0)
  const [templatePopupPosition, setTemplatePopupPosition] = useState({
    x: 0,
    y: 0
  })
  const [isTemplatePopupOpen, setIsTemplatePopupOpen] = useState(false)
  const [lastSelectedText, setLastSelectedText] = useState("")
  const [templateText, setTemplateText] = useState("")
  const [isIconClicked, setIsIconClicked] = useState(false)

  const aiPort = getPort("ai")
  const iconPort = getPort("icon")

  const openContentPopup = (
    popupIndex: number,
    position: { x: number; y: number },
    isUserMessageFirst: boolean = false
  ) => {
    const newPopup: IContentPopup = {
      index: popupIndex,
      conversationId: null,
      parentMessageId: null,
      isOpen: true,
      headerText: "Chat",
      position: position,
      topmostZIndex: topmostContentPopupZIndex,
      messages: [],
      isFinished: false,
      isUserMessageFirst: isUserMessageFirst
    }
    setContentPopups((prevPopups) => [...prevPopups, newPopup])
  }

  const closeContentPopup = (popupIndex: number) => {
    setContentPopups((prevContentPopups) => {
      return prevContentPopups.map((p) =>
        p.index === popupIndex ? { ...p, isOpen: false } : p
      )
    })
  }

  // This function will handle incoming AI chunks and update the respective popup's messages
  const handleAiChunk = (popupIndex: number, aiChunk: string) => {
    setContentPopups((prevPopups) =>
      prevPopups.map((popup) => {
        if (popup.index === popupIndex) {
          const newMessages = [...popup.messages]
          let updatedPopup = { ...popup }

          // Determine if this is the start of a new AI response stream for this popup.
          // A new AI response starts if:
          // 1. The popup was previously marked as finished (signaling a new interaction).
          // 2. Or, the number of messages indicates the user just spoke, and now it's AI's turn.
          //    (User message is added to `popup.messages` before AI call in `content-popup.tsx`)

          const isAIsTurnToStartNewMessage = popup.isUserMessageFirst
            ? newMessages.length % 2 === 1 // User added (len=1), AI adds (len becomes 2). User added (len=3), AI adds (len becomes 4)
            : newMessages.length % 2 === 0 // (If AI can start) AI adds (len becomes 1). User added (len=2), AI adds (len becomes 3)

          if (
            updatedPopup.isFinished ||
            (newMessages.length > 0 && isAIsTurnToStartNewMessage)
          ) {
            // This chunk starts a new AI message entry
            newMessages.push(aiChunk)
            // Ensure isFinished is false as we are starting/receiving a stream
            updatedPopup.isFinished = false
          } else if (newMessages.length > 0) {
            // This chunk appends to the existing AI message (last message in the array)
            newMessages[newMessages.length - 1] += aiChunk
            // Keep isFinished as false while streaming
            updatedPopup.isFinished = false
          } else {
            // Fallback: If no messages, start new one (e.g. AI is first message and popup was not marked finished)
            newMessages.push(aiChunk)
            updatedPopup.isFinished = false
          }
          updatedPopup.messages = newMessages
          return updatedPopup
        }
        return popup
      })
    )
  }

  // Rewritten aiMessageListener to handle the new simple string chunk format
  const aiMessageListener = (msg: any) => {
    if (!msg?.data) {
      return
    }

    const { type, popupIndex, response: aiChunk } = msg.data

    if (type === "STREAM_END") {
      if (typeof popupIndex === "number") {
        setContentPopups((prevPopups) =>
          prevPopups.map((p) =>
            p.index === popupIndex ? { ...p, isFinished: true } : p
          )
        )
      }
      return
    }

    if (typeof popupIndex === "number" && typeof aiChunk === "string") {
      handleAiChunk(popupIndex, aiChunk)
    }
  }

  const iconListener = () => {
    setIsIconClicked(true)
  }

  const setupContentPopup = (template: ITemplate) => {
    const processedUserMessage = template.content
      .replace("{selectedText}", lastSelectedText)
      .replace("{surroundingText}", surroundingText)

    const popupHeader = `${template.name}: ${lastSelectedText}`

    const currentPopupIndex = contentPopups.length
    const isUserMessageFirstForDisplay = false

    const newPopup: IContentPopup = {
      index: currentPopupIndex,
      conversationId: null,
      parentMessageId: null,
      isOpen: true,
      headerText: popupHeader,
      position: contentPopupPosition,
      topmostZIndex: topmostContentPopupZIndex,
      messages: [],
      isFinished: false,
      isUserMessageFirst: isUserMessageFirstForDisplay
    }
    setContentPopups((prevPopups) => [...prevPopups, newPopup])

    const body = {
      popupIndex: currentPopupIndex,
      messages: [processedUserMessage],
      isUserMessageFirst: true
    }
    aiPort.postMessage({ body: body })

    setIsTemplatePopupOpen(false)
  }

  const handleTemplatePopupOutsideClick = () => {
    setIsTemplatePopupOpen(false)
  }

  useEffect(() => {
    if (selectedText) {
      const selection = window.getSelection()

      if (selection?.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        if (rect.top === 0 && rect.left === 0) {
          setContentPopupPosition(mousePosition)
          setTemplatePopupPosition({
            x: mousePosition.x + window.scrollX,
            y: mousePosition.y + window.scrollY
          })
        } else {
          setContentPopupPosition({ x: rect.right, y: rect.bottom })
          setTemplatePopupPosition({
            x: rect.right + window.scrollX,
            y: rect.bottom + window.scrollY
          })
        }

        setLastSelectedText(selectedText)
        setIsTemplatePopupOpen(true)
      }
    }
  }, [selectedText])

  useEffect(() => {
    if (isIconClicked && !document.hidden) {
      const windowWidth = window.innerWidth
      const popupWidth = 400
      const position = { x: windowWidth - popupWidth - 28, y: 0 }

      openContentPopup(contentPopups.length, position, true)
      setIsIconClicked(false)
    }
  }, [isIconClicked])

  useEffect(() => {
    aiPort.onMessage.addListener(aiMessageListener)

    const handleDisconnect = (disconnectedPort: chrome.runtime.Port) => {
      if (disconnectedPort.name === aiPort.name) {
        setContentPopups((prevPopups) => {
          const updatedPopups = prevPopups.map((p) => {
            if (p.isOpen && !p.isFinished) {
              return { ...p, isFinished: true }
            }
            return p
          })
          return updatedPopups
        })
      }
    }

    if (aiPort && typeof aiPort.onDisconnect?.addListener === "function") {
      aiPort.onDisconnect.addListener(handleDisconnect)
    }

    return () => {
      aiPort.onMessage.removeListener(aiMessageListener)
      if (aiPort && typeof aiPort.onDisconnect?.removeListener === "function") {
        aiPort.onDisconnect.removeListener(handleDisconnect)
      }
    }
  }, [aiPort])

  // This function is called by ContentPopup when a user sends a message
  const handleUserSendMessage = (popupIndex: number, userMessage: string) => {
    setContentPopups((prevPopups) =>
      prevPopups.map((p) => {
        if (p.index === popupIndex) {
          const updatedMessages = [...p.messages, userMessage]
          const body = {
            popupIndex: p.index,
            messages: updatedMessages, // Full history including the new user message
            isUserMessageFirst: p.isUserMessageFirst // Pass this for role assignment
          }
          aiPort.postMessage({ body: body })

          return {
            ...p,
            messages: updatedMessages,
            isFinished: false // AI is now responding
          }
        }
        return p
      })
    )
  }

  return (
    <div>
      {isTemplatePopupOpen && (
        <TemplatePopup
          position={templatePopupPosition}
          onSelectTemplate={(template) => setupContentPopup(template)}
        />
      )}

      <div>
        {contentPopups.map(
          (contentPopup) =>
            contentPopup.isOpen && (
              <ContentPopup
                key={contentPopup.index}
                index={contentPopup.index}
                conversationId={contentPopup.conversationId}
                parentMessageId={contentPopup.parentMessageId}
                isOpen={contentPopup.isOpen}
                topmostZIndex={topmostContentPopupZIndex}
                position={contentPopup.position}
                headerText={contentPopup.headerText}
                messages={contentPopup.messages}
                isFinished={contentPopup.isFinished}
                isUserMessageFirst={contentPopup.isUserMessageFirst}
                onClose={() => closeContentPopup(contentPopup.index)}
                setZIndex={(zIndex) => setContentPopupZIndex(zIndex)}
                handleUserSendMessage={handleUserSendMessage}
              />
            )
        )}
      </div>
    </div>
  )
}

export default PopupManager
