import type { PlasmoMessaging } from "@plasmohq/messaging"

const uid = () => {
  const generateNumber = (limit) => {
    const value = limit * Math.random();
    return value | 0;
  }
  const generateX = () => {
    const value = generateNumber(16);
    return value.toString(16);
  }
  const generateXes = (count) => {
    let result = '';
    for (let i = 0; i < count; ++i) {
      result += generateX();
    }
    return result;
  }
  const generateConstant = () => {
    const value = generateNumber(16);
    const constant = (value & 0x3) | 0x8;
    return constant.toString(16);
  }

  const generate = () => {
    const result = generateXes(8)
      + '-' + generateXes(4)
      + '-' + '4' + generateXes(3)
      + '-' + generateConstant() + generateXes(3)
      + '-' + generateXes(12)
    return result;
  };

  return generate()
};

const getToken = async () => {
  return new Promise(async (resolve, reject) => {
    const resp = await fetch("https://chat.openai.com/api/auth/session")
    if (resp.status === 403) {
      reject('CLOUDFLARE')
    }
    try {
      const data = await resp.json()
      if (!data.accessToken) {
        reject('ERROR')
      }
      resolve(data.accessToken)
    } catch (err) {
      reject('ERROR')
    }
  })
}

const getResponse = async (message: string, conversationId: string, parentMessageId: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const accessToken = await getToken();
      const res = await fetch("https://chat.openai.com/backend-api/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + accessToken,
        },
        body: JSON.stringify({
          action: "next",
          conversation_id: conversationId,
          messages: [
            {
              id: uid(),
              role: "user",
              content: {
                content_type: "text",
                parts: [message]
              }
            }
          ],
          model: "text-davinci-002-render",
          parent_message_id: parentMessageId ?? uid()
        })
      })
      resolve(res.body)
    } catch (e) {
      if (e === "CLOUDFLARE") {
        reject("CLOUDFLARE")
      } else {
        reject("ERROR")
      }
    }
  })
}

const handler: PlasmoMessaging.PortHandler = async (req, res) => {
  const message = req.body.message;
  const popupIndex = req.body.popupIndex;
  const conversationId = req.body.conversationId;
  const parentMessageId = req.body.parentMessageId;
  const contentPopupMessages = req.body.messages;
  const contentPopupLastMessageIndex = req.body.lastMessageIndex;
  // res.send({ "data": "data" });

  getResponse(message, conversationId, parentMessageId).then(async answer => {
    // @ts-ignore
    const resReader = answer.getReader()
    
    while (true) {
      const { done, value } = await resReader.read()
      
      if (done) {
        break
      }

      if (done === undefined || value === undefined) {
        res.send({ body: 'ERROR' })
      }

      const reponse = new TextDecoder().decode(value);
      const data = { data: { response: reponse, popupIndex: popupIndex, contentPopupMessages: contentPopupMessages, contentPopupLastMessageIndex: contentPopupLastMessageIndex } }
      res.send(data);
    }
  }).catch((e) => res.send({ response: e, popupIndex: popupIndex }))
}

export default handler