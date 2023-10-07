// requiring libraries
const axios = require("axios");

const config = require("./config.json");

// variables and functions
let beforeAmount = 0;
let isDone = false;
let lastMessageId = "0";
let messagesToDelete = [];

function wait(s) {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}
function debugLog(text) {
    console.log(`[ Message Purger ] - ${text}`)
}

// starting
(async function() {
    // getting data
    debugLog("Fetching Data");
    const meResult = (await axios.get(`https://discord.com/api/v10/users/@me`, {
        headers: {
            Authorization: config.token
        }
    })).data;
    const dmResult = (await axios.get(`https://discord.com/api/v10/users/${config.targetId}`, {
        headers: {
            Authorization: config.token
        }
    })).data;
    console.log(`    You  ⤑  ${meResult.global_name}`);
    console.log(`    Target   ⤑  ${dmResult.global_name}`);

    // fetch messages
    debugLog("Fetching Messages | This can take a while.");
    while (!isDone) {
        const lastMessages = (await axios.get(`https://discord.com/api/v9/channels/${config.channelId}/messages?limit=100` + (lastMessageId !== "0" && `&before=${lastMessageId}` || ""), {
            headers: {
                Authorization: config.token
            }
        })).data;
        if (lastMessages.length === 0) {
            isDone = true;
            break;
        }
        beforeAmount += lastMessages.length;

        for (const message of lastMessages) {
            if (message.author.id === meResult.id) {
                messagesToDelete.push(message);
                lastMessageId = message.id;
            }
        }
    }

    // deleting messages
    debugLog(`Deleting Messages | This will take around ${messagesToDelete.length * 0.55} seconds`);
    for (const message of messagesToDelete) {
        let doneDeleting = false;
        try {
            await axios.delete(`https://discord.com/api/v9/channels/${config.channelId}/messages/${message.id}`, {
                headers: {
                    Authorization: config.token
                }
            });
            beforeAmount--;
        } catch (error) {
            // console.log(error.response.data)
        } finally {
            doneDeleting = true;
        }

        while (!doneDeleting) {
            await wait(0.05);
        }
        await wait(config.cooldown);
    }

    debugLog("Finished.")
})();