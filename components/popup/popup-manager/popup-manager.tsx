import React, { useState, useEffect, useRef } from 'react';
import ContentPopup, { type IContentPopup } from '~components/popup/content-popup/content-popup';
import { getPort } from "@plasmohq/messaging/port";
import TemplatePopup from '../template-popup/template-popup';

export interface IPopupManager {
  contentHeaderText: string;
  surroundingText: string;
  mousePosition: { x: number, y: number }
}

const PopupManager: React.FC<IPopupManager> = ({ contentHeaderText, surroundingText, mousePosition }) => {
  const [contentPopups, setContentPopups] = useState<IContentPopup[]>([]);
  const [templatePopupPosition, setTemplatePopupPosition] = useState({ x: 0, y: 0 });
  const [isTemplatePopupOpen, setIsTemplatePopupOpen] = useState(false);
  const [lastContentHeaderText, setLastContentHeaderTest] = useState('');
  const templatePopupRef = useRef(null);
  // const [closeAllPopups, setCloseAllPopups] = useState(false);
  const aiPort = getPort('ai');

  const openContentPopup = (position: { x: number; y: number }) => {
    const newPopup: IContentPopup = {
      isOpen: true,
      // contentHeaderText: contentHeaderText,
      contentHeaderText: lastContentHeaderText,
      contentText: '',
      position: position,
    };
    setContentPopups(prevPopups => [...prevPopups, newPopup]);
  };

  const closeContentPopup = (index: number) => {
    setContentPopups(prevContentPopups => {
      const updatedContentPopups = [...prevContentPopups];
      updatedContentPopups[index].isOpen = false;
      return updatedContentPopups;
    });
  };

  const updateLastPopupContent = (contentText: string) => {
    setContentPopups(prevPopups => {
      const updatedPopups = [...prevPopups];
      if (updatedPopups.length > 0) {
        const lastPopupIndex = updatedPopups.length - 1;
        updatedPopups[lastPopupIndex].contentText = contentText;
      }
      return updatedPopups;
    });
  };

  let isPopupAnswer = false;
  const messageListener = (msg: MessageEvent) => {
    try {
      const data = msg.data.split("data:");

      if (data.length < 2) {
        const json = JSON.parse(data);
        const detail = json?.detail;
        updateLastPopupContent(detail);
        return;
      }

      const firstDataItem = data[1].trim();

      if (firstDataItem === "[DONE]") {
        return;
      }

      const json = JSON.parse(firstDataItem);
      const answer = json?.message?.content?.parts[0];

      if (answer) {
        updateLastPopupContent(answer);
        isPopupAnswer = true;
      }
    } catch (error) {
      if (!isPopupAnswer) {
        updateLastPopupContent(`An error occurred: ${error}`);
        console.error(error);
      }
    }
  };

  const setSelectedTemplate = (template: string) => {
    if (!lastContentHeaderText || !surroundingText) {
      return;
    }

    const message = `Provide concise, complete and simple explanation of:\n${lastContentHeaderText}\n\nYou might use this:\n"${surroundingText}"`

    aiPort.postMessage({ body: message });

    const selection = window.getSelection();
    if (selection?.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.top === 0 && rect.left === 0 && contentPopups.length > 0) {
        const lastPopup = contentPopups[contentPopups.length - 1];
        openContentPopup({ x: lastPopup.position.x + 20, y: lastPopup.position.y + 20 });
      } else {
        // openContentPopup({ x: rect.left, y: rect.top });
        openContentPopup(mousePosition);
      }
    }
  };
  
  useEffect(() => {
    if (templatePopupRef.current && !templatePopupRef.current.contains(event.target) && !contentHeaderText) {
      setIsTemplatePopupOpen(false);
    } else if (contentHeaderText) {
      setIsTemplatePopupOpen(true);
    }

    if (contentHeaderText) {
      setLastContentHeaderTest(contentHeaderText);
    }
  }, [contentHeaderText]);

  useEffect(() => {
    aiPort.onMessage.addListener(messageListener);

    return () => {
      aiPort.onMessage.removeListener(messageListener);
    };
  }, []);

  // useEffect(() => {
  //   if (closeAllPopups) {
  //     setPopups([]);
  //     setCloseAllPopups(false);
  //   }
  // }, [closeAllPopups]);

  return (
    <div>
      {isTemplatePopupOpen && (
        <div ref={templatePopupRef}>
          <TemplatePopup
            onSelectTemplate={(template) => setSelectedTemplate(template)}
            position={{ x: mousePosition.x, y: mousePosition.y + window.scrollY }}
          />
        </div>
      )}

      {contentPopups.map((contentPopup, index) => (
        contentPopup.isOpen && (
          <ContentPopup
            key={index}
            isOpen={contentPopup.isOpen}
            onClose={() => closeContentPopup(index)}
            position={contentPopup.position}
            contentHeaderText={contentPopup.contentHeaderText}
            contentText={contentPopup.contentText}
          />
        )
      ))}
    </div>
  );
};

export default PopupManager;