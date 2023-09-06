import styleText from 'data-text:./content-popup.scss';
import skeletonLoadingStyleText from 'data-text:~shared/components/skeleton-loading/skeleton-loading.scss';
import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'markdown-to-jsx'
import CopyToClipboard from 'react-copy-to-clipboard';
import { getPort } from '@plasmohq/messaging/port';
import { FontAwesomeIcon, } from '@fortawesome/react-fontawesome';
import { faTimes, faThumbTack, faPaperPlane, faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { Rnd } from 'react-rnd'; // Import the react-rnd library

export interface IContentPopup {
  index: number;
  conversationId: string;
  parentMessageId: string;
  isOpen: boolean;
  topmostZIndex: number;
  position: { x: number; y: number };
  selectedText: string;
  messages: string[];
  lastMessageIndex: number;
  isFinished: boolean;
  onClose?: () => void;
  setZIndex?: (zIndex: number) => void;
  setIsFinished?: (isFinished: boolean) => void;
}

const ContentPopup: React.FC<IContentPopup> = ({
  index,
  conversationId,
  parentMessageId,
  isOpen,
  position: initialPosition,
  topmostZIndex: zIndex,
  selectedText: headerContent,
  messages,
  lastMessageIndex,
  isFinished,
  onClose,
  setZIndex,
  setIsFinished,
}) => {
  const [isPopupPinned, setPin] = useState(false);
  const [position, setPopupPosition] = useState(initialPosition);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({
    zIndex: zIndex,
  });
  const [inputMessage, setInputMessage] = useState('');
  const [contentContainerStyle, setContentContainerStyle] = useState<React.CSSProperties>({
    maxWidth: '400px',
    maxHeight: `${450 - 86}px`,
  });
  // const [isRefreshing, setIsRefreshing] = useState(false);
  const [contentPopupSize, setContentPopupSize] = useState({ width: 400, height: undefined })
  const contentPopupRef = useRef(null);
  const aiPort = getPort('ai');

  // const updatePopupPosition = (event, ui) => {
  //   setPopupPosition({ x: ui.x, y: ui.y });
  // };

  const handlePopupClick = () => {
    setPopupStyle({ ...popupStyle, zIndex: zIndex + 1 });
    setZIndex(zIndex + 1);
  };

  const sendMessageToAi = (message) => {
    if (message) {
      setInputMessage('');
      setIsFinished(false);

      messages.push(message);
      const body = {
        popupIndex: index,
        message: message,
        conversationId: conversationId,
        parentMessageId: parentMessageId,
        messages: messages,
        lastMessageIndex: lastMessageIndex + 2,
      };
      aiPort.postMessage({ body: body });
    }
  };

  useEffect(() => {
    if (isPopupPinned) {
      setPopupPosition({ x: position.x - window.scrollX, y: position.y - window.scrollY });
      setPopupStyle({ ...popupStyle, position: 'fixed' });
    } else {
      setPopupPosition({ x: position.x + window.scrollX, y: position.y + window.scrollY });
      setPopupStyle({ ...popupStyle, position: 'absolute' });
    }
  }, [isPopupPinned, isOpen]);

  // useEffect(() => {
  //   if (messages) {
  //     setIsRefreshing(false);
  //     console.log("Sds")
  //   }
  // }, [messages[messages.length - 1]]);

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
            topLeft: true,
          }}
          dragHandleClassName={'header'}
          position={position}
          onResize={(e, direction, ref, delta, position) => {
            setContentContainerStyle({
              height: `${ref.offsetHeight - 86}px`,
            });
            setPopupPosition(position);
            setContentPopupSize({ width: ref.offsetWidth, height: ref.offsetHeight });
          }}
          onDragStop={(e, d) => { setPopupPosition(d) }}
          style={popupStyle}
          ref={contentPopupRef}
        >
          {isOpen && (
            <div className='content-popup'>
              <div className='header-container'>
                <h3 className='header'>{headerContent}</h3>
                <div className='btn-container'>
                  <div className='pin-btn-container' onClick={() => setPin(!isPopupPinned)}>
                    <FontAwesomeIcon
                      className={`btn ${isPopupPinned ? 'pinned' : ''}`}
                      icon={faThumbTack}
                    />
                  </div>
                  <div className='close-btn-container' onClick={onClose}>
                    <FontAwesomeIcon className='btn' icon={faTimes} />
                  </div>
                </div>
              </div>
              {!messages/* || isRefreshing*/ ? (
                <div className='skeleton-loading'></div>
              ) : (
                <div>
                  <div>
                    <div className='content-container' style={contentContainerStyle}>
                      <div className='content'>
                        {messages.map((message, index) => (
                          <div
                            key={index}
                            className={`chat-message ${index % 2 !== 0 ? 'user' : 'ai'
                              }-message-container`}
                          >
                            <div className='content' key={'content' + index}>
                              <Markdown>{message}</Markdown>
                            </div>
                            <CopyToClipboard text={message}>
                              <FontAwesomeIcon
                                className={`${index % 2 !== 0 ? 'user-message' : 'ai-message'} btn copy-btn`}
                                icon={faCopy}
                              />
                            </CopyToClipboard>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className='message-input-container'>
                    <input
                      type='text'
                      className='message-input'
                      placeholder='Send a message'
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          sendMessageToAi(inputMessage);
                        }
                      }}
                    />
                    <div className='btn-container'>
                      {isFinished ? (
                        <div className='btn-container send' onClick={() => sendMessageToAi(inputMessage)}>
                          <FontAwesomeIcon className='btn' icon={faPaperPlane} />
                        </div>
                      ) : (
                        <div className='btn-container loading'>
                          <FontAwesomeIcon className='btn' icon={faEllipsis} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Rnd>
      </div>
    </div>
  );
};

export default ContentPopup;
