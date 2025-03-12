# Authorization

### API Keys

You can access the API methods using API Keys. These keys have no time-to-live (TTL), but they can be disabled or deleted. Each key is assigned to a specific [scope](#api-scopes). You can create up to 10 API keys by calling the method [user/AddApiKey](#user-addapikey).

An API key can be created with a secret:

<div class="center-column"></div>

```c
curl -X POST -H "Content-Type: application/json" \
    -H "Authorization: one-of-our-authorization-methods" \
    --data-binary '{
        "jsonrpc": "2.0",
        "id": 0,
        "method": "user/addApiKey",
        "params": {
            "type": "secret",
            "name": "My ApiKey",
            "clientSecret": "CspXxVtTyE3sf6jB7z4CSjxoymuS2H67ZjNDfovTu3i8",
            "maxScope": [
                "user:read"
            ]
        }
    }' \
    https://api.webapp-template/main
``` 

Or with an ED25519 PEM-encoded public key:

<div class="center-column"></div>

```c
curl -X POST -H "Content-Type: application/json" \
    -H "Authorization: one-of-our-authorization-methods" \
    --data-binary '{
        "jsonrpc": "2.0",
        "id": 0,
        "method": "user/addApiKey",
        "params": {
            "type": "pubKey",
            "name": "My ApiKey",
            "clientPubKey": "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEADsSTjY2wnm1iwWamIWwLTPVhtTIb8TVlI8tts3wkhkQ=\n-----END PUBLIC KEY-----",
            "maxScope": [
                "user:read"
            ]
        }
    }' \
    https://api.webapp-template/main
``` 

Regardless of the method used, you will receive an `apiKeyId`:

<div class="center-column"></div>

```c
{
    "jsonrpc":"2.0",
    "id":0,
    "result": {
        "apiKeyId":"66d046135d04ce7e4b9c789f"
    }
}
```

You can now authorize requests using your API key in one of the following ways:

### Signatures

You can sign your request using your API key.

First, prepare the data to be signed:

<div class="center-column"></div>

```js
clientId = "6XMc4VMf3q54YNarSn9CWUn4htStNu1ry9ajamemdo23sS1y21";
requestPayload = '{"jsonrpc":"2.0","id":0,"method":"user/getProfile","params":{}}';
requestData = `POST\n/main\n${requestPayload}\n`; // UPPERCASE(HTTP_METHOD()) + "\n" + URI() + "\n" + RequestBody + "\n";
timestamp = 1702555410352;
nonce = "3xUee4EA0gr8dg==";
dataToSign = `${timestamp};${nonce};${requestData}`;
```

Next, generate a signature corresponding to your API key credentials:

**HMAC signature**, if you provided a `clientSecret`:

<div class="center-column"></div>

```js
clientSecret = "CspXxVtTyE3sf6jB7z4CSjxoymuS2H67ZjNDfovTu3i8";
signature = BASE64(HMACSHA256(clientSecret, dataToSign).SUBARRAY(0, 20))
```

**ECC signature**, if you provided a `clientPubKey`:

<div class="center-column"></div>

```js
clientPrivKey = "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIOBVFGaSFtfqbNvZWctFKg3k+I0T5YXRavpKAD9+BgCX\n-----END PRIVATE KEY-----";
signature = BASE64(SIGN(dataToSign, clientPrivKey))
```

To sign a request, include the following in the `Authorization` header: 

<div class="center-column"></div>

```c
"pmx-hmac-sha256 ${clientId};1;${timestamp};${nonce};${signature}"
```

<div class="center-column"></div>

```c
curl -X POST -H "Content-Type: application/json" \
    -H "Authorization: pmx-hmac-sha256 6XMc4VMf3q54YNarSn9CWUn4htStNu1ry9ajamemdo23sS1y21;1;1702555410352;3xUee4EA0gr8dg;JN5llLladWZ+1rGu6yrkbIQzme0=" \
    --data-binary '{
        "jsonrpc": "2.0",
        "id": 0,
        "method": "user/getProfile",
        "params": {}
    }' \
    https://api.webapp-template/main
``` 

### Client Credentials  

Alternatively, if you provided a `clientSecret` instead of a public key, you can authorize the request by placing your client credentials in the `Authorization` header:

<div class="center-column"></div>

```c
curl -X POST -H "Content-Type: application/json" \
    -H "Authorization: Basic BASE64(${clientId}:${clientSecret})" \
    --data-binary '{
        "jsonrpc": "2.0",
        "id": 0,
        "method": "user/getProfile",
        "params": {}
    }' \
    https://api.webapp-template/main
``` 

### Access Tokens

Access Tokens have a TTL but can be refreshed using refresh Tokens. You can generate Access Tokens by calling [auth/token](#auth-token) or [auth/loginForToken](#auth-loginfortoken):

<div class="center-column"></div>

```c
curl -X POST \
    -H "Content-Type: application/json" \
    --data-binary '{
        "jsonrpc": "2.0",
        "id": 128,
        "method": "auth/token",
        "params": {
            "scope": [
                "user:read_write"
            ],
            "grantType": "client_credentials",
            "clientId": "65ad8f6b2e4f4f1adb40bf68",
            "clientSecret": "5ZTUQ7VBxoqRKn3pEyPjHeavXHVw7JcJF3MvAV43yfsR"
        }
    }' \
    https://api.webapp-template/main
```

<div class="center-column"></div>

```c
curl -X POST \
    -H "Content-Type: application/json" \
    --data-binary '{
        "jsonrpc": "2.0",
        "id": 128,
        "method": "auth/loginForToken",
        "params": {
            "email": "ad@m.in",
            "password": "admin01"
        }
    }' \
    https://api.webapp-template/main
```

Regardless of the method used, you will receive an `access_token` and a `refresh_token`:

<div class="center-column"></div>

```c
{
    "jsonrpc": "2.0",
    "id": 128,
    "result": {
        "access_token": "SXRzIGEgcmFuZG9tIHRleHQgZW5jb2RlZCBmb3IgdGhlIHRlc3RpbmcgcHVycG9zZSwgaWYgeW91IGRlY29kZWQgdGhpcyB0ZXh0LCB0cmVhdCBpcyBhcyBhIHNvcnQgb2YgZWFzdGVyIGVnZyA6KS4=",
        "expires_in": 900000, // TTL in milliseconds
        "refresh_token": "TG9yZW0gaXBzdW1Mb3JlbSBpcHN1bUxvcmVtIGlwc3VtTG9yZW0gaXBzdW1Mb3JlbSBpcHN1bUxvcmVtIGlwc3VtTG9yZW0gaXBzdW0=",
        "token_type": "Bearer",
        "scope": [
            "user:read",
            "user:write"
        ]
    }
}
```

The Access Token can be used to authorize your request by placing it in the `Authorization` header:

<div class="center-column"></div>

```c
curl -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer SXRzIGEgcmFuZG9tIHRleHQgZW5jb2RlZCBmb3IgdGhlIHRlc3RpbmcgcHVycG9zZSwgaWYgeW91IGRlY29kZWQgdGhpcyB0ZXh0LCB0cmVhdCBpcyBhcyBhIHNvcnQgb2YgZWFzdGVyIGVnZyA6KS4=" \
    --data-binary '{
        "jsonrpc": "2.0",
        "id": 128,
        "method": "user/getProfile",
        "params": {}
    }' \
    https://api.webapp-template/main
```

Access Tokens can be refreshed using refresh Tokens by calling the [auth/token](#auth-token) method:

<div class="center-column"></div>

```c
curl -X POST \
    -H "Content-Type: application/json" \
    --data-binary '{
        "jsonrpc": "2.0",
        "id": 128,
        "method": "auth/token",
        "params": {
            "grantType": "refresh_token",
            "refreshToken": "TG9yZW0gaXBzdW1Mb3JlbSBpcHN1bUxvcmVtIGlwc3VtTG9yZW0gaXBzdW0=",
        }
    }' \
    https://api.webapp-template/main   
```
In response, you will receive a new pair of Tokens, and the old pair will be revoked.

You can fork your Access Token using the [`auth/forkToken`](#auth-forktoken)  method, which allows you to create a separate session with the same scope as the original Token. This does not revoke the original Token, allowing both the original and the forked Tokens to be used independently. This can be useful if you want to maintain multiple active sessions with identical access permissions.

If you are connected via WebSocket, you can bind your `accessToken` to the connection using the `auth/bindAccessToken` method. This ensures that every request sent over the WebSocket will be executed with the permissions associated with that Token:

<div class="center-column"></div>

```js
ws.send(JSON.stringify({
    "jsonrpc": "2.0",
    "id": 128,
    "method": "auth/bindAccessToken",
    "params": {
        "accessToken": "SXRzIGEgcmFuZG9tIHRleHQgZW5jb2RlZCBmb3IgdGhlIHRlc3RpbmcgcHVycG9zZSwgaWYgeW91IGRlY29kZWQgdGhpcyB0ZXh0LCB0cmVhdCBpcyBhcyBhIHNvcnQgb2YgZWFzdGVyIGVnZyA6KS4",
    }
}));
```

By binding the Token, all the subsequent requests on this WebSocket connection will automatically use the Token's access rights.


### API Scopes

When requesting an Access Token, you can specify the scope, which defines the level of access granted. The scope determines whether the Token allows read-only access, write access, or both. The table below provides a breakdown of the available scopes:

| **Scope**                      | **Description** |
|----------------------------|-------------|
| **session:NAME**            | Creates a new session with the provided name, generating Tokens bound to that session. Access is granted for the session's lifetime. A user can have up to 16 sessions; when this limit is reached, the oldest session is removed. |
| **connection**              | Grants access as long as the connection is open, or until the Token expires. When the connection closes, a new authentication request is needed.
| **ipAddr:ADDR**             | Restricts the Token to connections from a specific IPv4 address (ADDR). |
| **expires:NUMBER**             | Access Token will expire after NUMBER of milliseconds. Max. value is 7 days. |
| **user: read, write, read_write** | Grants access to user methods, with the ability to specify whether the access is read-only, write-only, or both. |

These scopes allow fine-grained control over what actions can be performed with the generated Tokens, making it easier to manage permissions across different parts of the system.

# Two-Factor Authorization

If two-factor authorization is enabled for a user account, certain methods may require additional verification. In such cases, instead of a standard response, a response is returned with the field `secondFactorRequired` set to `true`. When this occurs, the client must resend the request with the following additional parameters: `authorizationData` and `challenge`.

For example, when a client sends a request that requires two-factor authorization, they will receive the following:

<div class="center-column"></div>

```secondFactorRequired```: true,</br>
```secondFactorInfo```: information about the second factor (mobile app or email),</br>
```challenge```: challenge ID,</br>

Here is an example of a response requesting second factor authorization:

<div class="center-column"></div>

```c
{
    "jsonrpc": "2.0",
    "result": {
        "secondFactorRequired": true,
        "secondFactorInfo": "mobile-app",
        "challenge": "cf3bc568d1a687cf61600387a0ff79e223fa773a2b09a7984d3d22e3e6b47229"
    }
}
```

The user should retrieve the 2FA code from their authenticator app or email and include it in the original request's parameters as `authorizationData`. Additionally, the `challenge` parameter must be added as well. The request should then be repeated with these updated parameters:

<div class="center-column"></div>

```c
{
    "id": 0,
    "method": "user/addApiKey",
    "params": {
        "authorizationData": "602051",
        "challenge": "cf3bc568d1a687cf61600387a0ff79e223fa773a2b09a7984d3d22e3e6b47229"
        // Original method parameters
    }
}
```
