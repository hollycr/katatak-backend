import { Request, Response, NextFunction } from "express";
const { fetchAllKatas, fetchKataByID } = require("../models/katas.models");
const { checkTopicExists } = require("../models/topics.models");

export async function getAllKatas(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { topic, order_by } = req.query;

  try {
    if (topic) {
      const topicExists: boolean = await checkTopicExists(topic);
    }
    const katas = await fetchAllKatas(topic, order_by);
    res.status(200).send({ katas });
  } catch (err) {
    next(err);
  }
}

export async function getKata(req: Request, res: Response, next: NextFunction) {
  try {
    const { kata_id } = req.params;
    const kata = await fetchKataByID(kata_id);
    res.status(200).send({ kata });
  } catch (err) {
    next(err);
  }
}
