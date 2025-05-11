export { }

import { Storage } from "@plasmohq/storage"

chrome.runtime.onInstalled.addListener(async (details) => {
  const currentVersion = chrome.runtime.getManifest().version
  const previousVersion = details.previousVersion
  const reason = details.reason
  console.log(`Previous Version: ${previousVersion}`)
  console.log(`Current Version: ${currentVersion}`)

  switch (reason) {
    case 'install':
      console.log('New User installed the extension.')
      break;
    case 'update':
      console.log('User has updated their extension.')
      break;
    case 'chrome_update':
    case 'shared_module_update':
    default:
      console.log('Other install events within the browser')
      break;
  }

  const storage = new Storage()
  await storage.set("templates", [
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
  ])
})