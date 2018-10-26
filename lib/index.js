var packageData = require('../package.json'),
    Web3 = require('aion-web3'),
    ethAbiDecoder = require('ethereumjs-abi'),
    BN = require('bn.js');

const DEFAULT_NODE = 'http://127.0.0.1:8545',
    DEFAULT_NETWORK_ID = '5777',
    NETWORK_NAME = 'AION';

module.exports.DEFAULT_NODE = DEFAULT_NODE;
module.exports.DEFAULT_NETWORK_ID = DEFAULT_NETWORK_ID;
module.exports.NETWORK_NAME = NETWORK_NAME;

function parseOpts(opts) {
    return {
        aionNode: opts['aion_node'] || DEFAULT_NODE,
        networkId: opts['network_id'] || DEFAULT_NETWORK_ID
    }
}

module.exports.parseOpts = parseOpts;

module.exports.getPluginDefinition = function () {
    return {
        network: NETWORK_NAME,
        version: packageData.version,
        package_name: packageData.name
    }
}

module.exports.submitTransaction = async function (serializedTx, txMetadata, opts) {
    var parsedOpts = parseOpts(opts),
        aionNode = parsedOpts.aionNode,
        networkId = parsedOpts.networkId,
        web3 = new Web3(new Web3.providers.HttpProvider(aionNode)),
        serializedTx = serializedTx.startsWith('0x') ? serializedTx : ('0x' + serializedTx),
        txHash = null,
        error = false,
        errorMsg = null;

    try {
        return new Promise(function (resolve) {
            try {
                web3.eth.sendSignedTransaction(serializedTx, function (err, result) {
                    if (err) {
                        txHash = null;
                        metadata = {};
                        error = true;
                        errorMsg = err;
                    } else {
                        txHash = result;
                    }
                    resolve({
                        hash: txHash,
                        metadata: {},
                        error: error,
                        errorMsg: errorMsg
                    });
                });
            } catch(error) {
                console.error(error);
                txHash = null;
                error = true;
                errorMsg = e;
                resolve({
                    hash: txHash,
                    metadata: {},
                    error: error,
                    errorMsg: errorMsg
                });
            }
        });
    } catch (error) {
        console.error(error);
        txHash = null;
        error = true;
        errorMsg = error;
    }

    return {
        hash: txHash,
        metadata: {},
        error: error,
        errorMsg: errorMsg
    };
}

async function sendRpcCall(web3, rpcMethod, rpcParams) {
    return new Promise(function(resolve, reject) {
        web3.currentProvider.send({
            id: 1,
            jsonrpc: '2.0',
            method: rpcMethod,
            params: rpcParams
        },
        function(err, rpcResponse) {
            if(err) {
                reject(err);
            } else {
                resolve(rpcResponse);
            }
        });
    });
}

function decodeQueryResult(rpcResponse, method, decodeOpts) {
    var result = null;
    if (method === 'eth_call' && rpcResponse && decodeOpts && Array.isArray(decodeOpts.return_types)) {
        try {
            const buf = Buffer.from(rpcResponse.result.replace("0x", ""), 'hex');
            decodedResult = ethAbiDecoder.rawDecode(decodeOpts.return_types, buf);
            if (Array.isArray(decodedResult)) {
                decodedResult = decodedResult.map(function (element) {
                    if (element instanceof Buffer) {
                        return element.toString('hex');
                    } else if (element instanceof BN) {
                        return element.toString();
                    } else {
                        return element;
                    }
                });
            }
            result = decodedResult;
        } catch (e) {
            result = null;
            console.error(e);
        }
    }
    return result;
};

module.exports.executeQuery = async function (query, decodeOpts, opts) {
    var parsedOpts = parseOpts(opts),
        aionNode = parsedOpts.aionNode,
        web3 = new Web3(new Web3.providers.HttpProvider(aionNode)),
        result = null,
        decoded = false,
        error = false,
        errorMsg = null;

    if (typeof query !== 'object') {
        error = true;
        errorMsg = 'Invalid query, must be an Object';
    } else {
        if (['eth_sendTransaction', 'eth_sendRawTransaction'].indexOf(query.rpc_method) > -1) {
            result = null;
            error = true;
            errorMsg = 'Invalid rpc_method parameter';
        } else {
            try {
                const rpcResponse = await sendRpcCall(web3, query.rpc_method, query.rpc_params);

                // Check for errors in the rpc response
                if(rpcResponse.error) {
                    result = null;
                    error = true;
                    errorMsg = rpcResponse.error.message;
                } else {
                    // Set raw response
                    result = rpcResponse.result;

                    // Try decoding smart contract call
                    const decodedResult = decodeQueryResult(rpcResponse, query.rpc_method, decodeOpts);

                    if (decodedResult) {
                        result = decodedResult;
                        decoded = true;
                    }
                }
            } catch(error) {
                result = null;
                error = true;
                errorMsg = error;
            }
        }
    }

    return {
        result: result || null,
        decoded: decoded,
        error: error,
        errorMsg: errorMsg
    };
}
