import styleText from "data-text:./content-popup.scss";
import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import Markdown from 'markdown-to-jsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faThumbTack } from '@fortawesome/free-solid-svg-icons';

export interface IContentPopup {
  isOpen: boolean;
  position: { x: number; y: number };
  selectedText: string;
  contentText: string;
  onClose?: () => void;
}

const ContentPopup: React.FC<IContentPopup> = ({ isOpen, position: initialPosition, selectedText: headerContent, contentText: textContent, onClose }) => {
  const [pin, setPin] = useState(false);
  const [position, setPopupPosition] = useState(initialPosition);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({
    position: 'absolute',
    zIndex: 0, // Initial z-index value
  });

  const handlePopupClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    // Update the z-index to 1 when the popup is clicked
    setPopupStyle({ ...popupStyle, zIndex: 1 });
  };

  useEffect(() => {
    if (pin) {
      setPopupPosition({ x: position.x - window.scrollX, y: position.y - window.scrollY });
      setPopupStyle({ ...popupStyle, position: 'fixed' });
    } else {
      setPopupPosition({ x: position.x + window.scrollX, y: position.y + window.scrollY });
      setPopupStyle({ ...popupStyle, position: 'absolute' });
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const popup = document.querySelector('.content-popup');
      if (popup && !popup.contains(event.target as Node)) {
        // Click is outside of the popup, set z-index to 0
        setPopupStyle({ ...popupStyle, zIndex: 0 });
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleDocumentClick);
    }

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [pin, isOpen]);

  const updatePopupPosition = (event, ui) => {
    setPopupPosition({ x: ui.x, y: ui.y });
  };

  return (
    <div>
      <style>{styleText}</style>

      <Draggable handle="h3" position={{ x: position.x, y: position.y }} onDrag={updatePopupPosition}>
        {isOpen && (
          <div className="content-popup" style={popupStyle} onClick={handlePopupClick}>
            <div className="header-container">
              <h3 className="header">{headerContent}</h3>
              <div className="btn-container">
                <div className="pin-btn-container"
                  onClick={() => setPin(!pin)}>

                  <FontAwesomeIcon
                    className={`pin-btn ${pin ? 'pinned' : ''}`}
                    icon={faThumbTack}
                  />
                </div>
                <div className="close-btn-container"
                  onClick={onClose}>

                  <FontAwesomeIcon
                    className="close-btn"
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
  );
};

export default ContentPopup;