// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'q4wqeix6vk'
const region = 'us-east-1'
export const apiEndpoint = `https://${apiId}.execute-api.${region}.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map. For example:
  // domain: 'dev-nd9990-p4.us.auth0.com',
  domain: 'dev-r-nf5p6j.us.auth0.com',            // Auth0 domain
  clientId: 'qquB0jUYHhn8Yo3enuQ6f1JhJIBIAtlr',          // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
