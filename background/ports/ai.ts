import OpenAI from "openai"

import type { PlasmoMessaging } from "@plasmohq/messaging"

// Initialize OpenAI client
// Ensure PLASMO_PUBLIC_OPENAI_API_KEY is set in your .env file
const apiKey = process.env.PLASMO_PUBLIC_OPENAI_API_KEY
if (!apiKey) {
  // console.error(
  //   "[AI Port] CRITICAL: PLASMO_PUBLIC_OPENAI_API_KEY is not set in .env file!"
  // )
} else {
  // console.log(
  //   `[AI Port] OpenAI API Key found (first 5 chars): ${apiKey.substring(
  //     0,
  //     5
  //   )}...`
  // )
}

const openai = new OpenAI({
  apiKey: apiKey
  // dangerouslyAllowBrowser: true, // Usually not needed for background scripts,
  // but uncomment if you face issues in certain environments.
})

// The 'uid' function is no longer needed with the official OpenAI API
// and has been removed.

// The 'getToken' function is no longer needed as we use an API key directly
// and has been removed.

// Rewritten getResponse function to use the official OpenAI API and stream responses
async function* getResponse(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
): AsyncGenerator<string, void, undefined> {
  // console.log(
  //   "[AI Port] getResponse called with messages:",
  //   JSON.stringify(messages, null, 2)
  // )
  try {
    // Using a more common model name. Change to "gpt-4" or other if you have access.
    const modelToUse = "gpt-4o"
    // console.log(
    //   `[AI Port] Attempting to create chat completion with model: ${modelToUse}`
    // )
    const stream = await openai.chat.completions.create({
      model: modelToUse,
      messages: messages,
      stream: true
    })
    // console.log("[AI Port] OpenAI stream created successfully.")

    let chunkIndex = 0
    for await (const chunk of stream) {
      // console.log(`[AI Port] Received stream chunk ${chunkIndex}:`, JSON.stringify(chunk, null, 2));
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content
        // console.log(
        //   `[AI Port] Yielding content from chunk ${chunkIndex}: "${content}"`
        // )
        yield content
      } else {
        // console.log(`[AI Port] Chunk ${chunkIndex} had no content in choices[0].delta.content.`);
        // Log if there's a finish_reason, which might indicate the end or an issue.
        if (chunk.choices[0]?.finish_reason) {
          // console.log(
          //   `[AI Port] Chunk ${chunkIndex} finish_reason: ${chunk.choices[0].finish_reason}`
          // )
        }
      }
      chunkIndex++
    }
    // console.log("[AI Port] Finished iterating over OpenAI stream.")
  } catch (error) {
    // console.error("[AI Port] Error calling OpenAI API in getResponse:", error)
    if (error instanceof OpenAI.APIError) {
      // console.error(
      //   `[AI Port] OpenAI APIError details: Status ${error.status}, Name ${error.name}, Message ${error.message}`
      // )
      // Propagate a more specific error message
      throw new Error(
        `OpenAI API Error: ${error.status} ${error.name} ${error.message}`
      )
    }
    throw new Error("Failed to get response from OpenAI API.")
  }
}

const handler: PlasmoMessaging.PortHandler = async (req, res) => {
  // console.log("[AI Port] Handler invoked.")
  // console.log("[AI Port] Request body:", JSON.stringify(req.body, null, 2))

  const popupIndex: number = req.body.popupIndex
  const conversationHistoryStrings: string[] = req.body.messages || []
  const isUserMessageFirst: boolean = req.body.isUserMessageFirst === true // Ensure boolean

  // console.log(
  //   `[AI Port] User message (last in history): "${conversationHistoryStrings[conversationHistoryStrings.length - 1]}", Popup index: ${popupIndex}, isUserMessageFirst: ${isUserMessageFirst}`
  // )
  // console.log(
  //   "[AI Port] Received conversationHistoryStrings:",
  //   JSON.stringify(conversationHistoryStrings, null, 2)
  // )

  const apiMessages: Array<{
    role: "user" | "assistant"
    content: string
  }> = []

  conversationHistoryStrings.forEach((msgContent, idx) => {
    let role: "user" | "assistant"
    // If isUserMessageFirst is true: User (0), AI (1), User (2)...
    // If isUserMessageFirst is false: AI (0), User (1), AI (2)...
    const currentMessageIsUser = isUserMessageFirst
      ? idx % 2 === 0
      : idx % 2 !== 0
    role = currentMessageIsUser ? "user" : "assistant"

    if (msgContent && msgContent.trim() !== "") {
      apiMessages.push({ role: role, content: msgContent })
    }
  })

  // console.log(
  //   "[AI Port] Constructed apiMessages for OpenAI:",
  //   JSON.stringify(apiMessages, null, 2)
  // )

  if (apiMessages.length === 0) {
    // console.error("[AI Port] No valid messages to send to OpenAI. Aborting.")
    res.send({
      data: {
        // Ensure consistent error response structure if client expects `data`
        type: "ERROR",
        response: "Error: No message content to send.",
        popupIndex: popupIndex
      }
    })
    return
  }

  try {
    // console.log("[AI Port] Calling getResponse with apiMessages...")
    const stream = getResponse(apiMessages)
    let receivedAnyChunk = false
    for await (const aiChunk of stream) {
      receivedAnyChunk = true
      // console.log(
      //   `[AI Port] Received aiChunk from getResponse generator: "${aiChunk}"`
      // )
      const dataToSend = {
        data: {
          response: aiChunk,
          popupIndex: popupIndex
          // Removed contentPopupMessages and contentPopupLastMessageIndex from here
        }
      }
      // console.log(
      //   "[AI Port] Sending data to client:",
      //   JSON.stringify(dataToSend, null, 2)
      // )
      res.send(dataToSend)
    }

    if (!receivedAnyChunk) {
      // console.warn(
      //   "[AI Port] Stream finished but no chunks were received from getResponse. This might indicate an issue upstream (e.g., API error not caught, or empty response)."
      // )
    }
    // console.log(
    //   `[AI Port] Finished processing stream in handler for popupIndex: ${popupIndex}. Sending STREAM_END.`
    // )
    res.send({
      data: {
        type: "STREAM_END",
        popupIndex: popupIndex
      }
    })
  } catch (e) {
    // console.error("[AI Port] Error in handler's try/catch block:", e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    // console.log(`[AI Port] Sending error response to client: "${errorMessage}"`)
    res.send({
      data: {
        // Ensure consistent error response structure
        type: "ERROR",
        response: `Error: ${errorMessage}`,
        popupIndex: popupIndex
      }
    })
  }
}

export default handler
