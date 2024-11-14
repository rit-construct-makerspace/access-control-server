import { WebClient } from "@slack/web-api";
import { EquipmentInstancesRow, MaintenanceLogRow } from "../db/tables.js";
import { getEquipmentByID } from "../repositories/Equipment/EquipmentRepository.js";
import { getInstanceByID } from "../repositories/Equipment/EquipmentInstancesRepository.js";


// Read a token from the environment variables
const token = process.env.SLACK_TOKEN;

// Initialize
const web = new WebClient(token);

// Given some known conversation ID (representing a public channel, private channel, DM or group DM)
const conversationId = process.env.SLACK_CHANNEL_ID ?? "";

export async function testSlackMessage() {

    // Post a message to the channel, and await the result.
    // Find more arguments and details of the response: https://api.slack.com/methods/chat.postMessage
    const result = await web.chat.postMessage({
        text: 'Hello world!',
        channel: conversationId,
    });

    // The result contains an identifier for the message, `ts`.
    console.log(`Successfully sent message ${result.ts} in conversation ${conversationId}`);
};

async function conditionalInstanceFetch(instanceID: number | undefined): Promise<EquipmentInstancesRow | undefined> {
    return instanceID ? getInstanceByID(instanceID as number) : undefined
}

export async function notifyMachineIssueCreated(equipmentID: number, instanceID: number | undefined, content: string) {
    const result = await getEquipmentByID(equipmentID).then((equipment) => {
        return conditionalInstanceFetch(instanceID).then(async (instance) => {
            return await web.chat.postMessage({
                text: `An issue has been reported for${instance ? ` instance *${instance?.name}* of` : ""} <https://make.rit.edu/app/admin/equipment/${equipment.archived && "archived/"}${equipment.id}|${equipment.name}>`,
                blocks: [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `An issue has been reported for${instance ? ` instance *${instance?.name}* of` : ""} <https://make.rit.edu/app/admin/equipment/${equipment.archived && "archived/"}${equipment.id}|${equipment.name}>`
                        }
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `> ${content}`
                        }
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": ":clipboard: Open Issue Log",
                                    "emoji": true
                                },
                                "value": "goto_issue_log",
                                "url": `https://make.rit.edu/app/admin/equipment/issues/${equipment.id}`,
                                "action_id": "open-issue-log"
                            },
                        ]
                    }
                ],
                channel: conversationId,
            });
        });



    });


    // The result contains an identifier for the message, `ts`.
    console.log(`Successfully sent message ${result.ts} in conversation ${conversationId}`);
}