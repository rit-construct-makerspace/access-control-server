import express from "express";
import * as Atrium from "../../../integrations/atrium-integration/atrium.js";
import { CurrencySource } from "../../../integrations/currency/types.js";
import * as UserRepo from "../../../repositories/Users/UserRepository.js";
import * as TempCardRepo from "../../../repositories/Users/TempCardRepository.js";
import { ReaderRow } from "../../../db/tables.js";

enum DispenserStatus {
  CARD_CHANGE = "CARD_CHANGE",
  DISPENSER_ERROR = "DISPENSER_ERROR"
}

enum DispenserError {
  CARD_STUCK = "CARD_STUCK",
  OUT_OF_CARDS = "OUT_OF_CARDS"
}

export function registerEndpoints(app: express.Application) {

  // Endpoint for associating cards
  app.post("/api/devices/cards/associate", async function (req, res) {
    const universityID = req.body.universityID;
    const cardTag = req.body.cardTag;

    if (universityID === undefined) { return res.status(400).json({ error: "Missing universityID" }).send(); }
    if (cardTag === undefined) { return res.status(400).json({ error: "Missing cardTag" }).send(); }

    if (typeof universityID !== "string") { return res.status(400).json({ error: "universityID was not a string" }).send(); }
    if (typeof cardTag !== "string") { return res.status(400).json({ error: "cardTag was not a string" }).send(); }

    const username = await Atrium.getRitEmailByUID(CurrencySource.Website, universityID);
    if (username === undefined) {
      return res.status(404).json({ error: "No user found with the given universityID" }).send();
    }

    const user = await UserRepo.getUserByRitUsername(username);
    if (user === undefined) {
      return res.status(404).json({ error: "No make account found for the given user" }).send();
    }

    const activeCards = await TempCardRepo.getActiveUserCards(user.id);
    if (activeCards.length >= 1) {
      return res.status(409).json({ error: "User already has outstanding card" }).send();
    }

    try {
      const cardUsers = await TempCardRepo.getUserFromTempCardTag(cardTag);
      if (cardUsers !== undefined) {
        return res.status(409).json({ error: "A user has already been loaned the given cardTag" }).send();
      }
    } catch (e) {
      return res.status(500).json({ error: "cardTag already has multiple users" }).send();
    }

    try {
      await TempCardRepo.IssueCard(user.id, cardTag);
      return res.sendStatus(200);
    } catch {
      return res.status(500).json({ error: "Failed to issue card" }).send();
    }
  });

  app.post("/api/devices/cards/disassociate", async function (req, res) {
    const cardTag = req.body.cardTag;
    if (cardTag === undefined) { return res.status(400).json({ error: "Missing cardTag" }).send(); }
    if (typeof cardTag !== "string") { return res.status(400).json({ error: "cardTag was not a string" }).send(); }

    try {
      const cardUsers = await TempCardRepo.getUserFromTempCardTag(cardTag);
      if (cardUsers === undefined) {
        return res.status(409).json({ error: "the given cardTag has not been loaned" }).send();
      }
    } catch (e) {
      return res.status(500).json({ error: "cardTag already has multiple users" }).send();
    }

    const returnedCards = await TempCardRepo.ReturnCard(cardTag);
    if (returnedCards.length === 0) {
      return res.status(500).json({ error: "Failed to return card" }).send();
    } else if (returnedCards.length === 1) {
      return res.sendStatus(200);
    } else {
      return res.status(200).json({ error: "Card was returned multiple times when it should have been returned once" }).send();
    }
  });

  app.post("/api/devices/cards/status", async function (req, res) {
    // @ts-ignore Using a field we added ourselves, so TS doesn't know about it
    const device: ReaderRow | undefined = req.device;
    // return 500 because req.device should have been set by us earlier, if it is undefined it is a server error
    if (device === undefined) { return res.sendStatus(500); }

    const status = req.body.status;
    if (status === undefined) { return res.status(400).json({ error: "Missing status" }).send(); }
    if (typeof status !== "string") { return res.status(400).json({ error: "status was not a string" }).send(); }

    if (!Object.values(DispenserStatus).some((possible_status) => possible_status === status)) {
      return res.status(400).json({ error: "status is not a valid DispenserStatus" }).send();
    }

    switch (status) {
      case DispenserStatus.CARD_CHANGE:
        // TODO: Care about the dispenser status
        return res.sendStatus(200);
      case DispenserStatus.DISPENSER_ERROR:
        const error = req.body.error;
        if (error === undefined) { return res.status(400).json({ error: "error not present but DISPENSER_ERROR indicated" }).send(); }
        if (typeof error !== "string") { return res.status(400).json({ error: "error was not a string" }).send(); }
        if (!Object.values(DispenserError).some((possible_error) => possible_error === error)) {
          return res.status(400).json({ error: "error is not a valid DispenserError" }).send();
        }

        // TODO: Care about the dispenser error
        return res.sendStatus(200);
      default:
        return res.sendStatus(500);
    }
  });
}