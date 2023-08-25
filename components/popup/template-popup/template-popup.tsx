import styleText from "data-text:./template-popup.scss";
import React, { useState } from 'react';

export interface ITemplatePopup {
  position: { x: number; y: number };
  onSelectTemplate: (template: string) => void;
}

const TemplatePopup: React.FC<ITemplatePopup> = ({ position, onSelectTemplate }) => {
  const popupStyle: React.CSSProperties = {
    top: `${position.y}px`,
    left: `${position.x}px`,
  };

  const templateOptions = [
    {
      name: 'Describe in context',
      template: 'Describe "{selectedText}" in the context of "{surroundingText}"'
    },
    // { 
    //   name: 'Template 2', 
    //   template: 'Another {selectedText} example in {surroundingText}'
    // },
    // Add more template options as needed
  ];

  const handleTemplateClick = (template: string) => {
    onSelectTemplate(template);
  };

  return (
    <div>
      <style>{styleText}</style>

      <div className="popup" style={popupStyle}>
        <ul className="templates">
          {templateOptions.map((option, index) => (
            <li
              key={index}
              className="template"
              onClick={() => handleTemplateClick(option.template)}
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