/*
 * How to run tests:
 * You need to fill in aionNodes, networkId, senderPk,
 * with the right information from your local node.
 */


var assert = require('assert'),
    aionPnp = require('../index.js'),
    packageData = require('../package.json'),
    Web3 = require('aion-web3'),
    sender = null,
    receiverAddress = null,
    aionNode = 'http://192.168.56.102:8545',
    networkId = 2,
    web3 = null,
    aionPnpOpts = {
        aion_node: aionNode,
        network_id: networkId
    };

before(async function () {
    web3 = new Web3(new Web3.providers.HttpProvider(aionNode));
    sender = await web3.eth.accounts.privateKeyToAccount('0x3cf1d347d4aaf454ff791bb57ea7dc85e2a100cc1d92c5fed3a27ef125588b8c2a5f9e786fa5f0949b6ceb27f94f3c9853952f4c85b5cb4f3fd8f1812c8f4cc4');
    receiverAddress = await web3.eth.personal.newAccount();
});

describe('Plugin Configuration', function () {
    it('should parse the necessary attributes', function () {
        var opts = {
                aion_node: 'http://192.168.56.102:9545',
                network_id: '2'
            },
            parsedOpts = aionPnp.parseOpts(opts);

        assert.equal(opts.aion_node, parsedOpts.aionNode);
        assert.equal(opts.network_id, parsedOpts.networkId);
    });

    it('should have defaults', function () {
        var parsedOpts = aionPnp.parseOpts({});

        assert.equal(parsedOpts.aionNode, aionPnp.DEFAULT_NODE);
        assert.equal(parsedOpts.networkId, aionPnp.DEFAULT_NETWORK_ID);
    });
});

describe('#getPluginDefinition()', function () {
    it('should have network, version and package name', function () {
        var pluginDefinition = aionPnp.getPluginDefinition();

        assert.equal(aionPnp.NETWORK_NAME, pluginDefinition.network);
        assert.equal(packageData.name, pluginDefinition.package_name);
        assert.equal(packageData.version, pluginDefinition.version);
    });
});

describe('#submitTransaction()', function () {

    it('should submit a valid transaction', async function() {
        var senderNonce = await web3.eth.getTransactionCount(sender.address),
            txParams = {
                nonce: '0x' + senderNonce.toString(16),
                to: receiverAddress,
                value: 10000000000000000000,
                data: null,
                chainId: networkId,
                gas: 22000,
                gasPrice: 10000000000
            };
        const signedTx = await sender.signTransaction(txParams);
        const serializedTx = signedTx.rawTransaction;

        const poktResponse = await aionPnp.submitTransaction(serializedTx, {}, aionPnpOpts);
        
        assert.ok(poktResponse.hash);
        assert.equal(poktResponse.error, false);
        assert.equal(poktResponse.errorMsg, null);
    });
    
});

describe('#executeQuery()', function () {
    it('should execute a query', async function () {
        var account = sender.address,
            query = {
                rpc_method: 'eth_getBalance',
                rpc_params: [account, 'latest']
            },
            queryResponse = await aionPnp.executeQuery(query, null, aionPnpOpts),
            web3Balance = await web3.eth.getBalance(account);
        assert.equal(web3.utils.hexToNumberString(queryResponse.result), web3Balance);
    });

    it('should return error response for an invalid query', async function () {
        var query = {
            rpc_method: 'web3_getBalance',
            rpc_params: [sender.address, 'latest']
        };
        var queryResponse = await aionPnp.executeQuery(query, null, aionPnpOpts);
        assert.equal(queryResponse.result, null);
        assert.equal(queryResponse.error, true);
        assert.ok(queryResponse.errorMsg);
    });
});
