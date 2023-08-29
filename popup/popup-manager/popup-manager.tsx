import React, { useState, useEffect, useRef } from 'react';
import ContentPopup, { type IContentPopup } from '~/popup/content-popup/content-popup';
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
  const [topmostContentPopupZIndex, setContentPopupZIndex] = useState(0);
  const [templatePopupPosition, setTemplatePopupPosition] = useState({ x: 0, y: 0 });
  const [isTemplatePopupOpen, setIsTemplatePopupOpen] = useState(false);
  const [lastSelectedText, setLastSelectedText] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [templateText, setTemplateText] = useState('');

  // const [closeAllPopups, setCloseAllPopups] = useState(false);
  const aiPort = getPort('ai');

  const openContentPopup = (popupIndex: number, position: { x: number; y: number }, messageToAi: string) => {
    const newPopup: IContentPopup = {
      index: popupIndex,
      conversationId: null,
      parentMessageId: null,
      isOpen: true,
      selectedText: headerText,
      contentText: null,
      position: position,
      topmostZIndex: topmostContentPopupZIndex,
      messageToAi: messageToAi,
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

  const updatePopupContent = (popupIndex: number, contentText: string, conversationId: string = null, parentMessageId: string = null) => {
    setContentPopups(prevPopups => {
      const updatedPopups = [...prevPopups];
      if (updatedPopups.length > 0) {
        updatedPopups[popupIndex].index = popupIndex;
        updatedPopups[popupIndex].conversationId = conversationId;
        updatedPopups[popupIndex].parentMessageId = parentMessageId;
        updatedPopups[popupIndex].contentText = contentText;
      }
      return updatedPopups;
    });
  };

  let isPopupAnswer = false;
  const messageListener = (msg: MessageEvent) => {
    const popupIndex = msg?.data?.popupIndex ?? 0;

    try {
      const response = msg.data.response.split("data:");

      if (response.length < 2) {
        const json = JSON.parse(response);
        const detail = json?.detail;
        updatePopupContent(popupIndex, detail);
        return;
      }

      const firstDataItem = response[1].trim();

      if (firstDataItem === "[DONE]") {
        return;
      }

      const json = JSON.parse(firstDataItem);
      const content = json?.message?.content?.parts[0];
      const conversationId = json?.conversation_id;
      const parentMessageId = json?.message?.id;

      if (content) {
        updatePopupContent(popupIndex, content, conversationId, parentMessageId);
        isPopupAnswer = true;
      }
    } catch (error) {
      if (!isPopupAnswer) {
        updatePopupContent(popupIndex, `An error occurred: ${error}`);
        console.error(error);
      }
    }
  };

  const setupContentPopup = (template: ITemplate) => {
    setHeaderText(`${template.name}: ${lastSelectedText}`);
    setTemplateText(template.content);
  }

  const handleTemplatePopupOutsideClick = () => {
    setIsTemplatePopupOpen(false);
  };

  useEffect(() => {
    if (!headerText || !templateText || !surroundingText) {
      return;
    }

    setIsTemplatePopupOpen(false);

    const message = templateText
      .replace('{selectedText}', lastSelectedText)
      .replace('{surroundingText}', surroundingText);

    const body = { popupIndex: contentPopups.length, message: message };
    aiPort.postMessage({ body: body });

    openContentPopup(contentPopups.length, contentPopupPosition, message);
  }, [headerText, templateText]);

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
      document.body.removeEventListener('mouseup', handleTemplatePopupOutsideClick)
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
        <TemplatePopup
          position={templatePopupPosition}
          onSelectTemplate={(template) => setupContentPopup(template)}
        />
      )}

      <div>
        {contentPopups.map((contentPopup, index) => (
          contentPopup.isOpen && (
            <ContentPopup
              key={index}
              index={contentPopup.index}
              conversationId={contentPopup.conversationId}
              parentMessageId={contentPopup.parentMessageId}
              isOpen={contentPopup.isOpen}
              topmostZIndex={topmostContentPopupZIndex}
              position={contentPopup.position}
              selectedText={contentPopup.selectedText}
              contentText={contentPopup.contentText}
              messageToAi={contentPopup.messageToAi}
              onClose={() => closeContentPopup(index)}
              setZIndex={(zIndex) => setContentPopupZIndex(zIndex)}
            />
          )
        ))}
      </div>
    </div>
  );
};

export default PopupManager;