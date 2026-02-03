import express from "express";
import * as Atrium from "../../../integrations/atrium-integration/atrium.js";
import { CurrencySource } from "../../../integrations/currency/types.js";
import * as UserRepo from "../../../repositories/Users/UserRepository.js";
import * as TempCardRepo from "../../../repositories/Users/TempCardRepository.js";
import { error } from "console";

export function registerEndpoints(app: express.Application) {

  // Endpoint for associating cards
  app.post("/api/devices/cards/associate", async function (req, res) {

    if (req.body.universityID === undefined) { return res.status(400).json({ error: "Missing universityID" }).send(); }
    if (req.body.cardTagID === undefined) { return res.status(400).json({ error: "Missing cardTagID" }).send(); }

    const universityID: string = req.body.universityID;
    const cardTagID: string = req.body.cardTagID;

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
      const cardUsers = await TempCardRepo.getUserFromTempCardTag(cardTagID);
      if (cardUsers !== undefined) {
        return res.status(409).json({ error: "A user has already been loaned the given cardTagID" }).send();
      }
    } catch (e) {
      return res.status(500).json({ error: "cardTagID already has multiple users" }).send();
    }

    try {
      await TempCardRepo.IssueCard(user.id, cardTagID);
      return res.sendStatus(200);
    } catch {
      return res.status(500).json({ error: "Failed to issue card" }).send();
    }
  });

  app.post("/api/devices/cards/disassociate", async function (req, res) {
    if (req.body.cardTagID === undefined) { return res.status(400).json({ error: "Missing cardTagID" }).send(); }
    const cardTagID: string = req.body.cardTagID;

    try {
      const cardUsers = await TempCardRepo.getUserFromTempCardTag(cardTagID);
      if (cardUsers === undefined) {
        return res.status(409).json({ error: "the given cardTagID has not been loaned" }).send();
      }
    } catch (e) {
      return res.status(500).json({ error: "cardTagID already has multiple users" }).send();
    }

    const returnedCards = await TempCardRepo.ReturnCard(cardTagID);
    if (returnedCards.length === 0) {
      return res.status(500).json({ error: "Failed to return card" }).send();
    } else if (returnedCards.length === 1) {
      return res.sendStatus(200);
    } else {
      return res.status(200).json({ error: "Card was returned multiple times when it should have been returned once" }).send();
    }
  })
}