import { faCopy } from "@fortawesome/free-regular-svg-icons"
import {
  faEllipsis,
  faPaperPlane,
  faThumbTack,
  faTimes
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styleText from "data-text:./content-popup.scss"
import skeletonLoadingStyleText from "data-text:~shared/components/skeleton-loading/skeleton-loading.scss"
import Markdown from "markdown-to-jsx"
import React, { useEffect, useRef, useState } from "react"
import CopyToClipboard from "react-copy-to-clipboard"
import { Rnd } from "react-rnd"

import { getPort } from "@plasmohq/messaging/port"

export interface IContentPopup {
  index: number
  conversationId: string | null
  parentMessageId: string | null
  isOpen: boolean
  topmostZIndex: number
  position: { x: number; y: number }
  headerText: string
  messages: string[]
  isFinished: boolean
  isUserMessageFirst: boolean
  onClose?: () => void
  setZIndex?: (zIndex: number) => void
  handleUserSendMessage?: (popupIndex: number, userMessage: string) => void
}

const ContentPopup: React.FC<IContentPopup> = ({
  index,
  conversationId,
  parentMessageId,
  isOpen,
  position: initialPosition,
  topmostZIndex: zIndex,
  headerText,
  messages,
  isFinished,
  isUserMessageFirst,
  onClose,
  setZIndex,
  handleUserSendMessage
}) => {
  const [isPopupUnpinned, setPin] = useState(false)
  const [position, setPopupPosition] = useState({
    position: initialPosition,
    scrollPosition: { x: 0, y: 0 }
  })
  const [scrollPosition, setScrollPosition] = useState({
    x: 0,
    y: window.scrollY
  })
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({
    zIndex: zIndex
  })
  const [inputMessage, setInputMessage] = useState("")
  const [contentContainerStyle, setContentContainerStyle] =
    useState<React.CSSProperties>({
      maxWidth: "400px",
      maxHeight: `${500 - 86}px`
    })
  const [contentPopupSize, setContentPopupSize] = useState({
    width: 400,
    height: undefined
  })
  const contentPopupRef = useRef(null)
  const inputMessageRef = useRef<HTMLInputElement | null>(null)

  const handlePopupClick = () => {
    setPopupStyle({ ...popupStyle, zIndex: zIndex + 1 })
    setZIndex(zIndex + 1)
  }

  const sendMessageToAi = (messageContent: string) => {
    if (
      messageContent &&
      (isFinished || (isUserMessageFirst && messages.length === 0))
    ) {
      setInputMessage("")

      if (handleUserSendMessage) {
        handleUserSendMessage(index, messageContent)
      }
    }
  }

  useEffect(() => {
    if (isPopupUnpinned) {
      setPopupPosition({
        position: {
          x: position.position.x - window.scrollX,
          y: position.position.y - window.scrollY
        },
        scrollPosition: { x: window.scrollX, y: window.scrollY }
      })
      setPopupStyle({ ...popupStyle, position: "fixed" })
    } else {
      setPopupPosition({
        position: {
          x: position.position.x + window.scrollX,
          y: position.position.y + window.scrollY
        },
        scrollPosition: { x: window.scrollX, y: window.scrollY }
      })
      setPopupStyle({ ...popupStyle, position: "absolute" })
    }
  }, [isPopupUnpinned, isOpen])

  useEffect(() => {
    if (inputMessageRef.current) {
      inputMessageRef.current.focus({ preventScroll: true })
    }
  }, [])

  return (
    <div>
      <style>
        {styleText}
        {skeletonLoadingStyleText}
      </style>

      <div onMouseDown={handlePopupClick}>
        <Rnd
          size={contentPopupSize}
          enableResizing={{
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true
          }}
          dragHandleClassName={"header"}
          position={position.position}
          onResize={(e, direction, ref, delta, position) => {
            setContentContainerStyle({
              height: `${ref.offsetHeight - 86}px`
            })
            setPopupPosition({
              position,
              scrollPosition: { x: window.scrollX, y: window.scrollY }
            })
            setContentPopupSize({
              width: ref.offsetWidth,
              height: ref.offsetHeight
            })
          }}
          onDragStop={(e, d) => {
            setPopupPosition({
              position: d,
              scrollPosition: { x: window.scrollX, y: window.scrollY }
            })
          }}
          style={popupStyle}
          ref={contentPopupRef}>
          {isOpen && (
            <div className="content-popup">
              <div className="header-container">
                <h3 className="header">
                  {isUserMessageFirst ? "Custom" : headerText}
                </h3>
                <div className="btn-container">
                  <div
                    className="pin-btn-container"
                    onClick={() => setPin(!isPopupUnpinned)}>
                    <FontAwesomeIcon
                      className={`btn ${isPopupUnpinned ? "pinned" : ""}`}
                      icon={faThumbTack}
                    />
                  </div>
                  <div className="close-btn-container" onClick={onClose}>
                    <FontAwesomeIcon className="btn" icon={faTimes} />
                  </div>
                </div>
              </div>
              <div>
                <div>
                  <div
                    className="content-container"
                    style={contentContainerStyle}>
                    <div className="content">
                      {messages.map((message, index) => {
                        const isUserMessage = isUserMessageFirst
                          ? index % 2 === 0
                          : index % 2 !== 0
                        const messageType = isUserMessage ? "user" : "ai"

                        return (
                          <div
                            key={index}
                            className={`${messageType}-message-container`}>
                            <div className="content" key={"content" + index}>
                              <Markdown>{message}</Markdown>
                            </div>
                            <CopyToClipboard text={message}>
                              <FontAwesomeIcon
                                className={`${messageType}-message btn copy-btn`}
                                icon={faCopy}
                              />
                            </CopyToClipboard>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="message-input-container">
                  <input
                    type="text"
                    className="message-input"
                    placeholder="Send a message"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        sendMessageToAi(inputMessage)
                      }
                    }}
                    ref={inputMessageRef}
                  />
                  <div className="btn-container">
                    {isFinished ||
                    (isUserMessageFirst && messages.length === 0) ? (
                      <div
                        className="btn-container send"
                        onClick={() => sendMessageToAi(inputMessage)}>
                        <FontAwesomeIcon className="btn" icon={faPaperPlane} />
                      </div>
                    ) : (
                      <div className="btn-container loading">
                        <FontAwesomeIcon className="btn" icon={faEllipsis} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Rnd>
      </div>
    </div>
  )
}

export default ContentPopup
