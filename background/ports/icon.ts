import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.PortHandler = async (req, res) => {
  chrome.action.onClicked.addListener(function (tab) {
    res.send(null);
  });
}

export default handler