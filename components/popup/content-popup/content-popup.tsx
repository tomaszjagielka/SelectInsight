import styleText from "data-text:./content-popup.scss";
import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faThumbTack } from '@fortawesome/free-solid-svg-icons';

export interface IContentPopup {
  isOpen: boolean;
  position: { x: number; y: number };
  contentHeaderText: string;
  contentText: string;
  onClose?: () => void;
}

const ContentPopup: React.FC<IContentPopup> = ({ isOpen, position: initialPosition, contentHeaderText: headerContent, contentText: textContent, onClose }) => {
  const [pin, setPin] = useState(false);
  const [position, setPopupPosition] = useState(initialPosition);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({
    position: 'absolute',
  });

  const handlePopupClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  useEffect(() => {
    if (pin) {
      setPopupPosition({ x: position.x - window.scrollX, y: position.y - window.scrollY });
      setPopupStyle({ ...popupStyle, position: 'fixed' });
    } else {
      setPopupPosition({ x: position.x + window.scrollX, y: position.y + window.scrollY });
      setPopupStyle({ ...popupStyle, position: 'absolute' });
    }
    console.log(pin);
  }, [pin]);

  const updatePopupPosition = (event, ui) => {
    setPopupPosition({ x: ui.x, y: ui.y });
  };

  return (
    <div>
      <style>{styleText}</style>

      <Draggable handle="h3" position={{ x: position.x, y: position.y }} onDrag={updatePopupPosition}>
        {isOpen && (
          <div className="popup" style={popupStyle} onClick={handlePopupClick}>
            <h3>{headerContent}</h3>

            {textContent ? (
              <div className="popup-content">{textContent}</div>
            ) : (
              <div className="spinner-container">
                <FontAwesomeIcon className="icon popup-content-spinner" icon={faSpinner} />
              </div>
            )}

            <FontAwesomeIcon
              className={`popup-pin-icon ${pin ? 'pinned' : ''}`}
              icon={faThumbTack}
              onClick={() => setPin(!pin)}
            />

            <FontAwesomeIcon className="popup-close-btn" icon={faTimes} onClick={onClose} />
          </div>
        )}
      </Draggable>
    </div>
  );
};

export default ContentPopup;