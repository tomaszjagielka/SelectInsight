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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const popupStyle: React.CSSProperties = {
    top: `${position.y}px`,
    left: `${position.x}px`,
  };

  const templateOptions: ITemplate[] = [
    {
      name: 'Explain',
      content: `Provide concise, complete and simple explanation of:\n{selectedText}\n\nYou might use this:\n{surroundingText}`
    },
    {
      name: 'Translate to Polish',
      content: 'Przetłumacz "{selectedText}" na polski. Możesz użyć tego:\n{surroundingText}',
    },
  ];

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setSelectedIndex(0);
  };

  const filteredTemplates = templateOptions.filter((option) =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((prevIndex) => {
        if (searchQuery === '') {
          return prevIndex === 0 ? filteredTemplates.length - 1 : prevIndex - 1;
        } else {
          return prevIndex === 0 ? filteredTemplates.length : prevIndex - 1;
        }
      });
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((prevIndex) => {
        if (searchQuery === '') {
          return prevIndex === filteredTemplates.length - 1 ? 0 : prevIndex + 1;
        } else {
          return prevIndex === filteredTemplates.length ? 0 : prevIndex + 1;
        }
      });
    } else if (event.key === 'Enter') {
      let template: ITemplate = null;

      if (selectedIndex === filteredTemplates.length) {
        const templateText = `${searchQuery}:\n{selectedText}`;
        template = { name: searchQuery, content: templateText };
      } else if (selectedIndex !== -1) {
        const templateName = filteredTemplates[selectedIndex].name;
        const templateText = filteredTemplates[selectedIndex].content;
        template = { name: templateName, content: templateText };
      }

      if (template) {
        onSelectTemplate(template);
      }
    }
  };

  return (
    <div>
      <style>{styleText}</style>

      <div className="template-popup" style={popupStyle}>
        <input
          type="text"
          className='search-input'
          placeholder="Write a prompt"
          value={searchQuery}
          onChange={handleSearchInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setSelectedIndex(0)}
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
          {searchQuery.trim() !== '' && (
            <li
              className={`${selectedIndex === filteredTemplates.length ? 'item-selected' : 'item'}`}
              onClick={() => onSelectTemplate({ name: searchQuery, content: `${searchQuery}:\n{selectedText}` })}
            >
              Custom: {searchQuery}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default TemplatePopup;