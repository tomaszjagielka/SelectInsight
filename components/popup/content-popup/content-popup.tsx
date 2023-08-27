import styleText from "data-text:./content-popup.scss";
import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import Markdown from 'markdown-to-jsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faThumbTack } from '@fortawesome/free-solid-svg-icons';

export interface IContentPopup {
  isOpen: boolean;
  topmostZIndex: number;
  position: { x: number; y: number };
  selectedText: string;
  contentText: string;
  onClose?: () => void;
  setZIndex?: (zIndex: number) => void;
}

const ContentPopup: React.FC<IContentPopup> = ({
  isOpen,
  position: initialPosition,
  topmostZIndex: zIndex,
  selectedText: headerContent,
  contentText: textContent,
  onClose,
  setZIndex
}) => {

  const [pin, setPin] = useState(false);
  const [position, setPopupPosition] = useState(initialPosition);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({
    position: 'absolute',
    zIndex: zIndex,
  });
  const contentPopupRef = useRef(null);

  const updatePopupPosition = (event, ui) => {
    setPopupPosition({ x: ui.x, y: ui.y });
  };

  const handlePopupClick = () => {
    setPopupStyle({ ...popupStyle, zIndex: ++zIndex });
    setZIndex(++zIndex);
  }

  useEffect(() => {
    if (pin) {
      setPopupPosition({ x: position.x - window.scrollX, y: position.y - window.scrollY });
      setPopupStyle({ ...popupStyle, position: 'fixed' });
    } else {
      setPopupPosition({ x: position.x + window.scrollX, y: position.y + window.scrollY });
      setPopupStyle({ ...popupStyle, position: 'absolute' });
    }
  }, [pin, isOpen]);


  return (
    <div>
      <style>{styleText}</style>

      <div onMouseDown={handlePopupClick}>
        <Draggable handle="h3" position={{ x: position.x, y: position.y }} onDrag={updatePopupPosition}>
          {isOpen && (
            <div className="content-popup" style={popupStyle} ref={contentPopupRef}>
              <div className="header-container">
                <h3 className="header">{headerContent}</h3>
                <div className="btn-container">
                  <div className="pin-btn-container"
                    onClick={() => setPin(!pin)}>

                    <FontAwesomeIcon
                      className={`btn ${pin ? 'pinned' : ''}`}
                      icon={faThumbTack}
                    />
                  </div>
                  <div className="close-btn-container"
                    onClick={onClose}>

                    <FontAwesomeIcon
                      className="btn"
                      icon={faTimes}
                    />
                  </div>
                </div>
              </div>

              <div className="content-container">
                {textContent ? (
                  <div className="content">
                    <Markdown>{textContent}</Markdown>
                  </div>
                ) : (
                  <div className="skeleton-loading"></div>
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