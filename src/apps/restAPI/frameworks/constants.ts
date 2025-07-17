/**
 * Node.js expose in env-vars the values we hard-coded in the package.json, to avoid repeat values 
 */

export const RESTAPI_NAME = process.env.npm_package_name;

export const RESTAPI_VERSION = process.env.npm_package_version;

export const RESTAPI_DOCS_PATH = "docs";

export const RESTAPI_DESCRIPTION = `### Your awesome markdown description

Here you can put everything related to your rest api that helps RestAPI consumers to understand your API, reserve this spot as a very technical jargon.

### Success responses
HTTP status = 2xx

\`\`\`
{
  data: { ... }
}
\`\`\`

by convention for paginated endpoint:

\`\`\`
{
  data: { items: [], meta: { count, limit, offset } }
}
\`\`\`

### Error responses

HTTP status = 4xx/5xx

\`\`\`
{
  error: {
    message: 'Error message',
  } 
}
\`\`\`

* status 401 - type = 'authentication'
* status 400 - type = 'validation'
* status 5xx - type = 'internal'`;

