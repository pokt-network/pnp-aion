# pnp-aion
An Aion Plugin for the Pocket Node app.

## Install Plugin
To install the plugin, first install [Pocket Node](https://github.com/pokt-network/pocket-node) and then run the following command:

`pocket-node install pnp-aion`

## Configuration
To configure your plugin run the following command:

`pocket-node configure AION /path/to/file.json`

The following object describes the format of the JSON file you need to use to configure this plugin.

***Notes:***
* Each key in the configuration object must be a valid subnetwork ID (`1` for mainnet, `4` for rinkeby and so on).
* The `aion_node` attribute must be a HTTP or HTTPS url.
* The default value for `aion_node` is `http://127.0.0.1:8545` and for `network_id` is `5777`

```
{
  "5777": {
    "aion_node": "http://127.0.0.1:8545",
    "network_id": "5777"
  },
  "4": {
    "aion_node": "http://127.0.0.1:8546",
    "network_id": "4"
  }
}
```

## Submitting requests to a Pocket Node using this plugin
Before diving into the specifications on how to submit requests to the AION network with this plugin, please review the Pocket Node Client Developer documentation found [here](https://github.com/pokt-network/pocket-node/blob/master/CLIENT_DEVELOPERS.md).

### Submitting transactions
Transactions must be signed with the account private key and submitted in the `serialized_tx` param of the `/transactions` endpoint. The `tx_metadata` param can be left blank.

### Executing queries
To execute a query, please specify an object like the following as your `query` param in the request to the `/queries` endpoint of the Node:

***Notes:***
* The `rpc_method` found below comes from the [AION JSON RPC Specification](https://github.com/aionnetwork/aion/wiki/JSON-RPC-API-Docs), please refer to it in order to craft your requests.
* The `rpc_method` will accept any RPC method, except `sendTransaction` and `sendRawTransaction`

```
{
  rpc_method: 'eth_getBalance',
  rpc_params: [<array with params>]
}
```
