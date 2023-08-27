import React, { useState, useEffect } from 'react';
import styleText from 'data-text:./template-popup.scss';

export interface ITemplate {
  name: string;
  content: string;
}

export interface ITemplatePopup {
  position: { x: number; y: number };
  onSelectTemplate: (template: ITemplate) => void;
}

const TemplatePopup: React.FC<ITemplatePopup> = ({ position, onSelectTemplate }) => {
  const popupStyle: React.CSSProperties = {
    top: `${position.y}px`,
    left: `${position.x}px`,
  };

  const templateOptions: ITemplate[] = [
    {
      name: 'Describe in context',
      content: 'Describe "{selectedText}" in the context of "{surroundingText}"',
    },
    {
      name: 'Translate to Polish',
      content: 'Translate "{selectedText}" to Polish',
    },
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setSelectedIndex(-1);
  };

  const filteredTemplates = templateOptions.filter((option) =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const handleKeyDown = (event) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((prevIndex) => (prevIndex < filteredTemplates.length - 1 ? prevIndex + 1 : prevIndex));
    } else if (event.key === 'Enter') {
      let template: ITemplate = null;

      if (selectedIndex !== -1) {
        const templateName = filteredTemplates[selectedIndex].name
        const templateText = filteredTemplates[selectedIndex].content;
        template = { name: templateName, content: templateText };
      } else if (selectedIndex === -1) {
        const templateText = `${searchQuery}:\n{selectedText}`;
        template = { name: searchQuery, content: templateText }
      }

      if (template) {
        onSelectTemplate(template);
      }
    }
  };

  useEffect(() => {
    const handleWindowClick = () => {
      setSelectedIndex(-1); // Reset selected index on window click
    };

    window.addEventListener('click', handleWindowClick);
    return () => {
      window.removeEventListener('click', handleWindowClick);
    };
  }, []);

  return (
    <div>
      <style>{styleText}</style>

      <div className="template-popup" style={popupStyle}>
        <input
          type="text"
          className='search-input'
          placeholder="Search templates"
          value={searchQuery}
          onChange={handleSearchInputChange}
          onKeyDown={handleKeyDown}
        />

        <ul className="items">
          {filteredTemplates.map((option, index) => (
            <li
              key={index}
              className={`${selectedIndex === index ? 'item-selected' : 'item'}`}
              onClick={() => onSelectTemplate({ name: option.name, content: option.content })}
            >
              {option.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TemplatePopup;