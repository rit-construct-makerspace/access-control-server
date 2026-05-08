import { ChatPostMessageArguments, WebClient } from "@slack/web-api";
import { EquipmentRow, MaintenanceTicketRow, MakerspaceRow, ReservationRow, UserRow } from "../../database/knex/tables.js";
import * as EquipmentInstanceRepo from "../../database/repositories/Equipment/EquipmentInstancesRepository.js";
import * as EquipmentRepo from "../../database/repositories/Equipment/EquipmentRepository.js";
import * as RoomRepo from "../../database/repositories/Rooms/RoomRepository.js";
import { format } from "date-fns";

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

export async function notifyNewMaintenanceTicket(ticket: MaintenanceTicketRow) {
  const instance = await EquipmentInstanceRepo.getInstanceByID(ticket.instanceID);
  const equipment = await EquipmentRepo.getEquipmentByID(instance?.equipmentID ?? -1);
  const room = await RoomRepo.getRoomByID(equipment?.roomID ?? -1);

  if (instance === undefined || equipment === undefined || room === null) {
    return;
  }

  return await sendSlackMessage({
    text: `Maintenance Ticket created for *${instance.name}* of <${process.env.VITE_URL}/makerspace/${room.makerspaceID}/equipment/${instance.equipmentID}|${equipment.name}>`,
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Maintenance Ticket created for *${instance.name}* of <${process.env.VITE_URL}/makerspace/${room.makerspaceID}/equipment/${instance.equipmentID}|${equipment.name}>`,
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `> ${ticket.description}`
        }
      },
    ],
    channel: conversationId,
  });
}

export async function notifyReservationRequest(reservation: ReservationRow, equipment: EquipmentRow, makerspaceID: Number, creator: UserRow) {
  return await sendSlackMessage({
    text: `Reservation requested for <${process.env.VITE_URL}/makerspace/${makerspaceID}/reservations|${equipment.name}> at ${format(new Date(Number(reservation.start)), "dd/MM/yyyy hh:mm")} from ${creator.firstName} ${creator.lastName} (${creator.ritUsername})`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Reservation requested for <${process.env.VITE_URL}/makerspace/${makerspaceID}/reservations|${equipment.name}> at ${format(new Date(Number(reservation.start)), "dd/MM/yyyy hh:mm")} from ${creator.firstName} ${creator.lastName} (${creator.ritUsername})`,
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `> ${reservation.description}`
        }
      },
    ],
    channel: conversationId,
  });
}