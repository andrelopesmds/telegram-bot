exports.handler = async (event: any) => {
  console.log(`${new Date()} - ${JSON.stringify(event)}`)

  return {
    statusCode: 200, body: JSON.stringify(event)
  }
};