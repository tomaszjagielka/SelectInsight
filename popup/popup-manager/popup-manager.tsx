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
      position: position,
      topmostZIndex: topmostContentPopupZIndex,
      messages: [],
      lastMessageIndex: 0,
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

  const updatePopupContent = (popupIndex: number, contentText: string, contentPopupMessages: string[], contentPopupLastMessageIndex: number, conversationId: string = null, parentMessageId: string = null) => {
    setContentPopups(prevPopups => {
      const updatedPopups = [...prevPopups];

      if (updatedPopups.length > 0) {
        updatedPopups[popupIndex].index = popupIndex;
        updatedPopups[popupIndex].conversationId = conversationId;
        updatedPopups[popupIndex].parentMessageId = parentMessageId;

        if (contentPopupMessages) {
          updatedPopups[popupIndex].messages = contentPopupMessages;
        }
        if (contentPopupLastMessageIndex) {
          updatedPopups[popupIndex].lastMessageIndex = contentPopupLastMessageIndex;
        }

        if (updatedPopups[popupIndex].messages.length - 1 < updatedPopups[popupIndex].lastMessageIndex) {
          updatedPopups[popupIndex].messages.push(contentText);
        } else if (updatedPopups[popupIndex].messages.length - 1 === updatedPopups[popupIndex].lastMessageIndex) {
          updatedPopups[popupIndex].messages[updatedPopups[popupIndex].lastMessageIndex] = contentText;
        }
      }
      return updatedPopups;
    });
  };

  let isPopupAnswer = false;
  const messageListener = (msg: MessageEvent) => {
    const popupIndex = msg?.data?.popupIndex ?? 0;
    const contentPopupLastMessageIndex = msg?.data?.contentPopupLastMessageIndex;

    try {
      const response = msg.data.response.split("data:");
      const firstDataItem = response[1].trim();

      if (firstDataItem === "[DONE]") {
        return;
      }

      const json = JSON.parse(firstDataItem);
      const content = json?.message?.content?.parts[0];
      const conversationId = json?.conversation_id;
      const parentMessageId = json?.message?.id;
      const contentPopupMessages = json?.contentPopupMessages;

      // TODO: Implement.
      // if (response.length < 2) {
      //   const json = JSON.parse(response);
      //   const detail = json?.detail;
      //   updatePopupContent(popupIndex, detail, contentPopupMessages, contentPopupLastMessageIndex, conversationId, parentMessageId);
      //   return;
      // }

      if (content) {
        updatePopupContent(popupIndex, content, contentPopupMessages, contentPopupLastMessageIndex, conversationId, parentMessageId);
        isPopupAnswer = true;
      }
    } catch (error) {
      if (!isPopupAnswer) {
        updatePopupContent(popupIndex, `An error occurred: ${error}`, [`An error occurred: ${error}`], contentPopupLastMessageIndex);
        // updatePopupContent(popupIndex, `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer varius condimentum augue, et congue tellus sodales quis. Duis rhoncus arcu dictum consectetur efficitur. Nam tortor elit, cursus eu lacinia nec, pulvinar vel turpis. Cras in fringilla massa, non fermentum turpis. Etiam a velit eget neque feugiat pellentesque. Quisque euismod, justo et sodales pretium, eros sapien rutrum ipsum, et aliquet risus quam nec sapien. Nullam in nulla nec massa tincidunt bibendum at a est. Quisque in congue turpis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Suspendisse bibendum faucibus felis eu accumsan. Donec accumsan libero porta euismod efficitur. Curabitur nec nisl suscipit urna suscipit aliquam nec et nibh. In malesuada nec eros condimentum maximus. Sed hendrerit et massa non facilisis. Duis commodo mauris risus, at rutrum nisi consequat vel. Donec cursus, sem sed volutpat pharetra, arcu metus volutpat lectus, quis laoreet eros massa in leo.`, [`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer varius condimentum augue, et congue tellus sodales quis. Duis rhoncus arcu dictum consectetur efficitur. Nam tortor elit, cursus eu lacinia nec, pulvinar vel turpis. Cras in fringilla massa, non fermentum turpis. Etiam a velit eget neque feugiat pellentesque. Quisque euismod, justo et sodales pretium, eros sapien rutrum ipsum, et aliquet risus quam nec sapien. Nullam in nulla nec massa tincidunt bibendum at a est. Quisque in congue turpis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Suspendisse bibendum faucibus felis eu accumsan. Donec accumsan libero porta euismod efficitur. Curabitur nec nisl suscipit urna suscipit aliquam nec et nibh. In malesuada nec eros condimentum maximus. Sed hendrerit et massa non facilisis. Duis commodo mauris risus, at rutrum nisi consequat vel. Donec cursus, sem sed volutpat pharetra, arcu metus volutpat lectus, quis laoreet eros massa in leo.`, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer varius condimentum augue, et congue tellus sodales quis. Duis rhoncus arcu dictum consectetur efficitur. Nam tortor elit, cursus eu lacinia nec, pulvinar vel turpis. Cras in fringilla massa, non fermentum turpis. Etiam a velit eget neque feugiat pellentesque. Quisque euismod, justo et sodales pretium, eros sapien rutrum ipsum, et aliquet risus quam nec sapien. Nullam in nulla nec massa tincidunt bibendum at a est. Quisque in congue turpis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Suspendisse bibendum faucibus felis eu accumsan. Donec accumsan libero porta euismod efficitur. Curabitur nec nisl suscipit urna suscipit aliquam nec et nibh. In malesuada nec eros condimentum maximus. Sed hendrerit et massa non facilisis. Duis commodo mauris risus, at rutrum nisi consequat vel. Donec cursus, sem sed volutpat pharetra, arcu metus volutpat lectus, quis laoreet eros massa in leo.`, [`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer varius condimentum augue, et congue tellus sodales quis. Duis rhoncus arcu dictum consectetur efficitur. Nam tortor elit, cursus eu lacinia nec, pulvinar vel turpis. Cras in fringilla massa, non fermentum turpis. Etiam a velit eget neque feugiat pellentesque. Quisque euismod, justo et sodales pretium, eros sapien rutrum ipsum, et aliquet risus quam nec sapien. Nullam in nulla nec massa tincidunt bibendum at a est. Quisque in congue turpis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Suspendisse bibendum faucibus felis eu accumsan. Donec accumsan libero porta euismod efficitur. Curabitur nec nisl suscipit urna suscipit aliquam nec et nibh. In malesuada nec eros condimentum maximus. Sed hendrerit et massa non facilisis. Duis commodo mauris risus, at rutrum nisi consequat vel. Donec cursus, sem sed volutpat pharetra, arcu metus volutpat lectus, quis laoreet eros massa in leo.'], contentPopupLastMessageIndex);
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
          setTemplatePopupPosition({ x: mousePosition.x + window.scrollX, y: mousePosition.y + window.scrollY });
        } else {
          setContentPopupPosition({ x: rect.right, y: rect.bottom });
          setTemplatePopupPosition({ x: rect.right + window.scrollX, y: rect.bottom + window.scrollY });
        }

        setLastSelectedText(selectedText);
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
              messages={contentPopup.messages}
              lastMessageIndex={contentPopup.lastMessageIndex}
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