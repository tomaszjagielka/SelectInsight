import React, { useState, useEffect } from 'react';
import ContentPopup, { type IContentPopup } from '~components/popup/content-popup/content-popup';
import { getPort } from "@plasmohq/messaging/port";

export interface IPopupManager {
  contentHeaderText: string;
  surroundingText: string;
}

const PopupManager: React.FC<IPopupManager> = ({ contentHeaderText, surroundingText }) => {
  const [popups, setPopups] = useState<IContentPopup[]>([]);
  // const [closeAllPopups, setCloseAllPopups] = useState(false);
  const aiPort = getPort('ai');

  const openPopup = (position: { x: number; y: number }) => {
    const newPopup: IContentPopup = {
      isOpen: true,
      contentHeaderText: contentHeaderText,
      contentText: '',
      position: position,
    };
    setPopups(prevPopups => [...prevPopups, newPopup]);
  };

  const closePopup = (index: number) => {
    setPopups(prevPopups => {
      const updatedPopups = [...prevPopups];
      updatedPopups[index].isOpen = false;
      return updatedPopups;
    });
  };

  const updateLastPopupContent = (contentText: string) => {
    setPopups(prevPopups => {
      const updatedPopups = [...prevPopups];
      if (updatedPopups.length > 0) {
        const lastPopupIndex = updatedPopups.length - 1;
        updatedPopups[lastPopupIndex].contentText = contentText;
      }
      return updatedPopups;
    });
  };

  useEffect(() => {
    if (contentHeaderText) {
      const message = `Describe briefly "${contentHeaderText}" in this content: "${surroundingText}"`
      aiPort.postMessage({ body: message });

      const selection = window.getSelection();
      if (selection?.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (rect.top === 0 && rect.left === 0 && popups.length > 0) {
          const lastPopup = popups[popups.length - 1];
          openPopup({ x: lastPopup.position.x + 20, y: lastPopup.position.y + 20 });
        } else {
          openPopup({ x: rect.left, y: rect.top });
        }
      }
    }
  }, [contentHeaderText]);

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

  // useEffect(() => {
  //   if (closeAllPopups) {
  //     setPopups([]);
  //     setCloseAllPopups(false);
  //   }
  // }, [closeAllPopups]);

  useEffect(() => {
    aiPort.onMessage.addListener(messageListener);

    return () => {
      aiPort.onMessage.removeListener(messageListener);
    };
  }, []);

  return (
    <div>
      {popups.map((popup, index) => (
        popup.isOpen && (
          <ContentPopup
            key={index}
            isOpen={popup.isOpen}
            onClose={() => closePopup(index)}
            position={popup.position}
            contentHeaderText={popup.contentHeaderText}
            contentText={popup.contentText}
          />
        )
      ))}
    </div>
  );
};

export default PopupManager;