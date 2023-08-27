import React, { useState, useEffect, useRef } from 'react';
import ContentPopup, { type IContentPopup } from '~components/popup/content-popup/content-popup';
import { getPort } from "@plasmohq/messaging/port";
import TemplatePopup, { type ITemplate } from '../template-popup/template-popup';

export interface IPopupManager {
  selectedText: string;
  surroundingText: string;
  mousePosition: { x: number, y: number }
}

const PopupManager: React.FC<IPopupManager> = ({ selectedText, surroundingText, mousePosition }) => {
  const [contentPopups, setContentPopups] = useState<IContentPopup[]>([]);
  const [contentPopupPosition, setContentPopupPosition] = useState({ x: 0, y: 0 });
  const [templatePopupPosition, setTemplatePopupPosition] = useState({ x: 0, y: 0 });
  const [isTemplatePopupOpen, setIsTemplatePopupOpen] = useState(false);
  const [lastSelectedText, setLastSelectedText] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [templateText, setTemplateText] = useState('');

  const templatePopupRef = useRef(null);
  // const [closeAllPopups, setCloseAllPopups] = useState(false);
  const aiPort = getPort('ai');

  const openContentPopup = (position: { x: number; y: number }) => {
    const newPopup: IContentPopup = {
      isOpen: true,
      selectedText: headerText,
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

  const setupContentPopup = (template: ITemplate) => {
    setHeaderText(`${template.name}: ${lastSelectedText}`);
    setTemplateText(template.content);
  }

  useEffect(() => {
    if (!headerText || !templateText || !surroundingText) {
      return;
    }

    setIsTemplatePopupOpen(false);

    const message = templateText
      .replace('{selectedText}', headerText)
      .replace('{surroundingText}', surroundingText);

    aiPort.postMessage({ body: message });

    openContentPopup(contentPopupPosition);
  }, [headerText, templateText]);

  const handleTemplatePopupOutsideClick = (event) => {
    if (templatePopupRef?.current && !templatePopupRef?.current?.contains(event.target)) {
      setIsTemplatePopupOpen(false);
    }
  };

  useEffect(() => {
    if (selectedText) {
      const selection = window.getSelection();

      if (selection?.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (rect.top === 0 && rect.left === 0) {
          setContentPopupPosition(mousePosition);
        } else {
          setContentPopupPosition({ x: rect.right, y: rect.bottom });
        }

        setLastSelectedText(selectedText);
        setTemplatePopupPosition({ x: mousePosition.x + window.scrollX, y: mousePosition.y + window.scrollY });
        setIsTemplatePopupOpen(true);
      }
    }
  }, [selectedText]);

  useEffect(() => {
    aiPort.onMessage.addListener(messageListener);
    document.body.addEventListener('mouseup', handleTemplatePopupOutsideClick)

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
            position={templatePopupPosition}
            onSelectTemplate={(template) => setupContentPopup(template)}
          />
        </div>
      )}

      <div>
        {contentPopups.map((contentPopup, index) => (
          contentPopup.isOpen && (
            <ContentPopup
              key={index}
              isOpen={contentPopup.isOpen}
              onClose={() => closeContentPopup(index)}
              position={contentPopup.position}
              selectedText={contentPopup.selectedText}
              contentText={contentPopup.contentText}
            />
          )
        ))}
      </div>
    </div>
  );
};

export default PopupManager;