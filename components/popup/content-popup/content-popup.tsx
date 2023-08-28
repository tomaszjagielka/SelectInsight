import styleText from 'data-text:./content-popup.scss';
import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import Markdown from 'markdown-to-jsx'
import { getPort } from '@plasmohq/messaging/port';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faThumbTack } from '@fortawesome/free-solid-svg-icons';
import { faRefresh } from '@fortawesome/free-solid-svg-icons';

export interface IContentPopup {
  index: number;
  isOpen: boolean;
  topmostZIndex: number;
  position: { x: number; y: number };
  selectedText: string;
  contentText: string;
  aiMessage: string;
  onClose?: () => void;
  setZIndex?: (zIndex: number) => void;
}

const ContentPopup: React.FC<IContentPopup> = ({
  index,
  isOpen,
  position: initialPosition,
  topmostZIndex: zIndex,
  selectedText: headerContent,
  contentText: textContent,
  aiMessage: aiMessage,
  onClose,
  setZIndex
}) => {

  const [pin, setPin] = useState(false);
  const [position, setPopupPosition] = useState(initialPosition);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({
    position: 'absolute',
    zIndex: zIndex,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const contentPopupRef = useRef(null);
  const aiPort = getPort('ai');

  const updatePopupPosition = (event, ui) => {
    setPopupPosition({ x: ui.x, y: ui.y });
  };

  const handlePopupClick = () => {
    setPopupStyle({ ...popupStyle, zIndex: zIndex++ });
    setZIndex(zIndex);
  }

  const refresh = () => {
    setIsRefreshing(true);
    const body = { popupIndex: index, message: aiMessage };
    aiPort.postMessage({ body: body });
  };

  useEffect(() => {
    if (pin) {
      setPopupPosition({ x: position.x - window.scrollX, y: position.y - window.scrollY });
      setPopupStyle({ ...popupStyle, position: 'fixed' });
    } else {
      setPopupPosition({ x: position.x + window.scrollX, y: position.y + window.scrollY });
      setPopupStyle({ ...popupStyle, position: 'absolute' });
    }
  }, [pin, isOpen]);

  useEffect(() => {
    if (textContent) {
      setIsRefreshing(false);
    }
  }, [textContent]);

  return (
    <div>
      <style>{styleText}</style>

      <div onMouseDown={handlePopupClick}>
        <Draggable handle='h3' position={{ x: position.x, y: position.y }} onDrag={updatePopupPosition}>
          {isOpen && (
            <div className='content-popup' style={popupStyle} ref={contentPopupRef}>
              <div className='header-container'>
                <h3 className='header'>{headerContent}</h3>
                <div className='btn-container'>
                  <div className='refresh-btn-container'
                    onClick={refresh}>

                    <FontAwesomeIcon
                      className='btn'
                      icon={faRefresh}
                    />
                  </div>
                  <div className='pin-btn-container'
                    onClick={() => setPin(!pin)}>

                    <FontAwesomeIcon
                      className={`btn ${pin ? 'pinned' : ''}`}
                      icon={faThumbTack}
                    />
                  </div>
                  <div className='close-btn-container'
                    onClick={onClose}>

                    <FontAwesomeIcon
                      className='btn'
                      icon={faTimes}
                    />
                  </div>
                </div>
              </div>

              <div className='content-container'>
                {isRefreshing ? (
                  <div className='skeleton-loading'></div>
                ) : (
                  textContent ? (
                    <div className='content'>
                      <Markdown>{textContent}</Markdown>
                    </div>
                  ) : (
                    <div className='skeleton-loading'></div>
                  )
                )}
              </div>
            </div>
          )}
        </Draggable>
      </div>
    </div>
  );
};

export default ContentPopup;