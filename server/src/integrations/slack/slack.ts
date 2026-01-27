import { ChatPostMessageArguments, WebClient } from "@slack/web-api";

// Read a token from the environment variables
const token = process.env.SLACK_TOKEN;

// Initialize
const web = new WebClient(token);

// Given some known conversation ID (representing a public channel, private channel, DM or group DM)
const conversationId = process.env.SLACK_CHANNEL_ID ?? "";

async function sendSlackMessage(message: ChatPostMessageArguments) {
    if (token === undefined || conversationId === "") {
        return; // Send messages to the void if slack not configured
    }

    return await web.chat.postMessage(message);
}

export async function notifyToolItemMarked(uniqueIdentifier: string, makerspaceID: number, instanceID: number, typeID: number, newStatusOrCondition: string) {
    return await sendSlackMessage({
        text: `Tool Item <${process.env.VITE_URL}/makerspace/${makerspaceID}/tools/instance/${instanceID}?type=${typeID}|${uniqueIdentifier}> has been marked as *${newStatusOrCondition}*`,
        blocks: [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `Tool Item <${process.env.VITE_URL}/makerspace/${makerspaceID}/tools/instance/${instanceID}?type=${typeID}|${uniqueIdentifier}> has been marked as *${newStatusOrCondition}*`
                }
            }
        ],
        channel: conversationId,
    });
}

export async function notifyInventoryItemBelowThreshold(itemName: string, count: number) {
    return await sendSlackMessage({
        text: `Inventory Item <${process.env.VITE_URL}/admin/inventory|${itemName}> is running low (${count})`,
        blocks: [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `Inventory Item <${process.env.VITE_URL}/admin/inventory|${itemName}> is running low (${count})`
                }
            }
        ],
        channel: conversationId,
    });
}