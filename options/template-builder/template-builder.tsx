import React, { useState, useEffect } from "react";
import { Storage } from "@plasmohq/storage"
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';

const TemplateBuilder = () => {
  const [specialBlocks] = useState([
    { content: "[SELECTED TEXT]" },
    {
      content: "[SURROUNDING TEXT]",
      length: 100,
    },
  ]);
  const [templates, setTemplates] = useState([
    {
      name: "Explain",
      blocks:
        [
          { content: "Provide" },
          { content: "concise," },
          { content: "complete" },
          { content: "and" },
          { content: "simple" },
          { content: "explanation" },
          { content: "of:" },
          { content: "[SELECTED TEXT]" }
        ]
    },
    {
      name: "Explain in context",
      blocks:
        [
          { content: "Provide" },
          { content: "concise," },
          { content: "complete" },
          { content: "and" },
          { content: "simple" },
          { content: "explanation" },
          { content: "of:" },
          { content: "[SELECTED TEXT]" },
          { content: "You" },
          { content: "might" },
          { content: "use" },
          { content: "this" },
          { content: "context:" },
          { content: "[SURROUNDING TEXT]", length: 100 },
        ]
    },
    {
      name: "",
      blocks: []
    }
  ]);
  const [isDirty, setIsDirty] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isMounted) {
      setIsDirty(true);
    } else {
      setIsMounted(true);
    }
  }, [templates]);

  useEffect(() => {
    // Function to load templates from storage
    const loadTemplatesFromStorage = async () => {
      const storage = new Storage();
      const storedTemplates: any = await storage.get("templates");

      if (storedTemplates) {
        setTemplates(storedTemplates);
      }
    };

    loadTemplatesFromStorage();
    setIsMounted(false);
  }, []);

  const handleDragEnd = (result, templateIndex) => {
    if (result.destination) {
      if (result.source.droppableId === "special" && result.destination.droppableId === "regular") {
        const specialBlock = { ...specialBlocks[result.source.index] };
        templates[templateIndex].blocks.splice(result.destination.index, 0, specialBlock);

        if (templates[templates.length - 1].blocks.length > 0) {
          const newTemplate = {
            name: "",
            blocks: []
          };

          templates.splice(templateIndex + 1, 0, newTemplate);

          setTemplates([...templates]);
        } else {
          setTemplates([...templates]);
        }
      }

      if (result.source.droppableId === "regular" && result.destination.droppableId === "regular") {
        const reorderedBlocks = [...templates[templateIndex].blocks];
        const [removed] = reorderedBlocks.splice(result.source.index, 1);

        reorderedBlocks.splice(result.destination.index, 0, removed);
        templates[templateIndex].blocks = reorderedBlocks;
        setTemplates(templates);
      }
    } else if (result.source.droppableId === "regular") {
      const updatedBlocks = [...templates[templateIndex].blocks];

      updatedBlocks.splice(result.source.index, 1);
      templates[templateIndex].blocks = updatedBlocks;
      setTemplates(templates);
    }
  };

  const handleTemplateNameInputChange = (e, templateIndex: number) => {
    const inputText = e.target.value;

    setTemplates((prevTemplates) => {
      const updatedTemplates = [...prevTemplates];
      const currentTemplate = updatedTemplates[templateIndex];
      currentTemplate.name = inputText;
      return updatedTemplates;
    });
  }

  const handlePromptInputChange = (e, templateIndex: number) => {
    const inputText = e.target.value;
    const block = inputText.split(' ');

    if (block.length > 1) {
      setTemplates((prevTemplates) => {
        const updatedTemplates = [...prevTemplates];
        const currentTemplate = updatedTemplates[templateIndex];

        currentTemplate.blocks.push({
          content: block[0],
        });

        if (updatedTemplates[updatedTemplates.length - 1].blocks.length > 0) {
          updatedTemplates.push({
            name: "",
            blocks: []
          });
        }

        return updatedTemplates;
      });

      e.target.value = '';
    }
  }

  const save = async () => {
    console.log(templates);
    const storage = new Storage();
    await storage.set("templates", templates);

    setIsDirty(false);
  };

  const deleteTemplate = (templateIndex) => {
    if (templates.length > 1 && templates[templateIndex].blocks.length > 0) {
      setTemplates((prevTemplates) => {
        const updatedTemplates = [...prevTemplates];
        updatedTemplates.splice(templateIndex, 1);
        return updatedTemplates;
      });
    }
  };

  const handleBlockLengthChange = (e, templateIndex, blockIndex) => {
    const length = parseInt(e.target.value);

    setTemplates((prevTemplates) => {
      const updatedTemplates = [...prevTemplates];
      const currentTemplate = updatedTemplates[templateIndex];
      currentTemplate.blocks[blockIndex].length = length;
      return updatedTemplates;
    });
  };

  return (
    <div>
      <h1>Template Builder</h1>

      {templates.map((template, templateIndex) => (
        <div key={templateIndex}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              type="text"
              value={template.name}
              onChange={(e) => handleTemplateNameInputChange(e, templateIndex)}
              placeholder="Template name"
              style={{
                padding: "8px",
                margin: "8px",
              }}
            />
            <DragDropContext onDragEnd={(result) => handleDragEnd(result, templateIndex)}>
              <Droppable droppableId="regular" direction="horizontal">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{ display: "flex", flex: 1 }}
                  >
                    {template.blocks.map((block, blockIndex) => (
                      <Draggable
                        key={blockIndex + specialBlocks.length}
                        draggableId={`${blockIndex + specialBlocks.length}`}
                        index={blockIndex}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              padding: "8px",
                              margin: "8px",
                              border: "1px solid #ccc",
                              backgroundColor: "white",
                              userSelect: "none",
                              ...provided.draggableProps.style,
                            }}
                          >
                            {block.content}
                            {block.length && ( // Conditionally render for surrounding text blocks
                              <input
                                type="number"
                                value={block.length}
                                onChange={(e) => handleBlockLengthChange(e, templateIndex, blockIndex)}
                                placeholder="Length"
                                style={{
                                  marginLeft: "8px",
                                  padding: 0,
                                  width: "50px",
                                }}
                              />
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    <input
                      type="text"
                      onChange={(e) => handlePromptInputChange(e, templateIndex)}
                      placeholder="Write a prompt "
                      style={{
                        padding: "8px",
                        margin: "8px",
                      }}
                    />
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <Droppable droppableId="special" direction="horizontal">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{ display: "flex" }}
                  >
                    {specialBlocks.map((item, index) => (
                      <Draggable
                        key={index}
                        draggableId={`${index}`}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              padding: "8px",
                              margin: "8px",
                              border: "1px solid #ccc",
                              backgroundColor: "lightblue",
                              userSelect: "none",
                              ...provided.draggableProps.style,
                            }}
                          >
                            {item.content}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <FontAwesomeIcon
                onClick={() => deleteTemplate(templateIndex)}
                icon={faTrashCan}
                style={{
                  width: "15px",
                  height: "15px",
                  padding: "8px",
                  margin: "8px",
                  cursor: "pointer",
                  backgroundColor: "coral",
                  border: "none",
                }}
              />
            </DragDropContext>
          </div>
        </div>
      ))}
      {isDirty && (
        <button
          onClick={save}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Save
        </button>
      )}
    </div>
  );
};

export default TemplateBuilder;