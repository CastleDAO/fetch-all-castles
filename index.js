
const fs = require('fs')
const Web3 = require('web3')

const contractAddress = '0x71f5C328241fC3e03A8c79eDCD510037802D369c';

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_PROVIDER));

const contract = new web3.eth.Contract(abi, contractAddress);

const firstBlock = 386564

async function fetchBatch(current, lastBlock, acc = []) {
    const lastCurrentBlock = current + 2000 > lastBlock ? lastBlock : current + 2000;
    const options = {
        fromBlock: current,                  //Number || "earliest" || "pending" || "latest"
        toBlock: lastCurrentBlock
    };

    const results = await contract.getPastEvents('Transfer', options)
    acc = [...acc, ...results]
    console.log('Fetched first batch of items', results.length, 'new items');

    if (lastCurrentBlock >= lastBlock) {
        return acc
    } else {
        return await fetchBatch(lastCurrentBlock, lastBlock, acc)
    }
}



export async function getMintedCastle(tokenId) {

    try {

        const attributesRaw = await contract.methods.traitsOf(tokenId).call();
        const attributes = JSON.parse(attributesRaw);

        return {
            attributes: {
                originalName: attributes.find(i => i.trait_type === 'Name').value,
                castleType: attributes.find(i => i.trait_type === 'CastleType').value,
                rarity: attributes.find(i => i.trait_type === 'Rarity').value,
                defense: parseInt(attributes.find(i => i.trait_type === 'Defense').value),
                skillType: attributes.find(i => i.trait_type === 'SkillType').value,
                skillAmount: parseInt(attributes.find(i => i.trait_type === 'SkillAmount').value),
                rarityNumber: parseInt(attributes.find(i => i.trait_type === 'RarityNumber').value),
                goldGeneration: parseInt(attributes.find(i => i.trait_type === 'GoldGeneration').value),
                capacity: parseInt(attributes.find(i => i.trait_type === 'Capacity').value),
                warrior: attributes.find(i => i.trait_type === 'Warrior').value === 'none' ? null : attributes.find(i => i.trait_type === 'Warrior').value,
                warriorName: attributes.find(i => i.trait_type === 'WarriorName').value === 'none' ? null : attributes.find(i => i.trait_type === 'WarriorName').value,
            },
            tokenId
        }

    } catch (e) {
        logger('ERROR', e.message);
        return null
    }

}

async function execute() {
    const lastBlock = await web3.eth.getBlockNumber()
    const fetched = await fetchBatch(firstBlock, lastBlock, [])
    const items = fetched.map(i => i.returnValues.tokenId)

    const details = await Promise.all(items.map(getMintedCastle))

    fs.writeFileSync('./results.json', JSON.stringify(details, null, 2))
}

execute()