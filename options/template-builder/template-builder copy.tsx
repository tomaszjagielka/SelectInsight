import styleText from 'data-text:./template-builder.scss';
import React, { useState, useEffect } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { Storage } from "@plasmohq/storage"

const TemplateBuilder = () => {
  const storage = new Storage()
  const [templates, setTemplates] = useState([{
    name: "Template",
    blocks: [
      { id: "block1", content: "Block 1", special: false },
      { id: "block2", content: "Block 2", special: false },
      { id: "block3", content: "Block 3", special: false },
    ]
  },
  {
    name: "Template",
    blocks: [
      { id: "block1", content: "Block 1", special: false },
      { id: "block2", content: "Block 2", special: false },
      { id: "block3", content: "Block 3", special: false },
    ]
  },
  ]);

  const specialBlocks = [
    // Define your special blocks here...
    { id: "specialBlock1", content: "Special Block 1", special: true, original: true },
    { id: "specialBlock2", content: "Special Block 2", special: true, original: true },
    { id: "specialBlock3", content: "Special Block 3", special: true, original: true },
  ];

  const [specialBlockLimits, setSpecialBlockLimits] = useState({
    specialBlock1: 1, // Maximum of 2 specialBlock1
    specialBlock2: 1, // Maximum of 2 specialBlock2
    specialBlock3: 1, // Maximum of 2 specialBlock3
  });

  const onDragEnd = (result, templateIndex) => {
    if (!result.destination) {
      return;
    }

    const draggableId = result.draggableId;
    const movedBlock = templates[templateIndex].blocks.find((block) => block.id === draggableId);
    const updatedBlocks = [...templates[templateIndex].blocks];
    const destinationIndex = result.destination.index;

    // Check if a regular block is to the left or right of the destination index
    const isLeftRegular =
      destinationIndex > 0 &&
      !updatedBlocks[destinationIndex - 1].special;
    const isRightRegular =
      destinationIndex < updatedBlocks.length - 1 &&
      !updatedBlocks[destinationIndex + 1].special;

    // Check if the moved block is a special block and an original one
    if (movedBlock.special) {
      // Check if the maximum limit for this type of special block is reached
      if (
        specialBlockLimits[movedBlock.id] <= 0 ||
        (!isLeftRegular && !isRightRegular)
      ) {
        // If the limit is reached or there are no regular blocks nearby, just move the block
        return;
      } else {
        // Duplicate the special block and decrement the limit
        const duplicatedBlock = {
          ...movedBlock,
          id: `${movedBlock.id}_duplicate_${specialBlockLimits[movedBlock.id]}`,
          original: false, // Mark as a duplicate
        };
        updatedBlocks.splice(destinationIndex, 0, duplicatedBlock);

        const updatedTemplates = templates.map((template, index) => {
          if (index === templateIndex) {
            // Update the current template with the new blocks
            return { ...template, blocks: updatedBlocks };
          }
          // Keep other templates unchanged
          return template;
        });

        setTemplates(updatedTemplates);

        // Update the special block limit
        setSpecialBlockLimits((prevLimits) => ({
          ...prevLimits,
          [movedBlock.id]: prevLimits[movedBlock.id] - 1,
        }));
      }
    } else {
      // If it's a regular block or a duplicate special block, just move it
      updatedBlocks.splice(result.source.index, 1);
      updatedBlocks.splice(destinationIndex, 0, movedBlock);

      const updatedTemplates = templates.map((template, index) => {
        if (index === templateIndex) {
          // Update the current template with the new blocks
          return { ...template, blocks: updatedBlocks };
        }
        // Keep other templates unchanged
        return template;
      });

      setTemplates(updatedTemplates);
    }
  };

  const handleInputChange = (e, templateIndex) => {
    const inputText = e.target.value;

    // Automatically add a block when a space is encountered
    if (inputText.includes(" ")) {
      const [beforeSpace, afterSpace] = inputText.split(" ");
      const newBlock = {
        id: `block${templates[templateIndex].blocks.length + 1}`,
        content: beforeSpace,
        special: false, // This block is not special
      };

      // Find the index of the last regular block that isn't original
      let lastRegularBlockIndex = -1;
      for (let i = templates[templateIndex].blocks.length - 1; i >= 0; i--) {
        if (!templates[templateIndex].blocks[i].special) {
          lastRegularBlockIndex = i;
          break;
        }
      }

      if (lastRegularBlockIndex !== -1) {
        // Insert the new block after the last regular block
        const updatedBlocks = [...templates[templateIndex].blocks];
        updatedBlocks.splice(lastRegularBlockIndex + 1, 0, newBlock);

        const updatedTemplates = [...templates];
        updatedTemplates[templateIndex] = {
          name: templates[templateIndex].name,
          blocks: updatedBlocks,
        };

        setTemplates(updatedTemplates);
      } else {
        // If no such block is found, just add the new block to the end
        setTemplates((prevTemplates) => {
          const updatedTemplates = [...prevTemplates];
          const currentTemplate = updatedTemplates[templateIndex];
          const updatedBlocks = [...currentTemplate.blocks, newBlock];
          currentTemplate.name = templates[templateIndex].name;
          currentTemplate.blocks = updatedBlocks;
          return updatedTemplates;
        });
      }

      e.target.value = afterSpace;
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

  const save = async () => {
    // const textBlocks = blocks
    //   .filter((block) => !block.special || !block.original)
    //   .map((block) => block.content);
    // console.log(textBlocks.join(" "));
    console.log(templates)
    const storage = new Storage()
    await storage.set("templates", templates)
  };

  // Load the blocks from storage when the component mounts
  useEffect(() => {
    async function loadBlocks() {
      const templates: any = await storage.get("templates");
      console.log(templates)
      if (templates) {
        setTemplates(templates);
      }
    }

    loadBlocks();
  }, []);

  return (
    <div>
      <style>{styleText}</style>
      <button onClick={save}>Convert to Text</button>
      <div className="container">
        <h2>Blocks</h2>
        {templates.map((template, templateIndex) => (
          <div key={templateIndex} className="blocks-container">
            <input
              type="text"
              value={template.name}
              onChange={(e) => handleTemplateNameInputChange(e, templateIndex)}
              placeholder="Type here..."
            />
            <input
              type="text"
              onChange={(e) => handleInputChange(e, templateIndex)}
              placeholder="Type here..."
            />
            <DragDropContext onDragEnd={(result) => onDragEnd(result, templateIndex)}>
              <Droppable droppableId={`allBlocks-${templateIndex}`} direction="horizontal" isCombineEnabled>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {template.blocks.map((block, blockIndex) => (
                      <Draggable key={block.id} draggableId={block.id} index={blockIndex}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`block ${block.special ? "special-block" : "regular-block"}`}
                          >
                            {block.content}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <Droppable droppableId={`allBlocks-2-${templateIndex}`} direction="horizontal" isCombineEnabled>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {template.blocks.map((block, blockIndex) => (
                      <Draggable key={block.id} draggableId={block.id} index={blockIndex}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`block ${block.special ? "special-block" : "regular-block"}`}
                          >
                            {block.content}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        ))}
        <div className="special-blocks-container">
          <h2>Special Blocks</h2>
          <DragDropContext>
            <Droppable droppableId="specialBlocks" direction="horizontal" isCombineEnabled>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {specialBlocks.map((block, blockIndex) => (
                    <Draggable
                      key={block.id}
                      draggableId={block.id}
                      index={blockIndex}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`block special-block`}
                        >
                          {block.content}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;