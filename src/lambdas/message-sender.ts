import { constants } from '../constants'
import { getRequest } from '../helper'

exports.handler = async (event: any) => {
  console.log(`${new Date()} - ${JSON.stringify(event)}`)

  const message = event.Records[0].Sns.Message;

  console.log(message)

  await getRequest('https://api.telegram.org/bot' + constants.BOT_TOKEN + '/sendMessage?chat_id=' + constants.BOT_CHAT_ID + '&parse_mode=Markdown&text=' + message)

  return {
    statusCode: 200, body: JSON.stringify(event)
  }
};
