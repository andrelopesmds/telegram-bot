import { constants } from '../constants'
import { getRequest } from '../helper'

exports.handler = async (event: any) => {
  console.log(`Event: ${JSON.stringify(event)}`)

  const message = event.Records[0].Sns.Message;

  const encodedURI = encodeURI('https://api.telegram.org/bot' + constants.BOT_TOKEN + '/sendMessage?chat_id=' + constants.BOT_CHAT_ID + '&parse_mode=Markdown&text=' + message)

  await getRequest(encodedURI)

  console.log(`Message sent: ${message}`)
};
