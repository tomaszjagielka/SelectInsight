import React, { useEffect, useState } from 'react';
import PopupManager from '~components/popup/popup-manager/popup-manager';

const Content: React.FC = () => {
  const [selectedText, setSelectedText] = useState('');
  const [surroundingText, setSurroundingText] = useState('');
  const [mousePosition, setMousePosition] = useState({x: 0, y: 0});

  const handleMouseUp = (event: MouseEvent) => {
    const selectedText = getSelectedText();

    if (selectedText) {
      setMousePosition({x: event.clientX, y: event.clientY});
      setSelectedText(selectedText.trim());
      setSurroundingText(extractSurroundingText(document.body.innerText, selectedText, 1000, 1000));
    } else {
      setSelectedText('');
    }
  };

  const getSelectedText = () => {
    return window.getSelection()?.toString() || '';
  };

  function extractSurroundingText(mainText, searchText, charactersBefore, charactersAfter) {
    const index = mainText.indexOf(searchText);

    if (index === -1) {
      return mainText.substring(0, charactersBefore + charactersAfter).replace(/\n/g, ' ');
    }

    const start = Math.max(0, index - charactersBefore);
    const end = Math.min(mainText.length, index + searchText.length + charactersAfter);

    return mainText.substring(start, end).replace(/\n/g, ' ');
  }

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    // document.body.addEventListener('mouseup', () => {
    //   setCloseAllPopups(true);
    // });

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      // document.body.removeEventListener('mouseup', () => {
      //   setCloseAllPopups(false);
      // });
    };
  }, []);

  return (
    <div>
      <PopupManager selectedText={selectedText} surroundingText={surroundingText} mousePosition={mousePosition} />
    </div>
  );
};

export default Content;