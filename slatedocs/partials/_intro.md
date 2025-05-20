# PrivMX PKI Server

## Basic Usage

### The Admin PKI API and Accessing the Server

Log in using the `auth/token` API method and the `API_KEY_ID` and `API_KEY_SECRET`, which you received - depending on how the server was launched - from the `setup` script, or from `create_api_key` script.

<div class="center-column"></div>

```bash
curl -X POST -H "Content-Type: application/json" --data-binary '{
    "jsonrpc":"2.0",
    "id":0,
    "method":
    "auth/token",
    "params":{
        "scope":["user:read_write"],
        "grantType":"client_credentials",
        "clientId":"<API_KEY_ID>",
        "clientSecret":"<API_KEY_SECRET>"
    }
}' http://localhost:8101/main
```

As a result, one of the fields you will receive will be the `access_token` field.

You can now use it for methods requiring authentication by providing it in the header as follows: `"Authorization: Bearer <access_token>"`.

### Registering PrivMX Bridge Server 

To register a PrivMX Bridge server you will use the `pkiadmin/setHost` method of the Admin PKI API and the generated access token:

<div class="center-column"></div>

```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <access-token>" --data-binary '{
    "jsonrpc":"2.0",
    "id":0,
    "method":"pkiadmin/setHost",
    "params":{
        "hostPubKey":"<BRIDGE_SERVER_PUBLIC_KEY>",
        "hostUrl":"<BRIDGE_SERVER_HOST_URL>"
    }
}' http://localhost:8101/main
```
As a result, you will receive a JSON object with an `instanceId` identifying the added PrivMX Bridge server.

### Verification of Registration
In order to verify the correctness of the previous step, you can use `pkiadmin/listHosts` API method get the list of registered Bridge servers:

<div class="center-column"></div>

```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <access-token>" --data-binary '{
    "jsonrpc":"2.0",
    "id":0,"method":"pkiadmin/listHosts",
    "params":{}
}' http://localhost:8101/main
```
The PKI server should return a list of registered PrivMX Bridge records in the form of a `JSON` object as a result.

### Adding User Identification Information

To enable verification of users' public keys, their records (UserIdentity) must be added to the PKI server using `pkiadmin/setKey` API method:

<div class="center-column"></div>

```bash
url -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <access-token>" --data-binary '{
    "jsonrpc":"2.0",
    "id":0,
    "method":"pkiadmin/setKey",
    "params":{
        "userId":"user1",
        "userPubKey":"<USER_PUBLIC_KEY>",
        "instanceId":"<INSTANCE_ID_OF_REGISTERED_BRIDGE_SERVER>",
        "contextId":"<CONTEXT_ID_OF_USER_ON_BRIDGE_SERVERR>"
    }
}' http://localhost:8101/main
```

From now on, the `UserIdentity` of a user presenting a given public key will be associated with a specific instance of PrivMX Bridge (and with a context within that server).

Further steps on how to verify the data at the client application level using the PrivMX Endpoint library are described in the [PrivMX Docs](https://docs.privmx.dev).

